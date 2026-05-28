import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Brain, HeartPulse } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const features = [
  {
    icon: Brain,
    title: "Inteligência clínica",
    desc: "Evolução mensal gerada automaticamente a partir dos atendimentos diários.",
  },
  {
    icon: ShieldCheck,
    title: "Blindagem para auditoria",
    desc: "Regras que garantem prontuários completos e prontos para faturamento.",
  },
  {
    icon: HeartPulse,
    title: "Cuidado no centro",
    desc: "Fluxos pensados para a rotina de clínicas especializadas em TEA.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="brand" size="lg">
            <Link to="/dashboard">
              Entrar <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid opacity-[0.4]" />
          <div className="absolute left-1/2 top-0 -z-10 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
          <div className="mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-muted-foreground shadow-soft">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Tecnologia · Empatia · Acompanhamento · Registro
            </span>
            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight lg:text-6xl">
              O prontuário inteligente para{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                clínicas de TEA
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              O TEAR conecta cuidado, informação e desenvolvimento humano em uma
              plataforma segura, moderna e feita para a rotina clínica.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="brand" size="lg">
                <Link to="/dashboard">
                  Começar agora <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#recursos">Conhecer recursos</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="mx-auto max-w-6xl px-6 pb-28">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo markClassName="h-8 w-8" />
          <p>© {new Date().getFullYear()} TEAR. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
