-- Módulo Clínicas (parte 2/2) — usa os valores criados na 0033.
-- Escopo: Super Admin (platform_admin) gerencia o cadastro completo das
-- clínicas, a situação operacional (`status`) e os administradores titulares.

-- 1) clinic_owner tem os mesmos poderes administrativos de clinic_admin.
--    Toda a RLS por clínica já passa por is_clinic_admin(), então basta
--    ampliar o helper — nenhuma policy precisa mudar.
create or replace function public.is_clinic_admin(cid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clinic_members
    where user_id = auth.uid() and clinic_id = cid
      and role in ('clinic_admin', 'clinic_owner') and active = true
  );
$$;

revoke execute on function public.is_clinic_admin(bigint) from public, anon;
grant execute on function public.is_clinic_admin(bigint) to authenticated;

-- 2) Overview da plataforma agora expõe a situação operacional e o titular.
--    O tipo de retorno mudou → drop antes do create.
drop function if exists public.platform_clinics_overview();

create function public.platform_clinics_overview()
returns table (
  id bigint,
  name varchar,
  trade_name varchar,
  cnpj varchar,
  email varchar,
  phone varchar,
  city varchar,
  state varchar,
  plan public.clinic_plan,
  plan_status public.clinic_plan_status,
  status public.clinic_status,
  active boolean,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  admin_count bigint,
  member_count bigint,
  patient_count bigint,
  sessions_30d bigint
)
language sql security definer set search_path = public as $$
  select
    c.id, c.name, c.trade_name, c.cnpj, c.email, c.phone, c.city, c.state,
    c.plan, c.plan_status, c.status, c.active, c.created_at,
    owner.name as owner_name,
    owner.email as owner_email,
    (select count(*) from public.clinic_members m
      where m.clinic_id = c.id and m.active
        and m.role in ('clinic_owner', 'clinic_admin')) as admin_count,
    (select count(*) from public.clinic_members m
      where m.clinic_id = c.id and m.active) as member_count,
    (select count(*) from public.patients p
      where p.clinic_id = c.id and p.active) as patient_count,
    (select count(*) from public.daily_evolutions e
      where e.clinic_id = c.id
        and e.session_date >= current_date - interval '30 days') as sessions_30d
  from public.clinics c
  left join lateral (
    select p.name, p.email
      from public.clinic_members m
      join public.profiles p on p.id = m.user_id
     where m.clinic_id = c.id and m.active and m.role = 'clinic_owner'
     order by m.joined_at nulls last, m.id
     limit 1
  ) owner on true
  where public.is_platform_admin()
  order by c.created_at desc;
$$;

revoke execute on function public.platform_clinics_overview() from public, anon;
grant execute on function public.platform_clinics_overview() to authenticated;

-- 3) Administradores de uma clínica (visão do Super Admin). profiles_select já
--    libera leitura de perfis para platform_admin, mas o e-mail canônico vive
--    em auth.users — o RPC junta os dois sem afrouxar policy alguma.
create or replace function public.platform_clinic_members(p_clinic_id bigint)
returns table (
  member_id bigint,
  user_id uuid,
  name text,
  email text,
  role public.member_role,
  active boolean,
  joined_at timestamptz,
  invited_at timestamptz
)
language sql security definer set search_path = public as $$
  select
    m.id, m.user_id,
    coalesce(p.name, split_part(u.email, '@', 1)) as name,
    coalesce(p.email, u.email) as email,
    m.role, m.active, m.joined_at, m.invited_at
  from public.clinic_members m
  left join public.profiles p on p.id = m.user_id
  left join auth.users u on u.id = m.user_id
  where m.clinic_id = p_clinic_id
    and public.is_platform_admin()
  order by
    case m.role when 'clinic_owner' then 0 when 'clinic_admin' then 1 else 2 end,
    m.created_at;
$$;

revoke execute on function public.platform_clinic_members(bigint) from public, anon;
grant execute on function public.platform_clinic_members(bigint) to authenticated;

-- 4) Auditoria da situação operacional: mudanças de `status` já são captadas
--    pela trigger genérica de audit_logs em clinics (pacote 3).
