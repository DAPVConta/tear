import { eq, and, sql, isNull, count } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dailyEvolutions, attendanceRecords, authorizations, patients, professionals, therapeuticPlans, monthlyEvolutions } from "../../drizzle/schema";

export const auditRouter = router({
  // Checklist de faturamento - verifica inconsistências
  billingChecklist: protectedProcedure
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2020),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { issues: [], summary: {}, billingChecks: [] };

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      const issues: Array<{ type: string; severity: string; message: string; patientId?: number; professionalId?: number; date?: string }> = [];

      // 1. Evoluções sem assinatura
      const unsignedEvolutions = await db.select().from(dailyEvolutions)
        .where(and(
          eq(dailyEvolutions.professionalSignature, false),
          sql`${dailyEvolutions.sessionDate} >= ${startDate}`,
          sql`${dailyEvolutions.sessionDate} <= ${endDate}`,
        ));

      unsignedEvolutions.forEach(ev => {
        issues.push({
          type: "assinatura_ausente",
          severity: "critica",
          message: `Evolução sem assinatura do terapeuta - Data: ${ev.sessionDate}`,
          patientId: ev.patientId,
          professionalId: ev.professionalId,
          date: String(ev.sessionDate),
        });
      });

      // 2. Presenças sem evolução vinculada
      const attendanceWithoutEvolution = await db.select().from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.status, "presente"),
          isNull(attendanceRecords.evolutionId),
          sql`${attendanceRecords.sessionDate} >= ${startDate}`,
          sql`${attendanceRecords.sessionDate} <= ${endDate}`,
        ));

      attendanceWithoutEvolution.forEach(att => {
        issues.push({
          type: "presenca_sem_evolucao",
          severity: "critica",
          message: `Registro de presença sem evolução técnica vinculada - Data: ${att.sessionDate}`,
          patientId: att.patientId,
          professionalId: att.professionalId,
          date: String(att.sessionDate),
        });
      });

      // 3. Faltas sem justificativa
      const unjustifiedAbsences = await db.select().from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.status, "falta_justificada"),
          isNull(attendanceRecords.justification),
          sql`${attendanceRecords.sessionDate} >= ${startDate}`,
          sql`${attendanceRecords.sessionDate} <= ${endDate}`,
        ));

      unjustifiedAbsences.forEach(att => {
        issues.push({
          type: "falta_sem_justificativa",
          severity: "alta",
          message: `Falta justificada sem texto de justificativa - Data: ${att.sessionDate}`,
          patientId: att.patientId,
          professionalId: att.professionalId,
          date: String(att.sessionDate),
        });
      });

      // 4. Evoluções sem validação de presença do responsável
      const noGuardianValidation = await db.select().from(dailyEvolutions)
        .where(and(
          eq(dailyEvolutions.guardianPresenceValidation, false),
          sql`${dailyEvolutions.sessionDate} >= ${startDate}`,
          sql`${dailyEvolutions.sessionDate} <= ${endDate}`,
        ));

      noGuardianValidation.forEach(ev => {
        issues.push({
          type: "sem_validacao_responsavel",
          severity: "alta",
          message: `Evolução sem validação de presença do responsável - Data: ${ev.sessionDate}`,
          patientId: ev.patientId,
          professionalId: ev.professionalId,
          date: String(ev.sessionDate),
        });
      });

      // 5. Guias vencidas com sessões no período
      const expiredAuths = await db.select().from(authorizations)
        .where(and(
          eq(authorizations.status, "ativa"),
          sql`${authorizations.expirationDate} < ${endDate}`,
        ));

      expiredAuths.forEach(auth => {
        issues.push({
          type: "guia_vencida",
          severity: "critica",
          message: `Guia ${auth.guideNumber} vencida em ${auth.expirationDate} - Atualizar status`,
          patientId: auth.patientId,
        });
      });

      // 6. Guias próximas do vencimento (15 dias)
      const fifteenDaysFromNow = new Date();
      fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
      
      const expiringAuths = await db.select().from(authorizations)
        .where(and(
          eq(authorizations.status, "ativa"),
          sql`${authorizations.expirationDate} <= ${fifteenDaysFromNow}`,
          sql`${authorizations.expirationDate} >= ${new Date()}`,
        ));

      expiringAuths.forEach(auth => {
        issues.push({
          type: "guia_vencendo",
          severity: "media",
          message: `Guia ${auth.guideNumber} vence em ${auth.expirationDate} - Solicitar renovação`,
          patientId: auth.patientId,
        });
      });

      // 7. Carga horária mensal - verificar se ultrapassa o autorizado
      const allAuths = await db.select().from(authorizations)
        .where(eq(authorizations.status, "ativa"));

      for (const auth of allAuths) {
        const sessionsInMonth = await db.select({ count: count() }).from(dailyEvolutions)
          .where(and(
            eq(dailyEvolutions.patientId, auth.patientId),
            eq(dailyEvolutions.authorizationId, auth.id),
            sql`${dailyEvolutions.sessionDate} >= ${startDate}`,
            sql`${dailyEvolutions.sessionDate} <= ${endDate}`,
          ));
        
        const usedInMonth = sessionsInMonth[0]?.count || 0;
        if (usedInMonth > auth.authorizedQuantity) {
          issues.push({
            type: "carga_horaria_excedida",
            severity: "critica",
            message: `Guia ${auth.guideNumber}: ${usedInMonth} sessões realizadas no mês, mas apenas ${auth.authorizedQuantity} autorizadas`,
            patientId: auth.patientId,
          });
        }
      }

      // 8. Plano Terapêutico não atualizado no mês
      const activePatients = await db.select().from(patients)
        .where(eq(patients.active, true));

      for (const patient of activePatients) {
        const activePlan = await db.select().from(therapeuticPlans)
          .where(and(
            eq(therapeuticPlans.patientId, patient.id),
            eq(therapeuticPlans.status, "ativo"),
          )).limit(1);

        if (!activePlan[0]) {
          issues.push({
            type: "sem_plano_terapeutico",
            severity: "alta",
            message: `Paciente ${patient.name} sem plano terapêutico ativo`,
            patientId: patient.id,
          });
        } else {
          // Verificar se o plano foi revisado no mês
          const planUpdatedAt = new Date(activePlan[0].updatedAt);
          if (planUpdatedAt < startDate) {
            issues.push({
              type: "plano_desatualizado",
              severity: "media",
              message: `Plano terapêutico do paciente ${patient.name} não foi revisado neste mês`,
              patientId: patient.id,
            });
          }
        }
      }

      // 9. Evolução mensal não gerada/aprovada
      for (const patient of activePatients) {
        const monthlyEv = await db.select().from(monthlyEvolutions)
          .where(and(
            eq(monthlyEvolutions.patientId, patient.id),
            eq(monthlyEvolutions.referenceMonth, input.month),
            eq(monthlyEvolutions.referenceYear, input.year),
          )).limit(1);

        if (!monthlyEv[0]) {
          // Verificar se há evoluções no mês para este paciente
          const hasEvolutions = await db.select({ count: count() }).from(dailyEvolutions)
            .where(and(
              eq(dailyEvolutions.patientId, patient.id),
              sql`${dailyEvolutions.sessionDate} >= ${startDate}`,
              sql`${dailyEvolutions.sessionDate} <= ${endDate}`,
            ));
          
          if ((hasEvolutions[0]?.count || 0) > 0) {
            issues.push({
              type: "evolucao_mensal_pendente",
              severity: "alta",
              message: `Evolução mensal não gerada para paciente ${patient.name}`,
              patientId: patient.id,
            });
          }
        } else if (!monthlyEv[0].approved) {
          issues.push({
            type: "evolucao_mensal_nao_aprovada",
            severity: "media",
            message: `Evolução mensal do paciente ${patient.name} não foi aprovada pelo terapeuta`,
            patientId: patient.id,
          });
        }
      }

      // Billing Checks - Checklist consolidado para faturamento
      const allEvolutionsInMonth = await db.select({ count: count() }).from(dailyEvolutions)
        .where(and(
          sql`${dailyEvolutions.sessionDate} >= ${startDate}`,
          sql`${dailyEvolutions.sessionDate} <= ${endDate}`,
        ));
      const totalEvolutionsCount = allEvolutionsInMonth[0]?.count || 0;

      const billingChecks = [
        {
          item: "Todas as evoluções possuem assinatura do terapeuta",
          status: unsignedEvolutions.length === 0,
          detail: unsignedEvolutions.length > 0 ? `${unsignedEvolutions.length} evolução(ões) sem assinatura` : "OK",
        },
        {
          item: "Carga horária mensal compatível com o autorizado",
          status: issues.filter(i => i.type === "carga_horaria_excedida").length === 0,
          detail: issues.filter(i => i.type === "carga_horaria_excedida").length > 0 
            ? `${issues.filter(i => i.type === "carga_horaria_excedida").length} guia(s) com carga excedida` 
            : "OK",
        },
        {
          item: "Plano de metas atualizado no mês",
          status: issues.filter(i => i.type === "plano_desatualizado" || i.type === "sem_plano_terapeutico").length === 0,
          detail: issues.filter(i => i.type === "plano_desatualizado" || i.type === "sem_plano_terapeutico").length > 0 
            ? `${issues.filter(i => i.type === "plano_desatualizado" || i.type === "sem_plano_terapeutico").length} paciente(s) com plano desatualizado/ausente` 
            : "OK",
        },
        {
          item: "Assinatura do responsável presente em todas as sessões",
          status: noGuardianValidation.length === 0,
          detail: noGuardianValidation.length > 0 ? `${noGuardianValidation.length} sessão(ões) sem validação do responsável` : "OK",
        },
        {
          item: "Todas as presenças possuem evolução vinculada",
          status: attendanceWithoutEvolution.length === 0,
          detail: attendanceWithoutEvolution.length > 0 ? `${attendanceWithoutEvolution.length} presença(s) sem evolução` : "OK",
        },
        {
          item: "Faltas justificadas possuem texto de justificativa",
          status: unjustifiedAbsences.length === 0,
          detail: unjustifiedAbsences.length > 0 ? `${unjustifiedAbsences.length} falta(s) sem justificativa` : "OK",
        },
        {
          item: "Guias dentro da validade",
          status: expiredAuths.length === 0,
          detail: expiredAuths.length > 0 ? `${expiredAuths.length} guia(s) vencida(s)` : "OK",
        },
        {
          item: "Evolução mensal gerada e aprovada",
          status: issues.filter(i => i.type === "evolucao_mensal_pendente" || i.type === "evolucao_mensal_nao_aprovada").length === 0,
          detail: issues.filter(i => i.type === "evolucao_mensal_pendente" || i.type === "evolucao_mensal_nao_aprovada").length > 0 
            ? `${issues.filter(i => i.type === "evolucao_mensal_pendente" || i.type === "evolucao_mensal_nao_aprovada").length} paciente(s) com evolução mensal pendente` 
            : "OK",
        },
      ];

      // Summary
      const summary = {
        totalIssues: issues.length,
        critical: issues.filter(i => i.severity === "critica").length,
        high: issues.filter(i => i.severity === "alta").length,
        medium: issues.filter(i => i.severity === "media").length,
        totalEvolutions: totalEvolutionsCount,
        billingReady: billingChecks.every(c => c.status),
      };

      return { issues, summary, billingChecks };
    }),

  // Relatório de inconsistências por profissional
  professionalReport: protectedProcedure
    .input(z.object({
      professionalId: z.number(),
      month: z.number().min(1).max(12),
      year: z.number().min(2020),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      const evolutions = await db.select().from(dailyEvolutions)
        .where(and(
          eq(dailyEvolutions.professionalId, input.professionalId),
          sql`${dailyEvolutions.sessionDate} >= ${startDate}`,
          sql`${dailyEvolutions.sessionDate} <= ${endDate}`,
        ));

      const attendance = await db.select().from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.professionalId, input.professionalId),
          sql`${attendanceRecords.sessionDate} >= ${startDate}`,
          sql`${attendanceRecords.sessionDate} <= ${endDate}`,
        ));

      return {
        totalEvolutions: evolutions.length,
        signedEvolutions: evolutions.filter(e => e.professionalSignature).length,
        unsignedEvolutions: evolutions.filter(e => !e.professionalSignature).length,
        totalAttendance: attendance.length,
        presents: attendance.filter(a => a.status === "presente").length,
        justifiedAbsences: attendance.filter(a => a.status === "falta_justificada").length,
        unjustifiedAbsences: attendance.filter(a => a.status === "falta_injustificada").length,
        withGuardianValidation: evolutions.filter(e => e.guardianPresenceValidation).length,
        withoutGuardianValidation: evolutions.filter(e => !e.guardianPresenceValidation).length,
      };
    }),
});
