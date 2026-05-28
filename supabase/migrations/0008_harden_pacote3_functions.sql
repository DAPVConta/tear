-- Hardening pós-Pacote 3:
-- - enforce_evolution_lock com search_path imutável
-- - trigger functions sem EXECUTE pela API REST

create or replace function public.enforce_evolution_lock()
returns trigger language plpgsql set search_path = '' as $$
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

revoke execute on function public.bump_authorization_used() from public, anon, authenticated;
revoke execute on function public.log_audit_event() from public, anon, authenticated;
