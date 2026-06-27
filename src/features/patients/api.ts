import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import {
  fetchPaginatedList,
  fetchRecordById,
  insertRecord,
  setActive,
  updateRecord,
  type FilterConfig,
} from "@/lib/crud";
import { todayLocalISO } from "@/lib/date";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Patient = Tables<"patients">;
export const PATIENTS_PAGE_SIZE = 10;

export type ReportStatusFilter = "all" | "expired" | "expiring" | "valid" | "missing";

type ListParams = {
  search: string;
  page: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  reportStatus?: ReportStatusFilter;
};

// Filtros server-side por status do laudo (correção #13). Calculados em runtime
// contra a data atual; mantém RLS por clinic_id intocada.
function reportStatusFilters(status: ReportStatusFilter): FilterConfig[] {
  if (status === "all") return [];
  const today = todayLocalISO();
  const in30 = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })();
  if (status === "missing") {
    return [{ column: "report_validity_date", op: "is", value: null }];
  }
  if (status === "expired") {
    return [{ column: "report_validity_date", op: "lt", value: today }];
  }
  if (status === "expiring") {
    return [
      { column: "report_validity_date", op: "gte", value: today },
      { column: "report_validity_date", op: "lte", value: in30 },
    ];
  }
  return [{ column: "report_validity_date", op: "gt", value: in30 }];
}

export function usePatients({
  search,
  page,
  sortBy = "name",
  sortDir = "asc",
  reportStatus = "all",
}: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.patients.list(
      clinicId,
      search,
      page,
      sortBy,
      sortDir,
      reportStatus,
    ),
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
        filters: [
          { column: "active", op: "eq", value: true },
          ...reportStatusFilters(reportStatus),
        ],
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

const MEDICAL_REPORTS_BUCKET = "medical-reports";

// Sobe o laudo no bucket privado (pasta = clinic_id) e devolve o caminho para
// gravar em patients.report_path. A exibição usa URL assinada.
export function useUploadMedicalReport() {
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `${clinic.id}/laudo-${Date.now()}-${rand}.${ext}`;
      const { error } = await supabase.storage
        .from(MEDICAL_REPORTS_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      return path;
    },
  });
}

// URL assinada (1h) para visualizar o laudo de um paciente.
export function useMedicalReportUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["medical-report-url", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(MEDICAL_REPORTS_BUCKET)
        .createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data?.signedUrl ?? null;
    },
  });
}

