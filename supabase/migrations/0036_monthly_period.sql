-- Evolução mensal por período.
-- Até aqui o relatório era sempre "mês fechado" (reference_month/reference_year).
-- Agora o mesmo motor atende dois recortes:
--   * mensal  — mês de referência fechado (comportamento atual);
--   * periodo — intervalo livre escolhido pelo profissional (de → até).
-- Em ambos os casos o intervalo fica explícito em period_start/period_end, que
-- passam a ser a fonte única de verdade para agregação, filtros e relatórios.

create type public.monthly_period_type as enum ('mensal', 'periodo');

alter table public.monthly_evolutions
  add column if not exists period_type public.monthly_period_type not null default 'mensal',
  add column if not exists period_start date,
  add column if not exists period_end date;

-- Backfill: registros existentes recebem o intervalo do mês de referência.
update public.monthly_evolutions
set period_start = make_date(reference_year, reference_month, 1),
    period_end = (make_date(reference_year, reference_month, 1)
                  + interval '1 month' - interval '1 day')::date
where period_start is null or period_end is null;

alter table public.monthly_evolutions
  alter column period_start set not null,
  alter column period_end set not null;

alter table public.monthly_evolutions
  add constraint monthly_period_range check (period_end >= period_start);

-- Anti-duplicidade por recorte:
-- a unicidade paciente+mês+ano só vale para o relatório MENSAL; o relatório por
-- período pode se repetir no mesmo mês com intervalos diferentes (e é barrado
-- apenas quando o intervalo é exatamente o mesmo).
alter table public.monthly_evolutions
  drop constraint if exists monthly_unique_patient_period;

create unique index if not exists monthly_unique_patient_month
  on public.monthly_evolutions (patient_id, reference_year, reference_month)
  where period_type = 'mensal';

create unique index if not exists monthly_unique_patient_range
  on public.monthly_evolutions (patient_id, period_start, period_end)
  where period_type = 'periodo';
