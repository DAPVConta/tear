import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { keys } from "@/lib/queryKeys";
import type { Tables } from "@/types/database";
import { useAuth } from "./AuthProvider";

type Clinic = Tables<"clinics">;
type MemberRole = Tables<"clinic_members">["role"];

export type ClinicMembership = { clinic: Clinic; role: MemberRole };

type ClinicContextValue = {
  clinic: Clinic | null;
  role: MemberRole | null;
  /** Todos os vínculos ativos do usuário, na ordem em que ele entrou. */
  memberships: ClinicMembership[];
  /** Troca o tenant ativo; ignora id fora dos vínculos do usuário. */
  switchClinic: (clinicId: number) => void;
  loading: boolean;
  hasClinic: boolean;
  refetch: () => void;
};

const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

// Preferência de tenant por usuário. Guarda só o id da clínica — nenhum dado
// clínico —, e a escolha é sempre validada contra os vínculos vindos do banco.
const STORAGE_PREFIX = "tear:active-clinic:";

function readStoredClinicId(userId: string | undefined): number | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    const id = raw ? Number(raw) : NaN;
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

function writeStoredClinicId(userId: string | undefined, clinicId: number) {
  if (!userId) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, String(clinicId));
  } catch {
    // Storage indisponível (modo privado): a escolha vale só para esta sessão.
  }
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: keys.currentClinic(userId),
    enabled: !!userId,
    queryFn: async (): Promise<ClinicMembership[]> => {
      // O filtro por user_id é obrigatório: a RLS de clinic_members libera
      // TODOS os membros das clínicas do usuário (e a tabela inteira para
      // platform_admin). Sem ele, o vínculo "ativo" seria o de outra pessoa —
      // e, no caso do platform_admin, o de outra clínica.
      const { data, error } = await supabase
        .from("clinic_members")
        .select("role, clinics(*)")
        .eq("user_id", userId!)
        .eq("active", true)
        .order("joined_at", { ascending: true });
      if (error) throw error;

      return (data ?? []).flatMap((member) =>
        member.clinics ? [{ clinic: member.clinics, role: member.role }] : [],
      );
    },
  });

  const memberships = useMemo(() => query.data ?? [], [query.data]);

  const [selectedId, setSelectedId] = useState<number | null>(() =>
    readStoredClinicId(userId),
  );

  // Cada usuário tem sua própria preferência — trocar de conta no mesmo
  // navegador não pode herdar o tenant do anterior.
  useEffect(() => {
    setSelectedId(readStoredClinicId(userId));
  }, [userId]);

  // O primeiro vínculo é o fallback quando não há escolha salva ou quando a
  // clínica escolhida deixou de valer (membro removido/inativado).
  const active =
    memberships.find((m) => m.clinic.id === selectedId) ?? memberships[0] ?? null;

  const switchClinic = useCallback(
    (clinicId: number) => {
      if (!memberships.some((m) => m.clinic.id === clinicId)) return;
      if (clinicId === active?.clinic.id) return;
      writeStoredClinicId(userId, clinicId);
      setSelectedId(clinicId);
      // Caches de lista trazem o clinic_id na key, mas os de detalhe são
      // indexados só pelo id da linha — descartar tudo evita exibir dado do
      // tenant anterior. A própria query de vínculos é preservada.
      queryClient.removeQueries({
        predicate: (q) => q.queryKey[0] !== "current-clinic",
      });
    },
    [memberships, active?.clinic.id, userId],
  );

  const value = useMemo<ClinicContextValue>(
    () => ({
      clinic: active?.clinic ?? null,
      role: active?.role ?? null,
      memberships,
      switchClinic,
      loading: query.isLoading,
      hasClinic: !!active,
      refetch: query.refetch,
    }),
    [active, memberships, switchClinic, query.isLoading, query.refetch],
  );

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
