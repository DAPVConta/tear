import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { authorizations } from "../../drizzle/schema";

const authorizationInput = z.object({
  patientId: z.number(),
  guideNumber: z.string().min(1),
  authorizationDate: z.string(),
  expirationDate: z.string(),
  procedureCode: z.string().min(1),
  procedureName: z.string().min(1),
  authorizedQuantity: z.number().min(1),
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
  observations: z.string().optional(),
});

export const authorizationsRouter = router({
  list: protectedProcedure
    .input(z.object({ patientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (ctx.clinic?.id) conditions.push(eq(authorizations.clinicId, ctx.clinic.id));
      if (input?.patientId) conditions.push(eq(authorizations.patientId, input.patientId));
      
      if (conditions.length > 0) {
        return db.select().from(authorizations).where(and(...conditions));
      }
      return db.select().from(authorizations);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const conditions = [eq(authorizations.id, input.id)];
      if (ctx.clinic?.id) conditions.push(eq(authorizations.clinicId, ctx.clinic.id));
      
      const result = await db.select().from(authorizations).where(and(...conditions)).limit(1);
      return result[0] || null;
    }),

  getActive: protectedProcedure
    .input(z.object({ patientId: z.number(), specialty: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [
        eq(authorizations.patientId, input.patientId),
        eq(authorizations.status, "ativa"),
      ];
      if (ctx.clinic?.id) conditions.push(eq(authorizations.clinicId, ctx.clinic.id));
      
      return db.select().from(authorizations).where(and(...conditions));
    }),

  create: protectedProcedure
    .input(authorizationInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!ctx.clinic) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa estar vinculado a uma clínica" });
      
      const { authorizationDate, expirationDate, ...rest } = input;
      const result = await db.insert(authorizations).values({
        ...rest,
        clinicId: ctx.clinic.id,
        authorizationDate: new Date(authorizationDate),
        expirationDate: new Date(expirationDate),
        createdByUserId: ctx.user!.id,
      });
      return { id: result[0].insertId };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(authorizationInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, authorizationDate, expirationDate, ...data } = input;
      
      // Verificar permissão: apenas o criador ou clinic_admin pode editar
      const existing = await db.select().from(authorizations).where(eq(authorizations.id, id)).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Guia não encontrada" });
      
      const isCreator = existing[0].createdByUserId === ctx.user!.id;
      const isClinicAdmin = ctx.clinicMember?.role === "clinic_admin";
      
      if (!isCreator && !isClinicAdmin) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Apenas o usuário que cadastrou esta guia ou o administrador da clínica pode editá-la." 
        });
      }
      
      const updateData: Record<string, unknown> = { ...data };
      if (authorizationDate) updateData.authorizationDate = new Date(authorizationDate);
      if (expirationDate) updateData.expirationDate = new Date(expirationDate);
      
      const conditions = [eq(authorizations.id, id)];
      if (ctx.clinic?.id) conditions.push(eq(authorizations.clinicId, ctx.clinic.id));
      
      await db.update(authorizations).set(updateData).where(and(...conditions));
      return { success: true };
    }),
});
