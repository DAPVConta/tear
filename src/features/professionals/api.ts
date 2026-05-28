import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sanitizeSearch } from "@/lib/search";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Professional = Tables<"professionals">;
export const PROFESSIONALS_PAGE_SIZE = 10;

type ListParams = {
  search: string;
  page: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export function useProfessionals({
  search,
  page,
  sortBy = "name",
  sortDir = "asc",
}: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: ["professionals", clinicId, search, page, sortBy, sortDir],
    enabled: !!clinicId,
    queryFn: async () => {
      const from = (page - 1) * PROFESSIONALS_PAGE_SIZE;
      const to = from + PROFESSIONALS_PAGE_SIZE - 1;

      let query = supabase
        .from("professionals")
        .select("*", { count: "exact" })
        .eq("clinic_id", clinicId!)
        .eq("active", true)
        .order(sortBy, { ascending: sortDir === "asc" })
        .range(from, to);

      const term = sanitizeSearch(search);
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,council_number.ilike.%${term}%,cpf.ilike.%${term}%`,
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });
}

// Opções leves (id + nome + especialidade) para seletores em outros módulos.
export function useProfessionalOptions() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: ["professional-options", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name, specialty")
        .eq("clinic_id", clinicId!)
        .eq("active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfessional(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["professional", id],
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      values: Omit<TablesInsert<"professionals">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("professionals")
        .insert({ ...values, clinic_id: clinic.id, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}

export function useUpdateProfessional(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (values: TablesUpdate<"professionals">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("professionals")
        .update(values)
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["professional", id] });
    },
  });
}

export function useDeactivateProfessional() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("professionals")
        .update({ active: false })
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}
