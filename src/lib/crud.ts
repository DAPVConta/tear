import { supabase } from "@/lib/supabase";
import { sanitizeSearch } from "@/lib/search";

// Helpers de CRUD escopados por clínica. Concentram o padrão que se
// repete em todos os módulos: clinic_id + count exact + sanitizeSearch +
// .or(ilike trio) + range + filtros adicionais + embed de relações.
// O cliente fica não-tipado (cast via `as never`) porque o helper é
// genérico sobre tabelas; o `T` da chamada define a forma de retorno.

export type ListResult<T> = { rows: T[]; total: number };

export type OrderConfig = { column: string; ascending: boolean };
export type FilterConfig = {
  column: string;
  op: "eq" | "neq" | "gte" | "lte" | "gt" | "lt" | "in" | "is";
  value: unknown;
};

export type ListConfig = {
  table: string;
  clinicId: number;
  page: number;
  pageSize: number;
  search?: string;
  searchColumns?: string[];
  embed?: string;
  order: OrderConfig;
  filters?: FilterConfig[];
};

type AnyBuilder = {
  eq: (c: string, v: unknown) => AnyBuilder;
  neq: (c: string, v: unknown) => AnyBuilder;
  gte: (c: string, v: unknown) => AnyBuilder;
  lte: (c: string, v: unknown) => AnyBuilder;
  gt: (c: string, v: unknown) => AnyBuilder;
  lt: (c: string, v: unknown) => AnyBuilder;
  in: (c: string, v: unknown) => AnyBuilder;
  is: (c: string, v: unknown) => AnyBuilder;
  order: (c: string, opts: { ascending: boolean }) => AnyBuilder;
  range: (from: number, to: number) => AnyBuilder;
  or: (expr: string) => AnyBuilder;
};

export async function fetchPaginatedList<T>({
  table,
  clinicId,
  page,
  pageSize,
  search,
  searchColumns,
  embed,
  order,
  filters,
}: ListConfig): Promise<ListResult<T>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from(table as never)
    .select(embed ?? "*", { count: "exact" })
    .eq("clinic_id", clinicId)
    .order(order.column, { ascending: order.ascending })
    .range(from, to) as unknown as AnyBuilder;

  for (const f of filters ?? []) {
    q = q[f.op](f.column, f.value);
  }

  const term = search ? sanitizeSearch(search) : "";
  if (term && searchColumns && searchColumns.length > 0) {
    const expr = searchColumns.map((c) => `${c}.ilike.%${term}%`).join(",");
    q = q.or(expr);
  }

  const { data, count, error } = (await q) as unknown as {
    data: unknown[] | null;
    count: number | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as T[], total: count ?? 0 };
}

// Options para seletores (Combobox): registros ativos da clínica, ordenados
// por nome. Usado por usePatientOptions/useProfessionalOptions.
export async function fetchActiveOptions<T>({
  table,
  clinicId,
  columns,
}: {
  table: string;
  clinicId: number;
  columns: string;
}): Promise<T[]> {
  const { data, error } = await supabase
    .from(table as never)
    .select(columns)
    .eq("clinic_id", clinicId)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as T[];
}

export async function fetchRecordById<T>({
  table,
  id,
  clinicId,
  embed,
}: {
  table: string;
  id: number;
  clinicId: number;
  embed?: string;
}): Promise<T | null> {
  const { data, error } = await supabase
    .from(table as never)
    .select(embed ?? "*")
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as T | null;
}

export async function insertRecord<T>({
  table,
  values,
  clinicId,
  createdBy,
}: {
  table: string;
  values: Record<string, unknown>;
  clinicId: number;
  createdBy?: string | null;
}): Promise<T> {
  const payload = {
    ...values,
    clinic_id: clinicId,
    ...(createdBy !== undefined ? { created_by: createdBy } : {}),
  };
  const { data, error } = await supabase
    .from(table as never)
    .insert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as T;
}

export async function updateRecord<T>({
  table,
  id,
  clinicId,
  values,
}: {
  table: string;
  id: number;
  clinicId: number;
  values: Record<string, unknown>;
}): Promise<T> {
  const { data, error } = await supabase
    .from(table as never)
    .update(values as never)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as T;
}

export async function setActive({
  table,
  id,
  clinicId,
  active,
}: {
  table: string;
  id: number;
  clinicId: number;
  active: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from(table as never)
    .update({ active } as never)
    .eq("id", id)
    .eq("clinic_id", clinicId);
  if (error) throw error;
}

export async function deleteRecord({
  table,
  id,
  clinicId,
}: {
  table: string;
  id: number;
  clinicId: number;
}): Promise<void> {
  const { error } = await supabase
    .from(table as never)
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);
  if (error) throw error;
}
