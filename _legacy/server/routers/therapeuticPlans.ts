import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { therapeuticPlans, therapeuticGoals } from "../../drizzle/schema";

const planInput = z.object({
  patientId: z.number(),
  professionalId: z.number(),
  title: z.string().min(3),
  startDate: z.string(),
  endDate: z.string().optional(),
  frequency: z.string().min(1),
  sessionDuration: z.number().min(15),
  generalObjective: z.string().min(10),
});

const goalInput = z.object({
  planId: z.number(),
  description: z.string().min(5),
  category: z.string().min(2),
  targetCriteria: z.string().min(5),
});

export const therapeuticPlansRouter = router({
  list: protectedProcedure
    .input(z.object({ patientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (ctx.clinic?.id) conditions.push(eq(therapeuticPlans.clinicId, ctx.clinic.id));
      if (input?.patientId) conditions.push(eq(therapeuticPlans.patientId, input.patientId));
      
      if (conditions.length > 0) {
        return db.select().from(therapeuticPlans).where(and(...conditions));
      }
      return db.select().from(therapeuticPlans);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const conditions = [eq(therapeuticPlans.id, input.id)];
      if (ctx.clinic?.id) conditions.push(eq(therapeuticPlans.clinicId, ctx.clinic.id));
      
      const result = await db.select().from(therapeuticPlans).where(and(...conditions)).limit(1);
      return result[0] || null;
    }),

  getActive: protectedProcedure
    .input(z.object({ patientId: z.number(), professionalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [
        eq(therapeuticPlans.patientId, input.patientId),
        eq(therapeuticPlans.status, "ativo"),
      ];
      if (ctx.clinic?.id) conditions.push(eq(therapeuticPlans.clinicId, ctx.clinic.id));
      if (input.professionalId) conditions.push(eq(therapeuticPlans.professionalId, input.professionalId));
      
      return db.select().from(therapeuticPlans).where(and(...conditions));
    }),

  create: protectedProcedure
    .input(planInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!ctx.clinic) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa estar vinculado a uma clínica" });
      
      const { startDate, endDate, ...rest } = input;
      const result = await db.insert(therapeuticPlans).values({
        ...rest,
        clinicId: ctx.clinic.id,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        createdByUserId: ctx.user!.id,
      });
      return { id: result[0].insertId };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(planInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, startDate, endDate, ...data } = input;
      
      // Verificar permissão: apenas o criador ou clinic_admin pode editar
      const existing = await db.select().from(therapeuticPlans).where(eq(therapeuticPlans.id, id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Plano terapêutico não encontrado" });
      
      const isCreator = existing[0].createdByUserId === ctx.user!.id;
      const isClinicAdmin = ctx.clinicMember?.role === "clinic_admin";
      
      if (!isCreator && !isClinicAdmin) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Apenas o profissional que criou este plano ou o administrador da clínica pode editá-lo." 
        });
      }
      
      const updateData: Record<string, unknown> = { ...data };
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      
      const conditions = [eq(therapeuticPlans.id, id)];
      if (ctx.clinic?.id) conditions.push(eq(therapeuticPlans.clinicId, ctx.clinic.id));
      
      await db.update(therapeuticPlans).set(updateData).where(and(...conditions));
      return { success: true };
    }),

  // Goals (Metas)
  listGoals: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(therapeuticGoals).where(eq(therapeuticGoals.planId, input.planId));
    }),

  createGoal: protectedProcedure
    .input(goalInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(therapeuticGoals).values(input);
      return { id: result[0].insertId };
    }),

  updateGoal: protectedProcedure
    .input(z.object({
      id: z.number(),
      description: z.string().optional(),
      category: z.string().optional(),
      targetCriteria: z.string().optional(),
      currentProgress: z.string().optional(),
      status: z.enum(["em_andamento", "adquirida", "em_manutencao", "descontinuada"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, status, currentProgress, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (status) updateData.status = status;
      if (currentProgress) updateData.currentProgress = currentProgress;
      await db.update(therapeuticGoals).set(updateData).where(eq(therapeuticGoals.id, id));
      return { success: true };
    }),
});
