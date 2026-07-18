import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/providers/ClinicProvider";

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

export type TherapyItem = { therapy: string; frequency: string };

// Extração completa do laudo pela IA (OpenAI gpt-4o-mini) para o fluxo de novo
// paciente: nome, terapias + periodicidade e os metadados do laudo. O token é
// resolvido por clínica no servidor (Configurações → IA); aqui só enviamos o
// clinic_id para a função validar a associação.
export type LaudoAIExtraction = LaudoExtraction & {
  patient_name: string | null;
  therapies: TherapyItem[];
};

export function useExtractLaudoAI() {
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (input: { fileBase64: string; mediaType: string }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return invokeEdge<LaudoAIExtraction>("openai-extract-laudo", {
        ...input,
        clinicId: clinic.id,
      });
    },
  });
}

// --- Configuração de IA por clínica (token_gpt) ---------------------------
// Presença do token, sem devolvê-lo em claro para a tela (mostramos só se está
// configurado). RLS garante que só clinic_admin lê a linha.
export function useClinicAiSettings() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: ["clinic-ai-settings", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_ai_settings")
        .select("openai_token, updated_at")
        .eq("clinic_id", clinicId!)
        .maybeSingle();
      if (error) throw error;
      const token = data?.openai_token ?? null;
      return {
        configured: !!token && token.trim().length > 0,
        updated_at: data?.updated_at ?? null,
      };
    },
  });
}

export function useSaveOpenaiToken() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (token: string | null) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const value = token && token.trim() ? token.trim() : null;
      const { error } = await supabase
        .from("clinic_ai_settings")
        .upsert(
          { clinic_id: clinic.id, openai_token: value },
          { onConflict: "clinic_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-ai-settings"] });
    },
  });
}
