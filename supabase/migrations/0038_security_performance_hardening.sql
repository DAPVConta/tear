-- Segurança e performance — padrões distribuídos (ver "Estratégia de segurança
-- e performance" no CLAUDE.md). Três lacunas fechadas server-side:
-- 1) Rate limit por usuário (janela fixa) para Edge Functions e RPCs sensíveis
--    — o Supabase só limita os endpoints do Auth; Functions e PostgREST não têm
--    limite por usuário nativo.
-- 2) Anti-brute-force no resgate de convite (mitiga enumeração de código e
--    reduz sinal de timing attack a ruído).
-- 3) Anti-duplicidade de atendimento server-side: o check de sobreposição do
--    front (hasOverlap) é read-then-act — duas abas salvando ao mesmo tempo
--    passam pelas duas leituras e ambas inserem (race condition clássica).

-- ============================================================
-- 1) Rate limit: contador de janela fixa por chave (ação:usuário).
-- ============================================================
create table public.rate_limit_counters (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0
);

-- RLS ligada e SEM policies: a tabela só é acessada pela função SECURITY
-- DEFINER abaixo — nenhum acesso direto pela API REST.
alter table public.rate_limit_counters enable row level security;

-- Retorna true se a chamada está dentro do limite (e conta a chamada).
-- Janela fixa: simples e atômica (um upsert); a imprecisão na borda da janela
-- (até 2x o limite num intervalo curto) é aceitável para os usos atuais.
create or replace function public.check_rate_limit(
  p_action text,
  p_max_calls integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_count integer;
begin
  if v_uid is null then
    return false;
  end if;
  if coalesce(p_max_calls, 0) < 1 or coalesce(p_window_seconds, 0) < 1
     or p_action is null or length(p_action) > 100 then
    return false;
  end if;

  -- Limpeza oportunista de janelas mortas (evita crescimento sem fim sem
  -- depender de job agendado).
  if random() < 0.01 then
    delete from public.rate_limit_counters
      where window_start < v_now - interval '2 days';
  end if;

  insert into public.rate_limit_counters as c (key, window_start, count)
  values (p_action || ':' || v_uid, v_now, 1)
  on conflict (key) do update set
    count = case when c.window_start <= v_now - make_interval(secs => p_window_seconds)
                 then 1 else c.count + 1 end,
    window_start = case when c.window_start <= v_now - make_interval(secs => p_window_seconds)
                        then v_now else c.window_start end
  returning c.count into v_count;

  return v_count <= p_max_calls;
end;
$$;

-- authenticated pode executar (Edge Functions chamam com o JWT do usuário);
-- chamar diretamente só permite inflar o PRÓPRIO contador — sem ganho.
revoke execute on function public.check_rate_limit(text, integer, integer)
  from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer)
  to authenticated, service_role;

-- ============================================================
-- 2) Convites: anti-brute-force no resgate.
-- ============================================================
-- Mesmo corpo do 0024 (sem reativação de acesso revogado, sem escalonamento,
-- lock da linha) + limite de 10 tentativas por usuário a cada 10 minutos.
-- Códigos legados têm 8 hex (32 bits) — sem limite, a enumeração é viável.
create or replace function public.redeem_clinic_invite(p_code text)
returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.clinic_invites;
  v_uid uuid := auth.uid();
  v_member public.clinic_members;
begin
  if v_uid is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;

  if not public.check_rate_limit('redeem_clinic_invite', 10, 600) then
    raise exception 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      using errcode = '54000';
  end if;

  select * into v_inv from public.clinic_invites
    where code = upper(btrim(p_code))
      and active = true
      and (expires_at is null or expires_at > now())
    limit 1
    for update;
  if v_inv.id is null then
    raise exception 'Convite inválido ou expirado.';
  end if;

  select * into v_member from public.clinic_members
    where clinic_id = v_inv.clinic_id and user_id = v_uid;

  if v_member.id is not null then
    -- Já existe vínculo: não reativa acesso revogado por admin nem escala papel.
    if v_member.active = false then
      raise exception 'Seu acesso a esta clínica foi desativado. Contate o administrador.'
        using errcode = '42501';
    end if;
    -- Membro ativo: convite é redundante; não altera papel (resgate idempotente).
    return v_inv.clinic_id;
  end if;

  insert into public.clinic_members (clinic_id, user_id, role, joined_at)
  values (v_inv.clinic_id, v_uid, v_inv.role, now());

  return v_inv.clinic_id;
end;
$$;

revoke execute on function public.redeem_clinic_invite(text) from public, anon;
grant execute on function public.redeem_clinic_invite(text) to authenticated;

-- ============================================================
-- 3) Anti-duplicidade de atendimento server-side.
-- ============================================================
-- Advisory lock transacional por paciente+data serializa gravações
-- concorrentes: a segunda transação espera a primeira commitar e aí o SELECT
-- enxerga a linha nova (read committed = snapshot por statement). Constraint
-- EXCLUDE seria a alternativa declarativa, mas quebraria a migração se já
-- houver sobreposição legada — a trigger só barra dados novos.
-- SECURITY DEFINER: a checagem precisa enxergar também evoluções sigilosas de
-- Psicologia (0029), invisíveis ao usuário comum pela RLS.
create or replace function public.enforce_evolution_no_overlap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'UPDATE'
     and NEW.patient_id = OLD.patient_id
     and NEW.session_date = OLD.session_date
     and NEW.start_time = OLD.start_time
     and NEW.end_time = OLD.end_time then
    -- Horário não mudou (ex.: adendo, clicksign, workflow): sem checagem.
    return NEW;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('evolution_overlap:' || NEW.patient_id::text || ':' || NEW.session_date::text, 0)
  );

  if exists (
    select 1 from public.daily_evolutions d
    where d.patient_id = NEW.patient_id
      and d.session_date = NEW.session_date
      and d.id is distinct from NEW.id
      and d.start_time < NEW.end_time
      and d.end_time > NEW.start_time
  ) then
    raise exception 'Já existe uma sessão deste paciente em horário sobreposto.'
      using errcode = '23505';
  end if;

  return NEW;
end;
$$;

revoke execute on function public.enforce_evolution_no_overlap()
  from public, anon, authenticated;

create trigger trg_evolution_no_overlap
  before insert or update on public.daily_evolutions
  for each row execute function public.enforce_evolution_no_overlap();
