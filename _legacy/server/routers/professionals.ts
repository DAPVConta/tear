import { eq, and, like } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { professionals } from "../../drizzle/schema";

const professionalInput = z.object({
  name: z.string().min(3),
  cpf: z.string().min(11),
  specialty: z.enum([
    "psicologia_aba",
    "fonoaudiologia",
    "terapia_ocupacional_is",
    "terapia_ocupacional_avds",
    "fisioterapia",
    "psicopedagogia",
    "musicoterapia",
    "neuropsicologia",
  ]),
  councilType: z.string().min(2),
  councilNumber: z.string().min(3),
  councilState: z.string().length(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  userId: z.number().optional(),
});

export const professionalsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [eq(professionals.active, true)];
      if (ctx.clinic?.id) conditions.push(eq(professionals.clinicId, ctx.clinic.id));
      if (input?.search) conditions.push(like(professionals.name, `%${input.search}%`));
      
      return db.select().from(professionals).where(and(...conditions));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const conditions = [eq(professionals.id, input.id)];
      if (ctx.clinic?.id) conditions.push(eq(professionals.clinicId, ctx.clinic.id));
      
      const result = await db.select().from(professionals).where(and(...conditions)).limit(1);
      return result[0] || null;
    }),

  create: protectedProcedure
    .input(professionalInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!ctx.clinic) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa estar vinculado a uma clínica" });
      
      const result = await db.insert(professionals).values({
        ...input,
        clinicId: ctx.clinic.id,
        createdByUserId: ctx.user!.id,
      });
      return { id: result[0].insertId };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(professionalInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      // Verificar permissão: apenas o criador ou clinic_admin pode editar
      const existing = await db.select().from(professionals).where(eq(professionals.id, id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado" });
      
      const isCreator = existing[0].createdByUserId === ctx.user!.id;
      const isClinicAdmin = ctx.clinicMember?.role === "clinic_admin";
      
      if (!isCreator && !isClinicAdmin) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Apenas o usuário que cadastrou este profissional ou o administrador da clínica pode editá-lo." 
        });
      }
      
      const conditions = [eq(professionals.id, id)];
      if (ctx.clinic?.id) conditions.push(eq(professionals.clinicId, ctx.clinic.id));
      
      await db.update(professionals).set(data).where(and(...conditions));
      return { success: true };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verificar permissão: apenas o criador ou clinic_admin pode desativar
      const existing = await db.select().from(professionals).where(eq(professionals.id, input.id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado" });
      
      const isCreator = existing[0].createdByUserId === ctx.user!.id;
      const isClinicAdmin = ctx.clinicMember?.role === "clinic_admin";
      
      if (!isCreator && !isClinicAdmin) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Apenas o usuário que cadastrou este profissional ou o administrador da clínica pode desativá-lo." 
        });
      }
      
      const conditions = [eq(professionals.id, input.id)];
      if (ctx.clinic?.id) conditions.push(eq(professionals.clinicId, ctx.clinic.id));
      
      await db.update(professionals).set({ active: false }).where(and(...conditions));
      return { success: true };
    }),
});
