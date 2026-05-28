import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Logo />
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 leading-relaxed">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <Section title="1. Quem somos">
          O TEAR é uma plataforma de prontuário eletrônico para clínicas
          especializadas em TEA. Cada clínica é controladora dos dados de seus
          pacientes; o TEAR atua como operador conforme a LGPD (Lei nº
          13.709/2018).
        </Section>

        <Section title="2. Dados que tratamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Identificação:</strong> nome, CPF, e-mail, telefone do
              usuário e dos pacientes/responsáveis.
            </li>
            <li>
              <strong>Dados de saúde:</strong> CID-10, diagnóstico, evoluções
              terapêuticas, frequência e progresso de metas.
            </li>
            <li>
              <strong>Operacionais:</strong> guias, planos, registros de
              auditoria com data, ação e usuário.
            </li>
          </ul>
        </Section>

        <Section title="3. Bases legais">
          Tratamos dados com base em: execução de contrato com a clínica,
          consentimento do titular, cumprimento de obrigação legal
          (prontuário — Resolução CFM nº 1.821/2007) e legítimo interesse
          quando aplicável.
        </Section>

        <Section title="4. Compartilhamento">
          Os dados ficam isolados por clínica (multi-tenancy com RLS no
          Postgres). Não compartilhamos dados clínicos com terceiros, exceto
          quando exigido por lei ou autorizado por você. Provedores de
          infraestrutura (Supabase, Vercel) atuam como suboperadores sob
          contratos de proteção de dados.
        </Section>

        <Section title="5. Retenção">
          Prontuários clínicos são mantidos pelo prazo legal mínimo de{" "}
          <strong>20 anos</strong> conforme a Resolução CFM nº 1.821/2007.
          Logs de auditoria são mantidos por até 5 anos. Outros dados
          pessoais podem ser excluídos conforme sua solicitação.
        </Section>

        <Section title="6. Seus direitos (LGPD Art. 18)">
          Você pode, a qualquer momento:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Confirmar a existência de tratamento.</li>
            <li>Acessar e exportar seus dados (em Configurações → LGPD).</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a exclusão dos seus dados pessoais.</li>
            <li>Revogar o consentimento.</li>
          </ul>
        </Section>

        <Section title="7. Segurança">
          Empregamos criptografia em trânsito (HTTPS) e em repouso, controle
          de acesso por papéis com Row Level Security, auditoria de ações
          sensíveis, cabeçalhos de segurança (HSTS, CSP, X-Frame-Options) e
          isolamento entre clínicas.
        </Section>

        <Section title="8. Contato">
          Encarregado de Dados (DPO): a clínica responsável é a controladora
          primária. Encaminhe solicitações ao DPO da sua clínica ou ao TEAR
          via canal indicado pela clínica.
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 space-y-2 text-sm text-foreground">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}
