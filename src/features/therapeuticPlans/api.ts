import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sanitizeSearch } from "@/lib/search";
import { useAuth } from "@/providers/AuthProvider";
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ planId, plan, goals, deletedGoalIds }: SaveInput) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const clinicId = clinic.id;

      // 1. Cria ou atualiza o plano.
      let id = planId;
      if (id) {
        const { error } = await supabase
          .from("therapeutic_plans")
          .update(plan)
          .eq("id", id)
          .eq("clinic_id", clinicId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("therapeutic_plans")
          .insert({ ...plan, clinic_id: clinicId, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      }

      // 2. Remove metas excluídas.
      if (deletedGoalIds.length > 0) {
        const { error } = await supabase
          .from("therapeutic_goals")
          .delete()
          .in("id", deletedGoalIds)
          .eq("clinic_id", clinicId);
        if (error) throw error;
      }

      // 3. Atualiza metas existentes e insere novas.
      const toUpdate = goals.filter((g) => g.id);
      const toInsert = goals.filter((g) => !g.id);

      // Atualizações de metas em paralelo (sem N round-trips sequenciais).
      // Nota: não há transação; falha parcial pode deixar plano salvo com
      // metas parcialmente atualizadas. Mitigar com RPC dedicada quando crítico.
      const updates = await Promise.all(
        toUpdate.map((g) =>
          supabase
            .from("therapeutic_goals")
            .update({
              description: g.description,
              category: g.category,
              target_criteria: g.target_criteria,
              current_progress: g.current_progress,
              status: g.status,
            })
            .eq("id", g.id!)
            .eq("clinic_id", clinicId),
        ),
      );
      const updateError = updates.find((r) => r.error)?.error;
      if (updateError) throw updateError;

      if (toInsert.length > 0) {
        const { error } = await supabase.from("therapeutic_goals").insert(
          toInsert.map((g) => ({
            clinic_id: clinicId,
            plan_id: id!,
            description: g.description,
            category: g.category,
            target_criteria: g.target_criteria,
            current_progress: g.current_progress,
            status: g.status,
          })),
        );
        if (error) throw error;
      }

      return id;
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
