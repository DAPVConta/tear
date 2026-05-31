import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Integração com a IA Claude via Edge Function `claude-analysis`. A chave da API
// (CLAUDE_KEY) vive apenas no servidor (Supabase Secrets); o navegador só fala
// com a função, autenticado pelo JWT da sessão. Enviamos apenas agregados
// clínicos (sem nome/CPF do paciente).

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
      const { data, error } = await supabase.functions.invoke<{
        text?: string;
        error?: string;
      }>("claude-analysis", { body: input });

      if (error) {
        // Tenta extrair a mensagem detalhada do corpo da resposta da função.
        let detail = error.message;
        try {
          const ctx = (error as unknown as { context?: Response }).context;
          const body = ctx ? await ctx.json() : null;
          if (body?.error) detail = body.error;
        } catch {
          // mantém a mensagem padrão
        }
        throw new Error(detail);
      }
      if (!data?.text) throw new Error(data?.error || "Resposta vazia da IA.");
      return data.text;
    },
  });
}
