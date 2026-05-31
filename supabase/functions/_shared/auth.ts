// Utilitários compartilhados pelas Edge Functions: CORS com allowlist e
// verificação defensiva do JWT no próprio código (além da flag verify_jwt do
// config.toml). Defesa em profundidade: se a flag cair num deploy, a função
// ainda recusa chamadas anônimas.
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

// Origens permitidas: lista separada por vírgula em ALLOWED_ORIGINS. Sem a
// variável configurada, mantém "*" (não quebra o app), mas o ideal em produção
// é restringir ao domínio do front.
function allowedOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function corsHeaders(req: Request): Record<string, string> {
  const list = allowedOrigins();
  const origin = req.headers.get("Origin") ?? "";
  const allow =
    list.length === 0 ? "*" : list.includes(origin) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Valida o JWT presente no header Authorization. Retorna o user autenticado ou
// null. Usa a anon key + o token do chamador (não a service role).
export async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
