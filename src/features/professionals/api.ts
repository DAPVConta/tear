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

export type ProfessionalStatusFilter = "active" | "inactive" | "all";

type ListParams = {
  search: string;
  page: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  status?: ProfessionalStatusFilter;
};

export function useProfessionals({
  search,
  page,
  sortBy = "name",
  sortDir = "asc",
  status = "active",
}: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.professionals.list(clinicId, search, page, sortBy, sortDir, status),
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
        // "all" não filtra; caso contrário, ativos ou inativos. Inativar é
        // soft-delete (preserva histórico de prontuários/evoluções), nunca
        // exclusão.
        filters:
          status === "all"
            ? []
            : [{ column: "active", op: "eq", value: status === "active" }],
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

// Ativa/inativa o profissional (soft-delete reversível). Inativar bloqueia o
// uso operacional (some dos seletores de novos atendimentos/evoluções); o
// histórico permanece intacto. Reativar restaura imediatamente.
export function useSetProfessionalActive() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return setActive({
        table: "professionals",
        id,
        clinicId: clinic.id,
        active,
      });
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
      queryClient.invalidateQueries({ queryKey: keys.professionals.byId(id) });
    },
  });
}
