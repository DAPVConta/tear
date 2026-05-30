-- RPC atômica para salvar plano + reconciliar metas.
-- Substitui o fluxo de múltiplos roundtrips do useSavePlan no front,
-- eliminando o risco de estado parcial em falha intermediária.

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
  goal jsonb;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  v_clinic := (p_plan->>'clinic_id')::bigint;

  if not public.is_clinic_member(v_clinic) then
    raise exception 'Sem permissão';
  end if;

  if v_plan_id is null then
    insert into public.therapeutic_plans (
      clinic_id, patient_id, professional_id, title,
      start_date, end_date, frequency, session_duration,
      general_objective, status, created_by
    ) values (
      v_clinic,
      (p_plan->>'patient_id')::bigint,
      (p_plan->>'professional_id')::bigint,
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
      patient_id = (p_plan->>'patient_id')::bigint,
      professional_id = (p_plan->>'professional_id')::bigint,
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
