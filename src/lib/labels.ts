import type { Enums } from "@/types/database";
import type { CouncilType } from "@/lib/constants";

export const memberRoleLabels: Record<Enums<"member_role">, string> = {
  clinic_admin: "Administrador",
  therapist: "Terapeuta",
  receptionist: "Recepção",
};

export const monthlyStatusLabels: Record<Enums<"monthly_status">, string> = {
  rascunho: "Rascunho",
  pendente_aprovacao: "Pendente de aprovação",
  ajustes_solicitados: "Ajustes solicitados",
  aguardando_assinatura: "Aguardando assinatura",
  assinada: "Assinada",
};

export const genderLabels: Record<Enums<"gender">, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};

export const paymentTypeLabels: Record<Enums<"payment_type">, string> = {
  operadora: "Operadora de Saúde (Convênio)",
  particular: "Particular",
  liminar: "Liminar (Judicial)",
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

// Frequência (#9) — armazenados como texto livre (sem enum no banco).
export const absenceReasonLabels: Record<string, string> = {
  doenca: "Doença",
  viagem: "Viagem",
  imprevisto_tecnico: "Imprevisto técnico",
  outros: "Outros",
};

export const guardianAckMethodLabels: Record<string, string> = {
  assinatura_tela: "Assinatura na tela/tablet",
  biometria: "Biometria",
  token: "Token / WhatsApp",
  presencial: "Confirmação presencial",
};

export const attendanceTypeLabels: Record<Enums<"attendance_type">, string> = {
  individual_presencial: "Individual — presencial",
  individual_domiciliar: "Individual — domiciliar",
  individual_escolar: "Individual — escolar",
  grupo_presencial: "Grupo — presencial",
  devolutiva_pais: "Devolutiva para os Pais",
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
  terapia_ocupacional: "Terapia Ocupacional",
  neuropediatria: "Neuropediatria",
  psiquiatria: "Psiquiatria",
  nutricao: "Nutrição",
  psicomotricidade_funcional: "Psicomotricidade Funcional",
  psicomotricidade_relacional: "Psicomotricidade Relacional",
  aplicador_aba_domiciliar: "Aplicador ABA — Domiciliar",
  aplicador_aba_escolar: "Aplicador ABA — Escolar",
};

// Conselho de classe obrigatório por especialidade (correção #11).
// Áreas sem conselho federal próprio caem em CBO (registro por ocupação /
// associação), permanecendo editável caso o profissional tenha graduação base
// vinculada a outro conselho.
export const specialtyCouncil: Record<Enums<"specialty">, CouncilType> = {
  psicologia_aba: "CRP",
  neuropsicologia: "CRP",
  fonoaudiologia: "CRFa",
  terapia_ocupacional: "CREFITO",
  terapia_ocupacional_is: "CREFITO",
  terapia_ocupacional_avds: "CREFITO",
  fisioterapia: "CREFITO",
  neuropediatria: "CRM",
  psiquiatria: "CRM",
  nutricao: "CRN",
  psicopedagogia: "CBO",
  musicoterapia: "CBO",
  psicomotricidade_funcional: "CBO",
  psicomotricidade_relacional: "CBO",
  aplicador_aba_domiciliar: "CBO",
  aplicador_aba_escolar: "CBO",
};
