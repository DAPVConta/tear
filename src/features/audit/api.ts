import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import { useClinic } from "@/providers/ClinicProvider";
import type { Tables } from "@/types/database";
import { auditEvolution, summarize, type EvolutionAudit } from "./checklist";

type Range = { from: string; to: string; patientId?: number };

type EvolutionWithRefs = Tables<"daily_evolutions"> & {
  patient: { name: string } | null;
  professional: { name: string } | null;
};

export function useBillingChecklist({ from, to, patientId }: Range) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.audit.checklist(clinicId, from, to, patientId),
    enabled: !!clinicId,
    queryFn: async () => {
      let q = supabase
        .from("daily_evolutions")
        .select("*, patient:patients(name), professional:professionals(name)")
        .eq("clinic_id", clinicId!)
        .gte("session_date", from)
        .lte("session_date", to)
        .order("session_date", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as unknown as EvolutionWithRefs[];
      const audits: (EvolutionAudit & {
        patient: { name: string } | null;
        professional: { name: string } | null;
      })[] = rows.map((e) => ({
        ...auditEvolution(e),
        patient: e.patient,
        professional: e.professional,
      }));
      return { audits, summary: summarize(audits) };
    },
  });
}

export type AuditLogRow = Tables<"audit_logs"> & {
  user: { name: string | null; email: string | null } | null;
};

export function useAuditLogs({
  from,
  to,
  limit = 50,
}: {
  from: string;
  to: string;
  limit?: number;
}) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.audit.logs(clinicId, from, to, limit),
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, user:profiles(name, email)")
        .eq("clinic_id", clinicId!)
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as AuditLogRow[];
    },
  });
}
