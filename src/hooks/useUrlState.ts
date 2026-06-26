import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

// Persiste um valor de filtro como query param na URL — permite refresh,
// compartilhamento de link e back/forward do navegador respeitando o estado.
export function useUrlState(
  key: string,
  defaultValue: string,
): [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;

  // Atualizador funcional: lê sempre o estado mais recente (prev) em vez de
  // capturar `params` por closure. Sem isso, dois setters disparados no mesmo
  // handler (ex.: setFrom + resetPage nos filtros) usavam o mesmo `params`
  // defasado e o último sobrescrevia a alteração do primeiro — o filtro de
  // datas não era aplicado.
  const setValue = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (!next || next === defaultValue) updated.delete(key);
          else updated.set(key, next);
          return updated;
        },
        { replace: true },
      );
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
