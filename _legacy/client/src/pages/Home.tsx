import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Shield, ClipboardList, Users, BarChart3, FileText,
  CheckCircle, ArrowRight, Puzzle, Heart, Sparkles
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center animate-pulse">
            <Puzzle className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">PEET</span>
          </div>
          <a href={getLoginUrl()}>
            <Button className="rounded-xl bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-medium shadow-sm h-9 px-5 text-sm">
              Entrar
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-tea-blue/5 via-tea-teal/3 to-tea-purple/5" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-tea-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-tea-teal/5 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-tea-blue/8 border border-tea-blue/15 rounded-full px-4 py-1.5 mb-6">
              <Heart className="w-3.5 h-3.5 text-tea-blue" />
              <span className="text-xs font-semibold text-tea-blue">Prontuário Eletrônico Especializado em TEA</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
              Documentação clínica{" "}
              <span className="bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent">
                blindada
              </span>{" "}
              para terapia TEA
            </h1>
            <p className="text-lg text-muted-foreground mt-5 max-w-2xl leading-relaxed">
              Sistema completo para clínicas de terapia ABA, TO, Fono e multidisciplinar.
              Evoluções diárias, controle de guias TISS, frequência e auditoria em um só lugar.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href={getLoginUrl()}>
                <Button className="rounded-xl bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-semibold shadow-md h-12 px-7 text-base gap-2">
                  Começar Agora <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                "Operadoras de saúde",
                "Atendimento particular",
                "Multi-clínica",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-tea-green" />
                  <span className="text-sm text-muted-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              Tudo que sua clínica precisa
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Desenvolvido por profissionais de saúde, para profissionais de saúde.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <ClipboardList className="w-5 h-5" />,
                title: "Evolução Diária",
                desc: "Registro detalhado com prompting, habilidades trabalhadas, comportamentos e síntese clínica.",
                color: "from-tea-blue to-tea-teal",
                bg: "bg-tea-blue/8",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Blindagem de Auditoria",
                desc: "Bloqueio automático após 24h, assinatura digital e checklist de compliance para faturamento.",
                color: "from-tea-amber to-tea-rose",
                bg: "bg-tea-amber/8",
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: "Guias TISS",
                desc: "Controle de autorizações, sessões utilizadas, vencimento e alertas automáticos.",
                color: "from-tea-green to-tea-teal",
                bg: "bg-tea-green/8",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "Multi-Clínica",
                desc: "Gerencie múltiplas clínicas, profissionais e pacientes com controle de acesso por perfil.",
                color: "from-tea-purple to-tea-rose",
                bg: "bg-tea-purple/8",
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Evolução Mensal com IA",
                desc: "Relatório mensal gerado automaticamente a partir das evoluções diárias com revisão profissional.",
                color: "from-tea-teal to-tea-green",
                bg: "bg-tea-teal/8",
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                title: "Planos Terapêuticos",
                desc: "PTS com metas SMART, categorias ABA e acompanhamento de progresso por objetivo.",
                color: "from-tea-blue to-tea-purple",
                bg: "bg-tea-blue/8",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-card rounded-2xl border border-border/50 p-6 hover:shadow-lg hover:border-border transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  <div className={`bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              Todas as especialidades TEA
            </h2>
            <p className="text-muted-foreground mt-3">
              Suporte completo para equipe multidisciplinar
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Psicologia (ABA)", color: "bg-tea-blue/8 text-tea-blue border-tea-blue/15" },
              { name: "Fonoaudiologia", color: "bg-tea-teal/8 text-tea-teal border-tea-teal/15" },
              { name: "TO - Integração Sensorial", color: "bg-tea-green/8 text-tea-green border-tea-green/15" },
              { name: "TO - AVDs", color: "bg-tea-amber/8 text-tea-amber border-tea-amber/15" },
              { name: "Fisioterapia", color: "bg-tea-purple/8 text-tea-purple border-tea-purple/15" },
              { name: "Psicopedagogia", color: "bg-tea-rose/8 text-tea-rose border-tea-rose/15" },
              { name: "Musicoterapia", color: "bg-tea-blue/8 text-tea-blue border-tea-blue/15" },
              { name: "Neuropsicologia", color: "bg-tea-teal/8 text-tea-teal border-tea-teal/15" },
            ].map((spec) => (
              <div key={spec.name} className={`rounded-xl border p-4 text-center font-medium text-sm ${spec.color}`}>
                {spec.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-tea-blue/5 via-tea-teal/3 to-tea-purple/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Pronto para modernizar sua clínica?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Comece agora e tenha seu prontuário eletrônico funcionando em minutos.
          </p>
          <a href={getLoginUrl()}>
            <Button className="mt-8 rounded-xl bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-semibold shadow-md h-12 px-8 text-base gap-2">
              Criar Minha Conta <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center">
              <Puzzle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground">PEET</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Prontuário Eletrônico Especializado em TEA
          </p>
        </div>
      </footer>
    </div>
  );
}
