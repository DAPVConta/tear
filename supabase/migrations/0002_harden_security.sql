-- ============================================================
-- TEAR — Hardening de segurança (advisors)
-- - Trava search_path da trigger function set_updated_at
-- - Restringe EXECUTE das funções SECURITY DEFINER
-- ============================================================

-- set_updated_at: search_path imutável
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user: somente trigger, nunca via API REST
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Helpers de RLS: apenas authenticated (usados nas policies). Sem anon.
revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.is_clinic_member(bigint) from public, anon;
revoke execute on function public.is_clinic_admin(bigint) from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_clinic_member(bigint) to authenticated;
grant execute on function public.is_clinic_admin(bigint) to authenticated;

-- create_clinic: apenas authenticated (onboarding). Sem anon.
revoke execute on function public.create_clinic(varchar, varchar, varchar, varchar, varchar) from public, anon;
grant execute on function public.create_clinic(varchar, varchar, varchar, varchar, varchar) to authenticated;
