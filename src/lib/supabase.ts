import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  browserSessionStorage,
  purgeLegacyPersistentSession,
} from "@/lib/authStorage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha cedo e clara em vez de erros obscuros em runtime.
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Verifique o .env.",
  );
}

// Apaga tokens gravados pelo modelo antigo (localStorage) antes de criar o
// client, para que nenhuma credencial sobreviva ao reinício do navegador.
purgeLegacyPersistentSession();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistência limitada à sessão do navegador: F5 mantém o login, fechar
    // o navegador/aba exige novo login (ver lib/authStorage).
    persistSession: true,
    storage: browserSessionStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
