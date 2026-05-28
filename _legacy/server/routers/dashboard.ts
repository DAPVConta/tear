import { eq, and, sql, count } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dailyEvolutions, patients, professionals, authorizations, attendanceRecords } from "../../drizzle/schema";

export const dashboardRouter = router({
  // Estatísticas gerais
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { patients: 0, professionals: 0, evolutions: 0, activeAuths: 0 };

    const [patientsCount] = await db.select({ count: count() }).from(patients).where(eq(patients.active, true));
    const [professionalsCount] = await db.select({ count: count() }).from(professionals).where(eq(professionals.active, true));
    const [evolutionsCount] = await db.select({ count: count() }).from(dailyEvolutions);
    const [activeAuthsCount] = await db.select({ count: count() }).from(authorizations).where(eq(authorizations.status, "ativa"));

    return {
      patients: patientsCount?.count || 0,
      professionals: professionalsCount?.count || 0,
      evolutions: evolutionsCount?.count || 0,
      activeAuths: activeAuthsCount?.count || 0,
    };
  }),

  // Alertas ativos
  alerts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const alerts: Array<{ type: string; severity: string; message: string; count: number }> = [];

    // Guias vencendo em 15 dias
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
    
    const expiringAuths = await db.select({ count: count() }).from(authorizations)
      .where(and(
        eq(authorizations.status, "ativa"),
        sql`${authorizations.expirationDate} <= ${fifteenDaysFromNow}`,
        sql`${authorizations.expirationDate} >= ${new Date()}`,
      ));

    if (expiringAuths[0]?.count > 0) {
      alerts.push({
        type: "guia_vencendo",
        severity: "warning",
        message: "Guias próximas do vencimento",
        count: expiringAuths[0].count,
      });
    }

    // Evoluções sem assinatura (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const unsignedEvolutions = await db.select({ count: count() }).from(dailyEvolutions)
      .where(and(
        eq(dailyEvolutions.professionalSignature, false),
        sql`${dailyEvolutions.sessionDate} >= ${sevenDaysAgo}`,
      ));

    if (unsignedEvolutions[0]?.count > 0) {
      alerts.push({
        type: "evolucao_sem_assinatura",
        severity: "error",
        message: "Evoluções pendentes de assinatura",
        count: unsignedEvolutions[0].count,
      });
    }

    // Guias esgotadas
    const exhaustedAuths = await db.select({ count: count() }).from(authorizations)
      .where(sql`${authorizations.usedQuantity} >= ${authorizations.authorizedQuantity} AND ${authorizations.status} = 'ativa'`);

    if (exhaustedAuths[0]?.count > 0) {
      alerts.push({
        type: "guia_esgotada",
        severity: "error",
        message: "Guias com sessões esgotadas",
        count: exhaustedAuths[0].count,
      });
    }

    return alerts;
  }),

  // Evoluções recentes
  recentEvolutions: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select().from(dailyEvolutions)
        .orderBy(sql`${dailyEvolutions.createdAt} DESC`)
        .limit(input?.limit || 10);
    }),
});
