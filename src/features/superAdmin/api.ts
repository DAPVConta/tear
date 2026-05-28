import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Enums } from "@/types/database";

export type PlatformClinicRow = {
  id: number;
  name: string;
  cnpj: string;
  plan: Enums<"clinic_plan">;
  plan_status: Enums<"clinic_plan_status">;
  active: boolean;
  created_at: string;
  member_count: number;
  patient_count: number;
  sessions_30d: number;
};

export function usePlatformOverview() {
  return useQuery({
    queryKey: ["platform-overview"],
    queryFn: async () => {
      // RPC com types ainda não regenerados — cast manual.
      const { data, error } = await supabase.rpc(
        "platform_clinics_overview" as never,
      );
      if (error) throw error;
      const rows = (data ?? []) as unknown as PlatformClinicRow[];
      // Normaliza counts (bigint → number-string em JS pelos clients PostgREST).
      return rows.map((r) => ({
        ...r,
        member_count: Number(r.member_count),
        patient_count: Number(r.patient_count),
        sessions_30d: Number(r.sessions_30d),
      }));
    },
  });
}

export function useToggleClinicActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const { error } = await supabase
        .from("clinics")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
    },
  });
}

export function useUpdateClinicPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      plan,
      plan_status,
    }: {
      id: number;
      plan: Enums<"clinic_plan">;
      plan_status: Enums<"clinic_plan_status">;
    }) => {
      const { error } = await supabase
        .from("clinics")
        .update({ plan, plan_status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
    },
  });
}
