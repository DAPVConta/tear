// Controle de sessão do TEAR — onde o token do Supabase Auth é guardado.
//
// Duas políticas, escolhidas pelo usuário na tela de login:
//
//   "lembrar-me" DESLIGADO (padrão)  → `sessionStorage`: a sessão vive enquanto
//     a sessão do NAVEGADOR viver. Recarregar (F5) mantém o login; fechar o
//     navegador/aba exige login novo. É o modo indicado para máquina
//     compartilhada dentro da clínica.
//
//   "lembrar-me" LIGADO → `localStorage`: a sessão sobrevive ao reinício do
//     navegador e é compartilhada entre abas. Indicado para o dispositivo
//     pessoal do profissional.
//
// Em ambos os modos vale o logout automático por inatividade (config/session).

const REMEMBER_KEY = "tear:remember-me";

// supabase-js só precisa destes três métodos.
export type AuthStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

// Fallback em memória para contextos sem Web Storage (modo privado, webview
// restrito, SSR). Nesses casos a sessão vive só enquanto a página estiver
// aberta — o que respeita a regra mais restritiva das duas.
function createMemoryStorage(): AuthStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function probe(store: Storage | undefined): AuthStorage | null {
  try {
    if (!store) return null;
    // Safari em modo privado aceita a referência e falha na escrita.
    const key = "tear:storage-probe";
    store.setItem(key, "1");
    store.removeItem(key);
    return store;
  } catch {
    return null;
  }
}

const hasWindow = typeof window !== "undefined";
const memory = createMemoryStorage();
const local = (hasWindow && probe(window.localStorage)) || memory;
const session = (hasWindow && probe(window.sessionStorage)) || memory;

export function isRememberMeEnabled(): boolean {
  return local.getItem(REMEMBER_KEY) === "1";
}

function activeStore(): AuthStorage {
  return isRememberMeEnabled() ? local : session;
}

function inactiveStore(): AuthStorage {
  return isRememberMeEnabled() ? session : local;
}

// Chaves do supabase-js: `sb-<project-ref>-auth-token[.<n>]`.
const AUTH_KEY_RE = /^sb-.*-auth-token(\.\d+)?$/;

function forEachStorageKey(
  store: Storage | AuthStorage,
  visit: (key: string) => void,
): void {
  // Só as Storage nativas expõem length/key; o fallback em memória não guarda
  // resquício entre sessões, então não precisa varredura.
  const native = store as Storage;
  if (typeof native.length !== "number" || typeof native.key !== "function") {
    return;
  }
  for (let i = native.length - 1; i >= 0; i--) {
    const key = native.key(i);
    if (key) visit(key);
  }
}

// Storage entregue ao client do Supabase. A escolha do destino é resolvida a
// cada chamada, então alternar "lembrar-me" antes do login já direciona a
// sessão nova para o lugar certo.
export const authStorage: AuthStorage = {
  getItem: (key) => activeStore().getItem(key),
  setItem: (key, value) => {
    activeStore().setItem(key, value);
    // Nunca deixa uma cópia velha do token no outro storage.
    inactiveStore().removeItem(key);
  },
  removeItem: (key) => {
    local.removeItem(key);
    session.removeItem(key);
  },
};

// Alterna a política. Migra o token já gravado para o novo destino, de modo que
// marcar/desmarcar a opção com sessão ativa não derrube o usuário.
export function setRememberMe(enabled: boolean): void {
  if (enabled === isRememberMeEnabled()) return;

  const from = activeStore();
  const to = enabled ? local : session;
  const migrating: [string, string][] = [];
  forEachStorageKey(from, (key) => {
    if (!AUTH_KEY_RE.test(key)) return;
    const value = from.getItem(key);
    if (value !== null) migrating.push([key, value]);
  });

  local.setItem(REMEMBER_KEY, enabled ? "1" : "0");

  for (const [key, value] of migrating) {
    to.setItem(key, value);
    from.removeItem(key);
  }
}

// Remove qualquer token persistido, nos dois storages. Usado no logout
// explícito para não deixar credencial na máquina.
export function clearStoredSession(): void {
  for (const store of [local, session]) {
    forEachStorageKey(store, (key) => {
      if (AUTH_KEY_RE.test(key)) store.removeItem(key);
    });
  }
}

// Antes do controle de sessão o token ficava sempre em `localStorage` e
// sobrevivia a reinícios. Com "lembrar-me" desligado esse resquício é
// credencial órfã: apagamos no boot.
export function purgeLegacyPersistentSession(): void {
  if (isRememberMeEnabled()) return;
  forEachStorageKey(local, (key) => {
    if (AUTH_KEY_RE.test(key)) local.removeItem(key);
  });
}
