import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import {
  Shield, FileText, Brain, BarChart3, Clock, Lock,
  ArrowRight, Star, CheckCircle, Check, Puzzle, Heart,
  Users, Sparkles, Zap
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Evolução Diária Estruturada",
    description: "Formulário completo com campos obrigatórios alinhados às exigências da ANS. Registre sessões com CID, objetivos do PTS, nível de suporte e intervenções.",
    color: "from-tea-blue to-tea-teal",
    bg: "bg-tea-blue/8",
  },
  {
    icon: Brain,
    title: "Evolução Mensal Automática (IA)",
    description: "O sistema gera automaticamente a síntese mensal consolidando todas as evoluções diárias, com análise de progresso nas metas.",
    color: "from-tea-purple to-tea-rose",
    bg: "bg-tea-purple/8",
  },
  {
    icon: Shield,
    title: "Blindagem Anti-Glosa",
    description: "7 regras de validação automáticas impedem o envio de documentação incompleta. Bloqueio de edição após 24h garante imutabilidade.",
    color: "from-tea-amber to-tea-rose",
    bg: "bg-tea-amber/8",
  },
  {
    icon: BarChart3,
    title: "Dashboard de Auditoria",
    description: "Painel em tempo real mostra documentação incompleta, evoluções sem assinatura e inconsistências antes do faturamento.",
    color: "from-tea-green to-tea-teal",
    bg: "bg-tea-green/8",
  },
  {
    icon: Clock,
    title: "Checklist de Faturamento",
    description: "Verificação automática de 8 critérios antes de enviar para a operadora: assinaturas, carga horária, PTS e compatibilidade de guias.",
    color: "from-tea-teal to-tea-green",
    bg: "bg-tea-teal/8",
  },
  {
    icon: Lock,
    title: "Multi-tenant Seguro",
    description: "Cada clínica tem seus dados completamente isolados. Controle de acesso por papel: Administrador, Terapeuta e Recepcionista.",
    color: "from-tea-blue to-tea-purple",
    bg: "bg-tea-blue/8",
  },
];

const specialties = [
  { name: "ABA - Análise do Comportamento", color: "bg-tea-blue/8 text-tea-blue border-tea-blue/15" },
  { name: "Fonoaudiologia", color: "bg-tea-teal/8 text-tea-teal border-tea-teal/15" },
  { name: "TO - Integração Sensorial", color: "bg-tea-green/8 text-tea-green border-tea-green/15" },
  { name: "TO - AVDs", color: "bg-tea-amber/8 text-tea-amber border-tea-amber/15" },
  { name: "Fisioterapia", color: "bg-tea-purple/8 text-tea-purple border-tea-purple/15" },
  { name: "Psicopedagogia", color: "bg-tea-rose/8 text-tea-rose border-tea-rose/15" },
  { name: "Musicoterapia", color: "bg-tea-blue/8 text-tea-blue border-tea-blue/15" },
  { name: "Neuropsicologia", color: "bg-tea-teal/8 text-tea-teal border-tea-teal/15" },
];

const plans = [
  {
    id: "basic",
    name: "Básico",
    price: "299",
    description: "Para clínicas pequenas",
    features: ["Até 5 profissionais", "Até 30 pacientes", "Evolução diária com blindagem", "Evolução mensal automática (IA)", "Auditoria e checklist", "Suporte por e-mail"],
  },
  {
    id: "professional",
    name: "Profissional",
    price: "599",
    popular: true,
    description: "Para clínicas em crescimento",
    features: ["Até 15 profissionais", "Até 100 pacientes", "Todas do Básico", "Relatórios PDF", "Exportação TISS", "Suporte prioritário", "Treinamento online"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "999",
    description: "Para redes de clínicas",
    features: ["Profissionais ilimitados", "Pacientes ilimitados", "Todas do Profissional", "Multi-unidades", "API de integração", "Gerente dedicado", "SLA 99.9%"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">PEET</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition">Funcionalidades</a>
            <a href="#especialidades" className="text-sm text-muted-foreground hover:text-foreground transition">Especialidades</a>
            <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition">Planos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="rounded-xl">
              <a href={getLoginUrl()}>Entrar</a>
            </Button>
            <Button asChild className="rounded-xl bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-medium shadow-sm">
              <a href={getLoginUrl()}>Começar Grátis</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-tea-blue/5 via-tea-teal/3 to-tea-purple/5" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-tea-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-tea-teal/5 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-tea-blue/8 border border-tea-blue/15 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-tea-blue" />
              <span className="text-xs font-semibold text-tea-blue">Blindado contra glosas</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Prontuário Eletrônico{" "}
              <span className="bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent">TEA</span>{" "}
              que{" "}
              <span className="bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent">elimina glosas</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Sistema completo de evolução terapêutica para clínicas que atendem pacientes com autismo.
              Documentação auditável, evolução mensal automática por IA e checklist de faturamento integrado.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="rounded-xl bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-semibold shadow-md h-12 px-8 text-base gap-2">
                <a href={getLoginUrl()}>
                  Teste Grátis por 14 Dias <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl h-12 px-8 text-base">
                <a href="#funcionalidades">Ver Funcionalidades</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground/60">Sem cartão de crédito. Cancele quando quiser.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-b border-border/50 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "7", label: "Regras de Blindagem", color: "text-tea-blue" },
              { value: "8", label: "Especialidades TEA", color: "text-tea-teal" },
              { value: "24h", label: "Bloqueio Automático", color: "text-tea-amber" },
              { value: "100%", label: "Compliance ANS", color: "text-tea-green" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Tudo que sua clínica precisa para{" "}
              <span className="bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent">zero glosas</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido por especialistas em compliance de saúde e auditoria de operadoras
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
                <div className={`h-0.5 bg-gradient-to-r ${feature.color}`} />
                <CardHeader>
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-3`}>
                    <feature.icon className="w-5 h-5 text-tea-blue" />
                  </div>
                  <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="especialidades" className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Todas as especialidades{" "}
              <span className="bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent">TEA</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Formulários adaptados para cada área de atuação terapêutica
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {specialties.map((spec) => (
              <div key={spec.name} className={`rounded-xl border p-4 text-center font-medium text-sm ${spec.color}`}>
                {spec.name}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 mt-10 justify-center">
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
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Planos que cabem no seu{" "}
              <span className="bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent">orçamento</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comece com 14 dias grátis. Sem compromisso.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                plan.popular ? "border-tea-blue border-2 shadow-lg scale-[1.02]" : "border-border/50 hover:border-border hover:shadow-md"
              }`}>
                {plan.popular && (
                  <div className="absolute -top-0 left-0 right-0 h-1 bg-gradient-to-r from-tea-blue to-tea-teal" />
                )}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-tea-blue to-tea-teal text-white border-0 shadow-sm">
                      <Star className="w-3 h-3 mr-1" /> Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-foreground">R$ {plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-tea-green shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pb-6">
                  <Button
                    className={`w-full rounded-xl ${
                      plan.popular
                        ? "bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-semibold shadow-sm"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <a href={getLoginUrl()}>Começar Grátis</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-tea-blue/5 via-tea-teal/3 to-tea-purple/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Pronto para eliminar glosas da sua clínica?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Junte-se às clínicas que já utilizam o PEET para garantir documentação completa e faturamento sem rejeições.
          </p>
          <Button size="lg" asChild className="mt-8 rounded-xl bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-semibold shadow-md h-12 px-8 text-base gap-2">
            <a href={getLoginUrl()}>
              Criar Minha Conta Grátis <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
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
