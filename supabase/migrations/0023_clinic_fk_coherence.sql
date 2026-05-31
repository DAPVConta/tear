-- Revisão de segurança — Coerência de tenant entre clinic_id e FKs.
--
-- Até aqui, as policies de INSERT/UPDATE só validavam is_clinic_member(clinic_id),
-- mas não garantiam que as chaves estrangeiras (patient_id, professional_id,
-- plan_id, authorization_id, evolution_id, reviewer_id) apontassem para
-- registros da MESMA clínica. Um membro da clínica A poderia gravar uma linha
-- com clinic_id = A referenciando um paciente/plano/guia da clínica B
-- (contaminação cross-tenant). Esta migração fecha esse vetor com uma trigger
-- BEFORE INSERT/UPDATE genérica que confere cada FK presente na linha.

create or replace function public.enforce_clinic_fk_coherence()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb := to_jsonb(NEW);
  v_clinic bigint := (v_row->>'clinic_id')::bigint;
  v_fk bigint;
  v_other bigint;
begin
  if v_clinic is null then
    return NEW; -- sem clinic_id na linha: nada a validar aqui.
  end if;

  -- patient_id → patients
  if (v_row->>'patient_id') is not null then
    v_fk := (v_row->>'patient_id')::bigint;
    select clinic_id into v_other from public.patients where id = v_fk;
    if v_other is distinct from v_clinic then
      raise exception 'Incoerência de tenant: patient_id % não pertence à clínica %.',
        v_fk, v_clinic using errcode = '42501';
    end if;
  end if;

  -- professional_id → professionals
  if (v_row->>'professional_id') is not null then
    v_fk := (v_row->>'professional_id')::bigint;
    select clinic_id into v_other from public.professionals where id = v_fk;
    if v_other is distinct from v_clinic then
      raise exception 'Incoerência de tenant: professional_id % não pertence à clínica %.',
        v_fk, v_clinic using errcode = '42501';
    end if;
  end if;

  -- reviewer_id → professionals (evolução mensal)
  if (v_row->>'reviewer_id') is not null then
    v_fk := (v_row->>'reviewer_id')::bigint;
    select clinic_id into v_other from public.professionals where id = v_fk;
    if v_other is distinct from v_clinic then
      raise exception 'Incoerência de tenant: reviewer_id % não pertence à clínica %.',
        v_fk, v_clinic using errcode = '42501';
    end if;
  end if;

  -- plan_id → therapeutic_plans
  if (v_row->>'plan_id') is not null then
    v_fk := (v_row->>'plan_id')::bigint;
    select clinic_id into v_other from public.therapeutic_plans where id = v_fk;
    if v_other is distinct from v_clinic then
      raise exception 'Incoerência de tenant: plan_id % não pertence à clínica %.',
        v_fk, v_clinic using errcode = '42501';
    end if;
  end if;

  -- authorization_id → authorizations
  if (v_row->>'authorization_id') is not null then
    v_fk := (v_row->>'authorization_id')::bigint;
    select clinic_id into v_other from public.authorizations where id = v_fk;
    if v_other is distinct from v_clinic then
      raise exception 'Incoerência de tenant: authorization_id % não pertence à clínica %.',
        v_fk, v_clinic using errcode = '42501';
    end if;
  end if;

  -- evolution_id → daily_evolutions (frequência)
  if (v_row->>'evolution_id') is not null then
    v_fk := (v_row->>'evolution_id')::bigint;
    select clinic_id into v_other from public.daily_evolutions where id = v_fk;
    if v_other is distinct from v_clinic then
      raise exception 'Incoerência de tenant: evolution_id % não pertence à clínica %.',
        v_fk, v_clinic using errcode = '42501';
    end if;
  end if;

  return NEW;
end;
$$;

-- A função de trigger não deve ser executável pela API REST.
revoke execute on function public.enforce_clinic_fk_coherence() from public, anon, authenticated;

create trigger trg_fk_coherence_authorizations
  before insert or update on public.authorizations
  for each row execute function public.enforce_clinic_fk_coherence();
create trigger trg_fk_coherence_therapeutic_plans
  before insert or update on public.therapeutic_plans
  for each row execute function public.enforce_clinic_fk_coherence();
create trigger trg_fk_coherence_therapeutic_goals
  before insert or update on public.therapeutic_goals
  for each row execute function public.enforce_clinic_fk_coherence();
create trigger trg_fk_coherence_daily_evolutions
  before insert or update on public.daily_evolutions
  for each row execute function public.enforce_clinic_fk_coherence();
create trigger trg_fk_coherence_monthly_evolutions
  before insert or update on public.monthly_evolutions
  for each row execute function public.enforce_clinic_fk_coherence();
create trigger trg_fk_coherence_attendance_records
  before insert or update on public.attendance_records
  for each row execute function public.enforce_clinic_fk_coherence();
create trigger trg_fk_coherence_professional_specialties
  before insert or update on public.professional_specialties
  for each row execute function public.enforce_clinic_fk_coherence();

-- Reforço explícito na RPC atômica de plano+metas: além da trigger acima,
-- validar paciente e profissional da mesma clínica dá uma mensagem clara e
-- antecipa a falha antes de qualquer escrita.
create or replace function public.save_plan_with_goals(
  p_plan_id bigint,
  p_plan jsonb,
  p_goals jsonb,
  p_deleted_goal_ids bigint[]
) returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_clinic bigint;
  v_plan_id bigint := p_plan_id;
  v_user uuid := auth.uid();
  v_patient bigint;
  v_professional bigint;
  goal jsonb;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  v_clinic := (p_plan->>'clinic_id')::bigint;

  if not public.is_clinic_member(v_clinic) then
    raise exception 'Sem permissão';
  end if;

  v_patient := (p_plan->>'patient_id')::bigint;
  v_professional := (p_plan->>'professional_id')::bigint;

  if not exists (select 1 from public.patients where id = v_patient and clinic_id = v_clinic) then
    raise exception 'Paciente não pertence à clínica.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.professionals where id = v_professional and clinic_id = v_clinic) then
    raise exception 'Profissional não pertence à clínica.' using errcode = '42501';
  end if;

  if v_plan_id is null then
    insert into public.therapeutic_plans (
      clinic_id, patient_id, professional_id, title,
      start_date, end_date, frequency, session_duration,
      general_objective, status, created_by
    ) values (
      v_clinic,
      v_patient,
      v_professional,
      p_plan->>'title',
      (p_plan->>'start_date')::date,
      nullif(p_plan->>'end_date', '')::date,
      p_plan->>'frequency',
      (p_plan->>'session_duration')::int,
      p_plan->>'general_objective',
      coalesce((p_plan->>'status')::plan_status, 'ativo'),
      v_user
    ) returning id into v_plan_id;
  else
    update public.therapeutic_plans set
      patient_id = v_patient,
      professional_id = v_professional,
      title = p_plan->>'title',
      start_date = (p_plan->>'start_date')::date,
      end_date = nullif(p_plan->>'end_date', '')::date,
      frequency = p_plan->>'frequency',
      session_duration = (p_plan->>'session_duration')::int,
      general_objective = p_plan->>'general_objective',
      status = (p_plan->>'status')::plan_status
    where id = v_plan_id and clinic_id = v_clinic;
  end if;

  if array_length(p_deleted_goal_ids, 1) is not null then
    delete from public.therapeutic_goals
      where id = any(p_deleted_goal_ids) and clinic_id = v_clinic;
  end if;

  for goal in select * from jsonb_array_elements(p_goals) loop
    if (goal->>'id') is not null then
      update public.therapeutic_goals set
        description = goal->>'description',
        category = goal->>'category',
        target_criteria = goal->>'target_criteria',
        current_progress = (goal->>'current_progress')::numeric,
        status = (goal->>'status')::goal_status
      where id = (goal->>'id')::bigint and clinic_id = v_clinic;
    else
      insert into public.therapeutic_goals (
        clinic_id, plan_id, description, category,
        target_criteria, current_progress, status
      ) values (
        v_clinic,
        v_plan_id,
        goal->>'description',
        goal->>'category',
        goal->>'target_criteria',
        (goal->>'current_progress')::numeric,
        (goal->>'status')::goal_status
      );
    end if;
  end loop;

  return v_plan_id;
end;
$$;

revoke execute on function public.save_plan_with_goals(bigint, jsonb, jsonb, bigint[]) from public, anon;
grant execute on function public.save_plan_with_goals(bigint, jsonb, jsonb, bigint[]) to authenticated;
