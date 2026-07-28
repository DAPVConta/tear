import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { authStorage, purgeLegacyPersistentSession } from "@/lib/authStorage";
// Importado ANTES do createClient: o módulo guarda, no seu corpo, o retrato
// dos parâmetros de retorno do Auth na URL (link de redefinição de senha) —
// que o client apaga ao processá-los. Ver lib/authRecovery.
import "@/lib/authRecovery";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha cedo e clara em vez de erros obscuros em runtime.
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Verifique o .env.",
  );
}

// Sem "lembrar-me", apaga tokens gravados pelo modelo antigo (localStorage)
// antes de criar o client, para que nenhuma credencial sobreviva ao reinício.
purgeLegacyPersistentSession();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Onde o token mora depende da opção "lembrar-me" (ver lib/authStorage):
    // sessionStorage por padrão, localStorage quando o usuário opta por
    // continuar conectado no dispositivo.
    persistSession: true,
    storage: authStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
