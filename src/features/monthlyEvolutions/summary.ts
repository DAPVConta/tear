import type { Enums } from "@/types/database";
import {
  evolutionAssessmentLabels,
  promptingLevelLabels,
} from "@/lib/labels";

// Motor determinístico de síntese mensal — produz um relatório em 6 seções
// a partir dos sinais agregados do período (frequência, evoluções diárias,
// progresso das metas). Sem IA: regras condicionais + templates de frases.

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Nível de ajuda — quanto MAIOR o índice, mais autônomo.
const PROMPTING_RANK: Record<Enums<"prompting_level">, number> = {
  fisica_total: 1,
  fisica_parcial: 2,
  gestual: 3,
  verbal: 4,
  independente: 5,
};

// Sinal numérico por avaliação — positivo = evolução, negativo = retrocesso.
const ASSESSMENT_SCORE: Record<Enums<"evolution_assessment">, number> = {
  evolucao_significativa: 2,
  evolucao_leve: 1,
  estavel: 0,
  retrocesso_leve: -1,
  retrocesso_significativo: -2,
};

export type AttendanceLite = {
  status: Enums<"attendance_status">;
};

export type EvolutionLite = {
  session_date: string;
  evolution_assessment: Enums<"evolution_assessment">;
  prompting_level: Enums<"prompting_level">;
  skills_worked: unknown;
  incidents: string | null;
};

export type GoalLite = {
  description: string;
  category: string;
  status: Enums<"goal_status">;
  current_progress: number;
};

export type SummaryInput = {
  patientName: string;
  professionalName: string;
  month: number;
  year: number;
  attendances: AttendanceLite[];
  evolutions: EvolutionLite[];
  goals: GoalLite[];
};

export type SummaryOutput = {
  totals: { total: number; present: number; absent: number };
  text: string;
};

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function mostFrequent<T extends string>(
  arr: T[],
): { key: T; count: number } | null {
  const m = new Map<T, number>();
  for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
  let best: { key: T; count: number } | null = null;
  for (const [key, count] of m) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

function splitHalf<T>(items: T[]): { first: T[]; second: T[] } {
  const half = Math.floor(items.length / 2);
  return { first: items.slice(0, half), second: items.slice(half) };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} e ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function topSkills(evolutions: EvolutionLite[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const e of evolutions) {
    if (!Array.isArray(e.skills_worked)) continue;
    for (const raw of e.skills_worked) {
      if (typeof raw !== "string") continue;
      const s = raw.trim();
      if (!s) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([s]) => s);
}

export function buildMonthlySummary({
  patientName,
  professionalName,
  month,
  year,
  attendances,
  evolutions,
  goals,
}: SummaryInput): SummaryOutput {
  const monthName = MONTH_NAMES_PT[month - 1] ?? "";

  const total = attendances.length;
  const present = attendances.filter((a) => a.status === "presente").length;
  const justified = attendances.filter(
    (a) => a.status === "falta_justificada",
  ).length;
  const unjustified = attendances.filter(
    (a) => a.status === "falta_injustificada",
  ).length;
  const canceled = attendances.filter(
    (a) =>
      a.status === "cancelado_clinica" || a.status === "cancelado_paciente",
  ).length;
  const absent = total - present;
  const presenceRate = pct(present, total);

  // Ordena evoluções por data para tendências.
  const ordered = [...evolutions].sort((a, b) =>
    a.session_date.localeCompare(b.session_date),
  );

  const assessmentDominant = mostFrequent(
    ordered.map((e) => e.evolution_assessment),
  );
  const promptingDominant = mostFrequent(
    ordered.map((e) => e.prompting_level),
  );

  const { first, second } = splitHalf(ordered);
  const assessmentTrend = (() => {
    if (first.length < 2 || second.length < 2) return "stable" as const;
    const a = avg(first.map((e) => ASSESSMENT_SCORE[e.evolution_assessment]));
    const b = avg(second.map((e) => ASSESSMENT_SCORE[e.evolution_assessment]));
    if (b - a >= 0.6) return "positive" as const;
    if (a - b >= 0.6) return "negative" as const;
    return "stable" as const;
  })();
  const promptingTrend = (() => {
    if (first.length < 2 || second.length < 2) return "stable" as const;
    const a = avg(first.map((e) => PROMPTING_RANK[e.prompting_level]));
    const b = avg(second.map((e) => PROMPTING_RANK[e.prompting_level]));
    if (b - a >= 0.6) return "positive" as const;
    if (a - b >= 0.6) return "negative" as const;
    return "stable" as const;
  })();

  const skills = topSkills(evolutions);
  const goalsAcquired = goals.filter((g) => g.status === "adquirida");
  const goalsInProgress = goals.filter((g) => g.status === "em_andamento");
  const topProgress = [...goals]
    .filter((g) => g.status !== "adquirida" && g.current_progress > 0)
    .sort((a, b) => b.current_progress - a.current_progress)
    .slice(0, 3);
  const incidentsCount = evolutions.filter(
    (e) => e.incidents && e.incidents.trim().length > 0,
  ).length;

  const lines: string[] = [];

  // 1. Síntese
  lines.push("SÍNTESE DO PERÍODO");
  if (total === 0) {
    lines.push(
      `Em ${monthName}/${year}, não houve sessões registradas no controle de frequência para ${patientName}.`,
    );
  } else {
    const justifiedNote =
      justified > 0
        ? ` (${justified} justificada${justified === 1 ? "" : "s"})`
        : "";
    const canceledNote =
      canceled > 0
        ? ` Houve ${canceled} cancelamento${canceled === 1 ? "" : "s"} no período.`
        : "";
    lines.push(
      `Em ${monthName}/${year}, ${patientName} teve ${total} sessões agendadas com ${professionalName}, ` +
        `com ${present} presenças (${presenceRate}%) e ${absent} ausência${absent === 1 ? "" : "s"}${justifiedNote}.${canceledNote}`,
    );
  }
  if (assessmentDominant) {
    lines.push(
      `A avaliação predominante das ${evolutions.length} evoluções foi "${evolutionAssessmentLabels[assessmentDominant.key]}".`,
    );
  }

  // 2. Habilidades trabalhadas
  lines.push("\nHABILIDADES TRABALHADAS");
  if (skills.length === 0) {
    lines.push(
      "Nenhuma habilidade específica foi destacada nas evoluções diárias do período.",
    );
  } else {
    lines.push(
      `As áreas mais trabalhadas no período: ${joinList(skills)}.`,
    );
  }

  // 3. Progressos observados
  lines.push("\nPROGRESSOS OBSERVADOS");
  const progressNotes: string[] = [];
  if (assessmentTrend === "positive") {
    progressNotes.push(
      "Observou-se evolução consistente — a qualidade das respostas terapêuticas aumentou da primeira para a segunda metade do mês.",
    );
  } else if (assessmentTrend === "stable" && evolutions.length >= 4) {
    progressNotes.push("O perfil de evolução manteve-se estável ao longo do mês.");
  }
  if (promptingTrend === "positive" && promptingDominant) {
    progressNotes.push(
      `Há sinais de ganho de autonomia: o nível de ajuda predominante reduziu durante o período (predominante: "${promptingLevelLabels[promptingDominant.key]}").`,
    );
  }
  if (goalsAcquired.length > 0) {
    progressNotes.push(
      `${goalsAcquired.length} meta${goalsAcquired.length === 1 ? "" : "s"} marcada${goalsAcquired.length === 1 ? "" : "s"} como adquirida${goalsAcquired.length === 1 ? "" : "s"} neste período: ${joinList(goalsAcquired.map((g) => g.description))}.`,
    );
  }
  if (topProgress.length > 0) {
    progressNotes.push(
      `Metas com maior progresso consolidado: ${joinList(topProgress.map((g) => `${g.description} (${Math.round(Number(g.current_progress))}%)`))}.`,
    );
  }
  if (progressNotes.length === 0) {
    lines.push("Sem progressos quantitativos a destacar no período.");
  } else {
    lines.push(...progressNotes);
  }

  // 4. Desafios e intercorrências
  lines.push("\nDESAFIOS E INTERCORRÊNCIAS");
  const challenges: string[] = [];
  if (incidentsCount > 0) {
    challenges.push(
      `Foram registrados ${incidentsCount} incidente${incidentsCount === 1 ? "" : "s"} nas evoluções diárias do período.`,
    );
  }
  if (unjustified > 0) {
    challenges.push(
      `${unjustified} ausência${unjustified === 1 ? "" : "s"} sem justificativa — recomenda-se acompanhamento com o responsável.`,
    );
  }
  if (total > 0 && presenceRate < 70) {
    challenges.push(
      `Taxa de presença de ${presenceRate}% está abaixo de 70% e pode comprometer a progressão terapêutica.`,
    );
  }
  if (assessmentTrend === "negative") {
    challenges.push(
      "Houve queda na qualidade das avaliações ao longo do mês; requer atenção.",
    );
  }
  if (promptingTrend === "negative") {
    challenges.push(
      "O nível de ajuda necessário aumentou ao longo do mês — revisar estratégias.",
    );
  }
  if (challenges.length === 0) {
    lines.push("Nenhuma intercorrência ou desafio significativo registrado.");
  } else {
    lines.push(...challenges);
  }

  // 5. Conclusão
  lines.push("\nCONCLUSÃO");
  const positives =
    (assessmentTrend === "positive" ? 1 : 0) +
    (promptingTrend === "positive" ? 1 : 0) +
    (goalsAcquired.length > 0 ? 1 : 0) +
    (total > 0 && presenceRate >= 85 ? 1 : 0);
  const negatives =
    (assessmentTrend === "negative" ? 1 : 0) +
    (promptingTrend === "negative" ? 1 : 0) +
    (incidentsCount > 2 ? 1 : 0) +
    (total > 0 && presenceRate < 70 ? 1 : 0);
  if (positives > negatives && positives >= 2) {
    lines.push(
      `Avaliação geral positiva do período. Os indicadores sugerem boa adesão e evolução clínica para ${patientName}.`,
    );
  } else if (negatives > positives) {
    lines.push(
      `Período exige atenção: combinar revisão do plano e reforço do vínculo com a família para ${patientName}.`,
    );
  } else {
    lines.push(
      `Período de manutenção: ${patientName} mantém o ritmo do plano sem alterações expressivas.`,
    );
  }

  // 6. Recomendações
  lines.push("\nRECOMENDAÇÕES");
  const recs: string[] = [];
  if (total > 0 && presenceRate < 80) {
    recs.push(
      "Reforçar o vínculo com a família para melhorar a adesão às sessões.",
    );
  } else {
    recs.push("Manter a frequência atual de atendimentos.");
  }
  if (goalsAcquired.length > 0) {
    recs.push(
      "Reavaliar o PTS para introduzir novas metas ou avançar o critério de generalização das adquiridas.",
    );
  }
  if (goalsInProgress.length > 0 && topProgress.length > 0) {
    recs.push(
      "Manter foco nas metas em progresso, especialmente as com maior avanço já consolidado.",
    );
  }
  if (incidentsCount > 0) {
    recs.push(
      "Discutir em equipe estratégias específicas para os incidentes registrados.",
    );
  }
  if (assessmentTrend === "negative" || promptingTrend === "negative") {
    recs.push(
      "Revisar abordagens terapêuticas e considerar alteração do plano caso a tendência persista.",
    );
  }
  if (recs.length === 0) {
    recs.push("Manter abordagem atual e reavaliar no próximo ciclo.");
  }
  lines.push(...recs.map((r) => `• ${r}`));

  return {
    totals: { total, present, absent },
    text: lines.join("\n"),
  };
}
