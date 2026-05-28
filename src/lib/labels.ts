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
