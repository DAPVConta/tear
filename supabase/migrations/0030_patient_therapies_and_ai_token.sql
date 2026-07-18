-- Fluxo "Novo paciente com IA" (ChatGPT 4o-mini).
-- 1) Campo Terapias no paciente: lista estruturada de terapias + periodicidade
--    (extraída do laudo pela IA e sempre editável).
-- 2) Token do provedor de IA por clínica (token_gpt), guardado em tabela
--    dedicada com RLS restrita a administradores — nunca exposto a demais
--    membros nem a outros tenants.

-- 1) Terapias recomendadas do paciente ------------------------------------
-- jsonb: array de { "therapy": string, "frequency": string }.
alter table public.patients
  add column if not exists therapies jsonb not null default '[]'::jsonb;

-- 2) Configuração de IA por clínica ----------------------------------------
create table if not exists public.clinic_ai_settings (
  clinic_id bigint primary key references public.clinics(id) on delete cascade,
  openai_token text,
  updated_at timestamptz not null default now()
);

comment on table public.clinic_ai_settings is
  'Configuração de IA por clínica. openai_token (token_gpt) só é lido/escrito por clinic_admin; a Edge Function o acessa via service role.';

create trigger trg_clinic_ai_settings_updated
  before update on public.clinic_ai_settings
  for each row execute function public.set_updated_at();

alter table public.clinic_ai_settings enable row level security;

-- Somente o administrador da clínica (ou platform_admin) lê/gerencia o token.
-- Terapeutas/recepcionistas nunca leem a chave: a extração passa pela Edge
-- Function, que resolve o token no servidor com a service role.
create policy clinic_ai_settings_select on public.clinic_ai_settings
  for select to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin());

create policy clinic_ai_settings_insert on public.clinic_ai_settings
  for insert to authenticated
  with check (public.is_clinic_admin(clinic_id) or public.is_platform_admin());

create policy clinic_ai_settings_update on public.clinic_ai_settings
  for update to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin())
  with check (public.is_clinic_admin(clinic_id) or public.is_platform_admin());

create policy clinic_ai_settings_delete on public.clinic_ai_settings
  for delete to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin());
