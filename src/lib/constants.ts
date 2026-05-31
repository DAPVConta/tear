export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

// Categorias de metas terapêuticas (PTS).
export const GOAL_CATEGORIES = [
  "Comunicação",
  "Comportamento",
  "Interação social",
  "Cognitivo",
  "Motor",
  "AVDs",
  "Acadêmico",
  "Sensorial",
  "Autonomia",
  "Outro",
] as const;

// Conselhos profissionais mais comuns nas clínicas de TEA.
export const COUNCIL_TYPES = [
  "CRP", // Psicologia
  "CRFa", // Fonoaudiologia
  "CREFITO", // Terapia Ocupacional / Fisioterapia
  "CRM", // Medicina
  "CRN", // Nutrição
  "CRESS", // Serviço Social
  "CREF", // Educação Física
  "CBO", // Áreas sem conselho federal (registro por ocupação/associação)
  "Outro",
] as const;

export type CouncilType = (typeof COUNCIL_TYPES)[number];

// Descrição por extenso de cada conselho (legenda/tooltip).
export const COUNCIL_LABELS: Record<CouncilType, string> = {
  CRP: "Conselho Regional de Psicologia",
  CRFa: "Conselho Regional de Fonoaudiologia",
  CREFITO: "Conselho Regional de Fisioterapia e Terapia Ocupacional",
  CRM: "Conselho Regional de Medicina",
  CRN: "Conselho Regional de Nutrição",
  CRESS: "Conselho Regional de Serviço Social",
  CREF: "Conselho Regional de Educação Física",
  CBO: "Classificação Brasileira de Ocupações / registro da associação",
  Outro: "Outro registro",
};
