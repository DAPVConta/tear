import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, UserCog, FileText, Shield, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, TrendingUp, Clock, Puzzle, Activity, Brain, Heart,
  Stethoscope, Music, BookOpen, Sparkles, Eye, BarChart3,
} from "lucide-react";
import { useLocation } from "wouter";

const specialties = [
  { key: "psicologia_aba", label: "ABA", abbr: "ABA", icon: Brain, desc: "Análise do Comportamento Aplicada", className: "tea-badge-aba" },
  { key: "fonoaudiologia", label: "Fono", abbr: "FONO", icon: Activity, desc: "Fonoaudiologia", className: "tea-badge-fono" },
  { key: "terapia_ocupacional_is", label: "TO-IS", abbr: "TO-IS", icon: Sparkles, desc: "Terapia Ocupacional - Integração Sensorial", className: "tea-badge-to-is" },
  { key: "terapia_ocupacional_avds", label: "TO-AVDs", abbr: "TO-AVDs", icon: Heart, desc: "Terapia Ocupacional - AVDs", className: "tea-badge-to-avds" },
  { key: "fisioterapia", label: "Fisio", abbr: "FISIO", icon: Stethoscope, desc: "Fisioterapia", className: "tea-badge-fisio" },
  { key: "psicopedagogia", label: "Psico", abbr: "PSICO", icon: BookOpen, desc: "Psicopedagogia", className: "tea-badge-psico" },
  { key: "musicoterapia", label: "Music", abbr: "MUSIC", icon: Music, desc: "Musicoterapia", className: "tea-badge-music" },
  { key: "neuropsicologia", label: "Neuro", abbr: "NEURO", icon: Eye, desc: "Neuropsicologia", className: "tea-badge-neuro" },
];

const shieldRules = [
  { label: "Bloqueio de edição após 24h", desc: "Imutabilidade garantida" },
  { label: "Campos obrigatórios", desc: "Fechamento completo" },
  { label: "Validação de presença", desc: "Responsável verificado" },
  { label: "Duplicidade de atendimento", desc: "Detecção automática" },
  { label: "Tempo mínimo 30 min", desc: "Sessão válida" },
  { label: "Vínculo com guia TISS", desc: "Rastreabilidade" },
  { label: "Assinatura digital", desc: "Autenticidade" },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: alerts } = trpc.dashboard.alerts.useQuery();
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center shadow-md">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Visão geral do prontuário eletrônico
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/evolucoes/nova")}
            className="rounded-lg border-tea-blue/20 text-tea-blue hover:bg-tea-blue/5 font-medium"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Nova Evolução
          </Button>
          <Button
            size="sm"
            onClick={() => setLocation("/pacientes/novo")}
            className="rounded-lg bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-medium shadow-sm"
          >
            <Users className="h-4 w-4 mr-1.5" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Pacientes Ativos"
          value={stats?.patients || 0}
          icon={Users}
          gradient="from-tea-blue/10 to-tea-teal/5"
          iconColor="text-tea-blue"
          iconBg="bg-tea-blue/10"
          loading={statsLoading}
          onClick={() => setLocation("/pacientes")}
        />
        <StatCard
          title="Profissionais"
          value={stats?.professionals || 0}
          icon={UserCog}
          gradient="from-tea-teal/10 to-tea-green/5"
          iconColor="text-tea-teal"
          iconBg="bg-tea-teal/10"
          loading={statsLoading}
          onClick={() => setLocation("/profissionais")}
        />
        <StatCard
          title="Evoluções"
          value={stats?.evolutions || 0}
          icon={FileText}
          gradient="from-tea-purple/10 to-tea-blue/5"
          iconColor="text-tea-purple"
          iconBg="bg-tea-purple/10"
          loading={statsLoading}
          onClick={() => setLocation("/evolucoes")}
        />
        <StatCard
          title="Guias Ativas"
          value={stats?.activeAuths || 0}
          icon={Shield}
          gradient="from-tea-amber/10 to-tea-rose/5"
          iconColor="text-tea-amber"
          iconBg="bg-tea-amber/10"
          loading={statsLoading}
          onClick={() => setLocation("/guias")}
        />
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-tea-amber/20 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-tea-amber to-tea-rose" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-tea-amber/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-tea-amber" />
              </div>
              Alertas de Compliance
              <Badge variant="secondary" className="ml-auto text-xs font-semibold">
                {alerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    alert.severity === "error"
                      ? "bg-destructive/5 border-destructive/15"
                      : alert.severity === "warning"
                      ? "bg-tea-amber/5 border-tea-amber/15"
                      : "bg-tea-green/5 border-tea-green/15"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {alert.severity === "error" ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    ) : alert.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-tea-amber shrink-0" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-tea-green shrink-0" />
                    )}
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                  <Badge
                    variant={alert.severity === "error" ? "destructive" : "secondary"}
                    className="shrink-0 font-semibold"
                  >
                    {alert.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ações Rápidas */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-tea-blue" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Registrar Evolução Diária", path: "/evolucoes/nova", icon: FileText, color: "text-tea-blue" },
              { label: "Cadastrar Paciente", path: "/pacientes/novo", icon: Users, color: "text-tea-teal" },
              { label: "Nova Guia de Autorização", path: "/guias/nova", icon: Shield, color: "text-tea-amber" },
              { label: "Novo Plano Terapêutico", path: "/planos/novo", icon: BookOpen, color: "text-tea-green" },
              { label: "Gerar Evolução Mensal", path: "/evolucao-mensal", icon: BarChart3, color: "text-tea-purple" },
              { label: "Verificar Auditoria", path: "/auditoria", icon: Shield, color: "text-tea-rose" },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => setLocation(action.path)}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-accent/60 transition-all group text-left"
              >
                <div className={`w-8 h-8 rounded-lg bg-accent/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground flex-1">
                  {action.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Blindagem Anti-Glosa */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-tea-green" />
              Blindagem Anti-Glosa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {shieldRules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-tea-green/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3 w-3 text-tea-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/90 leading-tight">{rule.label}</p>
                    <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Especialidades */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-tea-purple" />
              Especialidades TEA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {specialties.map((spec) => (
                <div key={spec.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${spec.className}`}>
                    <spec.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{spec.abbr}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{spec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon: Icon, gradient, iconColor, iconBg, loading, onClick,
}: {
  title: string; value: number; icon: any; gradient: string; iconColor: string; iconBg: string; loading?: boolean; onClick?: () => void;
}) {
  return (
    <Card
      className={`tea-stat-card shadow-sm border-border/50 cursor-pointer overflow-hidden relative`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
      <CardContent className="relative p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {title}
            </p>
            {loading ? (
              <div className="tea-skeleton h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
