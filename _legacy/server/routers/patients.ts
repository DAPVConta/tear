import { eq, and, like, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { patients } from "../../drizzle/schema";

const patientInput = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().optional(),
  birthDate: z.string({ message: "Data de nascimento é obrigatória" }),
  gender: z.enum(["masculino", "feminino", "outro"], { message: "Selecione o gênero" }),
  guardianName: z.string().min(3, "Nome do responsável deve ter no mínimo 3 caracteres"),
  guardianCpf: z.string().min(11, "CPF do responsável deve ter 11 dígitos"),
  guardianPhone: z.string().min(10, "Telefone deve ter no mínimo 10 dígitos"),
  guardianEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  paymentType: z.enum(["operadora", "particular"]).default("operadora"),
  healthPlanName: z.string().optional().or(z.literal("")),
  healthPlanCard: z.string().optional().or(z.literal("")),
  cid10Primary: z.string().min(3, "CID-10 primário é obrigatório (ex: F84.0)"),
  cid10Secondary: z.string().optional().or(z.literal("")),
  diagnosis: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export const patientsRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().min(1).default(1).optional(),
      limit: z.number().min(1).max(100).default(20).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const clinicId = ctx.clinic?.id;
      const conditions = [eq(patients.active, true)];
      if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
      if (input?.search) conditions.push(like(patients.name, `%${input.search}%`));
      
      return db.select().from(patients).where(and(...conditions));
    }),

  listPaginated: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      paymentType: z.enum(["operadora", "particular"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0, page: input.page, totalPages: 0 };
      
      const clinicId = ctx.clinic?.id;
      const conditions = [eq(patients.active, true)];
      if (clinicId) conditions.push(eq(patients.clinicId, clinicId));
      if (input.search) conditions.push(like(patients.name, `%${input.search}%`));
      if (input.paymentType) conditions.push(eq(patients.paymentType, input.paymentType));
      
      const whereClause = and(...conditions);
      
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(patients).where(whereClause);
      const total = Number(countResult.count);
      const totalPages = Math.ceil(total / input.limit);
      
      const items = await db.select().from(patients)
        .where(whereClause)
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);
      
      return { items, total, page: input.page, totalPages };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const conditions = [eq(patients.id, input.id)];
      if (ctx.clinic?.id) conditions.push(eq(patients.clinicId, ctx.clinic.id));
      
      const result = await db.select().from(patients).where(and(...conditions)).limit(1);
      return result[0] || null;
    }),

  create: protectedProcedure
    .input(patientInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!ctx.clinic) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa estar vinculado a uma clínica" });
      
      const { birthDate, ...rest } = input;
      const result = await db.insert(patients).values({
        ...rest,
        clinicId: ctx.clinic.id,
        birthDate: new Date(birthDate),
        createdByUserId: ctx.user!.id,
      });
      return { id: result[0].insertId };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(patientInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, birthDate, ...data } = input;
      
      const existing = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      
      const isCreator = existing[0].createdByUserId === ctx.user!.id;
      const isClinicAdmin = ctx.clinicMember?.role === "clinic_admin";
      
      if (!isCreator && !isClinicAdmin) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Apenas o profissional que cadastrou este paciente ou o administrador da clínica pode editá-lo." 
        });
      }
      
      const updateData: Record<string, unknown> = { ...data };
      if (birthDate) updateData.birthDate = new Date(birthDate);
      
      const conditions = [eq(patients.id, id)];
      if (ctx.clinic?.id) conditions.push(eq(patients.clinicId, ctx.clinic.id));
      
      await db.update(patients).set(updateData).where(and(...conditions));
      return { success: true };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db.select().from(patients).where(eq(patients.id, input.id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      
      const isCreator = existing[0].createdByUserId === ctx.user!.id;
      const isClinicAdmin = ctx.clinicMember?.role === "clinic_admin";
      
      if (!isCreator && !isClinicAdmin) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Apenas o profissional que cadastrou este paciente ou o administrador da clínica pode desativá-lo." 
        });
      }
      
      const conditions = [eq(patients.id, input.id)];
      if (ctx.clinic?.id) conditions.push(eq(patients.clinicId, ctx.clinic.id));
      
      await db.update(patients).set({ active: false }).where(and(...conditions));
      return { success: true };
    }),
});
