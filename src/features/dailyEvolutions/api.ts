import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type DailyEvolution = Tables<"daily_evolutions">;
export const EVOLUTIONS_PAGE_SIZE = 15;

export type EvolutionRow = DailyEvolution & {
  patient: { name: string } | null;
  professional: { name: string } | null;
};

type ListParams = {
  page: number;
  patientId?: number;
  from?: string;
  to?: string;
};

export function useDailyEvolutions({ page, patientId, from, to }: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: ["daily-evolutions", clinicId, page, patientId, from, to],
    enabled: !!clinicId,
    queryFn: async () => {
      const fromRange = (page - 1) * EVOLUTIONS_PAGE_SIZE;
      const toRange = fromRange + EVOLUTIONS_PAGE_SIZE - 1;

      let query = supabase
        .from("daily_evolutions")
        .select(
          "*, patient:patients(name), professional:professionals(name)",
          { count: "exact" },
        )
        .eq("clinic_id", clinicId!)
        .order("session_date", { ascending: false })
        .order("start_time", { ascending: false })
        .range(fromRange, toRange);

      if (patientId) query = query.eq("patient_id", patientId);
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
    queryKey: ["daily-evolution", id],
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

// Bloqueio automático após 24h da criação (regra de blindagem).
const LOCK_AFTER_MS = 24 * 60 * 60 * 1000;
export function isLocked(e: DailyEvolution): boolean {
  if (e.locked) return true;
  return Date.now() - new Date(e.created_at).getTime() > LOCK_AFTER_MS;
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
      queryClient.invalidateQueries({ queryKey: ["daily-evolutions"] });
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
      queryClient.invalidateQueries({ queryKey: ["daily-evolutions"] });
      queryClient.invalidateQueries({ queryKey: ["daily-evolution", id] });
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
      queryClient.invalidateQueries({ queryKey: ["daily-evolutions"] });
      queryClient.invalidateQueries({ queryKey: ["daily-evolution", id] });
    },
  });
}

// Guias ativas do paciente para vincular à evolução.
export function useActiveAuthorizationsByPatient(patientId: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["active-authorizations", clinic?.id, patientId],
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
    queryKey: ["plans-with-goals", clinic?.id, patientId],
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
