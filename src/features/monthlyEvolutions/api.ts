import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Enums, Json, Tables, TablesUpdate } from "@/types/database";
import type { DigitalSignature } from "@/lib/digitalSignature";
import { formatDateBR } from "@/lib/date";
import { buildMonthlySummary } from "./summary";

export type MonthlyEvolution = Tables<"monthly_evolutions">;
export type MonthlyPeriodType = Enums<"monthly_period_type">;
export type MonthlySignatureMethod = Enums<"monthly_signature_method">;
export const MONTHLY_PAGE_SIZE = 12;

export function getMonthlyDigitalSignature(
  m: Pick<MonthlyEvolution, "digital_signature"> | null | undefined,
): DigitalSignature | null {
  const s = m?.digital_signature;
  return s && typeof s === "object" && !Array.isArray(s)
    ? (s as unknown as DigitalSignature)
    : null;
}

// String canônica assinada — vincula a assinatura ao conteúdo do relatório.
export function buildMonthlySignaturePayload(m: MonthlyEvolution): string {
  return [
    `Evolução mensal #${m.id}`,
    `Paciente: ${m.patient_id}`,
    `Profissional: ${m.professional_id}`,
    `Período: ${formatMonthlyPeriod(m)}`,
    `Sessões: ${m.total_sessions} (presenças ${m.total_present}, ausências ${m.total_absent})`,
    `Síntese: ${m.generated_summary}`,
    `Análise: ${m.professional_review ?? ""}`,
    `Conclusão: ${m.conclusion ?? ""}`,
    `Próximo mês: ${m.next_month_plan ?? ""}`,
    `Aprovado por: ${m.reviewer_name ?? ""}`,
  ].join("\n");
}

export type MonthlyRow = MonthlyEvolution & {
  patient: { name: string } | null;
  professional: {
    name: string;
    specialty: Enums<"specialty">;
    signature_path: string | null;
  } | null;
};

export type GoalProgress = {
  goal_id: number;
  description: string;
  category: string;
  current_progress: number;
  status: string;
};

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Intervalo "yyyy-MM-dd" do 1º ao último dia do mês.
export function monthRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

// Recorte de um relatório já gravado. period_start/period_end são a fonte de
// verdade (preenchidos também para o mensal); o mês de referência é o fallback
// para registros lidos antes da migração 0036.
export type MonthlyPeriodFields = Pick<
  MonthlyEvolution,
  "period_type" | "period_start" | "period_end" | "reference_month" | "reference_year"
>;

export function monthlyRange(m: MonthlyPeriodFields) {
  if (m.period_start && m.period_end) {
    return { from: m.period_start, to: m.period_end };
  }
  return monthRange(m.reference_year, m.reference_month);
}

// Rótulo do recorte: "Julho / 2026" (mensal) ou "01/06/2026 a 15/07/2026".
export function formatMonthlyPeriod(m: MonthlyPeriodFields): string {
  if (m.period_type === "periodo" && m.period_start && m.period_end) {
    return `${formatDateBR(m.period_start)} a ${formatDateBR(m.period_end)}`;
  }
  return `${MONTH_NAMES_PT[m.reference_month - 1]} / ${m.reference_year}`;
}

// Sufixo do nome de arquivo — mantém os PDFs distinguíveis entre recortes.
export function monthlyFileSuffix(m: MonthlyPeriodFields): string {
  if (m.period_type === "periodo" && m.period_start && m.period_end) {
    return `${m.period_start}_a_${m.period_end}`;
  }
  return `${m.reference_year}-${String(m.reference_month).padStart(2, "0")}`;
}

type ListParams = {
  page: number;
  patientId?: number;
  year?: number;
};

export function useMonthlyEvolutions({ page, patientId, year }: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.monthly.list(clinicId, page, patientId, year),
    enabled: !!clinicId,
    queryFn: async () => {
      const fromRange = (page - 1) * MONTHLY_PAGE_SIZE;
      const toRange = fromRange + MONTHLY_PAGE_SIZE - 1;
      let q = supabase
        .from("monthly_evolutions")
        .select(
          "*, patient:patients(name), professional:professionals!monthly_evolutions_professional_id_fkey(name, specialty, signature_path)",
          { count: "exact" },
        )
        .eq("clinic_id", clinicId!)
        .order("reference_year", { ascending: false })
        .order("reference_month", { ascending: false })
        .range(fromRange, toRange);
      if (patientId) q = q.eq("patient_id", patientId);
      if (year) q = q.eq("reference_year", year);
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as MonthlyRow[], total: count ?? 0 };
    },
  });
}

export function useMonthlyEvolution(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.monthly.byId(id),
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_evolutions")
        .select(
          "*, patient:patients(name), professional:professionals!monthly_evolutions_professional_id_fkey(name, specialty, signature_path)",
        )
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MonthlyRow | null;
    },
  });
}

// --- Relatório "Histórico de Frequência de Atendimento" (modelo operadora) ---
// Uma linha por evolução diária do mês (paciente + profissional), com data e
// horários. As colunas de assinatura ficam em branco para assinatura física.
export type FrequencyReportRow = {
  session_date: string;
  start_time: string;
  end_time: string;
};

export type FrequencyReportData = {
  patient:
    | Pick<
        Tables<"patients">,
        "name" | "birth_date" | "health_plan_card" | "health_plan_name" | "guardian_name"
      >
    | null;
  professional:
    | Pick<
        Tables<"professionals">,
        "name" | "specialty" | "council_type" | "council_number" | "council_state"
      >
    | null;
  // Rótulo do recorte ("Julho / 2026" ou "01/06/2026 a 15/07/2026").
  periodLabel: string;
  // Base do nome do arquivo gerado.
  periodFileSuffix: string;
  rows: FrequencyReportRow[];
};

// Busca sob demanda (acionada no clique da listagem) os dados para o PDF de
// frequência: identificação do paciente/profissional + evoluções diárias do
// período do paciente com aquele profissional.
export async function fetchFrequencyReportData(
  clinicId: number,
  monthly: Pick<MonthlyEvolution, "patient_id" | "professional_id"> &
    MonthlyPeriodFields,
): Promise<FrequencyReportData> {
  const { from, to } = monthlyRange(monthly);

  const [
    { data: patient, error: patientErr },
    { data: professional, error: profErr },
    { data: evolutions, error: evoErr },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("name, birth_date, health_plan_card, health_plan_name, guardian_name")
      .eq("id", monthly.patient_id)
      .eq("clinic_id", clinicId)
      .maybeSingle(),
    supabase
      .from("professionals")
      .select("name, specialty, council_type, council_number, council_state")
      .eq("id", monthly.professional_id)
      .eq("clinic_id", clinicId)
      .maybeSingle(),
    supabase
      .from("daily_evolutions")
      .select("session_date, start_time, end_time")
      .eq("clinic_id", clinicId)
      .eq("patient_id", monthly.patient_id)
      .eq("professional_id", monthly.professional_id)
      .gte("session_date", from)
      .lte("session_date", to)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (patientErr) throw patientErr;
  if (profErr) throw profErr;
  if (evoErr) throw evoErr;

  return {
    patient: patient ?? null,
    professional: professional ?? null,
    periodLabel: formatMonthlyPeriod(monthly),
    periodFileSuffix: monthlyFileSuffix(monthly),
    rows: (evolutions ?? []) as FrequencyReportRow[],
  };
}

// Parâmetros do motor: mês fechado ou intervalo livre escolhido na tela.
export type GenerateInput = {
  patient_id: number;
  professional_id: number;
} & (
  | { period_type: "mensal"; reference_year: number; reference_month: number }
  | { period_type: "periodo"; period_start: string; period_end: string }
);

// Lançado quando já existe uma evolução para o mesmo recorte (unique
// paciente+mês para o mensal, paciente+intervalo para o período). Carrega o id
// da existente para a UI oferecer abri-la.
export class MonthlyExistsError extends Error {
  existingId?: number;
  constructor(existingId?: number, periodType: MonthlyPeriodType = "mensal") {
    super(
      periodType === "periodo"
        ? "Já existe uma evolução deste paciente para exatamente este período."
        : "Já existe uma evolução mensal para este paciente neste mês.",
    );
    this.name = "MonthlyExistsError";
    this.existingId = existingId;
  }
}

// Motor de Inteligência: agrega frequência, evoluções e metas para
// gerar a síntese mensal do paciente.
export function useGenerateMonthlyEvolution() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();

  return useMutation({
    mutationFn: async (input: GenerateInput) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      // Recorte normalizado: o intervalo é sempre explícito e o mês de
      // referência (obrigatório na tabela) vem do início do período.
      const { from, to } =
        input.period_type === "mensal"
          ? monthRange(input.reference_year, input.reference_month)
          : { from: input.period_start, to: input.period_end };
      const referenceYear =
        input.period_type === "mensal"
          ? input.reference_year
          : Number(from.slice(0, 4));
      const referenceMonth =
        input.period_type === "mensal"
          ? input.reference_month
          : Number(from.slice(5, 7));
      const periodLabel = formatMonthlyPeriod({
        period_type: input.period_type,
        period_start: from,
        period_end: to,
        reference_month: referenceMonth,
        reference_year: referenceYear,
      });

      // 1. Frequência no período
      const { data: attendances, error: attErr } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("clinic_id", clinic.id)
        .eq("patient_id", input.patient_id)
        .gte("session_date", from)
        .lte("session_date", to);
      if (attErr) throw attErr;

      // 2. Evoluções diárias do período (campos enriquecidos para o motor)
      const { data: evolutions, error: evoErr } = await supabase
        .from("daily_evolutions")
        .select(
          "session_date, evolution_assessment, prompting_level, skills_worked, incidents",
        )
        .eq("clinic_id", clinic.id)
        .eq("patient_id", input.patient_id)
        .gte("session_date", from)
        .lte("session_date", to);
      if (evoErr) throw evoErr;

      // 3. Metas vigentes do paciente (via planos não encerrados)
      const { data: plans, error: planErr } = await supabase
        .from("therapeutic_plans")
        .select("id")
        .eq("clinic_id", clinic.id)
        .eq("patient_id", input.patient_id)
        .neq("status", "encerrado");
      if (planErr) throw planErr;

      const planIds = (plans ?? []).map((p) => p.id);
      let goals: GoalProgress[] = [];
      if (planIds.length > 0) {
        const { data: g, error: goalErr } = await supabase
          .from("therapeutic_goals")
          .select("id, description, category, current_progress, status")
          .in("plan_id", planIds);
        if (goalErr) throw goalErr;
        goals = (g ?? []).map((row) => ({
          goal_id: row.id,
          description: row.description,
          category: row.category,
          current_progress: Number(row.current_progress),
          status: row.status,
        }));
      }

      // 4. Identificação do paciente e profissional (para o texto)
      const [{ data: patient }, { data: professional }] = await Promise.all([
        supabase
          .from("patients")
          .select("name")
          .eq("id", input.patient_id)
          .maybeSingle(),
        supabase
          .from("professionals")
          .select("name")
          .eq("id", input.professional_id)
          .maybeSingle(),
      ]);

      const summary = buildMonthlySummary({
        patientName: patient?.name ?? "Paciente",
        professionalName: professional?.name ?? "Profissional",
        periodLabel,
        attendances: attendances ?? [],
        evolutions: evolutions ?? [],
        goals: goals.map((g) => ({
          description: g.description,
          category: g.category,
          status: g.status as Enums<"goal_status">,
          current_progress: g.current_progress,
        })),
      });

      const total_sessions = summary.totals.total;
      const total_present = summary.totals.present;
      const total_absent = summary.totals.absent;
      const generated_summary = summary.text;

      const { data, error } = await supabase
        .from("monthly_evolutions")
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patient_id,
          professional_id: input.professional_id,
          period_type: input.period_type,
          period_start: from,
          period_end: to,
          reference_month: referenceMonth,
          reference_year: referenceYear,
          total_sessions,
          total_present,
          total_absent,
          goals_progress: goals as unknown as Json,
          generated_summary,
        })
        .select()
        .single();
      if (error) {
        // Unique do recorte: já existe evolução para este paciente no mesmo
        // mês (mensal) ou no mesmo intervalo (período). Busca a existente para
        // oferecer abri-la em vez de devolver um erro técnico.
        if (error.code === "23505") {
          let q = supabase
            .from("monthly_evolutions")
            .select("id")
            .eq("clinic_id", clinic.id)
            .eq("patient_id", input.patient_id)
            .eq("period_type", input.period_type);
          q =
            input.period_type === "mensal"
              ? q
                  .eq("reference_year", referenceYear)
                  .eq("reference_month", referenceMonth)
              : q.eq("period_start", from).eq("period_end", to);
          const { data: existing } = await q.maybeSingle();
          throw new MonthlyExistsError(existing?.id, input.period_type);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.monthly.all });
    },
  });
}

export function useUpdateMonthlyEvolution(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (values: TablesUpdate<"monthly_evolutions">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("monthly_evolutions")
        .update(values)
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.monthly.all });
      queryClient.invalidateQueries({ queryKey: keys.monthly.byId(id) });
    },
  });
}

// Profissional envia o rascunho para aprovação do coordenador.
export function useSubmitMonthly(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async () => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("monthly_evolutions")
        .update({
          workflow_status: "pendente_aprovacao",
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.monthly.all });
      queryClient.invalidateQueries({ queryKey: keys.monthly.byId(id) });
    },
  });
}

// Coordenador aprova (libera para assinatura) ou solicita ajustes.
export function useReviewMonthly(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      decision: "approve" | "reject";
      reason?: string;
      reviewerId?: number | null;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const reviewerName = profile?.name ?? user?.email ?? null;
      const now = new Date().toISOString();
      const patch =
        input.decision === "approve"
          ? {
              workflow_status: "aguardando_assinatura" as const,
              approved: true,
              approved_at: now,
              reviewed_at: now,
              reviewer_id: input.reviewerId ?? null,
              reviewer_name: reviewerName,
              rejection_reason: null,
            }
          : {
              workflow_status: "ajustes_solicitados" as const,
              approved: false,
              reviewed_at: now,
              reviewer_name: reviewerName,
              rejection_reason: input.reason ?? null,
            };
      const { error } = await supabase
        .from("monthly_evolutions")
        .update(patch)
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.monthly.all });
      queryClient.invalidateQueries({ queryKey: keys.monthly.byId(id) });
    },
  });
}

// Grava a assinatura e encerra o ciclo do relatório. Compartilhada pelos dois
// métodos (certificado A1 e assinatura digitalizada) e pelo lote da listagem.
async function persistMonthlySignature(
  clinicId: number,
  id: number,
  method: MonthlySignatureMethod,
  signature: DigitalSignature | null,
) {
  const { error } = await supabase
    .from("monthly_evolutions")
    .update({
      workflow_status: "assinada",
      signature_method: method,
      digital_signature: signature ? (signature as unknown as Json) : null,
      signed_at: signature?.signed_at ?? new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId);
  if (error) throw error;
}

// Método 1 — assinar com certificado ICP-Brasil (A1 local).
export function useSignMonthlyCertificate(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (signature: DigitalSignature) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      await persistMonthlySignature(clinic.id, id, "certificado", signature);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.monthly.all });
      queryClient.invalidateQueries({ queryKey: keys.monthly.byId(id) });
    },
  });
}

// Método 2 — assinatura digital: aplica no relatório a assinatura digitalizada
// que o profissional tem no cadastro. Sem certificado; vale como aceite
// eletrônico registrado (autor, data/hora e rubrica).
export function useSignMonthlyRubric(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async () => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      await persistMonthlySignature(clinic.id, id, "digital", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.monthly.all });
      queryClient.invalidateQueries({ queryKey: keys.monthly.byId(id) });
    },
  });
}

// A assinatura digital só existe se houver rubrica no cadastro do profissional
// — sem ela o documento sairia sem nenhuma marca de autoria.
export function hasProfessionalRubric(
  m: Pick<MonthlyRow, "professional">,
): boolean {
  return !!m.professional?.signature_path;
}

// Só o relatório já aprovado pelo coordenador pode ser assinado — a assinatura
// em lote acelera o trabalho, não pula etapa do fluxo.
export function canSignMonthly(m: Pick<MonthlyEvolution, "workflow_status">) {
  return m.workflow_status === "aguardando_assinatura";
}

export type BatchSignResult = {
  id: number;
  ok: boolean;
  error?: string;
};

/**
 * Assina várias evoluções de uma vez.
 * - certificado: o A1 é aberto UMA vez e cada relatório recebe um envelope
 *   PKCS#7 próprio, vinculado ao seu conteúdo.
 * - digital: aplica a rubrica cadastrada do profissional de cada relatório.
 * Uma falha isolada não derruba o lote — o resultado diz linha a linha o que
 * foi assinado.
 */
export function useSignMonthlyBatch() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (input: {
      method: MonthlySignatureMethod;
      file?: File | null;
      password?: string;
      items: MonthlyEvolution[];
      onProgress?: (done: number, total: number) => void;
    }): Promise<{ results: BatchSignResult[]; signerName: string }> => {
      if (!clinic?.id) throw new Error("Clínica não definida");

      let signPayload: ((payload: string) => DigitalSignature) | null = null;
      if (input.method === "certificado") {
        if (!input.file) throw new Error("Selecione o arquivo do certificado.");
        const { loadA1Certificate, signPayloadWithCertificate } = await import(
          "@/lib/digitalSignature"
        );
        const certificate = await loadA1Certificate(
          input.file,
          input.password ?? "",
        );
        signPayload = (payload) =>
          signPayloadWithCertificate(certificate, payload);
      }

      const results: BatchSignResult[] = [];
      let signerName = "";
      let done = 0;
      for (const item of input.items) {
        try {
          const signature = signPayload
            ? signPayload(buildMonthlySignaturePayload(item))
            : null;
          await persistMonthlySignature(
            clinic.id,
            item.id,
            input.method,
            signature,
          );
          if (signature) signerName = signature.signer_name;
          results.push({ id: item.id, ok: true });
        } catch (e) {
          results.push({
            id: item.id,
            ok: false,
            error: e instanceof Error ? e.message : "Falha ao assinar",
          });
        }
        done += 1;
        input.onProgress?.(done, input.items.length);
      }
      return { results, signerName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.monthly.all });
    },
  });
}

export { MONTH_NAMES_PT };
