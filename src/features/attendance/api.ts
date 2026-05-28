import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

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
    queryKey: ["attendances", clinicId, page, patientId, from, to],
    enabled: !!clinicId,
    queryFn: async () => {
      const fromRange = (page - 1) * ATTENDANCE_PAGE_SIZE;
      const toRange = fromRange + ATTENDANCE_PAGE_SIZE - 1;

      let query = supabase
        .from("attendance_records")
        .select(
          "*, patient:patients(name), professional:professionals(name)",
          { count: "exact" },
        )
        .eq("clinic_id", clinicId!)
        .order("session_date", { ascending: false })
        .range(fromRange, toRange);

      if (patientId) query = query.eq("patient_id", patientId);
      if (from) query = query.gte("session_date", from);
      if (to) query = query.lte("session_date", to);

      const { data, count, error } = await query;
      if (error) throw error;
      return {
        rows: (data ?? []) as unknown as AttendanceRow[],
        total: count ?? 0,
      };
    },
  });
}

export function useAttendance(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["attendance", id],
    enabled: !!id && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("id", id!)
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (
      values: Omit<TablesInsert<"attendance_records">, "clinic_id">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("attendance_records")
        .insert({ ...values, clinic_id: clinic.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });
}

export function useUpdateAttendance(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (values: TablesUpdate<"attendance_records">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data, error } = await supabase
        .from("attendance_records")
        .update(values)
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", id] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("attendance_records")
        .delete()
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });
}
