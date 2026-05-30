import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queryKeys";
import {
  fetchPaginatedList,
  fetchRecordById,
  insertRecord,
  updateRecord,
} from "@/lib/crud";
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
    queryKey: keys.authorizations.list(clinicId, search, page),
    enabled: !!clinicId,
    queryFn: () =>
      fetchPaginatedList<AuthorizationRow>({
        table: "authorizations",
        clinicId: clinicId!,
        page,
        pageSize: AUTHORIZATIONS_PAGE_SIZE,
        search,
        searchColumns: ["guide_number", "procedure_name", "procedure_code"],
        embed: "*, patient:patients(name)",
        order: { column: "expiration_date", ascending: true },
      }),
  });
}

export function useAuthorization(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.authorizations.byId(id),
    enabled: !!id && !!clinic?.id,
    queryFn: () =>
      fetchRecordById<Authorization>({
        table: "authorizations",
        id: id!,
        clinicId: clinic!.id,
      }),
  });
}

export function useCreateAuthorization() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (
      values: Omit<TablesInsert<"authorizations">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return insertRecord<Authorization>({
        table: "authorizations",
        values: values as Record<string, unknown>,
        clinicId: clinic.id,
        createdBy: user?.id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.authorizations.all });
    },
  });
}

export function useUpdateAuthorization(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (values: TablesUpdate<"authorizations">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return updateRecord<Authorization>({
        table: "authorizations",
        id,
        clinicId: clinic.id,
        values: values as Record<string, unknown>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.authorizations.all });
      queryClient.invalidateQueries({ queryKey: keys.authorizations.byId(id) });
    },
  });
}

export function useCancelAuthorization() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return updateRecord<Authorization>({
        table: "authorizations",
        id,
        clinicId: clinic.id,
        values: { status: "cancelada" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.authorizations.all });
    },
  });
}
