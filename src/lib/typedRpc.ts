import { supabase } from "@/lib/supabase";

// Wrapper único para chamadas RPC ainda não cobertas pelos types gerados
// do Supabase. Encolhe o ponto de cast para um único helper revisado e
// remove a poluição de `as never`/`as unknown as` espalhados pelos hooks.
// Quando regenerarmos `database.ts`, basta deletar este wrapper e usar o
// client tipado diretamente; nenhum call-site precisa mudar.
export async function callRpc<TReturn = unknown>(
  name: string,
  params?: Record<string, unknown>,
): Promise<TReturn> {
  const { data, error } = await supabase.rpc(
    name as never,
    (params ?? undefined) as never,
  );
  if (error) throw error;
  return data as TReturn;
}

// Cast utilitário para a saída de `.select("*, rel:relation(...)")` quando
// os Relationships estão simplificados em database.ts. Centraliza a falha
// de tipo em um único lugar revisável.
export function castRows<T>(rows: unknown[] | null | undefined): T[] {
  return (rows ?? []) as unknown as T[];
}
