-- Correção #6 — Especialidades multi-seleção + papéis de gestão.
--
-- Novos valores de enum (aplicados fora de transação):
--   terapia_ocupacional, neuropediatria, psiquiatria, nutricao,
--   psicomotricidade_funcional, psicomotricidade_relacional,
--   aplicador_aba_domiciliar, aplicador_aba_escolar, at_is.

-- Multi-especialidade (N:N). professionals.specialty permanece como a
-- especialidade PRINCIPAL (compatibilidade com listas/PDF/seletores).
create table if not exists public.professional_specialties (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  professional_id bigint not null references public.professionals(id) on delete cascade,
  specialty public.specialty not null,
  created_at timestamptz not null default now(),
  unique (professional_id, specialty)
);

create index if not exists idx_prof_specialties_professional
  on public.professional_specialties(professional_id);
create index if not exists idx_prof_specialties_clinic
  on public.professional_specialties(clinic_id);

alter table public.professional_specialties enable row level security;

create policy professional_specialties_select on public.professional_specialties
  for select to authenticated
  using (public.is_clinic_member(clinic_id) or public.is_platform_admin());
create policy professional_specialties_insert on public.professional_specialties
  for insert to authenticated
  with check (public.is_clinic_member(clinic_id));
create policy professional_specialties_delete on public.professional_specialties
  for delete to authenticated
  using (public.is_clinic_member(clinic_id) or public.is_platform_admin());

create trigger audit_professional_specialties
  after insert or update or delete on public.professional_specialties
  for each row execute function public.log_audit_event();

-- Papéis de gestão como campos no profissional (decisão do dono):
-- coordinator_specialty != null → coordenador daquela especialidade (pode
-- aprovar a Evolução Mensal do #3/#4); is_at_supervisor → supervisor de AT.
alter table public.professionals
  add column if not exists coordinator_specialty public.specialty,
  add column if not exists is_at_supervisor boolean not null default false;

-- Backfill: cada profissional já existente passa a ter a sua especialidade
-- principal também na tabela N:N.
insert into public.professional_specialties (clinic_id, professional_id, specialty)
select clinic_id, id, specialty from public.professionals
on conflict (professional_id, specialty) do nothing;
