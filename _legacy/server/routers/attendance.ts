import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { attendanceRecords } from "../../drizzle/schema";

export const attendanceRouter = router({
  list: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      professionalId: z.number().optional(),
      month: z.number().optional(),
      year: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (input?.patientId) conditions.push(eq(attendanceRecords.patientId, input.patientId));
      if (input?.professionalId) conditions.push(eq(attendanceRecords.professionalId, input.professionalId));
      
      if (input?.month && input?.year) {
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0);
        conditions.push(sql`${attendanceRecords.sessionDate} >= ${startDate}`);
        conditions.push(sql`${attendanceRecords.sessionDate} <= ${endDate}`);
      }
      
      if (conditions.length > 0) {
        return db.select().from(attendanceRecords).where(and(...conditions));
      }
      return db.select().from(attendanceRecords);
    }),

  // Registrar falta (com justificativa obrigatória para faltas justificadas)
  registerAbsence: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      professionalId: z.number(),
      authorizationId: z.number().optional().nullable(),
      sessionDate: z.string(),
      status: z.enum(["falta_justificada", "falta_injustificada", "cancelado_clinica", "cancelado_paciente"]),
      justification: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Justificativa obrigatória para faltas justificadas
      if (input.status === "falta_justificada" && !input.justification) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Justificativa é obrigatória para faltas justificadas" 
        });
      }

      const result = await db.insert(attendanceRecords).values({
        clinicId: ctx.clinic?.id || 0,
        patientId: input.patientId,
        professionalId: input.professionalId,
        authorizationId: input.authorizationId || null,
        sessionDate: new Date(input.sessionDate),
        status: input.status,
        justification: input.justification,
        guardianSignature: false,
      });

      return { id: result[0].insertId };
    }),
});
