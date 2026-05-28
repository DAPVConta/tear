import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LogoMark } from "@/components/brand/Logo";
import {
  RequireAuth,
  RequireClinic,
  RedirectIfAuthed,
  RequirePlatformAdmin,
} from "@/routes/guards";
import {
  Landing,
  Login,
  Onboarding,
  Dashboard,
  PatientsList,
  PatientForm,
  ProfessionalsList,
  ProfessionalForm,
  AuthorizationsList,
  AuthorizationForm,
  PlansList,
  PlanForm,
  DailyEvolutionsList,
  DailyEvolutionForm,
  MonthlyList,
  MonthlyGenerate,
  MonthlyDetail,
  AttendanceList,
  AttendanceForm,
  AuditDashboard,
  SettingsPage,
  SuperAdmin,
  PrivacyPolicy,
  NotFound,
} from "@/routes/pages";

// Fallback do Suspense usado APENAS no boot inicial / rotas fora do shell.
// Quando o usuário já está no shell, o fallback é uma barra fina dentro
// da própria área de conteúdo (ver AppShell).
function BootLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <LogoMark className="h-12 w-12 animate-pulse" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<BootLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />

        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<RequireClinic />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pacientes" element={<PatientsList />} />
              <Route path="/pacientes/novo" element={<PatientForm />} />
              <Route path="/pacientes/:id" element={<PatientForm />} />
              <Route path="/profissionais" element={<ProfessionalsList />} />
              <Route path="/profissionais/novo" element={<ProfessionalForm />} />
              <Route path="/profissionais/:id" element={<ProfessionalForm />} />
              <Route path="/guias" element={<AuthorizationsList />} />
              <Route path="/guias/nova" element={<AuthorizationForm />} />
              <Route path="/guias/:id" element={<AuthorizationForm />} />
              <Route path="/planos" element={<PlansList />} />
              <Route path="/planos/novo" element={<PlanForm />} />
              <Route path="/planos/:id" element={<PlanForm />} />
              <Route path="/evolucoes" element={<DailyEvolutionsList />} />
              <Route path="/evolucoes/nova" element={<DailyEvolutionForm />} />
              <Route path="/evolucoes/:id" element={<DailyEvolutionForm />} />
              <Route path="/evolucao-mensal" element={<MonthlyList />} />
              <Route path="/evolucao-mensal/gerar" element={<MonthlyGenerate />} />
              <Route path="/evolucao-mensal/:id" element={<MonthlyDetail />} />
              <Route path="/frequencia" element={<AttendanceList />} />
              <Route path="/frequencia/novo" element={<AttendanceForm />} />
              <Route path="/frequencia/:id" element={<AttendanceForm />} />
              <Route path="/auditoria" element={<AuditDashboard />} />
              <Route path="/configuracoes" element={<SettingsPage />} />

              <Route element={<RequirePlatformAdmin />}>
                <Route path="/super-admin" element={<SuperAdmin />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
