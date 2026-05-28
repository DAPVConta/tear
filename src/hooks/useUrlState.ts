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

  const setValue = useCallback(
    (next: string) => {
      const updated = new URLSearchParams(params);
      if (!next || next === defaultValue) updated.delete(key);
      else updated.set(key, next);
      setParams(updated, { replace: true });
    },
    [key, defaultValue, params, setParams],
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
