-- Gestão de Membros — Fase 1: visão dos membros da clínica.
--
-- profiles_select expõe só o próprio perfil; esta RPC (SECURITY DEFINER, gated
-- por is_clinic_member) devolve os membros da clínica do chamador com nome e
-- e-mail, sem afrouxar a policy global de profiles.
create or replace function public.clinic_members_overview(p_clinic_id bigint)
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
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_clinic_member(p_clinic_id) then
    raise exception 'Acesso negado à clínica.' using errcode = '42501';
  end if;
  return query
    select cm.id, cm.user_id, p.name, u.email::text, cm.role,
           cm.active, cm.joined_at, cm.invited_at
    from public.clinic_members cm
    join public.profiles p on p.id = cm.user_id
    left join auth.users u on u.id = cm.user_id
    where cm.clinic_id = p_clinic_id
    order by cm.role, p.name nulls last;
end;
$$;

revoke execute on function public.clinic_members_overview(bigint)
  from public, anon;
grant execute on function public.clinic_members_overview(bigint)
  to authenticated;

-- Auto-rastreamento das mudanças de membros (papel/ativação).
create trigger audit_clinic_members
  after insert or update or delete on public.clinic_members
  for each row execute function public.log_audit_event();
