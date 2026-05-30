// Planos de assinatura do PEET SaaS
export const PLANS = {
  trial: {
    id: "trial",
    name: "Trial",
    description: "14 dias gratuitos para testar o sistema",
    price: 0,
    interval: "month" as const,
    features: [
      "Até 3 profissionais",
      "Até 10 pacientes",
      "Evolução diária",
      "Evolução mensal automática",
      "Relatórios básicos",
    ],
    maxProfessionals: 3,
    maxPatients: 10,
    trialDays: 14,
  },
  basic: {
    id: "basic",
    name: "Básico",
    description: "Para clínicas pequenas",
    price: 29900, // R$ 299,00 em centavos
    interval: "month" as const,
    features: [
      "Até 5 profissionais",
      "Até 30 pacientes",
      "Evolução diária com blindagem",
      "Evolução mensal automática (IA)",
      "Auditoria e checklist de faturamento",
      "Suporte por e-mail",
    ],
    maxProfessionals: 5,
    maxPatients: 30,
    trialDays: 0,
  },
  professional: {
    id: "professional",
    name: "Profissional",
    description: "Para clínicas em crescimento",
    price: 59900, // R$ 599,00 em centavos
    interval: "month" as const,
    features: [
      "Até 15 profissionais",
      "Até 100 pacientes",
      "Todas as funcionalidades do Básico",
      "Relatórios avançados em PDF",
      "Exportação TISS",
      "Suporte prioritário",
      "Treinamento online",
    ],
    maxProfessionals: 15,
    maxPatients: 100,
    trialDays: 0,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Para redes de clínicas",
    price: 99900, // R$ 999,00 em centavos
    interval: "month" as const,
    features: [
      "Profissionais ilimitados",
      "Pacientes ilimitados",
      "Todas as funcionalidades do Profissional",
      "Multi-unidades",
      "API de integração",
      "Gerente de conta dedicado",
      "SLA de 99.9%",
    ],
    maxProfessionals: 999,
    maxPatients: 9999,
    trialDays: 0,
  },
} as const;

export type PlanId = keyof typeof PLANS;
