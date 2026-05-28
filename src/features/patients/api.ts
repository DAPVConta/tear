import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Patient = Tables<"patients">;
export const PATIENTS_PAGE_SIZE = 10;

// Remove caracteres reservados do PostgREST para impedir que o termo de busca
// quebre/reescreva a árvore de filtros do `.or()` (vírgula, parênteses, %, * etc.).
function sanitizeSearch(term: string): string {
  return term.replace(/[,()%*:\\"]/g, " ").trim();
}

type ListParams = { search: string; page: number };

export function usePatients({ search, page }: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: ["patients", clinicId, search, page],
    enabled: !!clinicId,
    queryFn: async () => {
      const from = (page - 1) * PATIENTS_PAGE_SIZE;
      const to = from + PATIENTS_PAGE_SIZE - 1;

      let query = supabase
        .from("patients")
        .select("*", { count: "exact" })
        .eq("clinic_id", clinicId!)
        .eq("active", true)
        .order("name", { ascending: true })
        .range(from, to);

      const term = sanitizeSearch(search);
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,guardian_name.ilike.%${term}%,cpf.ilike.%${term}%`,
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });
}

export function usePatient(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["patient", id],
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      values: Omit<TablesInsert<"patients">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...values, clinic_id: clinic.id, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useUpdatePatient(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (values: TablesUpdate<"patients">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("patients")
        .update(values)
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
    },
  });
}

export function useDeactivatePatient() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("patients")
        .update({ active: false })
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
