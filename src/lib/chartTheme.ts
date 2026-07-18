import type { Enums } from "@/types/database";

// Paletas de data-viz derivadas das escalas da marca (tailwind.config) e
// validadas com o validador de paleta (banda de lightness, separação CVD
// ΔE ≥ 8, piso de visão normal ≥ 15 e contraste ≥ 3:1 contra a superfície
// de cada modo). Cores cruas do manual (#45C7FF, #FFC400) reprovam em fundo
// claro — aqui usamos os degraus aprovados. Ordem fixa: nunca ciclar.
export type ChartMode = "light" | "dark";

export const CHART_CATEGORICAL: Record<ChartMode, string[]> = {
  light: ["#1E88FF", "#B38800", "#006CA3", "#FF2D2D", "#2E50B0"],
  dark: ["#1E88FF", "#B38800", "#008FD6", "#FF2D2D", "#5E7BCE"],
};

// Avaliação clínica é uma escala com POLARIDADE (progresso ↔ retrocesso):
// divergente — azul no polo positivo, cinza neutro no meio, vermelho no polo
// negativo. A cor segue a categoria (chave), nunca a posição na lista.
export const ASSESSMENT_COLORS: Record<
  ChartMode,
  Record<Enums<"evolution_assessment">, string>
> = {
  light: {
    evolucao_significativa: "#006FE6",
    evolucao_leve: "#74AEFF",
    estavel: "#94A3B8",
    retrocesso_leve: "#FF7B7B",
    retrocesso_significativo: "#E60000",
  },
  dark: {
    evolucao_significativa: "#4A9BFF",
    evolucao_leve: "#A6CCFF",
    estavel: "#94A3B8",
    retrocesso_leve: "#FF7B7B",
    retrocesso_significativo: "#FF2D2D",
  },
};
