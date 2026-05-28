import { lazy } from "react";

// Factories nomeadas — mesmas referências usadas pelo lazy() e pelo
// prefetchPage() (hover/focus na sidebar), garantindo um único chunk
// por página e cache compartilhado entre prefetch e render.
const factories = {
  "/": () => import("@/pages/Landing"),
  "/login": () => import("@/pages/auth/Login"),
  "/onboarding": () => import("@/pages/Onboarding"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/pacientes": () => import("@/pages/patients/PatientsList"),
  "/pacientes/form": () => import("@/pages/patients/PatientForm"),
  "/profissionais": () => import("@/pages/professionals/ProfessionalsList"),
  "/profissionais/form": () => import("@/pages/professionals/ProfessionalForm"),
  "/guias": () => import("@/pages/authorizations/AuthorizationsList"),
  "/guias/form": () => import("@/pages/authorizations/AuthorizationForm"),
  "/planos": () => import("@/pages/plans/PlansList"),
  "/planos/form": () => import("@/pages/plans/PlanForm"),
  "/evolucoes": () => import("@/pages/evolutions/DailyEvolutionsList"),
  "/evolucoes/form": () => import("@/pages/evolutions/DailyEvolutionForm"),
  "/evolucao-mensal": () => import("@/pages/monthly/MonthlyList"),
  "/evolucao-mensal/gerar": () => import("@/pages/monthly/MonthlyGenerate"),
  "/evolucao-mensal/detail": () => import("@/pages/monthly/MonthlyDetail"),
  "/frequencia": () => import("@/pages/attendance/AttendanceList"),
  "/frequencia/form": () => import("@/pages/attendance/AttendanceForm"),
  "/auditoria": () => import("@/pages/audit/AuditDashboard"),
  "/configuracoes": () => import("@/pages/settings/SettingsPage"),
  "/super-admin": () => import("@/pages/super-admin/SuperAdmin"),
  "/privacidade": () => import("@/pages/PrivacyPolicy"),
  "/404": () => import("@/pages/NotFound"),
} as const;

type PageKey = keyof typeof factories;

export const Landing = lazy(factories["/"]);
export const Login = lazy(factories["/login"]);
export const Onboarding = lazy(factories["/onboarding"]);
export const Dashboard = lazy(factories["/dashboard"]);
export const PatientsList = lazy(factories["/pacientes"]);
export const PatientForm = lazy(factories["/pacientes/form"]);
export const ProfessionalsList = lazy(factories["/profissionais"]);
export const ProfessionalForm = lazy(factories["/profissionais/form"]);
export const AuthorizationsList = lazy(factories["/guias"]);
export const AuthorizationForm = lazy(factories["/guias/form"]);
export const PlansList = lazy(factories["/planos"]);
export const PlanForm = lazy(factories["/planos/form"]);
export const DailyEvolutionsList = lazy(factories["/evolucoes"]);
export const DailyEvolutionForm = lazy(factories["/evolucoes/form"]);
export const MonthlyList = lazy(factories["/evolucao-mensal"]);
export const MonthlyGenerate = lazy(factories["/evolucao-mensal/gerar"]);
export const MonthlyDetail = lazy(factories["/evolucao-mensal/detail"]);
export const AttendanceList = lazy(factories["/frequencia"]);
export const AttendanceForm = lazy(factories["/frequencia/form"]);
export const AuditDashboard = lazy(factories["/auditoria"]);
export const SettingsPage = lazy(factories["/configuracoes"]);
export const SuperAdmin = lazy(factories["/super-admin"]);
export const PrivacyPolicy = lazy(factories["/privacidade"]);
export const NotFound = lazy(factories["/404"]);

// Dispara o download do chunk antes do clique. Sem-op se o módulo já
// estiver carregado (import() é cacheado pelo runtime).
export function prefetchPage(href: string): void {
  // Casa o href com a chave conhecida; trata sub-rotas (/pacientes/123 → /pacientes).
  const key = (factories[href as PageKey]
    ? href
    : (Object.keys(factories) as PageKey[]).find(
        (k) => k !== "/" && href.startsWith(k),
      )) as PageKey | undefined;
  if (key) void factories[key]();
}
