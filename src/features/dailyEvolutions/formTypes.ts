import type { Enums } from "@/types/database";

// Correção #12 — o formulário de evolução diária é renderizado de forma
// dinâmica conforme a especialidade do profissional do atendimento.
export type EvolutionFormType = "aba_at" | "medico" | "clinico";

// Aplicadores ABA / ATs — formulário com supervisor, programas de ensino,
// métricas de nível de ajuda e workflow de homologação técnica.
const AT_SPECIALTIES: ReadonlySet<Enums<"specialty">> = new Set([
  "aplicador_aba_domiciliar",
  "aplicador_aba_escolar",
]);

// Área médica — anamnese, exame, CID-11/CID-10 e conduta medicamentosa.
const MEDICAL_SPECIALTIES: ReadonlySet<Enums<"specialty">> = new Set([
  "neuropediatria",
  "psiquiatria",
]);

export function formTypeForSpecialty(
  specialty: Enums<"specialty"> | null | undefined,
): EvolutionFormType {
  if (specialty && AT_SPECIALTIES.has(specialty)) return "aba_at";
  if (specialty && MEDICAL_SPECIALTIES.has(specialty)) return "medico";
  return "clinico";
}

export const evolutionFormTypeLabels: Record<EvolutionFormType, string> = {
  aba_at: "Aplicador ABA / AT",
  medico: "Área médica",
  clinico: "Evolução técnica",
};

// ── Dados estruturados (coluna structured_data jsonb) ───────────────────────

// Programa de ensino aplicado na sessão (folha de treino do AT).
export type AbaProgram = {
  program: string; // nome do programa / target
  trials: number | null; // total de tentativas realizadas
};

// Distribuição do nível de ajuda predominante (em %), para gráficos de
// linha de base e desempenho ao longo do tempo.
export type PromptingMetrics = {
  physical: number | null;
  gestural: number | null;
  verbal: number | null;
  independent: number | null;
};

export type AbaStructuredData = {
  kind: "aba_at";
  target_behaviors: string; // comportamentos-alvo e barreiras
  programs: AbaProgram[];
  prompting: PromptingMetrics;
  session_analysis: string; // análise da sessão e conduta
};

export type MedicalStructuredData = {
  kind: "medical";
  anamnesis: string;
  clinical_exam: string;
  cid11: string;
  cid10: string;
  therapeutic_conduct: string;
};

export type StructuredData = AbaStructuredData | MedicalStructuredData;

export function emptyPromptingMetrics(): PromptingMetrics {
  return { physical: null, gestural: null, verbal: null, independent: null };
}
