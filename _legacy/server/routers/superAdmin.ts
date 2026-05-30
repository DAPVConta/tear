import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { platformAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clinics, clinicMembers, users, patients, professionals, dailyEvolutions } from "../../drizzle/schema";
import { eq, sql, desc, count, and } from "drizzle-orm";

export const superAdminRouter = router({
  // Listar todas as clínicas com estatísticas
  listClinics: platformAdminProcedure
    .input(z.object({
      search: z.string().optional(),
      planFilter: z.enum(["all", "trial", "basic", "professional", "enterprise"]).optional(),
      statusFilter: z.enum(["all", "active", "trialing", "past_due", "canceled"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const allClinics = await db.select().from(clinics).orderBy(desc(clinics.createdAt));

      // Enriquecer com contadores
      const enriched = await Promise.all(allClinics.map(async (clinic) => {
        const [membersCount] = await db.select({ count: count() }).from(clinicMembers)
          .where(and(eq(clinicMembers.clinicId, clinic.id), eq(clinicMembers.active, true)));
        const [patientsCount] = await db.select({ count: count() }).from(patients)
          .where(eq(patients.clinicId, clinic.id));
        const [professionalsCount] = await db.select({ count: count() }).from(professionals)
          .where(eq(professionals.clinicId, clinic.id));
        const [evolutionsCount] = await db.select({ count: count() }).from(dailyEvolutions)
          .where(eq(dailyEvolutions.clinicId, clinic.id));

        return {
          ...clinic,
          membersCount: membersCount?.count || 0,
          patientsCount: patientsCount?.count || 0,
          professionalsCount: professionalsCount?.count || 0,
          evolutionsCount: evolutionsCount?.count || 0,
        };
      }));

      // Aplicar filtros
      let filtered = enriched;
      if (input?.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(s) ||
          c.cnpj.includes(s) ||
          (c.email && c.email.toLowerCase().includes(s))
        );
      }
      if (input?.planFilter && input.planFilter !== "all") {
        filtered = filtered.filter(c => c.plan === input.planFilter);
      }
      if (input?.statusFilter && input.statusFilter !== "all") {
        filtered = filtered.filter(c => c.planStatus === input.statusFilter);
      }

      return filtered;
    }),

  // Estatísticas globais da plataforma
  platformStats: platformAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {
      totalClinics: 0,
      activeClinics: 0,
      trialClinics: 0,
      paidClinics: 0,
      totalUsers: 0,
      totalPatients: 0,
      totalEvolutions: 0,
      mrr: 0,
      planDistribution: [] as { plan: string; count: number }[],
      statusDistribution: [] as { status: string; count: number }[],
    };

    const [totalClinicsResult] = await db.select({ count: count() }).from(clinics);
    const [activeClinicsResult] = await db.select({ count: count() }).from(clinics)
      .where(eq(clinics.planStatus, "active"));
    const [trialClinicsResult] = await db.select({ count: count() }).from(clinics)
      .where(eq(clinics.planStatus, "trialing"));
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [totalPatientsResult] = await db.select({ count: count() }).from(patients);
    const [totalEvolutionsResult] = await db.select({ count: count() }).from(dailyEvolutions);

    // Calcular MRR (Monthly Recurring Revenue)
    const allClinics = await db.select({ plan: clinics.plan, planStatus: clinics.planStatus }).from(clinics);
    const planPrices: Record<string, number> = {
      basic: 29900,
      professional: 59900,
      enterprise: 99900,
    };
    const mrr = allClinics
      .filter(c => c.planStatus === "active")
      .reduce((sum, c) => sum + (planPrices[c.plan] || 0), 0);

    // Distribuição por plano
    const planDist = allClinics.reduce((acc, c) => {
      acc[c.plan] = (acc[c.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribuição por status
    const statusDist = allClinics.reduce((acc, c) => {
      acc[c.planStatus] = (acc[c.planStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClinics: totalClinicsResult?.count || 0,
      activeClinics: activeClinicsResult?.count || 0,
      trialClinics: trialClinicsResult?.count || 0,
      paidClinics: (activeClinicsResult?.count || 0),
      totalUsers: totalUsersResult?.count || 0,
      totalPatients: totalPatientsResult?.count || 0,
      totalEvolutions: totalEvolutionsResult?.count || 0,
      mrr,
      planDistribution: Object.entries(planDist).map(([plan, count]) => ({ plan, count })),
      statusDistribution: Object.entries(statusDist).map(([status, count]) => ({ status, count })),
    };
  }),

  // Detalhes de uma clínica específica
  clinicDetail: platformAdminProcedure
    .input(z.object({ clinicId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [clinic] = await db.select().from(clinics).where(eq(clinics.id, input.clinicId)).limit(1);
      if (!clinic) throw new TRPCError({ code: "NOT_FOUND", message: "Clínica não encontrada" });

      // Membros
      const members = await db.select({
        id: clinicMembers.id,
        role: clinicMembers.role,
        active: clinicMembers.active,
        createdAt: clinicMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
      }).from(clinicMembers)
        .leftJoin(users, eq(clinicMembers.userId, users.id))
        .where(eq(clinicMembers.clinicId, input.clinicId));

      // Contadores
      const [patientsCount] = await db.select({ count: count() }).from(patients)
        .where(eq(patients.clinicId, input.clinicId));
      const [professionalsCount] = await db.select({ count: count() }).from(professionals)
        .where(eq(professionals.clinicId, input.clinicId));
      const [evolutionsCount] = await db.select({ count: count() }).from(dailyEvolutions)
        .where(eq(dailyEvolutions.clinicId, input.clinicId));

      return {
        clinic,
        members,
        stats: {
          patients: patientsCount?.count || 0,
          professionals: professionalsCount?.count || 0,
          evolutions: evolutionsCount?.count || 0,
        },
      };
    }),

  // Ativar/desativar clínica
  toggleClinicStatus: platformAdminProcedure
    .input(z.object({ clinicId: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(clinics)
        .set({ active: input.active })
        .where(eq(clinics.id, input.clinicId));

      return { success: true };
    }),

  // Alterar plano de uma clínica manualmente
  updateClinicPlan: platformAdminProcedure
    .input(z.object({
      clinicId: z.number(),
      plan: z.enum(["trial", "basic", "professional", "enterprise"]),
      planStatus: z.enum(["active", "past_due", "canceled", "trialing"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(clinics)
        .set({ plan: input.plan, planStatus: input.planStatus })
        .where(eq(clinics.id, input.clinicId));

      return { success: true };
    }),
});
