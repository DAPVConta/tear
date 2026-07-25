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
    // Cor TEA por card (azul/amarelo/vermelho = diversidade da marca)
    iconClass: "bg-brand-blue-light/12 text-brand-blue-light",
  },
  {
    icon: ShieldCheck,
    title: "Blindagem para auditoria",
    desc: "Regras que garantem prontuários completos e prontos para faturamento.",
    iconClass: "bg-brand-yellow/15 text-warning-text",
  },
  {
    icon: HeartPulse,
    title: "Cuidado no centro",
    desc: "Fluxos pensados para a rotina de clínicas especializadas em TEA.",
    iconClass: "bg-brand-red/12 text-brand-red",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-end px-6 py-5">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="brand" size="lg">
            <Link to="/login">
              Entrar <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero — mesh multicor da paleta + grid com máscara radial */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid opacity-[0.35] [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-[-6rem] h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand-blue-light/20 blur-3xl" />
            <div className="absolute left-[12%] top-10 h-72 w-72 rounded-full bg-brand-cyan/15 blur-3xl" />
            <div className="absolute right-[10%] top-24 h-72 w-72 rounded-full bg-brand-yellow/12 blur-3xl" />
            <div className="absolute right-1/4 top-44 h-56 w-56 rounded-full bg-brand-red/10 blur-3xl" />
          </div>
          <div className="mx-auto max-w-4xl px-6 pb-20 pt-6 text-center lg:pb-24 lg:pt-8">
            {/* O PNG da logo tem margem transparente própria: recortamos com
                margens negativas proporcionais para colar nos textos. */}
            <div className="mb-4 flex justify-center">
              <Logo
                className="w-full max-w-xl overflow-hidden"
                markClassName="h-auto w-full -my-[14%]"
              />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-semibold text-muted-foreground shadow-soft backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Tecnologia · Empatia · Acompanhamento · Registro
            </span>
            <h1 className="mt-6 text-balance text-[2.75rem] font-extrabold leading-[1.05] tracking-tight lg:text-6xl">
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
                <Link to="/login">
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
                  className="group rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-elevated"
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-105 ${f.iconClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-h3">{f.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo markClassName="h-8" />
          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="hover:text-foreground">
              Política de Privacidade
            </Link>
            <span>© {new Date().getFullYear()} TEAR.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
