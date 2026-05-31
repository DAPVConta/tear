import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { callRpc } from "@/lib/typedRpc";
import { useClinic } from "@/providers/ClinicProvider";
import type { Enums, Tables } from "@/types/database";

export type MemberRole = Enums<"member_role">;
export type ClinicInvite = Tables<"clinic_invites">;

export type ClinicMember = {
  member_id: number;
  user_id: string;
  name: string | null;
  email: string | null;
  role: MemberRole;
  active: boolean;
  joined_at: string | null;
  invited_at: string;
};

// Lista os membros da clínica (nome/e-mail via RPC SECURITY DEFINER, já que
// profiles_select só expõe o próprio perfil).
export function useClinicMembers() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["clinic-members", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: () =>
      callRpc<ClinicMember[]>("clinic_members_overview", {
        p_clinic_id: clinic!.id,
      }),
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: number;
      role: MemberRole;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("clinic_members")
        .update({ role } as never)
        .eq("id", memberId)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-members"] });
    },
  });
}

export function useSetMemberActive() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async ({
      memberId,
      active,
    }: {
      memberId: number;
      active: boolean;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("clinic_members")
        .update({ active } as never)
        .eq("id", memberId)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-members"] });
    },
  });
}

// --- Convites (Fase 2: link/código) ---

export function useClinicInvites() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["clinic-invites", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_invites")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClinicInvite[];
    },
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: ({
      role,
      expiresDays,
    }: {
      role: MemberRole;
      expiresDays: number | null;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return callRpc<ClinicInvite>("create_clinic_invite", {
        p_clinic_id: clinic.id,
        p_role: role,
        p_expires_days: expiresDays,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-invites"] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (inviteId: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("clinic_invites")
        .update({ active: false } as never)
        .eq("id", inviteId)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-invites"] });
    },
  });
}

// Resgate do código pelo próprio usuário (entrar numa clínica).
export function useRedeemInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      callRpc<number>("redeem_clinic_invite", { p_code: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-clinic"] });
    },
  });
}
