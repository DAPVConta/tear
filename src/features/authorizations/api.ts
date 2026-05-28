import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sanitizeSearch } from "@/lib/search";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Authorization = Tables<"authorizations">;
export type AuthorizationRow = Authorization & {
  patient: { name: string } | null;
};
export const AUTHORIZATIONS_PAGE_SIZE = 10;

type ListParams = { search: string; page: number };

export function useAuthorizations({ search, page }: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: ["authorizations", clinicId, search, page],
    enabled: !!clinicId,
    queryFn: async () => {
      const from = (page - 1) * AUTHORIZATIONS_PAGE_SIZE;
      const to = from + AUTHORIZATIONS_PAGE_SIZE - 1;

      let query = supabase
        .from("authorizations")
        .select("*, patient:patients(name)", { count: "exact" })
        .eq("clinic_id", clinicId!)
        .order("expiration_date", { ascending: true })
        .range(from, to);

      const term = sanitizeSearch(search);
      if (term) {
        query = query.or(
          `guide_number.ilike.%${term}%,procedure_name.ilike.%${term}%,procedure_code.ilike.%${term}%`,
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return {
        rows: (data ?? []) as unknown as AuthorizationRow[],
        total: count ?? 0,
      };
    },
  });
}

export function useAuthorization(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["authorization", id],
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authorizations")
        .select("*")
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAuthorization() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      values: Omit<TablesInsert<"authorizations">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("authorizations")
        .insert({ ...values, clinic_id: clinic.id, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorizations"] });
    },
  });
}

export function useUpdateAuthorization(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (values: TablesUpdate<"authorizations">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("authorizations")
        .update(values)
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorizations"] });
      queryClient.invalidateQueries({ queryKey: ["authorization", id] });
    },
  });
}

export function useCancelAuthorization() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("authorizations")
        .update({ status: "cancelada" })
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorizations"] });
    },
  });
}
