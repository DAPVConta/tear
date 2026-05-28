import { eq, and, sql, lt } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dailyEvolutions, authorizations, attendanceRecords, patients, professionals } from "../../drizzle/schema";

function isEvolutionLocked(createdAt: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 24;
}

const skillWorkedSchema = z.object({
  goalId: z.number().optional(),
  skill: z.string(),
  promptLevel: z.enum(["fisica_total", "fisica_parcial", "gestual", "verbal", "independente"]),
  response: z.string(),
  notes: z.string().optional(),
});

const evolutionInput = z.object({
  patientId: z.number(),
  professionalId: z.number(),
  authorizationId: z.number().optional().nullable(), // NULLABLE para particular
  planId: z.number().optional().nullable(),
  isPrivate: z.boolean().default(false), // Sessão particular
  sessionDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  sessionDurationMinutes: z.number().min(1),
  attendanceType: z.enum([
    "individual_presencial",
    "individual_domiciliar",
    "individual_escolar",
    "grupo_presencial",
  ]),
  goalsWorked: z.array(z.number()).default([]),
  skillsWorked: z.array(skillWorkedSchema).min(1, "Registre ao menos uma habilidade trabalhada"),
  promptingLevel: z.enum(["fisica_total", "fisica_parcial", "gestual", "verbal", "independente"]),
  behavioralNotes: z.string().optional(),
  behavioralIntervention: z.string().optional(),
  sessionSummary: z.string().min(10, "A síntese da sessão deve ter no mínimo 10 caracteres"),
  evolutionAssessment: z.enum([
    "evolucao_significativa",
    "evolucao_leve",
    "estavel",
    "retrocesso_leve",
    "retrocesso_significativo",
  ]),
  nextSessionPlan: z.string().min(5, "O plano para próxima sessão é obrigatório"),
  incidents: z.string().optional(),
  guardianPresenceValidation: z.boolean(),
  guardianValidationMethod: z.enum(["assinatura_digital", "token", "presencial"]).optional(),
});

export const dailyEvolutionsRouter = router({
  list: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      professionalId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (ctx.clinic?.id) conditions.push(eq(dailyEvolutions.clinicId, ctx.clinic.id));
      if (input?.patientId) conditions.push(eq(dailyEvolutions.patientId, input.patientId));
      if (input?.professionalId) conditions.push(eq(dailyEvolutions.professionalId, input.professionalId));
      
      if (conditions.length > 0) {
        return db.select().from(dailyEvolutions).where(and(...conditions));
      }
      return db.select().from(dailyEvolutions);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const conditions = [eq(dailyEvolutions.id, input.id)];
      if (ctx.clinic?.id) conditions.push(eq(dailyEvolutions.clinicId, ctx.clinic.id));
      
      const result = await db.select().from(dailyEvolutions).where(and(...conditions)).limit(1);
      return result[0] || null;
    }),

  create: protectedProcedure
    .input(evolutionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!ctx.clinic) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa estar vinculado a uma clínica" });

      // VALIDAÇÃO: Guia ativa (SOMENTE para pacientes de operadora)
      if (!input.isPrivate && input.authorizationId) {
        const authResult = await db.select().from(authorizations)
          .where(eq(authorizations.id, input.authorizationId)).limit(1);
        
        if (!authResult[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Guia de autorização não encontrada" });
        const auth = authResult[0];
        if (auth.status !== "ativa") throw new TRPCError({ code: "BAD_REQUEST", message: "A guia de autorização não está ativa" });
        if (new Date(auth.expirationDate) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "A guia de autorização está vencida" });
        if (auth.usedQuantity >= auth.authorizedQuantity) throw new TRPCError({ code: "BAD_REQUEST", message: "Quantidade de sessões autorizadas já foi esgotada" });

        // VALIDAÇÃO: Especialidade compatível com guia
        if (auth.specialty) {
          const profResult = await db.select().from(professionals).where(eq(professionals.id, input.professionalId)).limit(1);
          if (profResult[0] && profResult[0].specialty !== auth.specialty) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Especialidade do profissional não é compatível com a guia` });
          }
        }
      }

      // VALIDAÇÃO: Tempo mínimo 30 min
      if (input.sessionDurationMinutes < 30) throw new TRPCError({ code: "BAD_REQUEST", message: "A duração mínima da sessão é de 30 minutos" });

      // VALIDAÇÃO: Duplicidade
      const existingEvolutions = await db.select().from(dailyEvolutions)
        .where(and(
          eq(dailyEvolutions.patientId, input.patientId),
          eq(dailyEvolutions.sessionDate, new Date(input.sessionDate)),
          eq(dailyEvolutions.startTime, input.startTime),
        ));
      if (existingEvolutions.length > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Já existe uma evolução registrada para este paciente neste horário" });

      // VALIDAÇÃO: Presença do responsável
      if (!input.guardianPresenceValidation) throw new TRPCError({ code: "BAD_REQUEST", message: "A validação de presença do responsável é obrigatória" });

      // VALIDAÇÃO: CID compatível com TEA
      const patientResult = await db.select().from(patients).where(eq(patients.id, input.patientId)).limit(1);
      if (patientResult[0]) {
        const cidPrimary = patientResult[0].cid10Primary;
        const validTEACids = ["F84", "F84.0", "F84.1", "F84.2", "F84.3", "F84.4", "F84.5", "F84.8", "F84.9"];
        const isValidCid = validTEACids.some(cid => cidPrimary.startsWith(cid.split(".")[0]));
        if (!isValidCid) throw new TRPCError({ code: "BAD_REQUEST", message: `CID-10 do paciente (${cidPrimary}) não é compatível com atendimento TEA` });
      }

      // Criar evolução
      const { sessionDate, goalsWorked, skillsWorked, ...rest } = input;
      const result = await db.insert(dailyEvolutions).values({
        ...rest,
        authorizationId: input.authorizationId || null,
        planId: input.planId || null,
        clinicId: ctx.clinic.id,
        sessionDate: new Date(sessionDate),
        goalsWorked: JSON.stringify(goalsWorked),
        skillsWorked: JSON.stringify(skillsWorked),
        professionalSignature: true,
        signedAt: new Date(),
        createdByUserId: ctx.user!.id,
      });

      // Incrementar guia (somente se não for particular)
      if (!input.isPrivate && input.authorizationId) {
        await db.update(authorizations)
          .set({ usedQuantity: sql`${authorizations.usedQuantity} + 1` })
          .where(eq(authorizations.id, input.authorizationId));
      }

      // Criar registro de presença
      await db.insert(attendanceRecords).values({
        clinicId: ctx.clinic.id,
        patientId: input.patientId,
        professionalId: input.professionalId,
        authorizationId: input.authorizationId || null,
        sessionDate: new Date(sessionDate),
        status: "presente",
        evolutionId: result[0].insertId,
        guardianSignature: input.guardianPresenceValidation,
        isPrivate: input.isPrivate,
      });

      return { id: result[0].insertId };
    }),

  addAddendum: protectedProcedure
    .input(z.object({ evolutionId: z.number(), text: z.string().min(5), professionalId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const evolution = await db.select().from(dailyEvolutions).where(eq(dailyEvolutions.id, input.evolutionId)).limit(1);
      if (!evolution[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Evolução não encontrada" });

      const currentAddendum = evolution[0].addendum ? 
        (typeof evolution[0].addendum === 'string' ? JSON.parse(evolution[0].addendum) : evolution[0].addendum) : [];
      
      const newAddendum = [...currentAddendum, { date: new Date().toISOString(), text: input.text, professionalId: input.professionalId }];
      await db.update(dailyEvolutions).set({ addendum: JSON.stringify(newAddendum) }).where(eq(dailyEvolutions.id, input.evolutionId));
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      sessionSummary: z.string().optional(),
      behavioralNotes: z.string().optional(),
      behavioralIntervention: z.string().optional(),
      nextSessionPlan: z.string().optional(),
      incidents: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const evolution = await db.select().from(dailyEvolutions).where(eq(dailyEvolutions.id, input.id)).limit(1);
      if (!evolution[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Evolução não encontrada" });

      if (evolution[0].locked || isEvolutionLocked(evolution[0].createdAt)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Esta evolução está bloqueada para edição (mais de 24h). Utilize a função de adendo." });
      }

      // Verificar permissão: apenas o criador ou clinic_admin pode editar
      const isCreator = evolution[0].createdByUserId === ctx.user!.id;
      const isClinicAdmin = ctx.clinicMember?.role === "clinic_admin";
      
      if (!isCreator && !isClinicAdmin) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Apenas o profissional que registrou esta evolução ou o administrador da clínica pode editá-la." 
        });
      }

      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => { if (value !== undefined) updateData[key] = value; });
      await db.update(dailyEvolutions).set(updateData).where(eq(dailyEvolutions.id, id));
      return { success: true };
    }),

  lockExpired: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    await db.update(dailyEvolutions).set({ locked: true, lockedAt: new Date() })
      .where(and(eq(dailyEvolutions.locked, false), lt(dailyEvolutions.createdAt, twentyFourHoursAgo)));
    return { success: true };
  }),

  sign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(dailyEvolutions).set({ professionalSignature: true, signedAt: new Date() }).where(eq(dailyEvolutions.id, input.id));
      return { success: true };
    }),
});
