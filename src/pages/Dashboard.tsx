import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Users,
  ClipboardList,
  FileCheck2,
  TrendingUp,
  TrendingDown,
  Plus,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  AlertTriangle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  Bar,
  BarChart,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { parseDateOnly, daysUntil } from "@/lib/date";
import type { LucideIcon } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { TeaBars } from "@/components/brand/Logo";
import { Stagger, StaggerItem } from "@/components/motion/motion";
import { useClinic } from "@/providers/ClinicProvider";
import { ASSESSMENT_COLORS, type ChartMode } from "@/lib/chartTheme";
import {
  useDashboardMetrics,
  useSessionsByDay,
  useExpiringAuthorizations,
  useAssessmentDistribution,
  usePendingSessions,
  type ExpiringAuthorization,
  type PendingSession,
} from "@/features/dashboard/api";

function todayPt() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa noite";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// Ordem semântica fixa da escala de avaliação (progresso → retrocesso).
const ASSESSMENT_ORDER = [
  "evolucao_significativa",
  "evolucao_leve",
  "estavel",
  "retrocesso_leve",
  "retrocesso_significativo",
];

export default function Dashboard() {
  const { clinic } = useClinic();
  const { resolvedTheme } = useTheme();
  const mode: ChartMode = resolvedTheme === "dark" ? "dark" : "light";
  const [panel, setPanel] = useState<"pending" | "guides" | null>(null);
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();
  const { data: sessions, isLoading: loadingSessions } = useSessionsByDay({
    days: 14,
  });
  const { data: expiring, isLoading: loadingExpiring } =
    useExpiringAuthorizations({ withinDays: 30 });
  const { data: pending, isLoading: loadingPending } = usePendingSessions({
    days: 30,
  });
  const { data: assessments, isLoading: loadingAssessments } =
    useAssessmentDistribution({ days: 30 });

  const sortedAssessments = [...(assessments ?? [])].sort(
    (a, b) => ASSESSMENT_ORDER.indexOf(a.key) - ASSESSMENT_ORDER.indexOf(b.key),
  );

  // Comparativo semanal: últimos 7 dias vs. 7 anteriores.
  const totalSessions = (sessions ?? []).reduce((s, d) => s + d.sessoes, 0);
  const last7 = (sessions ?? []).slice(-7).reduce((s, d) => s + d.sessoes, 0);
  const prev7 = (sessions ?? []).slice(0, -7).reduce((s, d) => s + d.sessoes, 0);
  const weekDelta =
    prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

  function toggle(next: "pending" | "guides") {
    setPanel((prev) => (prev === next ? null : next));
  }

  return (
    <div className="space-y-8">
      {/* Hero imponente */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-hero-aurora p-8 text-white shadow-elevated lg:p-10">
        <div className="absolute inset-0 bg-noise opacity-[0.05]" />
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <TeaBars className="mb-5" barClassName="h-1 w-7" />
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayPt()}
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight lg:text-4xl">
              {greeting()}
              {clinic?.name ? (
                <>
                  ,{" "}
                  <span className="bg-gradient-to-r from-brand-cyan-200 via-white to-brand-blue-light-200 bg-clip-text text-transparent">
                    {clinic.name}
                  </span>
                </>
              ) : null}
            </h1>
            <p className="mt-3 max-w-xl text-white/70">
              Acompanhe pacientes, sessões e indicadores clínicos em tempo real
              — com a inteligência do TEAR.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary shadow-glow transition-transform hover:-translate-y-0.5 hover:bg-white/90"
            >
              <Link to="/evolucoes/novo">
                <Plus className="h-4 w-4" /> Nova evolução
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/10 text-white backdrop-blur-sm transition-transform hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
            >
              <Link to="/pacientes/novo">
                <Plus className="h-4 w-4" /> Novo paciente
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Métricas — um acento TEA por cartão (diversidade da marca) */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <Metric
            label="Pacientes ativos"
            hint="em acompanhamento"
            icon={Users}
            value={metrics?.patientsActive}
            loading={loadingMetrics}
            accent="blue"
          />
        </StaggerItem>
        <StaggerItem>
          <Metric
            label="Sessões na semana"
            hint="desde segunda-feira"
            icon={ClipboardList}
            value={metrics?.sessionsThisWeek}
            loading={loadingMetrics}
            accent="cyan"
          />
        </StaggerItem>
        <StaggerItem>
          <Metric
            label="Guias vigentes"
            hint="ativas e dentro do prazo"
            icon={FileCheck2}
            value={metrics?.activeGuides}
            loading={loadingMetrics}
            accent="yellow"
          />
        </StaggerItem>
        <StaggerItem>
          <Metric
            label="Taxa de presença"
            hint="últimos 30 dias"
            icon={TrendingUp}
            value={metrics?.attendanceRate}
            suffix={metrics?.attendanceRate == null ? "" : "%"}
            fallback="—"
            loading={loadingMetrics}
            accent="red"
          />
        </StaggerItem>
      </Stagger>

      {/* Gráficos */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-blue-light-50 text-brand-blue-light-600 dark:bg-brand-blue-light-950/60 dark:text-brand-blue-light-300">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-h3">Sessões nos últimos 14 dias</h2>
                <p className="text-sm text-muted-foreground">
                  Volume de atendimentos por dia
                </p>
              </div>
            </div>
            {weekDelta != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tabular-nums",
                  weekDelta >= 0
                    ? "bg-success/10 text-success-text"
                    : "bg-destructive/10 text-destructive-text",
                )}
              >
                {weekDelta >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {weekDelta > 0 ? "+" : ""}
                {weekDelta}% vs. semana anterior
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            {loadingSessions ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : totalSessions === 0 ? (
              <EmptyChart
                icon={Activity}
                message="Nenhuma sessão registrada no período."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sessions ?? []}
                  margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
                >
                  <defs>
                    <linearGradient id="fillSessoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E88FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1E88FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <YAxis
                    width={30}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tickCount={4}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <RechartsTooltip
                    cursor={{
                      stroke: "#1E88FF",
                      strokeOpacity: 0.35,
                      strokeDasharray: "4 4",
                    }}
                    content={<ChartTooltip />}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessoes"
                    name="sessões"
                    stroke="#1E88FF"
                    strokeWidth={2}
                    fill="url(#fillSessoes)"
                    activeDot={{
                      r: 5,
                      fill: "#1E88FF",
                      stroke: "hsl(var(--card))",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-cyan-50 text-brand-cyan-700 dark:bg-brand-cyan-950/60 dark:text-brand-cyan-300">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-h3">Avaliações</h2>
              <p className="text-sm text-muted-foreground">
                Sessões dos últimos 30 dias
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            {loadingAssessments ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : sortedAssessments.length === 0 ? (
              <EmptyChart icon={BarChart3} message="Sem dados no período." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedAssessments}
                  layout="vertical"
                  margin={{ top: 4, right: 28, bottom: 0, left: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={118}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--secondary))", opacity: 0.6 }}
                    content={<ChartTooltip />}
                  />
                  <Bar
                    dataKey="value"
                    name="sessões"
                    barSize={20}
                    radius={[0, 6, 6, 0]}
                  >
                    {/* Escala divergente: cor segue a categoria clínica */}
                    {sortedAssessments.map((a) => (
                      <Cell
                        key={a.key}
                        fill={ASSESSMENT_COLORS[mode][a.key]}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Cartões de ação — clique monta a lista; clique no item vai para editar */}
      <section className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          label="Pendências"
          hint="Sessões com item de faturamento em falta (30d)"
          icon={ClipboardCheck}
          accent="red"
          count={pending?.length}
          loading={loadingPending}
          open={panel === "pending"}
          onToggle={() => toggle("pending")}
        />
        <ActionCard
          label="Guias a vencer"
          hint="Autorizações vencendo em até 30 dias"
          icon={FileClock}
          accent="yellow"
          count={expiring?.length}
          loading={loadingExpiring}
          open={panel === "guides"}
          onToggle={() => toggle("guides")}
        />
      </section>

      {panel === "pending" && (
        <PendingPanel items={pending} loading={loadingPending} />
      )}
      {panel === "guides" && (
        <GuidesPanel items={expiring} loading={loadingExpiring} />
      )}
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Acentos TEA compartilhados pelos cartões do dashboard.
type MetricAccent = "blue" | "cyan" | "yellow" | "red";
const ACCENT: Record<
  MetricAccent,
  { bar: string; chip: string; chipText: string; card: string }
> = {
  blue: {
    bar: "bg-brand-blue-light",
    chip: "from-brand-blue-light-400 to-brand-blue-light-600 shadow-glow",
    chipText: "text-white",
    card: "border-brand-blue-light-200/70 bg-gradient-to-br from-brand-blue-light-50 to-brand-blue-light-100/60 dark:border-brand-blue-light-900/50 dark:from-brand-blue-light-950/70 dark:to-brand-blue-light-900/30",
  },
  cyan: {
    bar: "bg-brand-cyan",
    chip: "from-brand-cyan-400 to-brand-cyan-600 shadow-glow-cyan",
    chipText: "text-white",
    card: "border-brand-cyan-200/70 bg-gradient-to-br from-brand-cyan-50 to-brand-cyan-100/60 dark:border-brand-cyan-900/50 dark:from-brand-cyan-950/70 dark:to-brand-cyan-900/30",
  },
  yellow: {
    bar: "bg-brand-yellow",
    chip: "from-brand-yellow-300 to-brand-yellow-500 shadow-glow-yellow",
    chipText: "text-brand-yellow-950",
    card: "border-brand-yellow-200/70 bg-gradient-to-br from-brand-yellow-50 to-brand-yellow-100/60 dark:border-brand-yellow-900/50 dark:from-brand-yellow-950/70 dark:to-brand-yellow-900/30",
  },
  red: {
    bar: "bg-brand-red",
    chip: "from-brand-red-400 to-brand-red-600 shadow-glow-red",
    chipText: "text-white",
    card: "border-brand-red-200/70 bg-gradient-to-br from-brand-red-50 to-brand-red-100/60 dark:border-brand-red-900/50 dark:from-brand-red-950/70 dark:to-brand-red-900/30",
  },
};

// Cartão de ação clicável (abre/fecha o painel de lista correspondente).
function ActionCard({
  label,
  hint,
  icon: Icon,
  accent,
  count,
  loading,
  open,
  onToggle,
}: {
  label: string;
  hint: string;
  icon: LucideIcon;
  accent: MetricAccent;
  count: number | undefined;
  loading?: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const a = ACCENT[accent];
  const empty = !loading && (count ?? 0) === 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border p-5 text-left shadow-soft outline-none transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-ring",
        a.card,
        open && "ring-2 ring-ring",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity group-hover:opacity-100",
          a.bar,
        )}
      />
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br transition-transform duration-200 ease-out group-hover:scale-105",
            a.chip,
            a.chipText,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[1.75rem] font-extrabold tabular-nums leading-none tracking-tight">
              {loading ? (
                <Skeleton className="inline-block h-7 w-10" />
              ) : (
                (count ?? 0)
              )}
            </span>
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </p>
          <p className="mt-1 truncate text-caption text-muted-foreground">
            {hint}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </div>
      {empty && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-success-text">
          <CheckCircle2 className="h-3.5 w-3.5" /> Tudo em dia
        </p>
      )}
    </button>
  );
}

function PanelShell({
  title,
  subtitle,
  icon: Icon,
  iconClass,
  linkTo,
  linkLabel,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClass: string;
  linkTo: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-border bg-card p-6 shadow-soft duration-300">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl",
              iconClass,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-h3">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={linkTo}>{linkLabel}</Link>
        </Button>
      </div>
      {children}
    </section>
  );
}

function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success-text">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function PendingPanel({
  items,
  loading,
}: {
  items: PendingSession[] | undefined;
  loading: boolean;
}) {
  const navigate = useNavigate();
  return (
    <PanelShell
      title="Sessões com pendências"
      subtitle="Itens de faturamento em falta nos últimos 30 dias"
      icon={ClipboardCheck}
      iconClass="bg-brand-red-50 text-brand-red-700 dark:bg-brand-red-950/60 dark:text-brand-red-300"
      linkTo="/auditoria"
      linkLabel="Abrir auditoria"
    >
      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (items?.length ?? 0) === 0 ? (
        <PanelEmpty message="Nenhuma sessão com pendências. Tudo em dia." />
      ) : (
        <ul className="space-y-1">
          {items!.map((s) => {
            const name = s.patient?.name ?? "—";
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/evolucoes/${s.id}`)}
                  className="group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/60"
                >
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-xs font-bold text-white">
                    {initials(name)}
                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-white ring-2 ring-card">
                      <AlertTriangle className="h-2.5 w-2.5" />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {format(parseDateOnly(s.session_date), "dd/MM/yyyy")}
                      {s.professional?.name ? ` · ${s.professional.name}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.failed.map((r) => (
                        <Badge key={r.id} variant="warning">
                          {r.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}

function GuidesPanel({
  items,
  loading,
}: {
  items: ExpiringAuthorization[] | undefined;
  loading: boolean;
}) {
  const navigate = useNavigate();
  return (
    <PanelShell
      title="Guias a vencer"
      subtitle="Autorizações que vencem nos próximos 30 dias"
      icon={FileClock}
      iconClass="bg-brand-yellow-50 text-brand-yellow-800 dark:bg-brand-yellow-950/60 dark:text-brand-yellow-300"
      linkTo="/guias"
      linkLabel="Ver todas"
    >
      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (items?.length ?? 0) === 0 ? (
        <PanelEmpty message="Nenhuma guia vencendo no período. Tudo em dia." />
      ) : (
        <ul className="space-y-1">
          {items!.map((g) => {
            const days = daysUntil(g.expiration_date);
            const critical = days <= 7;
            const name = g.patient?.name ?? "—";
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/guias/${g.id}`)}
                  className="group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/60"
                >
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-xs font-bold text-white">
                    {initials(name)}
                    {critical && (
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-white ring-2 ring-card">
                        <AlertTriangle className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      Guia {g.guide_number} · vence em{" "}
                      {format(parseDateOnly(g.expiration_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums",
                      critical
                        ? "bg-brand-red-50 text-brand-red-700 dark:bg-brand-red-950/60 dark:text-brand-red-300"
                        : "bg-brand-yellow-50 text-brand-yellow-800 dark:bg-brand-yellow-950/60 dark:text-brand-yellow-300",
                    )}
                  >
                    {days === 0
                      ? "vence hoje"
                      : days === 1
                        ? "1 dia"
                        : `${days} dias`}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}

function Metric({
  label,
  hint,
  icon: Icon,
  value,
  suffix = "",
  fallback = "0",
  loading,
  accent = "blue",
}: {
  label: string;
  hint?: string;
  icon: LucideIcon;
  value: number | null | undefined;
  suffix?: string;
  fallback?: string;
  loading?: boolean;
  accent?: MetricAccent;
}) {
  const display =
    value === undefined || value === null ? fallback : `${value}${suffix}`;
  const a = ACCENT[accent];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-6 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-elevated",
        a.card,
      )}
    >
      {/* Ícone-marca d'água decorativo */}
      <Icon className="pointer-events-none absolute -bottom-5 -right-5 h-24 w-24 text-foreground opacity-[0.04] transition-transform duration-300 group-hover:scale-110 group-hover:opacity-[0.06]" />
      {/* Barra de acento superior (cor TEA) */}
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity group-hover:opacity-100",
          a.bar,
        )}
      />
      <div className="relative">
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br transition-transform duration-300 ease-out group-hover:scale-105",
            a.chip,
            a.chipText,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-5 font-display text-[2rem] font-extrabold tabular-nums leading-none tracking-tight">
          {loading ? <Skeleton className="inline-block h-8 w-16" /> : display}
        </p>
        <p className="mt-2.5 text-sm font-semibold">{label}</p>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  );
}

function EmptyChart({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
