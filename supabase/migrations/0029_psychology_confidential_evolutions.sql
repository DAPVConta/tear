-- Correção #17 — sigilo da evolução de Psicologia (CFP / LGPD).
-- A evolução marcada como sigilosa só é visível para:
--   * o profissional psicólogo (psicologia_aba) ativo da clínica
--   * o clinic_admin da clínica
--   * o platform_admin (auditoria global)
-- Demais membros (recepção, médicos, terapeutas de outras áreas) não enxergam
-- sequer a linha. A flag é definida automaticamente por trigger a partir da
-- especialidade do profissional do atendimento — não é editável pela UI.

alter table public.daily_evolutions
  add column if not exists is_confidential boolean not null default false;

create index if not exists daily_evolutions_is_confidential_idx
  on public.daily_evolutions(is_confidential)
  where is_confidential;

-- Determina sigilo a partir da especialidade do profissional do atendimento.
create or replace function public.set_evolution_confidentiality()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  spec public.specialty;
begin
  select p.specialty into spec
    from public.professionals p
   where p.id = new.professional_id;
  new.is_confidential := coalesce(spec = 'psicologia_aba', false);
  return new;
end;
$$;

revoke execute on function public.set_evolution_confidentiality() from public, anon, authenticated;

drop trigger if exists set_evolution_confidentiality on public.daily_evolutions;
create trigger set_evolution_confidentiality
  before insert or update of professional_id on public.daily_evolutions
  for each row execute function public.set_evolution_confidentiality();

-- Backfill — marca como sigilosas as evoluções já existentes cujo profissional
-- é da especialidade psicologia_aba.
update public.daily_evolutions de
   set is_confidential = true
  from public.professionals p
 where de.professional_id = p.id
   and p.specialty = 'psicologia_aba'
   and de.is_confidential = false;

-- Helper RLS: usuário corrente é psicólogo (psicologia_aba) ativo na clínica.
create or replace function public.is_psychologist_in_clinic(target_clinic_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
      from public.professionals p
     where p.user_id = auth.uid()
       and p.clinic_id = target_clinic_id
       and p.active
       and p.specialty = 'psicologia_aba'
  );
$$;

revoke execute on function public.is_psychologist_in_clinic(bigint) from public, anon;
grant execute on function public.is_psychologist_in_clinic(bigint) to authenticated;

-- Reescreve a policy de SELECT incluindo a regra de sigilo. Mantém clinic_admin
-- e platform_admin com acesso pleno.
drop policy if exists daily_evolutions_select on public.daily_evolutions;
create policy daily_evolutions_select
  on public.daily_evolutions
  for select
  using (
    (is_clinic_member(clinic_id) or is_platform_admin())
    and (
      not is_confidential
      or is_clinic_admin(clinic_id)
      or is_platform_admin()
      or is_psychologist_in_clinic(clinic_id)
    )
  );

-- Mantém INSERT/UPDATE/DELETE como antes (já filtram por membership). Sem
-- afrouxamento: a trigger garante que is_confidential reflete a especialidade.
