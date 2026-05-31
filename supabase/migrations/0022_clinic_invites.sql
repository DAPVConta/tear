-- Gestão de Membros — Fase 2: convite por link/código.
-- Admin gera um código (com papel + validade); a pessoa, já cadastrada, resgata
-- o código e entra na clínica como membro.

create table public.clinic_invites (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  code text not null unique,
  role public.member_role not null default 'therapist',
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_clinic_invites_clinic on public.clinic_invites(clinic_id);

alter table public.clinic_invites enable row level security;

-- Só o admin da clínica gerencia/visualiza convites.
create policy clinic_invites_select on public.clinic_invites
  for select to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin());
create policy clinic_invites_update on public.clinic_invites
  for update to authenticated
  using (public.is_clinic_admin(clinic_id))
  with check (public.is_clinic_admin(clinic_id));
create policy clinic_invites_delete on public.clinic_invites
  for delete to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin());

create trigger audit_clinic_invites
  after insert or update or delete on public.clinic_invites
  for each row execute function public.log_audit_event();

-- Gera um convite (gated por is_clinic_admin). Retorna a linha (com o código).
create or replace function public.create_clinic_invite(
  p_clinic_id bigint,
  p_role public.member_role default 'therapist',
  p_expires_days integer default 14
)
returns public.clinic_invites
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.clinic_invites;
  v_code text;
begin
  if not public.is_clinic_admin(p_clinic_id) then
    raise exception 'Apenas administradores podem gerar convites.'
      using errcode = '42501';
  end if;
  v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
  insert into public.clinic_invites (clinic_id, code, role, created_by, expires_at)
  values (
    p_clinic_id,
    v_code,
    coalesce(p_role, 'therapist'),
    auth.uid(),
    case when p_expires_days is null then null
         else now() + make_interval(days => p_expires_days) end
  )
  returning * into v_row;
  return v_row;
end;
$$;

-- Resgata um convite: adiciona o usuário autenticado à clínica. Roda como
-- SECURITY DEFINER para ler o convite e inserir o vínculo; o papel vem do
-- convite (não escala papel de quem já é membro).
create or replace function public.redeem_clinic_invite(p_code text)
returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.clinic_invites;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;
  select * into v_inv from public.clinic_invites
    where code = upper(btrim(p_code))
      and active = true
      and (expires_at is null or expires_at > now())
    limit 1;
  if v_inv.id is null then
    raise exception 'Convite inválido ou expirado.';
  end if;
  insert into public.clinic_members (clinic_id, user_id, role, joined_at)
  values (v_inv.clinic_id, v_uid, v_inv.role, now())
  on conflict (clinic_id, user_id) do update set active = true;
  return v_inv.clinic_id;
end;
$$;

revoke execute on function public.create_clinic_invite(bigint, public.member_role, integer)
  from public, anon;
grant execute on function public.create_clinic_invite(bigint, public.member_role, integer)
  to authenticated;
revoke execute on function public.redeem_clinic_invite(text) from public, anon;
grant execute on function public.redeem_clinic_invite(text) to authenticated;
