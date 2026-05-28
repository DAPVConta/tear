import { Link } from "react-router-dom";
import {
  Users,
  ClipboardList,
  FileCheck2,
  TrendingUp,
  ArrowUpRight,
  Plus,
  CalendarDays,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const metrics: {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
}[] = [
  { label: "Pacientes ativos", value: "128", delta: "+12%", icon: Users },
  { label: "Sessões na semana", value: "342", delta: "+8%", icon: ClipboardList },
  { label: "Guias vigentes", value: "57", delta: "+3%", icon: FileCheck2 },
  { label: "Taxa de presença", value: "94%", delta: "+1,2%", icon: TrendingUp },
];

const chartData = [
  { day: "Seg", sessoes: 48 },
  { day: "Ter", sessoes: 61 },
  { day: "Qua", sessoes: 55 },
  { day: "Qui", sessoes: 72 },
  { day: "Sex", sessoes: 68 },
  { day: "Sáb", sessoes: 38 },
];

function today() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
}

export default function Dashboard() {
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
              {today()}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
              Painel da clínica
            </h1>
            <p className="mt-3 text-white/70">
              Acompanhe pacientes, sessões e indicadores clínicos em tempo real —
              com a inteligência do TEAR.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/evolucoes">
                <Plus className="h-4 w-4" /> Nova evolução
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link to="/pacientes">
                <Plus className="h-4 w-4" /> Novo paciente
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-all group-hover:bg-brand-gradient group-hover:shadow-glow">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-info/15 px-2 py-0.5 text-xs font-semibold text-accent">
                  <ArrowUpRight className="h-3 w-3" />
                  {m.delta}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{m.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
            </div>
          );
        })}
      </section>

      {/* Gráfico */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Sessões na semana</h2>
            <p className="text-sm text-muted-foreground">
              Volume de atendimentos por dia
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
            >
              <defs>
                <linearGradient id="fillSessoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E88FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1E88FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
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
        </div>
      </section>
    </div>
  );
}
