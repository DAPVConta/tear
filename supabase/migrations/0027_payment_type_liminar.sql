-- Correção #15 — novo tipo de atendimento "Liminar" (judicial) com número da
-- liminar e operadora vinculada. Reaproveita health_plan_name para a operadora.
alter type public.payment_type add value if not exists 'liminar';

alter table public.patients
  add column if not exists liminar_number varchar(120);

comment on column public.patients.liminar_number is
  'Número do processo / liminar judicial. Obrigatório quando payment_type=''liminar''.';
