-- Restringe a criação de clínicas a platform_admin.
-- Antes: qualquer usuário autenticado (self-service no onboarding) podia criar.
-- Agora: apenas Super Admin (platform_role = 'platform_admin'). Quem cria
-- continua virando clinic_admin da nova clínica.
create or replace function public.create_clinic(
  p_name varchar,
  p_cnpj varchar,
  p_email varchar,
  p_phone varchar default null,
  p_trade_name varchar default null
)
returns public.clinics language plpgsql security definer set search_path = public as $$
declare
  v_clinic public.clinics;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  if not public.is_platform_admin() then
    raise exception 'Apenas administradores da plataforma podem criar clínicas';
  end if;

  insert into public.clinics (name, cnpj, email, phone, trade_name, trial_ends_at)
  values (p_name, p_cnpj, p_email, p_phone, p_trade_name, now() + interval '14 days')
  returning * into v_clinic;

  insert into public.clinic_members (clinic_id, user_id, role, joined_at)
  values (v_clinic.id, auth.uid(), 'clinic_admin', now());

  return v_clinic;
end;
$$;
