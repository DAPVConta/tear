import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  ClipboardList,
  FileCheck2,
  TrendingUp,
  Plus,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ClipboardCheck,
  FileClock,
  CheckCircle2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/motion/motion";
import { useClinic } from "@/providers/ClinicProvider";
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

export default function Dashboard() {
  const { clinic } = useClinic();
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

  function toggle(next: "pending" | "guides") {
    setPanel((prev) => (prev === next ? null : next));
  }

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

      {/* Métricas — acento TEA por cartão (diversidade da marca) */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <Metric
            label="Pacientes ativos"
            icon={Users}
            value={metrics?.patientsActive}
            loading={loadingMetrics}
            accent="blue"
          />
        </StaggerItem>
        <StaggerItem>
          <Metric
            label="Sessões na semana"
            icon={ClipboardList}
            value={metrics?.sessionsThisWeek}
            loading={loadingMetrics}
            accent="cyan"
          />
        </StaggerItem>
        <StaggerItem>
          <Metric
            label="Guias vigentes"
            icon={FileCheck2}
            value={metrics?.activeGuides}
            loading={loadingMetrics}
            accent="yellow"
          />
        </StaggerItem>
        <StaggerItem>
          <Metric
            label="Taxa de presença (30d)"
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-h2">Sessões nos últimos 14 dias</h2>
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
                  <CartesianGrid
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
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
          <h2 className="text-h2">Avaliações (30 dias)</h2>
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
                  <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                    {assessments!.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
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
// Cartão de ação clicável (abre/fecha o painel de lista correspondente).
type ActionAccent = "red" | "yellow";
const ACTION_ACCENT: Record<
  ActionAccent,
  { bar: string; icon: string; iconBg: string; ring: string }
> = {
  red: {
    bar: "bg-brand-red",
    icon: "text-brand-red",
    iconBg: "bg-brand-red/12",
    ring: "focus-visible:ring-brand-red/40",
  },
  yellow: {
    bar: "bg-brand-yellow",
    icon: "text-warning-text",
    iconBg: "bg-brand-yellow/15",
    ring: "focus-visible:ring-brand-yellow/40",
  },
};

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
  accent: ActionAccent;
  count: number | undefined;
  loading?: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const a = ACTION_ACCENT[accent];
  const empty = !loading && (count ?? 0) === 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-soft outline-none transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 ${a.ring} ${
        open ? "border-primary/40 ring-2 ring-primary/20" : "border-border"
      }`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 ${a.bar} opacity-80 transition-opacity group-hover:opacity-100`}
      />
      <div className="flex items-center gap-4">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${a.iconBg} ${a.icon} transition-transform duration-200 ease-out group-hover:scale-105`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="text-[1.75rem] font-extrabold tabular-nums leading-none tracking-tight">
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
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
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
  linkTo,
  linkLabel,
  children,
}: {
  title: string;
  linkTo: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-border bg-card p-6 shadow-soft duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-h2">{title}</h2>
        <Button asChild variant="outline" size="sm">
          <Link to={linkTo}>{linkLabel}</Link>
        </Button>
      </div>
      {children}
    </section>
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
      linkTo="/auditoria"
      linkLabel="Abrir auditoria"
    >
      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (items?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Nenhuma sessão com pendências. ✔
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items!.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => navigate(`/evolucoes/${s.id}`)}
                className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-secondary/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-red/12 text-brand-red">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {s.patient?.name ?? "—"}
                  </p>
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
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
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
      title="Guias a vencer (30 dias)"
      linkTo="/guias"
      linkLabel="Ver todas"
    >
      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (items?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Nenhuma guia vencendo no período. ✔
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items!.map((g) => {
            const days = daysUntil(g.expiration_date);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/guias/${g.id}`)}
                  className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-secondary/40"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      days <= 7
                        ? "bg-destructive/10 text-destructive-text"
                        : "bg-warning/15 text-warning-text"
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
                      {format(parseDateOnly(g.expiration_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {days === 0
                      ? "vence hoje"
                      : days === 1
                        ? "1 dia"
                        : `${days} dias`}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}

// Paleta categórica oficial para data-viz (séries/categorias).
const CHART_PALETTE = ["#1E88FF", "#45C7FF", "#FFC400", "#FF2D2D", "#0A2E8C"];

type MetricAccent = "blue" | "cyan" | "yellow" | "red";
const ACCENT: Record<
  MetricAccent,
  { bar: string; icon: string; iconBg: string }
> = {
  blue: { bar: "bg-brand-blue-light", icon: "text-brand-blue-light", iconBg: "bg-brand-blue-light/12" },
  cyan: { bar: "bg-brand-cyan", icon: "text-brand-cyan-700", iconBg: "bg-brand-cyan/15" },
  yellow: { bar: "bg-brand-yellow", icon: "text-warning-text", iconBg: "bg-brand-yellow/15" },
  red: { bar: "bg-brand-red", icon: "text-brand-red", iconBg: "bg-brand-red/12" },
};

function Metric({
  label,
  icon: Icon,
  value,
  suffix = "",
  fallback = "0",
  loading,
  accent = "blue",
}: {
  label: string;
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
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevated">
      {/* Barra de acento superior (cor TEA) */}
      <span
        className={`absolute inset-x-0 top-0 h-1 ${a.bar} opacity-80 transition-opacity group-hover:opacity-100`}
      />
      <div className="flex items-center justify-between">
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl ${a.iconBg} ${a.icon} transition-transform duration-200 ease-out group-hover:scale-105`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-[1.75rem] font-extrabold tabular-nums leading-none tracking-tight">
        {loading ? <Skeleton className="inline-block h-8 w-16" /> : display}
      </p>
      <p className="mt-2 text-caption text-muted-foreground">{label}</p>
    </div>
  );
}
