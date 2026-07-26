import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { callRpc } from "@/lib/typedRpc";
import { keys } from "@/lib/queryKeys";
import type { Enums, Tables, TablesInsert } from "@/types/database";

export type ClinicStatus = Enums<"clinic_status">;
export type ClinicRecord = Tables<"clinics">;

// Linha do overview da plataforma (RPC platform_clinics_overview).
export type PlatformClinicRow = {
  id: number;
  name: string;
  trade_name: string | null;
  cnpj: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  plan: Enums<"clinic_plan">;
  plan_status: Enums<"clinic_plan_status">;
  status: ClinicStatus;
  active: boolean;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  admin_count: number;
  member_count: number;
  patient_count: number;
  sessions_30d: number;
};

export type PlatformClinicMember = {
  member_id: number;
  user_id: string;
  name: string | null;
  email: string | null;
  role: Enums<"member_role">;
  active: boolean;
  joined_at: string | null;
  invited_at: string;
};

// Situações que mantêm a clínica com acesso liberado. `active` continua sendo
// a chave que a RLS/ClinicProvider consultam; o status é a leitura de negócio.
const STATUS_KEEPS_ACCESS: Record<ClinicStatus, boolean> = {
  em_implantacao: true,
  ativa: true,
  suspensa: false,
  encerrada: false,
};

export function usePlatformClinics() {
  return useQuery({
    queryKey: keys.clinics.list(),
    queryFn: async () => {
      const rows = await callRpc<PlatformClinicRow[]>(
        "platform_clinics_overview",
      );
      // bigint chega como string em alguns clients PostgREST — normaliza.
      return (rows ?? []).map((r) => ({
        ...r,
        admin_count: Number(r.admin_count),
        member_count: Number(r.member_count),
        patient_count: Number(r.patient_count),
        sessions_30d: Number(r.sessions_30d),
      }));
    },
  });
}

export function useClinicRecord(id: number | undefined) {
  return useQuery({
    queryKey: keys.clinics.byId(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ClinicRecord;
    },
  });
}

export type ClinicInput = Omit<
  TablesInsert<"clinics">,
  "id" | "created_at" | "updated_at" | "theme" | "logo_url"
>;

export function useSaveClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: number;
      values: ClinicInput;
    }): Promise<ClinicRecord> => {
      const payload = {
        ...values,
        active: STATUS_KEEPS_ACCESS[values.status ?? "em_implantacao"],
      };
      if (id) {
        const { data, error } = await supabase
          .from("clinics")
          .update(payload)
          .eq("id", id)
          .select("*")
          .single();
        if (error) throw error;
        return data as ClinicRecord;
      }
      const { data, error } = await supabase
        .from("clinics")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as ClinicRecord;
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: keys.clinics.all });
      queryClient.invalidateQueries({ queryKey: keys.clinics.byId(row.id) });
      queryClient.invalidateQueries({ queryKey: keys.currentClinic.all });
    },
  });
}

// Muda apenas a situação operacional (atalho da listagem). Mantém `active`
// coerente com o status para que o bloqueio de acesso siga a regra de negócio.
export function useSetClinicStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ClinicStatus }) => {
      const { error } = await supabase
        .from("clinics")
        .update({ status, active: STATUS_KEEPS_ACCESS[status] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.clinics.all });
      queryClient.invalidateQueries({ queryKey: keys.clinics.byId(id) });
      queryClient.invalidateQueries({ queryKey: keys.currentClinic.all });
    },
  });
}

export function useUpdateClinicPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      plan,
      plan_status,
    }: {
      id: number;
      plan: Enums<"clinic_plan">;
      plan_status: Enums<"clinic_plan_status">;
    }) => {
      const { error } = await supabase
        .from("clinics")
        .update({ plan, plan_status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.clinics.all });
    },
  });
}

// --- Administradores da clínica (visão do Super Admin) --------------------

export function useClinicAdmins(clinicId: number | undefined) {
  return useQuery({
    queryKey: keys.clinics.members(clinicId),
    enabled: !!clinicId,
    queryFn: () =>
      callRpc<PlatformClinicMember[]>("platform_clinic_members", {
        p_clinic_id: clinicId!,
      }),
  });
}

export type CreateClinicAdminResult = {
  userId: string;
  email: string;
  created: boolean;
  // Senha temporária devolvida UMA vez pela Edge Function (nunca persistida).
  password: string | null;
  role: Enums<"member_role">;
};

// A criação do usuário no Supabase Auth exige service role → Edge Function.
export function useCreateClinicAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      clinicId: number;
      name: string;
      email: string;
      password?: string;
      role?: "clinic_owner" | "clinic_admin";
    }): Promise<CreateClinicAdminResult> => {
      const { data, error } = await supabase.functions.invoke(
        "clinic-admin-user",
        { body: { action: "create", ...input } },
      );
      if (error) throw new Error(await readFunctionError(error, data));
      return data as CreateClinicAdminResult;
    },
    onSuccess: (_d, { clinicId }) => {
      queryClient.invalidateQueries({ queryKey: keys.clinics.members(clinicId) });
      queryClient.invalidateQueries({ queryKey: keys.clinics.all });
    },
  });
}

export function useResetClinicAdminPassword() {
  return useMutation({
    mutationFn: async (input: {
      clinicId: number;
      userId: string;
      password?: string;
    }): Promise<{ userId: string; password: string }> => {
      const { data, error } = await supabase.functions.invoke(
        "clinic-admin-user",
        { body: { action: "reset_password", ...input } },
      );
      if (error) throw new Error(await readFunctionError(error, data));
      return data as { userId: string; password: string };
    },
  });
}

export function useSetClinicMemberActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      active,
    }: {
      clinicId: number;
      memberId: number;
      active: boolean;
    }) => {
      const { error } = await supabase
        .from("clinic_members")
        .update({ active })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: (_d, { clinicId }) => {
      queryClient.invalidateQueries({ queryKey: keys.clinics.members(clinicId) });
      queryClient.invalidateQueries({ queryKey: keys.clinics.all });
    },
  });
}

// `functions.invoke` embrulha o erro HTTP; o corpo traz a mensagem amigável.
async function readFunctionError(
  error: unknown,
  data: unknown,
): Promise<string> {
  const fromData = (data as { error?: string } | null)?.error;
  if (fromData) return fromData;
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.text === "function") {
    try {
      const body = await ctx.text();
      const parsed = JSON.parse(body) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      // resposta sem corpo JSON — cai na mensagem genérica
    }
  }
  return error instanceof Error ? error.message : "Falha na operação";
}
