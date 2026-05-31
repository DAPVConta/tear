import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Enums, Json, Tables, TablesInsert, TablesUpdate } from "@/types/database";
import type { DigitalSignature } from "@/lib/digitalSignature";
import type { StructuredData } from "@/features/dailyEvolutions/formTypes";

export type DailyEvolution = Tables<"daily_evolutions">;
export const EVOLUTIONS_PAGE_SIZE = 15;

// Adendo / nota de retificação anexada à evolução sem alterar o registro
// original (única forma de "corrigir" após o bloqueio de 24h).
export type Addendum = {
  text: string;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
};

export function getAddenda(
  e: Pick<DailyEvolution, "addendum"> | null | undefined,
): Addendum[] {
  return Array.isArray(e?.addendum) ? (e!.addendum as unknown as Addendum[]) : [];
}

export function getDigitalSignature(
  e: Pick<DailyEvolution, "digital_signature"> | null | undefined,
): DigitalSignature | null {
  const s = e?.digital_signature;
  return s && typeof s === "object" && !Array.isArray(s)
    ? (s as unknown as DigitalSignature)
    : null;
}

// Devolutiva para os pais — campos em linguagem acessível para familiares.
export type ParentFeedback = {
  previous_activities: string;
  next_activities: string;
  home_guidance: string;
};

export function getParentFeedback(
  e: Pick<DailyEvolution, "parent_feedback"> | null | undefined,
): ParentFeedback | null {
  const f = e?.parent_feedback;
  if (!f || typeof f !== "object" || Array.isArray(f)) return null;
  const o = f as Record<string, unknown>;
  return {
    previous_activities:
      typeof o.previous_activities === "string" ? o.previous_activities : "",
    next_activities:
      typeof o.next_activities === "string" ? o.next_activities : "",
    home_guidance: typeof o.home_guidance === "string" ? o.home_guidance : "",
  };
}

// Dados estruturados por tipo de formulário (ABA / médico) — correção #12.
export function getStructuredData(
  e: Pick<DailyEvolution, "structured_data"> | null | undefined,
): StructuredData | null {
  const s = e?.structured_data;
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  return s as unknown as StructuredData;
}

// Assinatura digital A1 do supervisor (homologação técnica da evolução do AT).
export function getSupervisorSignature(
  e: Pick<DailyEvolution, "supervisor_signature"> | null | undefined,
): DigitalSignature | null {
  const s = e?.supervisor_signature;
  return s && typeof s === "object" && !Array.isArray(s)
    ? (s as unknown as DigitalSignature)
    : null;
}

// String canônica assinada digitalmente — vincula a assinatura ao conteúdo
// clínico exato da evolução no momento da finalização.
export function buildEvolutionSignaturePayload(e: DailyEvolution): string {
  return [
    `Evolução diária #${e.id}`,
    `Paciente: ${e.patient_id}`,
    `Profissional: ${e.professional_id}`,
    `Data: ${e.session_date} ${e.start_time}–${e.end_time}`,
    `Tipo: ${e.attendance_type}`,
    `Nível de suporte: ${e.prompting_level}`,
    `Síntese: ${e.session_summary}`,
    `Avaliação: ${e.evolution_assessment}`,
    `Próxima sessão: ${e.next_session_plan}`,
    `Comportamento: ${e.behavioral_notes ?? ""}`,
    `Intervenção: ${e.behavioral_intervention ?? ""}`,
    `Intercorrências: ${e.incidents ?? ""}`,
  ].join("\n");
}

// String canônica para a homologação do supervisor (vincula a assinatura A1 do
// supervisor ao conteúdo e ao AT que registrou a evolução).
export function buildSupervisorSignaturePayload(e: DailyEvolution): string {
  return [
    `Homologação técnica da evolução #${e.id}`,
    `Paciente: ${e.patient_id}`,
    `Aplicador (AT): ${e.professional_id}`,
    `Supervisor: ${e.supervisor_id ?? "—"}`,
    `Data da sessão: ${e.session_date} ${e.start_time}–${e.end_time}`,
    `Síntese: ${e.session_summary}`,
    `Avaliação: ${e.evolution_assessment}`,
  ].join("\n");
}

export type EvolutionRow = DailyEvolution & {
  patient: { name: string } | null;
  professional: { name: string; specialty?: Enums<"specialty"> } | null;
};

type ListParams = {
  page: number;
  patientId?: number;
  specialty?: string;
  from?: string;
  to?: string;
};

export function useDailyEvolutions({
  page,
  patientId,
  specialty,
  from,
  to,
}: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: keys.evolutions.list(clinicId, page, patientId, specialty, from, to),
    enabled: !!clinicId,
    queryFn: async () => {
      const fromRange = (page - 1) * EVOLUTIONS_PAGE_SIZE;
      const toRange = fromRange + EVOLUTIONS_PAGE_SIZE - 1;

      // Join interno com professionals para permitir filtro por especialidade
      // (timeline filtrável — correção #12). Toda evolução tem professional_id,
      // então o inner join não descarta linhas.
      let query = supabase
        .from("daily_evolutions")
        .select(
          "*, patient:patients(name), professional:professionals!inner(name, specialty)",
          { count: "exact" },
        )
        .eq("clinic_id", clinicId!)
        .order("session_date", { ascending: false })
        .order("start_time", { ascending: false })
        .range(fromRange, toRange);

      if (patientId) query = query.eq("patient_id", patientId);
      if (specialty) query = query.eq("professional.specialty", specialty);
      if (from) query = query.gte("session_date", from);
      if (to) query = query.lte("session_date", to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as EvolutionRow[], total: count ?? 0 };
    },
  });
}

export function useDailyEvolution(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.evolutions.byId(id),
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_evolutions")
        .select("*")
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// Bloqueio automático após 24h da ASSINATURA (regra de blindagem). O contador
// inicia no timestamp da assinatura; enquanto não houver assinatura, a evolução
// permanece editável. Espelha a trigger server-side enforce_evolution_lock.
const LOCK_AFTER_MS = 24 * 60 * 60 * 1000;
export function isLocked(e: Pick<DailyEvolution, "locked" | "signed_at">): boolean {
  if (e.locked) return true;
  if (!e.signed_at) return false;
  return Date.now() - new Date(e.signed_at).getTime() > LOCK_AFTER_MS;
}

// Normaliza "HH:MM" → "HH:MM:SS" para casar com o formato do tipo `time`
// retornado pelo Postgres e evitar comparações lexicográficas ambíguas.
function toTime(t: string): string {
  return /^\d{2}:\d{2}$/.test(t) ? `${t}:00` : t;
}

// Verifica sobreposição de sessões no mesmo paciente/data.
async function hasOverlap(params: {
  clinicId: number;
  patient_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  excludeId?: number;
}): Promise<boolean> {
  const startNorm = toTime(params.start_time);
  const endNorm = toTime(params.end_time);
  let q = supabase
    .from("daily_evolutions")
    .select("id, start_time, end_time")
    .eq("clinic_id", params.clinicId)
    .eq("patient_id", params.patient_id)
    .eq("session_date", params.session_date)
    .lt("start_time", endNorm)
    .gt("end_time", startNorm);
  if (params.excludeId) q = q.neq("id", params.excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export function useCreateEvolution() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      values: Omit<TablesInsert<"daily_evolutions">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const overlap = await hasOverlap({
        clinicId: clinic.id,
        patient_id: values.patient_id,
        session_date: values.session_date,
        start_time: values.start_time,
        end_time: values.end_time,
      });
      if (overlap)
        throw new Error(
          "Já existe uma sessão deste paciente neste horário.",
        );

      const normalized = {
        ...values,
        start_time: toTime(values.start_time),
        end_time: toTime(values.end_time),
      };
      const { data, error } = await supabase
        .from("daily_evolutions")
        .insert({ ...normalized, clinic_id: clinic.id, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
    },
  });
}

export function useUpdateEvolution(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();

  return useMutation({
    mutationFn: async (values: TablesUpdate<"daily_evolutions">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      // Re-checa bloqueio: pega o estado atual antes de atualizar.
      const { data: current, error: fetchErr } = await supabase
        .from("daily_evolutions")
        .select("*")
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!current) throw new Error("Evolução não encontrada");
      if (isLocked(current))
        throw new Error("Evolução bloqueada para edição (>24h).");

      // Verifica sobreposição se mudou data/horário/paciente.
      const nextPatient = values.patient_id ?? current.patient_id;
      const nextDate = values.session_date ?? current.session_date;
      const nextStart = values.start_time ?? current.start_time;
      const nextEnd = values.end_time ?? current.end_time;
      const overlap = await hasOverlap({
        clinicId: clinic.id,
        patient_id: nextPatient,
        session_date: nextDate,
        start_time: nextStart,
        end_time: nextEnd,
        excludeId: id,
      });
      if (overlap)
        throw new Error("Já existe uma sessão deste paciente neste horário.");

      const normalized = {
        ...values,
        start_time: values.start_time ? toTime(values.start_time) : undefined,
        end_time: values.end_time ? toTime(values.end_time) : undefined,
      };
      const { data, error } = await supabase
        .from("daily_evolutions")
        .update(normalized)
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(id) });
    },
  });
}

export function useSignEvolution() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("daily_evolutions")
        .update({
          professional_signature: true,
          signed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(id) });
    },
  });
}

// Finaliza a evolução com assinatura digital ICP-Brasil (A1) gerada localmente.
// Persiste o envelope PKCS#7 + metadados do certificado e inicia o contador de
// 24h via signed_at. O status passa a "Assinado Digitalmente".
export function useSignEvolutionDigital(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (signature: DigitalSignature) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("daily_evolutions")
        .update({
          professional_signature: true,
          signed_at: signature.signed_at,
          digital_signature: signature as unknown as Json,
        } as never)
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(id) });
    },
  });
}

// Anexa um adendo/nota de retificação. Permitido mesmo com a evolução travada
// (a coluna addendum fica fora da lista protegida pela trigger de bloqueio).
export function useAddAddendum(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data: current, error: fetchErr } = await supabase
        .from("daily_evolutions")
        .select("addendum")
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      const next: Addendum[] = [
        ...getAddenda(current),
        {
          text,
          author_id: user?.id ?? null,
          author_name: profile?.name ?? user?.email ?? null,
          created_at: new Date().toISOString(),
        },
      ];
      const { error } = await supabase
        .from("daily_evolutions")
        .update({ addendum: next as unknown as Json } as never)
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(id) });
    },
  });
}

// AT/Aplicador ABA: encerra a evolução com assinatura eletrônica simples
// (autenticado pela sessão) e a envia para validação técnica do supervisor.
// Inicia o contador de 24h via signed_at, como a assinatura comum.
export function useSubmitForTechnicalValidation(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async () => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("daily_evolutions")
        .update({
          professional_signature: true,
          signed_at: new Date().toISOString(),
          validation_status: "pendente_validacao",
        } as never)
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(id) });
    },
  });
}

// Supervisor homologa e assina (certificado A1 local) a evolução do AT.
export function useHomologateEvolution(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (signature: DigitalSignature) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("daily_evolutions")
        .update({
          validation_status: "homologada",
          supervisor_signature: signature as unknown as Json,
          supervisor_signed_at: signature.signed_at,
        } as never)
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(id) });
    },
  });
}

// Fila de homologação: evoluções pendentes de validação técnica atribuídas a
// um supervisor (painel de pendências).
export function useEvolutionsPendingValidation(supervisorId: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["evolutions-pending-validation", clinic?.id, supervisorId],
    enabled: !!clinic?.id && !!supervisorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_evolutions")
        .select("*, patient:patients(name), professional:professionals(name)")
        .eq("clinic_id", clinic!.id)
        .eq("supervisor_id", supervisorId!)
        .eq("validation_status", "pendente_validacao")
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EvolutionRow[];
    },
  });
}

// Supervisores elegíveis (supervisor de AT ou coordenador de Psicologia/ABA).
export function useAtSupervisors() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["at-supervisors", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name, is_at_supervisor, coordinator_specialty")
        .eq("clinic_id", clinic!.id)
        .eq("active", true)
        .or("is_at_supervisor.eq.true,coordinator_specialty.eq.psicologia_aba")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Guias ativas do paciente para vincular à evolução.
export function useActiveAuthorizationsByPatient(patientId: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.authorizations.activeByPatient(clinic?.id, patientId),
    enabled: !!patientId && !!clinic?.id,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("authorizations")
        .select("id, guide_number, procedure_name, specialty, authorized_quantity, used_quantity, expiration_date")
        .eq("clinic_id", clinic!.id)
        .eq("patient_id", patientId!)
        .eq("status", "ativa")
        .gte("expiration_date", today)
        .order("expiration_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Planos do paciente + suas metas (para marcar metas trabalhadas).
export function usePlansWithGoalsByPatient(patientId: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.plans.byPatient(clinic?.id, patientId),
    enabled: !!patientId && !!clinic?.id,
    queryFn: async () => {
      const { data: plans, error } = await supabase
        .from("therapeutic_plans")
        .select("id, title, status")
        .eq("clinic_id", clinic!.id)
        .eq("patient_id", patientId!)
        .neq("status", "encerrado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!plans?.length) return [];

      const ids = plans.map((p) => p.id);
      const { data: goals, error: goalsErr } = await supabase
        .from("therapeutic_goals")
        .select("id, plan_id, description, category, status")
        .in("plan_id", ids);
      if (goalsErr) throw goalsErr;

      return plans.map((p) => ({
        ...p,
        goals: (goals ?? []).filter((g) => g.plan_id === p.id),
      }));
    },
  });
}
