-- Pacote 3 — robustez de dados
-- 1) Auto-rastreamento em audit_logs (todas as tabelas clínicas).
-- 2) Lock 24h server-side em daily_evolutions.
-- 3) used_quantity automático na guia ao criar/remover/realocar evolução.
-- 4) Unique constraint paciente+mês+ano em monthly_evolutions.

create or replace function public.log_audit_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_clinic bigint;
  v_record_id bigint;
  v_old jsonb;
  v_new jsonb;
begin
  if (TG_OP = 'DELETE') then
    v_old := to_jsonb(OLD);
    v_record_id := (v_old->>'id')::bigint;
    v_clinic := (v_old->>'clinic_id')::bigint;
  else
    v_new := to_jsonb(NEW);
    v_record_id := (v_new->>'id')::bigint;
    v_clinic := (v_new->>'clinic_id')::bigint;
    if (TG_OP = 'UPDATE') then v_old := to_jsonb(OLD); end if;
  end if;

  insert into public.audit_logs (clinic_id, user_id, action, table_name, record_id, old_values, new_values)
  values (v_clinic, auth.uid(), TG_OP, TG_TABLE_NAME, v_record_id, v_old, v_new);
  return coalesce(NEW, OLD);
end;
$$;

create trigger audit_patients after insert or update or delete on public.patients
  for each row execute function public.log_audit_event();
create trigger audit_professionals after insert or update or delete on public.professionals
  for each row execute function public.log_audit_event();
create trigger audit_authorizations after insert or update or delete on public.authorizations
  for each row execute function public.log_audit_event();
create trigger audit_therapeutic_plans after insert or update or delete on public.therapeutic_plans
  for each row execute function public.log_audit_event();
create trigger audit_therapeutic_goals after insert or update or delete on public.therapeutic_goals
  for each row execute function public.log_audit_event();
create trigger audit_daily_evolutions after insert or update or delete on public.daily_evolutions
  for each row execute function public.log_audit_event();
create trigger audit_monthly_evolutions after insert or update or delete on public.monthly_evolutions
  for each row execute function public.log_audit_event();
create trigger audit_attendance_records after insert or update or delete on public.attendance_records
  for each row execute function public.log_audit_event();

create or replace function public.enforce_evolution_lock()
returns trigger language plpgsql as $$
begin
  if (now() - OLD.created_at > interval '24 hours' or OLD.locked = true) then
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
    then
      raise exception 'Evolução bloqueada após 24h. Use adendo para corrigir.';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_evolution_lock before update on public.daily_evolutions
  for each row execute function public.enforce_evolution_lock();

create or replace function public.bump_authorization_used()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.authorization_id is not null then
      update public.authorizations set used_quantity = used_quantity + 1
        where id = NEW.authorization_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.authorization_id is not null then
      update public.authorizations
        set used_quantity = greatest(used_quantity - 1, 0)
        where id = OLD.authorization_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if OLD.authorization_id is distinct from NEW.authorization_id then
      if OLD.authorization_id is not null then
        update public.authorizations
          set used_quantity = greatest(used_quantity - 1, 0)
          where id = OLD.authorization_id;
      end if;
      if NEW.authorization_id is not null then
        update public.authorizations set used_quantity = used_quantity + 1
          where id = NEW.authorization_id;
      end if;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_bump_auth_used after insert or update or delete on public.daily_evolutions
  for each row execute function public.bump_authorization_used();

alter table public.monthly_evolutions
  add constraint monthly_unique_patient_period unique (patient_id, reference_year, reference_month);
