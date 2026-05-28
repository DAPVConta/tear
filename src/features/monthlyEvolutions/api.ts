import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/providers/ClinicProvider";
import type { Enums, Json, Tables, TablesUpdate } from "@/types/database";
import { buildMonthlySummary } from "./summary";

export type MonthlyEvolution = Tables<"monthly_evolutions">;
export const MONTHLY_PAGE_SIZE = 12;

export type MonthlyRow = MonthlyEvolution & {
  patient: { name: string } | null;
  professional: { name: string } | null;
};

export type GoalProgress = {
  goal_id: number;
  description: string;
  category: string;
  current_progress: number;
  status: string;
};

function monthRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type ListParams = {
  page: number;
  patientId?: number;
  year?: number;
};

export function useMonthlyEvolutions({ page, patientId, year }: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: ["monthly-evolutions", clinicId, page, patientId, year],
    enabled: !!clinicId,
    queryFn: async () => {
      const fromRange = (page - 1) * MONTHLY_PAGE_SIZE;
      const toRange = fromRange + MONTHLY_PAGE_SIZE - 1;
      let q = supabase
        .from("monthly_evolutions")
        .select(
          "*, patient:patients(name), professional:professionals(name)",
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
    queryKey: ["monthly-evolution", id],
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_evolutions")
        .select(
          "*, patient:patients(name), professional:professionals(name)",
        )
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MonthlyRow | null;
    },
  });
}

type GenerateInput = {
  patient_id: number;
  professional_id: number;
  reference_year: number;
  reference_month: number;
};

// Motor de Inteligência: agrega frequência, evoluções e metas para
// gerar a síntese mensal do paciente.
export function useGenerateMonthlyEvolution() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();

  return useMutation({
    mutationFn: async (input: GenerateInput) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { from, to } = monthRange(input.reference_year, input.reference_month);

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
        month: input.reference_month,
        year: input.reference_year,
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
          reference_month: input.reference_month,
          reference_year: input.reference_year,
          total_sessions,
          total_present,
          total_absent,
          goals_progress: goals as unknown as Json,
          generated_summary,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-evolutions"] });
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
      queryClient.invalidateQueries({ queryKey: ["monthly-evolutions"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-evolution", id] });
    },
  });
}

export function useApproveMonthlyEvolution() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("monthly_evolutions")
        .update({ approved: true, approved_at: new Date().toISOString() })
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["monthly-evolutions"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-evolution", id] });
    },
  });
}

export { MONTH_NAMES_PT };
