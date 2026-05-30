import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { createContext, useContext, lazy, Suspense } from "react";
import { Puzzle } from "lucide-react";

// Lazy-loaded pages for better initial load performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PatientsPage = lazy(() => import("./pages/Patients"));
const PatientFormPage = lazy(() => import("./pages/PatientForm"));
const ProfessionalsPage = lazy(() => import("./pages/Professionals"));
const ProfessionalFormPage = lazy(() => import("./pages/ProfessionalForm"));
const AuthorizationsPage = lazy(() => import("./pages/Authorizations"));
const AuthorizationFormPage = lazy(() => import("./pages/AuthorizationForm"));
const TherapeuticPlansPage = lazy(() => import("./pages/TherapeuticPlans"));
const TherapeuticPlanFormPage = lazy(() => import("./pages/TherapeuticPlanForm"));
const DailyEvolutionPage = lazy(() => import("./pages/DailyEvolution"));
const DailyEvolutionFormPage = lazy(() => import("./pages/DailyEvolutionForm"));
const MonthlyEvolutionPage = lazy(() => import("./pages/MonthlyEvolution"));
const AuditDashboardPage = lazy(() => import("./pages/AuditDashboard"));
const AttendancePage = lazy(() => import("./pages/Attendance"));
const LandingPage = lazy(() => import("./pages/Landing"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Billing = lazy(() => import("./pages/Billing"));
const ClinicSettings = lazy(() => import("./pages/ClinicSettings"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));

// Page loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center animate-pulse">
          <Puzzle className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

// Contexto da clínica para compartilhar entre componentes
type ClinicContextType = {
  clinic: any;
  clinicLoading: boolean;
  hasClinic: boolean;
};

const ClinicContext = createContext<ClinicContextType>({
  clinic: null,
  clinicLoading: true,
  hasClinic: false,
});

export function useClinic() {
  return useContext(ClinicContext);
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { data: clinic, isLoading: clinicLoading } = trpc.clinics.current.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center animate-pulse">
            <Puzzle className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    );
  }

  // Se o usuário não tem clínica vinculada, redirecionar para onboarding
  if (!clinic) {
    return <Redirect to="/onboarding" />;
  }

  return (
    <ClinicContext.Provider value={{ clinic, clinicLoading: false, hasClinic: true }}>
      <DashboardLayout>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </DashboardLayout>
    </ClinicContext.Provider>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center animate-pulse">
          <Puzzle className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Landing page pública */}
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : (
          <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>
        )}
      </Route>
      <Route path="/landing">
        <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>
      </Route>
      <Route path="/onboarding">
        <Suspense fallback={<PageLoader />}><Onboarding /></Suspense>
      </Route>

      {/* Rotas protegidas */}
      <Route path="/dashboard">
        <ProtectedPage><Dashboard /></ProtectedPage>
      </Route>

      {/* Pacientes */}
      <Route path="/pacientes">
        <ProtectedPage><PatientsPage /></ProtectedPage>
      </Route>
      <Route path="/pacientes/novo">
        <ProtectedPage><PatientFormPage /></ProtectedPage>
      </Route>
      <Route path="/pacientes/:id">
        <ProtectedPage><PatientFormPage /></ProtectedPage>
      </Route>

      {/* Profissionais */}
      <Route path="/profissionais">
        <ProtectedPage><ProfessionalsPage /></ProtectedPage>
      </Route>
      <Route path="/profissionais/novo">
        <ProtectedPage><ProfessionalFormPage /></ProtectedPage>
      </Route>
      <Route path="/profissionais/:id">
        <ProtectedPage><ProfessionalFormPage /></ProtectedPage>
      </Route>

      {/* Guias */}
      <Route path="/guias">
        <ProtectedPage><AuthorizationsPage /></ProtectedPage>
      </Route>
      <Route path="/guias/nova">
        <ProtectedPage><AuthorizationFormPage /></ProtectedPage>
      </Route>
      <Route path="/guias/:id">
        <ProtectedPage><AuthorizationFormPage /></ProtectedPage>
      </Route>

      {/* Planos Terapêuticos */}
      <Route path="/planos">
        <ProtectedPage><TherapeuticPlansPage /></ProtectedPage>
      </Route>
      <Route path="/planos/novo">
        <ProtectedPage><TherapeuticPlanFormPage /></ProtectedPage>
      </Route>
      <Route path="/planos/:id">
        <ProtectedPage><TherapeuticPlanFormPage /></ProtectedPage>
      </Route>

      {/* Evoluções */}
      <Route path="/evolucoes">
        <ProtectedPage><DailyEvolutionPage /></ProtectedPage>
      </Route>
      <Route path="/evolucoes/nova">
        <ProtectedPage><DailyEvolutionFormPage /></ProtectedPage>
      </Route>
      <Route path="/evolucao-mensal">
        <ProtectedPage><MonthlyEvolutionPage /></ProtectedPage>
      </Route>

      {/* Frequência e Auditoria */}
      <Route path="/frequencia">
        <ProtectedPage><AttendancePage /></ProtectedPage>
      </Route>
      <Route path="/auditoria">
        <ProtectedPage><AuditDashboardPage /></ProtectedPage>
      </Route>

      {/* Configurações */}
      <Route path="/settings/billing">
        <ProtectedPage><Billing /></ProtectedPage>
      </Route>
      <Route path="/settings/clinic">
        <ProtectedPage><ClinicSettings /></ProtectedPage>
      </Route>

      {/* Super Admin */}
      <Route path="/super-admin">
        <ProtectedPage><SuperAdmin /></ProtectedPage>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
