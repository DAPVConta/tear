import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dailyEvolutions, monthlyEvolutions, attendanceRecords, therapeuticGoals, patients, professionals } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

export const monthlyEvolutionsRouter = router({
  list: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      professionalId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (input?.patientId) conditions.push(eq(monthlyEvolutions.patientId, input.patientId));
      if (input?.professionalId) conditions.push(eq(monthlyEvolutions.professionalId, input.professionalId));
      
      if (conditions.length > 0) {
        return db.select().from(monthlyEvolutions).where(and(...conditions));
      }
      return db.select().from(monthlyEvolutions);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(monthlyEvolutions).where(eq(monthlyEvolutions.id, input.id)).limit(1);
      return result[0] || null;
    }),

  // Motor de Inteligência: Gerar evolução mensal automaticamente
  generate: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      professionalId: z.number(),
      month: z.number().min(1).max(12),
      year: z.number().min(2020),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar dados do paciente
      const patientResult = await db.select().from(patients)
        .where(eq(patients.id, input.patientId)).limit(1);
      if (!patientResult[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

      // Buscar dados do profissional
      const profResult = await db.select().from(professionals)
        .where(eq(professionals.id, input.professionalId)).limit(1);
      if (!profResult[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado" });

      // Buscar todas as evoluções diárias do mês
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);
      
      const evolutions = await db.select().from(dailyEvolutions)
        .where(and(
          eq(dailyEvolutions.patientId, input.patientId),
          eq(dailyEvolutions.professionalId, input.professionalId),
          sql`${dailyEvolutions.sessionDate} >= ${startDate}`,
          sql`${dailyEvolutions.sessionDate} <= ${endDate}`,
        ));

      if (evolutions.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não há evoluções diárias registradas para este período" });
      }

      // Buscar registros de presença
      const attendance = await db.select().from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.patientId, input.patientId),
          eq(attendanceRecords.professionalId, input.professionalId),
          sql`${attendanceRecords.sessionDate} >= ${startDate}`,
          sql`${attendanceRecords.sessionDate} <= ${endDate}`,
        ));

      const totalPresent = attendance.filter(a => a.status === "presente").length;
      const totalAbsent = attendance.filter(a => a.status !== "presente").length;

      // Compilar dados das evoluções para o LLM
      const evolutionsSummary = evolutions.map(e => ({
        date: e.sessionDate,
        assessment: e.evolutionAssessment,
        summary: e.sessionSummary,
        promptLevel: e.promptingLevel,
        behavioral: e.behavioralNotes,
        nextPlan: e.nextSessionPlan,
      }));

      // Gerar síntese via LLM
      const prompt = `Você é um especialista em relatórios terapêuticos para pacientes com TEA (Transtorno do Espectro Autista).

Gere um relatório mensal de evolução terapêutica baseado nas evoluções diárias abaixo.

PACIENTE: ${patientResult[0].name}
DIAGNÓSTICO: ${patientResult[0].diagnosis}
CID: ${patientResult[0].cid10Primary}
PROFISSIONAL: ${profResult[0].name} (${profResult[0].specialty})
PERÍODO: ${input.month}/${input.year}
TOTAL DE SESSÕES: ${evolutions.length}
PRESENÇAS: ${totalPresent} | FALTAS: ${totalAbsent}

EVOLUÇÕES DIÁRIAS:
${JSON.stringify(evolutionsSummary, null, 2)}

Gere um relatório profissional e técnico contendo:
1. SÍNTESE DO PERÍODO: Resumo geral do progresso do paciente
2. HABILIDADES TRABALHADAS: Principais áreas de foco
3. PROGRESSOS OBSERVADOS: Avanços concretos
4. DESAFIOS E INTERCORRÊNCIAS: Dificuldades encontradas
5. CONCLUSÃO: Avaliação geral do mês
6. RECOMENDAÇÕES: Plano para o próximo mês

Use linguagem técnica adequada para relatórios de saúde. Seja objetivo e baseado nos dados fornecidos.`;

      let generatedSummary = "";
      try {
        const llmResult = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um assistente especializado em relatórios terapêuticos para TEA. Gere relatórios profissionais, técnicos e objetivos." },
            { role: "user", content: prompt },
          ],
        });
        generatedSummary = typeof llmResult.choices[0]?.message?.content === 'string' 
          ? llmResult.choices[0].message.content 
          : "Relatório não pôde ser gerado automaticamente. Por favor, preencha manualmente.";
      } catch (error) {
        generatedSummary = `RELATÓRIO MENSAL - ${input.month}/${input.year}\n\nPaciente: ${patientResult[0].name}\nTotal de sessões: ${evolutions.length}\nPresenças: ${totalPresent}\nFaltas: ${totalAbsent}\n\n[Síntese automática indisponível. Por favor, preencha manualmente baseado nas evoluções diárias do período.]`;
      }

      // Calcular progresso das metas
      const goalsProgress = evolutions.reduce((acc: Record<string, { count: number; assessments: string[] }>, ev) => {
        const goals = typeof ev.goalsWorked === 'string' ? JSON.parse(ev.goalsWorked) : ev.goalsWorked;
        if (Array.isArray(goals)) {
          goals.forEach((goalId: number) => {
            if (!acc[goalId]) acc[goalId] = { count: 0, assessments: [] };
            acc[goalId].count++;
            acc[goalId].assessments.push(ev.evolutionAssessment);
          });
        }
        return acc;
      }, {});

      // Salvar evolução mensal
      const result = await db.insert(monthlyEvolutions).values({
        clinicId: ctx.clinic?.id || 0,
        patientId: input.patientId,
        professionalId: input.professionalId,
        referenceMonth: input.month,
        referenceYear: input.year,
        totalSessions: evolutions.length,
        totalPresent,
        totalAbsent,
        goalsProgress: JSON.stringify(goalsProgress),
        generatedSummary,
      });

      return { id: result[0].insertId, summary: generatedSummary, totalSessions: evolutions.length, totalPresent, totalAbsent };
    }),

  // Aprovar evolução mensal
  approve: protectedProcedure
    .input(z.object({
      id: z.number(),
      professionalReview: z.string().optional(),
      conclusion: z.string().optional(),
      nextMonthPlan: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(monthlyEvolutions)
        .set({
          ...data,
          approved: true,
          approvedAt: new Date(),
        })
        .where(eq(monthlyEvolutions.id, id));
      
      return { success: true };
    }),
});
