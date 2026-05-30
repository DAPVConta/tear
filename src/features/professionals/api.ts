import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import {
  fetchPaginatedList,
  fetchRecordById,
  insertRecord,
  setActive,
  updateRecord,
} from "@/lib/crud";
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
    queryKey: keys.professionals.list(clinicId, search, page, sortBy, sortDir),
    enabled: !!clinicId,
    queryFn: () =>
      fetchPaginatedList<Professional>({
        table: "professionals",
        clinicId: clinicId!,
        page,
        pageSize: PROFESSIONALS_PAGE_SIZE,
        search,
        searchColumns: ["name", "council_number", "cpf"],
        order: { column: sortBy, ascending: sortDir === "asc" },
        filters: [{ column: "active", op: "eq", value: true }],
      }),
  });
}

// Opções leves (id + nome + especialidade) para seletores em outros módulos.
export function useProfessionalOptions() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.professionals.options(clinicId),
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
    queryKey: keys.professionals.byId(id),
    enabled: !!id && !!clinic?.id,
    queryFn: () =>
      fetchRecordById<Professional>({
        table: "professionals",
        id: id!,
        clinicId: clinic!.id,
      }),
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (
      values: Omit<TablesInsert<"professionals">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return insertRecord<Professional>({
        table: "professionals",
        values: values as Record<string, unknown>,
        clinicId: clinic.id,
        createdBy: user?.id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
    },
  });
}

export function useUpdateProfessional(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (values: TablesUpdate<"professionals">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return updateRecord<Professional>({
        table: "professionals",
        id,
        clinicId: clinic.id,
        values: values as Record<string, unknown>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
      queryClient.invalidateQueries({ queryKey: keys.professionals.byId(id) });
    },
  });
}

export function useDeactivateProfessional() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return setActive({
        table: "professionals",
        id,
        clinicId: clinic.id,
        active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
    },
  });
}
