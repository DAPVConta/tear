import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ShieldCheck, FileCheck2, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

/**
 * Moldura das telas públicas de acesso (login, recuperação e redefinição de
 * senha): painel da marca à esquerda + coluna do formulário à direita.
 *
 * Fica em um só lugar para que as três telas do fluxo de acesso tenham
 * exatamente a mesma presença visual — trocar o painel muda todas.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  above,
  footer,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  /** Slot acima do título — usado pelo trilho de etapas da recuperação. */
  above?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel da marca — aurora multicor da paleta + motivo das barras */}
      <div className="relative hidden flex-col overflow-hidden bg-brand-radial p-12 text-white lg:flex">
        {/* Blobs aurora desfocados (diversidade da marca) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-blue-light/30 blur-3xl" />
          <div className="absolute right-[-10%] top-1/3 h-80 w-80 rounded-full bg-brand-cyan/20 blur-3xl" />
          <div className="absolute bottom-[-12%] left-1/4 h-72 w-72 rounded-full bg-brand-yellow/15 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-brand-red/10 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-grid opacity-[0.07] [mask-image:radial-gradient(120%_120%_at_30%_20%,black,transparent_75%)]" />

        <Link to="/" className="relative w-fit">
          <Logo variant="white" markClassName="h-12 lg:h-14" />
        </Link>

        <div className="relative mt-16">
          {/* Barras coloridas — motivo da marca (diversidade/desenvolvimento) */}
          <div className="mb-7 flex gap-2" aria-hidden="true">
            <span className="h-1.5 w-14 rounded-full bg-brand-blue-light" />
            <span className="h-1.5 w-9 rounded-full bg-brand-yellow" />
            <span className="h-1.5 w-6 rounded-full bg-brand-red" />
          </div>
          <h2 className="max-w-md text-balance text-[2.5rem] font-extrabold leading-[1.08] tracking-tight">
            Tecnologia que conecta cuidado, informação e desenvolvimento humano.
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Prontuário inteligente para clínicas de TEA.
          </p>

          <AuthLayoutBadges />
        </div>

        <p className="relative mt-auto pt-12 text-sm text-white/50">
          © {new Date().getFullYear()} TEAR · Tecnologia, Empatia, Acompanhamento
          e Registro
        </p>
      </div>

      {/* Coluna do conteúdo */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {above}
          <h1 className="text-h1 text-[1.75rem]">{title}</h1>
          <p className="mt-2 text-body text-muted-foreground">{subtitle}</p>
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}

// Credenciais / prova de seriedade. Separado só para manter o corpo do
// layout legível.
function AuthLayoutBadges() {
  const items = [
    { Icon: ShieldCheck, label: "LGPD & RLS por clínica" },
    { Icon: FileCheck2, label: "Assinatura ICP-Brasil A1" },
    { Icon: Sparkles, label: "Evolução mensal com IA" },
  ];
  return (
    <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
      {items.map(({ Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand-cyan" />
          {label}
        </li>
      ))}
    </ul>
  );
}
