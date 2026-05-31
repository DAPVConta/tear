-- Correção #2 — Evolução diária: trava de 24h a partir da ASSINATURA + assinatura
-- digital com certificado ICP-Brasil (A1) local + adendo/nota de retificação.
--
-- 1) O contador de 24h passa a iniciar no timestamp da assinatura (signed_at),
--    e não mais na criação (created_at). Enquanto não houver assinatura, a
--    evolução permanece editável; após 24h da assinatura, só adendo corrige.
-- 2) Coluna digital_signature: metadados da assinatura digital local (algoritmo,
--    hash, titular/CPF e emissor do certificado, PKCS#7 em base64, timestamp).
--    A assinatura é feita 100% no navegador com o certificado do usuário — nenhum
--    dado clínico sai para serviços externos.

alter table public.daily_evolutions
  add column if not exists digital_signature jsonb;

-- Trava agora ancorada em signed_at (assinatura/finalização). As colunas
-- addendum e digital_signature ficam de fora da lista protegida: adendos e o
-- registro da assinatura são permitidos mesmo com a evolução travada.
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
    then
      raise exception 'Evolução bloqueada após 24h da assinatura. Use um adendo para corrigir.';
    end if;
  end if;
  return NEW;
end;
$$;
