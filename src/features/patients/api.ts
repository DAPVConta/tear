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

export type Patient = Tables<"patients">;
export const PATIENTS_PAGE_SIZE = 10;

type ListParams = {
  search: string;
  page: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export function usePatients({
  search,
  page,
  sortBy = "name",
  sortDir = "asc",
}: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.patients.list(clinicId, search, page, sortBy, sortDir),
    enabled: !!clinicId,
    queryFn: () =>
      fetchPaginatedList<Patient>({
        table: "patients",
        clinicId: clinicId!,
        page,
        pageSize: PATIENTS_PAGE_SIZE,
        search,
        searchColumns: ["name", "guardian_name", "cpf"],
        order: { column: sortBy, ascending: sortDir === "asc" },
        filters: [{ column: "active", op: "eq", value: true }],
      }),
  });
}

// Opções leves (id + nome) para seletores de paciente em outros módulos.
export function usePatientOptions() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.patients.options(clinicId),
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name")
        .eq("clinic_id", clinicId!)
        .eq("active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePatient(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.patients.byId(id),
    enabled: !!id && !!clinic?.id,
    queryFn: () =>
      fetchRecordById<Patient>({
        table: "patients",
        id: id!,
        clinicId: clinic!.id,
      }),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (
      values: Omit<TablesInsert<"patients">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return insertRecord<Patient>({
        table: "patients",
        values: values as Record<string, unknown>,
        clinicId: clinic.id,
        createdBy: user?.id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.patients.all });
    },
  });
}

export function useUpdatePatient(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (values: TablesUpdate<"patients">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return updateRecord<Patient>({
        table: "patients",
        id,
        clinicId: clinic.id,
        values: values as Record<string, unknown>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.patients.all });
      queryClient.invalidateQueries({ queryKey: keys.patients.byId(id) });
    },
  });
}

export function useDeactivatePatient() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return setActive({
        table: "patients",
        id,
        clinicId: clinic.id,
        active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.patients.all });
    },
  });
}

