import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import type { Tables } from "@/types/database";
import { useAuth } from "./AuthProvider";

type Clinic = Tables<"clinics">;
type MemberRole = Tables<"clinic_members">["role"];

type ClinicContextValue = {
  clinic: Clinic | null;
  role: MemberRole | null;
  loading: boolean;
  hasClinic: boolean;
  refetch: () => void;
};

const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: keys.currentClinic(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data: member, error } = await supabase
        .from("clinic_members")
        .select("role, clinic_id")
        .eq("active", true)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!member) return { clinic: null, role: null };

      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", member.clinic_id)
        .maybeSingle();
      if (clinicError) throw clinicError;

      return { clinic, role: member.role };
    },
  });

  const value: ClinicContextValue = {
    clinic: query.data?.clinic ?? null,
    role: query.data?.role ?? null,
    loading: query.isLoading,
    hasClinic: !!query.data?.clinic,
    refetch: query.refetch,
  };

  return (
    <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx)
    throw new Error("useClinic deve ser usado dentro de <ClinicProvider>");
  return ctx;
}
