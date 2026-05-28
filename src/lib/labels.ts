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
