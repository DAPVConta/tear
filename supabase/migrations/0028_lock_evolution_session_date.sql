-- Correção #16 — a data da evolução diária deve coincidir com a data atual no
-- momento da criação (sem retroativas nem futuras). Edições continuam podendo
-- ajustar a data (admin/correção via 24h) — a trava é só na inserção.
create or replace function public.enforce_evolution_session_date()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.session_date is distinct from current_date then
    raise exception 'session_date deve ser a data atual (today=% / informado=%)',
      current_date, new.session_date
      using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_evolution_session_date() from public, anon, authenticated;

drop trigger if exists enforce_evolution_session_date on public.daily_evolutions;
create trigger enforce_evolution_session_date
  before insert on public.daily_evolutions
  for each row execute function public.enforce_evolution_session_date();
