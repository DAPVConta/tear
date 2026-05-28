import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LogoMark } from "@/components/brand/Logo";
import {
  RequireAuth,
  RequireClinic,
  RedirectIfAuthed,
  RequirePlatformAdmin,
} from "@/routes/guards";

const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const PatientsList = lazy(() => import("@/pages/patients/PatientsList"));
const PatientForm = lazy(() => import("@/pages/patients/PatientForm"));
const ProfessionalsList = lazy(() => import("@/pages/professionals/ProfessionalsList"));
const ProfessionalForm = lazy(() => import("@/pages/professionals/ProfessionalForm"));
const AuthorizationsList = lazy(() => import("@/pages/authorizations/AuthorizationsList"));
const AuthorizationForm = lazy(() => import("@/pages/authorizations/AuthorizationForm"));
const PlansList = lazy(() => import("@/pages/plans/PlansList"));
const PlanForm = lazy(() => import("@/pages/plans/PlanForm"));
const DailyEvolutionsList = lazy(() => import("@/pages/evolutions/DailyEvolutionsList"));
const DailyEvolutionForm = lazy(() => import("@/pages/evolutions/DailyEvolutionForm"));
const AttendanceList = lazy(() => import("@/pages/attendance/AttendanceList"));
const AttendanceForm = lazy(() => import("@/pages/attendance/AttendanceForm"));
const MonthlyList = lazy(() => import("@/pages/monthly/MonthlyList"));
const MonthlyGenerate = lazy(() => import("@/pages/monthly/MonthlyGenerate"));
const MonthlyDetail = lazy(() => import("@/pages/monthly/MonthlyDetail"));
const AuditDashboard = lazy(() => import("@/pages/audit/AuditDashboard"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const SuperAdmin = lazy(() => import("@/pages/super-admin/SuperAdmin"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageLoader() {
  return (
    <div className="grid place-items-center py-24">
      <LogoMark className="h-12 w-12 animate-pulse" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Autenticado */}
        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Autenticado + com clínica */}
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
