import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sanitizeSearch } from "@/lib/search";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, Enums } from "@/types/database";

export type TherapeuticPlan = Tables<"therapeutic_plans">;
export type TherapeuticGoal = Tables<"therapeutic_goals">;
export const PLANS_PAGE_SIZE = 10;

export type PlanRow = TherapeuticPlan & {
  patient: { name: string } | null;
  professional: { name: string } | null;
};

export type GoalInput = {
  id?: number;
  description: string;
  category: string;
  target_criteria: string;
  current_progress: number;
  status: Enums<"goal_status">;
};

type ListParams = { search: string; page: number };

export function useTherapeuticPlans({ search, page }: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: ["plans", clinicId, search, page],
    enabled: !!clinicId,
    queryFn: async () => {
      const from = (page - 1) * PLANS_PAGE_SIZE;
      const to = from + PLANS_PAGE_SIZE - 1;

      let query = supabase
        .from("therapeutic_plans")
        .select(
          "*, patient:patients(name), professional:professionals(name)",
          { count: "exact" },
        )
        .eq("clinic_id", clinicId!)
        .order("created_at", { ascending: false })
        .range(from, to);

      const term = sanitizeSearch(search);
      if (term) query = query.ilike("title", `%${term}%`);

      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as PlanRow[], total: count ?? 0 };
    },
  });
}

export function usePlanWithGoals(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["plan", id],
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data: plan, error } = await supabase
        .from("therapeutic_plans")
        .select("*")
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      if (!plan) return null;

      const { data: goals, error: goalsError } = await supabase
        .from("therapeutic_goals")
        .select("*")
        .eq("plan_id", id!)
        .order("id", { ascending: true });
      if (goalsError) throw goalsError;

      return { plan, goals: goals ?? [] };
    },
  });
}

type SaveInput = {
  planId?: number;
  plan: {
    patient_id: number;
    professional_id: number;
    title: string;
    start_date: string;
    end_date: string | null;
    frequency: string;
    session_duration: number;
    general_objective: string;
    status: Enums<"plan_status">;
  };
  goals: GoalInput[];
  deletedGoalIds: number[];
};

export function useSavePlan() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();

  return useMutation({
    mutationFn: async ({ planId, plan, goals, deletedGoalIds }: SaveInput) => {
      if (!clinic?.id) throw new Error("Clínica não definida");

      // RPC atômica (transação no Postgres) — substitui o sequencial
      // create/update + delete + update[] + insert do front, eliminando
      // o risco de estado parcial em falha intermediária.
      const { data, error } = await supabase.rpc(
        "save_plan_with_goals" as never,
        {
          p_plan_id: planId ?? null,
          p_plan: { ...plan, clinic_id: clinic.id },
          p_goals: goals,
          p_deleted_goal_ids: deletedGoalIds,
        } as never,
      );
      if (error) throw error;
      return (data as unknown as number) ?? planId ?? null;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      if (id) queryClient.invalidateQueries({ queryKey: ["plan", id] });
    },
  });
}

export function useSetPlanStatus() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: Enums<"plan_status">;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("therapeutic_plans")
        .update({ status })
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}
