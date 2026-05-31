import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Integração com a IA Claude via Edge Functions. A chave da API (CLAUDE_KEY)
// vive apenas no servidor (Supabase Secrets); o navegador só fala com as
// funções, autenticado pelo JWT da sessão.

// Invoca uma Edge Function e normaliza o erro: extrai a mensagem detalhada do
// corpo da resposta da função quando disponível.
async function invokeEdge<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(
    name,
    { body },
  );
  if (error) {
    let detail = error.message;
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      const parsed = ctx ? await ctx.json() : null;
      if (parsed?.error) detail = parsed.error;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(detail);
  }
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    (data as { error?: string }).error
  ) {
    throw new Error((data as { error?: string }).error as string);
  }
  return data as T;
}

export type MonthlyAnalysisInput = {
  period: string;
  specialty?: string;
  totals: { sessions: number; present: number; absent: number };
  summary: string;
  goals: {
    description: string;
    category: string;
    current_progress: number;
    status: string;
  }[];
};

export function useGenerateMonthlyAnalysis() {
  return useMutation({
    mutationFn: async (input: MonthlyAnalysisInput) => {
      const data = await invokeEdge<{ text?: string }>("claude-analysis", input);
      if (!data?.text) throw new Error("Resposta vazia da IA.");
      return data.text;
    },
  });
}

export type LaudoExtraction = {
  doctor: string | null;
  crm_uf: string | null;
  issue_date: string | null;
  validity_date: string | null;
  validity_source: "explicit" | "computed" | null;
};

export function useExtractLaudo() {
  return useMutation({
    mutationFn: (input: { fileBase64: string; mediaType: string }) =>
      invokeEdge<LaudoExtraction>("claude-extract-laudo", input),
  });
}
