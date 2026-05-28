import type { Enums } from "@/types/database";

export const genderLabels: Record<Enums<"gender">, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};

export const paymentTypeLabels: Record<Enums<"payment_type">, string> = {
  operadora: "Operadora",
  particular: "Particular",
};

export const authorizationStatusLabels: Record<
  Enums<"authorization_status">,
  string
> = {
  ativa: "Ativa",
  vencida: "Vencida",
  cancelada: "Cancelada",
  esgotada: "Esgotada",
};

export const planStatusLabels: Record<Enums<"plan_status">, string> = {
  ativo: "Ativo",
  revisao: "Em revisão",
  encerrado: "Encerrado",
};

export const goalStatusLabels: Record<Enums<"goal_status">, string> = {
  em_andamento: "Em andamento",
  adquirida: "Adquirida",
  em_manutencao: "Em manutenção",
  descontinuada: "Descontinuada",
};

export const attendanceStatusLabels: Record<
  Enums<"attendance_status">,
  string
> = {
  presente: "Presente",
  falta_justificada: "Falta justificada",
  falta_injustificada: "Falta injustificada",
  cancelado_clinica: "Cancelado (clínica)",
  cancelado_paciente: "Cancelado (paciente)",
};

export const attendanceTypeLabels: Record<Enums<"attendance_type">, string> = {
  individual_presencial: "Individual — presencial",
  individual_domiciliar: "Individual — domiciliar",
  individual_escolar: "Individual — escolar",
  grupo_presencial: "Grupo — presencial",
};

export const promptingLevelLabels: Record<Enums<"prompting_level">, string> = {
  fisica_total: "Ajuda física total",
  fisica_parcial: "Ajuda física parcial",
  gestual: "Ajuda gestual",
  verbal: "Ajuda verbal",
  independente: "Independente",
};

export const evolutionAssessmentLabels: Record<
  Enums<"evolution_assessment">,
  string
> = {
  evolucao_significativa: "Evolução significativa",
  evolucao_leve: "Evolução leve",
  estavel: "Estável",
  retrocesso_leve: "Retrocesso leve",
  retrocesso_significativo: "Retrocesso significativo",
};

export const guardianValidationMethodLabels: Record<
  Enums<"guardian_validation_method">,
  string
> = {
  assinatura_digital: "Assinatura digital",
  token: "Token",
  presencial: "Presencial",
};

export const specialtyLabels: Record<Enums<"specialty">, string> = {
  psicologia_aba: "Psicologia (ABA)",
  fonoaudiologia: "Fonoaudiologia",
  terapia_ocupacional_is: "T.O. — Integração Sensorial",
  terapia_ocupacional_avds: "T.O. — AVDs",
  fisioterapia: "Fisioterapia",
  psicopedagogia: "Psicopedagogia",
  musicoterapia: "Musicoterapia",
  neuropsicologia: "Neuropsicologia",
};
