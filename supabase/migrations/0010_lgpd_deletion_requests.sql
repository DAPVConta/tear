-- LGPD Art. 18 — direito ao apagamento e portabilidade.
create type deletion_request_status as enum ('pending', 'processed', 'denied');

create table public.data_deletion_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_email text not null,
  reason text,
  status deletion_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null,
  notes text,
  unique (user_id, status)
);

create index idx_deletion_requests_status on public.data_deletion_requests(status);

alter table public.data_deletion_requests enable row level security;

create policy "deletion_requests_select_own"
  on public.data_deletion_requests for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

create policy "deletion_requests_insert_own"
  on public.data_deletion_requests for insert to authenticated
  with check (user_id = auth.uid());

create policy "deletion_requests_update_admin"
  on public.data_deletion_requests for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.request_my_data_deletion(p_reason text default null)
returns public.data_deletion_requests
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_row public.data_deletion_requests;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  select email into v_email from public.profiles where id = v_user;
  insert into public.data_deletion_requests (user_id, user_email, reason)
  values (v_user, coalesce(v_email, ''), p_reason)
  returning * into v_row;
  return v_row;
end;
$$;
revoke execute on function public.request_my_data_deletion(text) from public, anon;
grant execute on function public.request_my_data_deletion(text) to authenticated;

create or replace function public.export_my_data()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'clinic_memberships', coalesce(
      (select jsonb_agg(to_jsonb(m)) from public.clinic_members m where m.user_id = auth.uid()),
      '[]'::jsonb
    ),
    'deletion_requests', coalesce(
      (select jsonb_agg(to_jsonb(d)) from public.data_deletion_requests d where d.user_id = auth.uid()),
      '[]'::jsonb
    )
  );
$$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
