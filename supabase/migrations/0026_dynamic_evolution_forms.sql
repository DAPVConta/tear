-- Correção #12 — Formulários de evolução diária dinâmicos por especialidade.
--
-- 1) Remove definitivamente a especialidade "AT — Integração Sensorial"
--    (at_is). Nenhum registro a utiliza (verificado), então recriamos o enum
--    sem o valor. Os focos de T.O. (Integração Sensorial e AVDs) permanecem.
-- 2) Acrescenta dados estruturados por tipo de formulário (jsonb) e o workflow
--    de homologação técnica das evoluções de Aplicadores ABA / ATs:
--    AT assina (eletrônica simples) -> "pendente_validacao" -> supervisor
--    homologa e assina (certificado A1 local).

-- ── 1) Recria o enum specialty sem at_is ────────────────────────────────────
alter type public.specialty rename to specialty__old;

create type public.specialty as enum (
  'psicologia_aba',
  'fonoaudiologia',
  'terapia_ocupacional_is',
  'terapia_ocupacional_avds',
  'fisioterapia',
  'psicopedagogia',
  'musicoterapia',
  'neuropsicologia',
  'terapia_ocupacional',
  'neuropediatria',
  'psiquiatria',
  'nutricao',
  'psicomotricidade_funcional',
  'psicomotricidade_relacional',
  'aplicador_aba_domiciliar',
  'aplicador_aba_escolar'
);

alter table public.professionals
  alter column specialty type public.specialty using specialty::text::public.specialty;
alter table public.professionals
  alter column coordinator_specialty type public.specialty using coordinator_specialty::text::public.specialty;
alter table public.professional_specialties
  alter column specialty type public.specialty using specialty::text::public.specialty;
alter table public.authorizations
  alter column specialty type public.specialty using specialty::text::public.specialty;

drop type public.specialty__old;

-- ── 2) Workflow de validação técnica (AT -> supervisor) e dados estruturados ─
do $$ begin
  create type public.technical_validation_status as enum (
    'pendente_validacao',
    'homologada'
  );
exception when duplicate_object then null; end $$;

alter table public.daily_evolutions
  -- Payload específico do tipo de formulário (programas ABA + métricas de
  -- ajuda; campos médicos: anamnese/exame/conduta/CID). Mantém as colunas
  -- clínicas existentes para compatibilidade com relatórios/PDF.
  add column if not exists structured_data jsonb,
  -- Supervisor responsável pela homologação (evoluções de AT/Aplicador ABA).
  add column if not exists supervisor_id bigint references public.professionals (id),
  add column if not exists validation_status public.technical_validation_status,
  -- Assinatura digital A1 do supervisor (homologação) — envelope PKCS#7 + meta.
  add column if not exists supervisor_signature jsonb,
  add column if not exists supervisor_signed_at timestamptz;

comment on column public.daily_evolutions.structured_data is
  'Dados estruturados por tipo de formulário (ABA: programas/tentativas/níveis de ajuda; Médico: anamnese/exame/conduta/CID-11/CID-10). Alimenta gráficos de desempenho.';
comment on column public.daily_evolutions.supervisor_id is
  'Profissional supervisor responsável pela homologação técnica (formulário de Aplicador ABA / AT).';

-- ── 3) Trava de 24h: congela também structured_data após a assinatura ────────
-- As colunas de workflow do supervisor (validation_status, supervisor_signature,
-- supervisor_signed_at) ficam FORA da lista protegida: a homologação do
-- supervisor ocorre depois da assinatura do AT.
create or replace function public.enforce_evolution_lock()
returns trigger language plpgsql set search_path = '' as $$
begin
  if ((OLD.signed_at is not null and now() - OLD.signed_at > interval '24 hours')
      or OLD.locked = true) then
    if NEW.patient_id is distinct from OLD.patient_id
       or NEW.professional_id is distinct from OLD.professional_id
       or NEW.session_date is distinct from OLD.session_date
       or NEW.start_time is distinct from OLD.start_time
       or NEW.end_time is distinct from OLD.end_time
       or NEW.session_duration_minutes is distinct from OLD.session_duration_minutes
       or NEW.attendance_type is distinct from OLD.attendance_type
       or NEW.is_private is distinct from OLD.is_private
       or NEW.authorization_id is distinct from OLD.authorization_id
       or NEW.plan_id is distinct from OLD.plan_id
       or NEW.goals_worked is distinct from OLD.goals_worked
       or NEW.skills_worked is distinct from OLD.skills_worked
       or NEW.prompting_level is distinct from OLD.prompting_level
       or NEW.behavioral_notes is distinct from OLD.behavioral_notes
       or NEW.behavioral_intervention is distinct from OLD.behavioral_intervention
       or NEW.session_summary is distinct from OLD.session_summary
       or NEW.evolution_assessment is distinct from OLD.evolution_assessment
       or NEW.next_session_plan is distinct from OLD.next_session_plan
       or NEW.incidents is distinct from OLD.incidents
       or NEW.guardian_presence_validation is distinct from OLD.guardian_presence_validation
       or NEW.guardian_validation_method is distinct from OLD.guardian_validation_method
       or NEW.structured_data is distinct from OLD.structured_data
    then
      raise exception 'Evolução bloqueada após 24h da assinatura. Use um adendo para corrigir.';
    end if;
  end if;
  return NEW;
end;
$$;
