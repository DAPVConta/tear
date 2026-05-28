-- RPC para Super Admin: overview agregado de todas as clínicas
-- (count de membros, pacientes, sessões 30d). Gated por is_platform_admin.
create or replace function public.platform_clinics_overview()
returns table (
  id bigint,
  name varchar,
  cnpj varchar,
  plan public.clinic_plan,
  plan_status public.clinic_plan_status,
  active boolean,
  created_at timestamptz,
  member_count bigint,
  patient_count bigint,
  sessions_30d bigint
)
language sql security definer set search_path = public as $$
  select
    c.id, c.name, c.cnpj, c.plan, c.plan_status, c.active, c.created_at,
    (select count(*) from public.clinic_members m
      where m.clinic_id = c.id and m.active) as member_count,
    (select count(*) from public.patients p
      where p.clinic_id = c.id and p.active) as patient_count,
    (select count(*) from public.daily_evolutions e
      where e.clinic_id = c.id
        and e.session_date >= current_date - interval '30 days') as sessions_30d
  from public.clinics c
  where public.is_platform_admin()
  order by c.created_at desc;
$$;

revoke execute on function public.platform_clinics_overview() from public, anon;
grant execute on function public.platform_clinics_overview() to authenticated;
