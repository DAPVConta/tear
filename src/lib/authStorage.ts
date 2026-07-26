// Controle de sessão do TEAR.
//
// Regra do produto: a sessão vive enquanto a sessão do NAVEGADOR viver. Fechou
// o navegador (ou a aba), tem de logar de novo — comportamento esperado de um
// sistema com dado clínico em máquina compartilhada dentro da clínica.
//
// Implementação: o token do Supabase Auth passa a morar em `sessionStorage`
// (escopo aba/janela, apagado pelo próprio navegador ao encerrar) em vez de
// `localStorage` (que sobrevive a reinícios indefinidamente). Recarregar a
// página (F5) NÃO desloga — o refresh token continua na aba.

// Fallback em memória para contextos sem Web Storage (modo restrito, SSR,
// alguns webviews). Nesses casos a sessão vive só enquanto a página estiver
// aberta, o que respeita a mesma regra.
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  } as Storage;
}

function resolveSessionStorage(): Storage {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return createMemoryStorage();
    }
    // Safari em modo privado aceita a referência e falha na escrita.
    const probe = "tear:storage-probe";
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return window.sessionStorage;
  } catch {
    return createMemoryStorage();
  }
}

// Storage usado pelo client do Supabase Auth.
export const browserSessionStorage: Storage = resolveSessionStorage();

// Antes deste controle o token ficava em `localStorage` e sobrevivia a
// reinícios do navegador. Removemos os resquícios no boot para que nenhuma
// credencial antiga continue guardada na máquina — e para que quem estava
// logado seja levado ao login, como a nova regra exige.
export function purgeLegacyPersistentSession(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      // Chaves do supabase-js: `sb-<project-ref>-auth-token[.<n>]`.
      if (key && /^sb-.*-auth-token(\.\d+)?$/.test(key)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage indisponível — nada a limpar.
  }
}
