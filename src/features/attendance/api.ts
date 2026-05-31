import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import {
  deleteRecord,
  fetchPaginatedList,
  fetchRecordById,
  insertRecord,
  updateRecord,
} from "@/lib/crud";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

const ATTENDANCE_BUCKET = "attendance-attachments";

export type AttendanceRecord = Tables<"attendance_records">;
export const ATTENDANCE_PAGE_SIZE = 15;

export type AttendanceRow = AttendanceRecord & {
  patient: { name: string } | null;
  professional: { name: string } | null;
};

type ListParams = {
  page: number;
  patientId?: number;
  from?: string;
  to?: string;
};

export function useAttendances({ page, patientId, from, to }: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.attendances.list(clinicId, page, patientId, from, to),
    enabled: !!clinicId,
    queryFn: () => {
      const filters: Array<{
        column: string;
        op: "eq" | "neq" | "gte" | "lte" | "in";
        value: unknown;
      }> = [];
      if (patientId) filters.push({ column: "patient_id", op: "eq", value: patientId });
      if (from) filters.push({ column: "session_date", op: "gte", value: from });
      if (to) filters.push({ column: "session_date", op: "lte", value: to });
      return fetchPaginatedList<AttendanceRow>({
        table: "attendance_records",
        clinicId: clinicId!,
        page,
        pageSize: ATTENDANCE_PAGE_SIZE,
        embed: "*, patient:patients(name), professional:professionals(name)",
        order: { column: "session_date", ascending: false },
        filters,
      });
    },
  });
}

export function useAttendance(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.attendances.byId(id),
    enabled: !!id && !!clinic?.id,
    queryFn: () =>
      fetchRecordById<AttendanceRecord>({
        table: "attendance_records",
        id: id!,
        clinicId: clinic!.id,
      }),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (
      values: Omit<TablesInsert<"attendance_records">, "clinic_id">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return insertRecord<AttendanceRecord>({
        table: "attendance_records",
        values: values as Record<string, unknown>,
        clinicId: clinic.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.attendances.all });
    },
  });
}

export function useUpdateAttendance(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (values: TablesUpdate<"attendance_records">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return updateRecord<AttendanceRecord>({
        table: "attendance_records",
        id,
        clinicId: clinic.id,
        values: values as Record<string, unknown>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.attendances.all });
      queryClient.invalidateQueries({ queryKey: keys.attendances.byId(id) });
    },
  });
}

// Sobe o atestado/comprovante no bucket privado (pasta = clinic_id) e devolve
// o caminho para gravar em attendance_records.attachment_path.
export function useUploadAttendanceAttachment() {
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `${clinic.id}/atestado-${Date.now()}-${rand}.${ext}`;
      const { error } = await supabase.storage
        .from(ATTENDANCE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      return path;
    },
  });
}

// URL assinada (1h) para visualizar o atestado anexado.
export function useAttendanceAttachmentUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["attendance-attachment-url", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(ATTENDANCE_BUCKET)
        .createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data?.signedUrl ?? null;
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return deleteRecord({
        table: "attendance_records",
        id,
        clinicId: clinic.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.attendances.all });
    },
  });
}
