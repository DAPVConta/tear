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
  "CRESS", // Serviço Social
  "CREF", // Educação Física
  "Outro",
] as const;
