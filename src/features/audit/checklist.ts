import type { Tables } from "@/types/database";

type Evolution = Tables<"daily_evolutions">;

// Regras de blindagem para faturamento (dinâmicas — sem hardcode nas páginas).
// Cada regra é nomeada, com label PT-BR e função de checagem.
export type BillingRule = {
  id: string;
  label: string;
  description: string;
  check: (e: Evolution) => boolean;
};

export const BILLING_RULES: BillingRule[] = [
  {
    id: "session_summary",
    label: "Resumo da sessão",
    description: "Texto descritivo do que foi trabalhado.",
    check: (e) => !!e.session_summary?.trim(),
  },
  {
    id: "next_plan",
    label: "Próximo plano definido",
    description: "Direcionamento para a próxima sessão.",
    check: (e) => !!e.next_session_plan?.trim(),
  },
  {
    id: "professional_signature",
    label: "Assinatura do profissional",
    description: "Evolução assinada eletronicamente.",
    check: (e) => e.professional_signature,
  },
  {
    id: "guardian_validation",
    label: "Validação do responsável",
    description: "Presença confirmada por assinatura, token ou presencial.",
    check: (e) => e.guardian_presence_validation,
  },
  {
    id: "authorization",
    label: "Guia vinculada",
    description: "Sessões de operadora exigem guia ativa.",
    check: (e) => e.is_private || !!e.authorization_id,
  },
  {
    id: "goals_worked",
    label: "Metas trabalhadas",
    description: "Pelo menos uma meta do plano marcada.",
    check: (e) =>
      Array.isArray(e.goals_worked) && (e.goals_worked as unknown[]).length > 0,
  },
  {
    id: "duration_minimum",
    label: "Duração mínima (30 min)",
    description: "Sessões abaixo do mínimo não podem ser faturadas.",
    check: (e) => e.session_duration_minutes >= 30,
  },
];

export type EvolutionAudit = {
  evolution: Evolution;
  failed: BillingRule[];
  isComplete: boolean;
};

export function auditEvolution(e: Evolution): EvolutionAudit {
  const failed = BILLING_RULES.filter((r) => !r.check(e));
  return { evolution: e, failed, isComplete: failed.length === 0 };
}

export type ChecklistSummary = {
  total: number;
  complete: number;
  incomplete: number;
  completionRate: number;
  // Quantidade de evoluções que falham em cada regra (para o gráfico/ranking).
  failuresByRule: Record<string, number>;
};

export function summarize(items: EvolutionAudit[]): ChecklistSummary {
  const total = items.length;
  const complete = items.filter((i) => i.isComplete).length;
  const failuresByRule: Record<string, number> = {};
  for (const rule of BILLING_RULES) failuresByRule[rule.id] = 0;
  for (const item of items)
    for (const rule of item.failed) failuresByRule[rule.id] += 1;
  return {
    total,
    complete,
    incomplete: total - complete,
    completionRate: total === 0 ? 0 : Math.round((complete / total) * 100),
    failuresByRule,
  };
}
