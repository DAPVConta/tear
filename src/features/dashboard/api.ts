import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, subDays } from "date-fns";
import { parseDateOnly } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import { useClinic } from "@/providers/ClinicProvider";
import { auditEvolution } from "@/features/audit/checklist";
import type { Enums, Tables } from "@/types/database";

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export function useDashboardMetrics() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;

  return useQuery({
    queryKey: keys.dashboard.metrics(clinicId),
    enabled: !!clinicId,
    queryFn: async () => {
      const now = new Date();
      const weekStart = format(
        startOfWeek(now, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      const monthAgo = format(subDays(now, 30), "yyyy-MM-dd");
      const t = today();

      // Pacientes ativos (count via head: true).
      const patientsP = supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("active", true);

      // Sessões na semana.
      const sessionsP = supabase
        .from("daily_evolutions")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .gte("session_date", weekStart);

      // Guias vigentes (ativas e não vencidas).
      const guidesP = supabase
        .from("authorizations")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("status", "ativa")
        .gte("expiration_date", t);

      // Taxa de presença (últimos 30 dias).
      const totalAttendanceP = supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .gte("session_date", monthAgo);

      const presentAttendanceP = supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .gte("session_date", monthAgo)
        .eq("status", "presente");

      const [patients, sessions, guides, total, present] = await Promise.all([
        patientsP,
        sessionsP,
        guidesP,
        totalAttendanceP,
        presentAttendanceP,
      ]);

      for (const r of [patients, sessions, guides, total, present]) {
        if (r.error) throw r.error;
      }

      const totalCount = total.count ?? 0;
      const presentCount = present.count ?? 0;
      const attendanceRate =
        totalCount === 0 ? null : Math.round((presentCount / totalCount) * 100);

      return {
        patientsActive: patients.count ?? 0,
        sessionsThisWeek: sessions.count ?? 0,
        activeGuides: guides.count ?? 0,
        attendanceRate,
      };
    },
  });
}

export function useSessionsByDay({ days = 14 } = {}) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.dashboard.sessionsByDay(clinicId, days),
    enabled: !!clinicId,
    queryFn: async () => {
      const from = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_evolutions")
        .select("session_date")
        .eq("clinic_id", clinicId!)
        .gte("session_date", from);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        counts.set(format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd"), 0);
      }
      for (const row of data ?? []) {
        const k = row.session_date;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      return [...counts.entries()].map(([date, sessoes]) => ({
        date,
        label: format(parseDateOnly(date), "dd/MM"),
        sessoes,
      }));
    },
  });
}

export type ExpiringAuthorization = {
  id: number;
  guide_number: string;
  expiration_date: string;
  patient: { name: string } | null;
};

export function useExpiringAuthorizations({ withinDays = 30, max = 50 } = {}) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.dashboard.expiringGuides(clinicId, withinDays),
    enabled: !!clinicId,
    queryFn: async () => {
      const t = today();
      const limit = format(
        new Date(Date.now() + withinDays * 86400000),
        "yyyy-MM-dd",
      );
      const { data, error } = await supabase
        .from("authorizations")
        .select("id, guide_number, expiration_date, patient:patients(name)")
        .eq("clinic_id", clinicId!)
        .eq("status", "ativa")
        .gte("expiration_date", t)
        .lte("expiration_date", limit)
        .order("expiration_date", { ascending: true })
        .limit(max);
      if (error) throw error;
      return (data ?? []) as unknown as ExpiringAuthorization[];
    },
  });
}

export type PendingSession = {
  id: number;
  session_date: string;
  patient: { name: string } | null;
  professional: { name: string } | null;
  failed: { id: string; label: string }[];
};

type EvolutionWithRefs = Tables<"daily_evolutions"> & {
  patient: { name: string } | null;
  professional: { name: string } | null;
};

// Sessões (evolução diária) com pendências de faturamento no período — mesmas
// regras de blindagem do módulo de Auditoria (checklist dinâmico).
export function usePendingSessions({ days = 30 } = {}) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.dashboard.pendingSessions(clinicId, days),
    enabled: !!clinicId,
    queryFn: async () => {
      const from = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_evolutions")
        // Desambigua o FK professional_id (há também supervisor_id).
        .select(
          "*, patient:patients(name), professional:professionals!professional_id(name)",
        )
        .eq("clinic_id", clinicId!)
        .gte("session_date", from)
        .order("session_date", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as unknown as EvolutionWithRefs[];
      const pending: PendingSession[] = [];
      for (const e of rows) {
        const audit = auditEvolution(e);
        if (audit.isComplete) continue;
        pending.push({
          id: e.id,
          session_date: e.session_date,
          patient: e.patient,
          professional: e.professional,
          failed: audit.failed.map((r) => ({ id: r.id, label: r.label })),
        });
      }
      return pending;
    },
  });
}

const ASSESSMENT_LABELS: Record<Enums<"evolution_assessment">, string> = {
  evolucao_significativa: "Evol. significativa",
  evolucao_leve: "Evol. leve",
  estavel: "Estável",
  retrocesso_leve: "Retrocesso leve",
  retrocesso_significativo: "Retrocesso signif.",
};

export function useAssessmentDistribution({ days = 30 } = {}) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.dashboard.assessmentDistribution(clinicId, days),
    enabled: !!clinicId,
    queryFn: async () => {
      const from = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_evolutions")
        .select("evolution_assessment")
        .eq("clinic_id", clinicId!)
        .gte("session_date", from);
      if (error) throw error;

      const counts = new Map<Enums<"evolution_assessment">, number>();
      for (const row of data ?? []) {
        const k = row.evolution_assessment;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      return [...counts.entries()].map(([k, value]) => ({
        key: k,
        label: ASSESSMENT_LABELS[k],
        value,
      }));
    },
  });
}
