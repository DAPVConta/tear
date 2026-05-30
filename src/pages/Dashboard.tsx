import { Link } from "react-router-dom";
import {
  Users,
  ClipboardList,
  FileCheck2,
  TrendingUp,
  Plus,
  CalendarDays,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  Bar,
  BarChart,
  YAxis,
} from "recharts";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClinic } from "@/providers/ClinicProvider";
import {
  useDashboardMetrics,
  useSessionsByDay,
  useExpiringAuthorizations,
  useAssessmentDistribution,
} from "@/features/dashboard/api";

function todayPt() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
}

export default function Dashboard() {
  const { clinic } = useClinic();
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();
  const { data: sessions, isLoading: loadingSessions } = useSessionsByDay({
    days: 14,
  });
  const { data: expiring, isLoading: loadingExpiring } =
    useExpiringAuthorizations({ withinDays: 30 });
  const { data: assessments, isLoading: loadingAssessments } =
    useAssessmentDistribution({ days: 30 });

  return (
    <div className="space-y-8">
      {/* Hero imponente */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-radial p-8 text-white shadow-elevated lg:p-10">
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-blue-light/30 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
              <CalendarDays className="h-4 w-4" />
              {todayPt()}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
              {clinic?.name ?? "Painel da clínica"}
            </h1>
            <p className="mt-3 text-white/70">
              Acompanhe pacientes, sessões e indicadores clínicos em tempo real —
              com a inteligência do TEAR.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Link to="/evolucoes/novo">
                <Plus className="h-4 w-4" /> Nova evolução
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link to="/pacientes/novo">
                <Plus className="h-4 w-4" /> Novo paciente
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Pacientes ativos"
          icon={Users}
          value={metrics?.patientsActive}
          loading={loadingMetrics}
        />
        <Metric
          label="Sessões na semana"
          icon={ClipboardList}
          value={metrics?.sessionsThisWeek}
          loading={loadingMetrics}
        />
        <Metric
          label="Guias vigentes"
          icon={FileCheck2}
          value={metrics?.activeGuides}
          loading={loadingMetrics}
        />
        <Metric
          label="Taxa de presença (30d)"
          icon={TrendingUp}
          value={metrics?.attendanceRate}
          suffix={metrics?.attendanceRate == null ? "" : "%"}
          fallback="—"
          loading={loadingMetrics}
        />
      </section>

      {/* Gráficos */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Sessões nos últimos 14 dias</h2>
              <p className="text-sm text-muted-foreground">
                Volume de atendimentos por dia
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            {loadingSessions ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sessions ?? []}
                  margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
                >
                  <defs>
                    <linearGradient id="fillSessoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E88FF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1E88FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <RechartsTooltip
                    cursor={{ stroke: "hsl(var(--border))" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessoes"
                    stroke="#1E88FF"
                    strokeWidth={2.5}
                    fill="url(#fillSessoes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-bold">Avaliações (30 dias)</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Distribuição das sessões
          </p>
          <div className="h-64 w-full">
            {loadingAssessments ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (assessments?.length ?? 0) === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem dados no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={assessments}
                  layout="vertical"
                  margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#1E88FF"
                    radius={[6, 6, 6, 6]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Guias a vencer */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Guias a vencer (30 dias)</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe as autorizações próximas do vencimento
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/guias">Ver todas</Link>
          </Button>
        </div>
        {loadingExpiring ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (expiring?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Nenhuma guia vencendo no período. ✔
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {expiring!.map((g) => {
              const days = differenceInCalendarDays(
                parseISO(g.expiration_date),
                new Date(),
              );
              return (
                <li key={g.id}>
                  <Link
                    to={`/guias/${g.id}`}
                    className="flex items-center gap-4 py-3 transition-colors hover:bg-secondary/40"
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        days <= 7
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/15 text-amber-600"
                      }`}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {g.patient?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Guia {g.guide_number} ·{" "}
                        {format(parseISO(g.expiration_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      {days === 0
                        ? "vence hoje"
                        : days === 1
                          ? "1 dia"
                          : `${days} dias`}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  icon: Icon,
  value,
  suffix = "",
  fallback = "0",
  loading,
}: {
  label: string;
  icon: LucideIcon;
  value: number | null | undefined;
  suffix?: string;
  fallback?: string;
  loading?: boolean;
}) {
  const display =
    value === undefined || value === null ? fallback : `${value}${suffix}`;
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-all group-hover:bg-brand-gradient group-hover:shadow-glow">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">
        {loading ? <Skeleton className="inline-block h-8 w-16" /> : display}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
