// Recuperação de senha — leitura do retorno do Supabase Auth na URL.
//
// O e-mail de "esqueci minha senha" leva a `${origin}${RESET_PASSWORD_PATH}`.
// O Supabase entrega o resultado na própria URL: em caso de sucesso, o token
// vem no fragmento (`#access_token=…&type=recovery`) e é consumido pelo
// supabase-js (`detectSessionInUrl`); em caso de falha, vem o par
// `error`/`error_code` (link expirado, já usado, etc.).
//
// Como o client do Supabase limpa o fragmento assim que o processa, guardamos
// um retrato dos parâmetros ANTES de ele existir — este módulo é importado por
// `lib/supabase.ts`, então seu corpo roda antes do `createClient`. Só os campos
// de diagnóstico são retidos: nenhum token entra no retrato.

export const RESET_PASSWORD_PATH = "/redefinir-senha";

// Para onde o Supabase deve devolver o usuário depois de validar o link do
// e-mail. Precisa estar autorizado em Supabase → Authentication → URL
// Configuration → Redirect URLs.
export function passwordResetRedirectUrl(): string {
  return `${window.location.origin}${RESET_PASSWORD_PATH}`;
}

export type AuthRedirectError = {
  code: string;
  description: string;
};

const DIAGNOSTIC_KEYS = ["type", "error", "error_code", "error_description"];

function readRedirectParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.replace(/^#/, "");
  const sources = [
    new URLSearchParams(window.location.search),
    new URLSearchParams(hash),
  ];
  const params: Record<string, string> = {};
  for (const source of sources) {
    for (const key of DIAGNOSTIC_KEYS) {
      const value = source.get(key);
      if (value) params[key] = value;
    }
  }
  return params;
}

const redirectParams = readRedirectParams();

// Mensagens em PT-BR para os motivos que o usuário realmente encontra. O
// fallback usa a descrição do Supabase (em inglês) só quando não conhecemos
// o código.
const ERROR_MESSAGES: Record<string, string> = {
  otp_expired:
    "Este link de redefinição expirou ou já foi utilizado. Peça um novo — cada link vale por uma única redefinição.",
  access_denied:
    "Este link de redefinição não é mais válido. Peça um novo para continuar.",
  invalid_request: "O link de redefinição veio incompleto. Peça um novo.",
};

export function getAuthRedirectError(): AuthRedirectError | null {
  const code = redirectParams.error_code || redirectParams.error;
  if (!code) return null;
  return {
    code,
    description:
      ERROR_MESSAGES[code] ??
      ERROR_MESSAGES[redirectParams.error ?? ""] ??
      redirectParams.error_description ??
      "Não foi possível validar o link de redefinição.",
  };
}

// `true` quando a página foi aberta pelo link do e-mail (com sucesso ou com
// erro) — distingue o acesso legítimo de quem digitou a rota na barra.
export function isPasswordRecoveryRedirect(): boolean {
  return redirectParams.type === "recovery" || getAuthRedirectError() !== null;
}

// Remove tokens e códigos de erro da barra de endereço depois que o Supabase
// já processou o retorno. Evita que um F5 reprocesse (ou exponha) o link.
export function clearAuthRedirectParams(): void {
  if (typeof window === "undefined") return;
  const { origin, pathname } = window.location;
  window.history.replaceState(null, "", `${origin}${pathname}`);
}
