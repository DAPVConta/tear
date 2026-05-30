import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { patientsRouter } from "./routers/patients.ts";
import { professionalsRouter } from "./routers/professionals.ts";
import { authorizationsRouter } from "./routers/authorizations.ts";
import { therapeuticPlansRouter } from "./routers/therapeuticPlans.ts";
import { dailyEvolutionsRouter } from "./routers/dailyEvolutions.ts";
import { monthlyEvolutionsRouter } from "./routers/monthlyEvolutions.ts";
import { attendanceRouter } from "./routers/attendance.ts";
import { auditRouter } from "./routers/audit.ts";
import { dashboardRouter } from "./routers/dashboard.ts";
import { clinicsRouter } from "./routers/clinics.ts";
import { stripeRouter } from "./stripe/stripeRouter.ts";
import { superAdminRouter } from "./routers/superAdmin.ts";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  patients: patientsRouter,
  professionals: professionalsRouter,
  authorizations: authorizationsRouter,
  therapeuticPlans: therapeuticPlansRouter,
  dailyEvolutions: dailyEvolutionsRouter,
  monthlyEvolutions: monthlyEvolutionsRouter,
  attendance: attendanceRouter,
  audit: auditRouter,
  dashboard: dashboardRouter,
  clinics: clinicsRouter,
  stripe: stripeRouter,
  superAdmin: superAdminRouter,
});

export type AppRouter = typeof appRouter;
