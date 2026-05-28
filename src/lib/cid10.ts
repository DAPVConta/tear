// CID-10 — recorte curado para o contexto clínico de TEA e desenvolvimento
// infantil (transtornos mentais e do desenvolvimento, paralisias cerebrais
// e quadros mais comuns associados). Para uma base completa, integrar com
// uma API externa em incremento dedicado.

export type CidCode = {
  code: string;
  description: string;
};

export const CID10_DATASET: CidCode[] = [
  // F70–F79: Retardo mental / Deficiência intelectual
  { code: "F70", description: "Retardo mental leve" },
  { code: "F71", description: "Retardo mental moderado" },
  { code: "F72", description: "Retardo mental grave" },
  { code: "F73", description: "Retardo mental profundo" },
  { code: "F78", description: "Outros tipos de retardo mental" },
  { code: "F79", description: "Retardo mental não especificado" },

  // F80: Transtornos específicos da fala e da linguagem
  { code: "F80.0", description: "Transtorno específico da articulação da fala" },
  { code: "F80.1", description: "Transtorno expressivo da linguagem" },
  { code: "F80.2", description: "Transtorno receptivo da linguagem" },
  { code: "F80.3", description: "Afasia adquirida com epilepsia (Landau-Kleffner)" },
  { code: "F80.8", description: "Outros transtornos do desenvolvimento da fala e linguagem" },
  { code: "F80.9", description: "Transtorno não especificado da fala e linguagem" },

  // F81: Transtornos específicos do desenvolvimento das habilidades escolares
  { code: "F81.0", description: "Transtorno específico de leitura" },
  { code: "F81.1", description: "Transtorno específico de soletração" },
  { code: "F81.2", description: "Transtorno específico das habilidades aritméticas" },
  { code: "F81.3", description: "Transtorno misto de habilidades escolares" },
  { code: "F81.8", description: "Outros transtornos do desenvolvimento das habilidades escolares" },
  { code: "F81.9", description: "Transtorno não especificado do desenvolvimento das habilidades escolares" },

  // F82–F83
  { code: "F82", description: "Transtorno específico do desenvolvimento motor" },
  { code: "F83", description: "Transtornos específicos misto do desenvolvimento" },

  // F84: Transtornos globais do desenvolvimento (TEA)
  { code: "F84.0", description: "Autismo infantil" },
  { code: "F84.1", description: "Autismo atípico" },
  { code: "F84.2", description: "Síndrome de Rett" },
  { code: "F84.3", description: "Outro transtorno desintegrativo da infância" },
  { code: "F84.4", description: "Transtorno com hipercinesia, retardo mental e estereotipias" },
  { code: "F84.5", description: "Síndrome de Asperger" },
  { code: "F84.8", description: "Outros transtornos globais do desenvolvimento" },
  { code: "F84.9", description: "Transtorno global do desenvolvimento não especificado" },

  // F88–F89
  { code: "F88", description: "Outros transtornos do desenvolvimento psicológico" },
  { code: "F89", description: "Transtorno não especificado do desenvolvimento psicológico" },

  // F90: Transtornos hipercinéticos (TDAH)
  { code: "F90.0", description: "Distúrbio da atividade e atenção (TDAH)" },
  { code: "F90.1", description: "Transtorno hipercinético de conduta" },
  { code: "F90.8", description: "Outros transtornos hipercinéticos" },
  { code: "F90.9", description: "Transtorno hipercinético não especificado" },

  // F91: Transtornos de conduta
  { code: "F91.0", description: "Transtorno de conduta restrito ao contexto familiar" },
  { code: "F91.1", description: "Transtorno de conduta não-socializado" },
  { code: "F91.2", description: "Transtorno de conduta socializado" },
  { code: "F91.3", description: "Transtorno desafiador e de oposição" },
  { code: "F91.8", description: "Outros transtornos de conduta" },
  { code: "F91.9", description: "Transtorno de conduta não especificado" },

  // F92–F94
  { code: "F92.0", description: "Transtorno depressivo de conduta" },
  { code: "F92.8", description: "Outros transtornos mistos de conduta e emoções" },
  { code: "F93.0", description: "Transtorno de ansiedade de separação na infância" },
  { code: "F93.1", description: "Transtorno de ansiedade fóbica na infância" },
  { code: "F93.2", description: "Transtorno de ansiedade social na infância" },
  { code: "F93.3", description: "Transtorno de rivalidade entre irmãos" },
  { code: "F93.8", description: "Outros transtornos emocionais da infância" },
  { code: "F94.0", description: "Mutismo eletivo" },
  { code: "F94.1", description: "Transtorno reativo de vinculação na infância" },
  { code: "F94.2", description: "Transtorno de vinculação na infância com desinibição" },
  { code: "F94.8", description: "Outros transtornos do funcionamento social na infância" },

  // F95: Tiques
  { code: "F95.0", description: "Tique transitório" },
  { code: "F95.1", description: "Tique motor ou vocal crônico" },
  { code: "F95.2", description: "Tiques vocais e motores múltiplos (síndrome de Tourette)" },
  { code: "F95.8", description: "Outros tiques" },
  { code: "F95.9", description: "Tique não especificado" },

  // F98: Outros transtornos comportamentais
  { code: "F98.0", description: "Enurese não-orgânica" },
  { code: "F98.1", description: "Encoprese não-orgânica" },
  { code: "F98.2", description: "Transtorno de alimentação na infância" },
  { code: "F98.3", description: "Pica do lactente ou da criança" },
  { code: "F98.4", description: "Estereotipias motoras" },
  { code: "F98.5", description: "Gagueira (tartamudez)" },
  { code: "F98.6", description: "Linguagem precipitada" },
  { code: "F98.8", description: "Outros transtornos comportamentais e emocionais" },
  { code: "F98.9", description: "Transtorno comportamental ou emocional não especificado" },

  // Quadros mais comuns como diagnósticos secundários
  { code: "F50.0", description: "Anorexia nervosa" },
  { code: "F50.8", description: "Outros transtornos da alimentação" },
  { code: "F41.0", description: "Transtorno de pânico" },
  { code: "F41.1", description: "Transtorno de ansiedade generalizada" },
  { code: "F42.0", description: "Transtorno obsessivo-compulsivo (TOC)" },

  // G80: Paralisia cerebral
  { code: "G80.0", description: "Paralisia cerebral espástica quadriplégica" },
  { code: "G80.1", description: "Paralisia cerebral espástica diplégica" },
  { code: "G80.2", description: "Paralisia cerebral espástica hemiplégica" },
  { code: "G80.3", description: "Paralisia cerebral discinética" },
  { code: "G80.4", description: "Paralisia cerebral atáxica" },
  { code: "G80.8", description: "Outra paralisia cerebral" },
  { code: "G80.9", description: "Paralisia cerebral não especificada" },

  // Síndromes genéticas frequentemente associadas
  { code: "Q90.0", description: "Trissomia 21 (Síndrome de Down)" },
  { code: "Q87.0", description: "Síndromes congênitas, predominantemente face" },
  { code: "Q87.1", description: "Síndromes congênitas com baixa estatura" },
];
