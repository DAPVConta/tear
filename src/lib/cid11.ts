// CID-11 — recorte curado para o contexto clínico de TEA e desenvolvimento
// infantil, com o "De-Para" para o CID-10 equivalente (correção #10). A OMS
// adotou o CID-11, mas operadoras e auditorias de convênios ainda trabalham
// com CID-10; por isso, ao selecionar um código CID-11 o sistema sugere o
// CID-10 correspondente. Para uma base completa, integrar com a API oficial
// da OMS em incremento dedicado. O combobox aceita código personalizado.

export type Cid11Code = {
  code: string;
  description: string;
  // CID-10 equivalente, quando há correspondência direta utilizável em guias.
  cid10?: string;
};

export const CID11_DATASET: Cid11Code[] = [
  // 6A02 — Transtorno do espectro do autismo (TEA)
  { code: "6A02", description: "Transtorno do espectro do autismo", cid10: "F84.0" },
  {
    code: "6A02.0",
    description:
      "TEA sem deficiência intelectual e com comprometimento leve ou ausente da linguagem funcional",
    cid10: "F84.0",
  },
  {
    code: "6A02.1",
    description:
      "TEA com deficiência intelectual e com comprometimento leve ou ausente da linguagem funcional",
    cid10: "F84.0",
  },
  {
    code: "6A02.2",
    description:
      "TEA sem deficiência intelectual e com comprometimento da linguagem funcional",
    cid10: "F84.1",
  },
  {
    code: "6A02.3",
    description:
      "TEA com deficiência intelectual e com comprometimento da linguagem funcional",
    cid10: "F84.1",
  },
  {
    code: "6A02.5",
    description: "TEA com ausência de linguagem funcional",
    cid10: "F84.0",
  },

  // 6A00 — Transtornos do desenvolvimento intelectual
  { code: "6A00.0", description: "Transtorno do desenvolvimento intelectual, leve", cid10: "F70" },
  { code: "6A00.1", description: "Transtorno do desenvolvimento intelectual, moderado", cid10: "F71" },
  { code: "6A00.2", description: "Transtorno do desenvolvimento intelectual, grave", cid10: "F72" },
  { code: "6A00.3", description: "Transtorno do desenvolvimento intelectual, profundo", cid10: "F73" },
  { code: "6A00.Z", description: "Transtorno do desenvolvimento intelectual, não especificado", cid10: "F79" },

  // 6A01 — Transtornos do desenvolvimento da fala ou da linguagem
  { code: "6A01.0", description: "Transtorno do desenvolvimento dos sons da fala", cid10: "F80.0" },
  { code: "6A01.1", description: "Transtorno do desenvolvimento da fluência da fala (gagueira)", cid10: "F98.5" },
  { code: "6A01.20", description: "Transtorno do desenvolvimento da linguagem, com comprometimento da linguagem receptiva e expressiva", cid10: "F80.2" },
  { code: "6A01.21", description: "Transtorno do desenvolvimento da linguagem, com comprometimento predominante da linguagem expressiva", cid10: "F80.1" },
  { code: "6A01.22", description: "Transtorno do desenvolvimento da linguagem, com comprometimento predominante da pragmática", cid10: "F80.8" },

  // 6A03 — Transtorno do desenvolvimento da aprendizagem
  { code: "6A03.0", description: "Transtorno do desenvolvimento da aprendizagem com comprometimento na leitura", cid10: "F81.0" },
  { code: "6A03.1", description: "Transtorno do desenvolvimento da aprendizagem com comprometimento na escrita", cid10: "F81.1" },
  { code: "6A03.2", description: "Transtorno do desenvolvimento da aprendizagem com comprometimento na matemática", cid10: "F81.2" },
  { code: "6A03.3", description: "Transtorno do desenvolvimento da aprendizagem, outro especificado", cid10: "F81.8" },

  // 6A04 / 6A06
  { code: "6A04", description: "Transtorno do desenvolvimento da coordenação motora", cid10: "F82" },
  { code: "6A06", description: "Transtorno do movimento estereotipado", cid10: "F98.4" },

  // 6A05 — Transtorno de déficit de atenção e hiperatividade (TDAH)
  { code: "6A05.0", description: "TDAH, apresentação predominantemente desatenta", cid10: "F90.0" },
  { code: "6A05.1", description: "TDAH, apresentação predominantemente hiperativa-impulsiva", cid10: "F90.1" },
  { code: "6A05.2", description: "TDAH, apresentação combinada", cid10: "F90.0" },
  { code: "6A05.Z", description: "TDAH, não especificado", cid10: "F90.9" },

  // Transtornos de ansiedade e relacionados na infância
  { code: "6B00", description: "Transtorno de ansiedade generalizada", cid10: "F41.1" },
  { code: "6B01", description: "Transtorno de pânico", cid10: "F41.0" },
  { code: "6B05", description: "Transtorno de ansiedade de separação", cid10: "F93.0" },
  { code: "6B06", description: "Mutismo seletivo", cid10: "F94.0" },
  { code: "6B20", description: "Transtorno obsessivo-compulsivo", cid10: "F42.0" },
  { code: "6B80", description: "Anorexia nervosa", cid10: "F50.0" },

  // Transtornos de conduta / oposição
  { code: "6C90", description: "Transtorno desafiador de oposição", cid10: "F91.3" },
  { code: "6C91", description: "Transtorno de conduta-dissocial", cid10: "F91.9" },

  // Síndrome de Tourette e tiques (capítulo neurológico no CID-11)
  { code: "8A05.00", description: "Síndrome de Tourette", cid10: "F95.2" },

  // Síndromes genéticas frequentemente associadas
  { code: "LD40.0", description: "Síndrome de Down (trissomia do 21)", cid10: "Q90.0" },
  { code: "LD90.4", description: "Síndrome de Rett", cid10: "F84.2" },

  // Paralisia cerebral (capítulo neurológico)
  { code: "8D20.0", description: "Paralisia cerebral espástica unilateral", cid10: "G80.2" },
  { code: "8D20.1", description: "Paralisia cerebral espástica bilateral", cid10: "G80.1" },
  { code: "8D20.2", description: "Paralisia cerebral discinética", cid10: "G80.3" },
  { code: "8D20.3", description: "Paralisia cerebral atáxica", cid10: "G80.4" },
];

// Índice por código para lookup O(1) do De-Para.
const CID11_BY_CODE = new Map(CID11_DATASET.map((c) => [c.code, c]));

// Retorna o CID-10 equivalente para um código CID-11, se houver no recorte.
export function cid10ForCid11(code: string): string | undefined {
  return CID11_BY_CODE.get(code)?.cid10;
}

export function findCid11(code: string): Cid11Code | undefined {
  return CID11_BY_CODE.get(code);
}
