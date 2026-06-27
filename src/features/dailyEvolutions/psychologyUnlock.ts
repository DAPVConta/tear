import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

// Sigilo CFP/LGPD (correção #17) — gate de reautenticação para acessar as
// evoluções de psicologia. A RLS já esconde os registros para quem não tem
// permissão; este hook adiciona um segundo fator de intenção: o profissional
// autorizado precisa reconfirmar a senha antes de descortinar o conteúdo.
//
// O destravamento vale para a ABA do navegador (sessionStorage por clínica +
// usuário) e é descartado ao trocar de clínica, fechar a aba ou sair.

const KEY_PREFIX = "tear:psy_unlock";

function key(userId: string | undefined, clinicId: number | undefined) {
  if (!userId || !clinicId) return null;
  return `${KEY_PREFIX}:${clinicId}:${userId}`;
}

export function usePsychologyUnlock(clinicId: number | undefined) {
  const { user } = useAuth();
  const storageKey = key(user?.id, clinicId);

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!storageKey) return false;
    try {
      return sessionStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  // Resincroniza se a chave mudar (troca de clínica ou de usuário).
  useEffect(() => {
    if (!storageKey) {
      setUnlocked(false);
      return;
    }
    try {
      setUnlocked(sessionStorage.getItem(storageKey) === "1");
    } catch {
      setUnlocked(false);
    }
  }, [storageKey]);

  const unlock = useCallback(
    async (password: string): Promise<void> => {
      const email = user?.email;
      if (!email) throw new Error("Sessão sem e-mail — refaça login");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {
          // sessionStorage indisponível
        }
      }
      setUnlocked(true);
    },
    [user?.email, storageKey],
  );

  const lock = useCallback(() => {
    if (storageKey) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    setUnlocked(false);
  }, [storageKey]);

  return { unlocked, unlock, lock };
}
