import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearStoredSession } from "@/lib/authStorage";
import { SessionTimeoutGuard } from "@/components/session/SessionTimeoutGuard";
import type { Tables } from "@/types/database";

type Profile = Tables<"profiles">;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  // Identidade estável: o guarda de inatividade usa `signOut` como dependência
  // de efeito — recriá-lo a cada render reiniciaria o timer sem parar.
  const signOut = useCallback(async () => {
    // Limpa rascunhos com dado clínico (LGPD) antes de encerrar a sessão —
    // evita que o próximo usuário do mesmo navegador leia conteúdo de
    // paciente persistido em localStorage.
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith("tear:draft:")) localStorage.removeItem(key);
      }
    } catch {
      // localStorage indisponível — segue com o signOut.
    }
    await supabase.auth.signOut();
    // Garante que nenhum token sobre nos dois storages, independentemente da
    // opção "lembrar-me" vigente.
    clearStoredSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signOut,
    }),
    [session, profile, loading, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutGuard />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
