import { useCallback } from "react";
import { useSearchParams, type SetURLSearchParams } from "react-router-dom";

// Acumula as escritas de query params disparadas no MESMO tick (ex.: um filtro
// chama setFrom + resetPage no mesmo handler) e as aplica num ÚNICO
// setSearchParams. Isso é necessário porque o react-router NÃO compõe múltiplas
// chamadas síncronas de setSearchParams: a forma funcional recebe sempre o
// `searchParamsRef.current` (defasado, igual para as duas chamadas), então a
// última sobrescreve a primeira — o filtro de datas "não aplicava". Ao juntar
// todas as escritas pendentes num único updater funcional, elas se compõem
// corretamente sobre o estado mais recente.
let pending: Record<string, string | null> = {};
let scheduled = false;
let latestSetter: SetURLSearchParams | null = null;

function enqueueWrite(
  key: string,
  next: string | null,
  setParams: SetURLSearchParams,
) {
  pending[key] = next; // null = remover a chave
  latestSetter = setParams;
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    const writes = pending;
    const setter = latestSetter;
    pending = {};
    scheduled = false;
    latestSetter = null;
    setter?.(
      (prev) => {
        const updated = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(writes)) {
          if (v === null) updated.delete(k);
          else updated.set(k, v);
        }
        return updated;
      },
      { replace: true },
    );
  });
}

// Persiste um valor de filtro como query param na URL — permite refresh,
// compartilhamento de link e back/forward do navegador respeitando o estado.
export function useUrlState(
  key: string,
  defaultValue: string,
): [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      enqueueWrite(key, !next || next === defaultValue ? null : next, setParams);
    },
    [key, defaultValue, setParams],
  );

  return [value, setValue];
}

export function useUrlNumber(
  key: string,
  defaultValue: number,
): [number, (next: number) => void] {
  const [raw, setRaw] = useUrlState(key, String(defaultValue));
  const value = Number(raw) || defaultValue;
  return [value, (n: number) => setRaw(String(n))];
}
