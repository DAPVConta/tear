-- Revisão de segurança — endurecimento de convites, workflow mensal,
-- correções e trilha de auditoria.

-- ============================================================
-- 1) Convites: sem reativação de acesso revogado e sem escalonamento de papel.
-- ============================================================
-- O resgate anterior fazia "on conflict ... do update set active = true",
-- reativando um membro que um admin havia inativado (bypass do bloqueio de
-- acesso da Fase 3) e potencialmente trocando seu papel. Agora:
--   - usuário com acesso DESATIVADO não reativa via convite (precisa do admin);
--   - membro já ativo não tem papel alterado (sem escalonamento);
--   - lock da linha do convite (for update) evita corrida.
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
    -- Membro ativo: convite é redundante; não altera papel.
    return v_inv.clinic_id;
  end if;

  insert into public.clinic_members (clinic_id, user_id, role, joined_at)
  values (v_inv.clinic_id, v_uid, v_inv.role, now());

  return v_inv.clinic_id;
end;
$$;

revoke execute on function public.redeem_clinic_invite(text) from public, anon;
grant execute on function public.redeem_clinic_invite(text) to authenticated;

-- Código com mais entropia (16 hex em vez de 8). Códigos antigos continuam
-- válidos (a busca é por igualdade exata).
create or replace function public.create_clinic_invite(
  p_clinic_id bigint,
  p_role public.member_role default 'therapist',
  p_expires_days integer default 14
)
returns public.clinic_invites
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.clinic_invites;
  v_code text;
begin
  if not public.is_clinic_admin(p_clinic_id) then
    raise exception 'Apenas administradores podem gerar convites.'
      using errcode = '42501';
  end if;
  v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16));
  insert into public.clinic_invites (clinic_id, code, role, created_by, expires_at)
  values (
    p_clinic_id,
    v_code,
    coalesce(p_role, 'therapist'),
    auth.uid(),
    case when p_expires_days is null then null
         else now() + make_interval(days => p_expires_days) end
  )
  returning * into v_row;
  return v_row;
end;
$$;

revoke execute on function public.create_clinic_invite(bigint, public.member_role, integer)
  from public, anon;
grant execute on function public.create_clinic_invite(bigint, public.member_role, integer)
  to authenticated;

-- ============================================================
-- 2) Workflow da evolução mensal: trava server-side.
-- ============================================================
-- Antes, status/reviewer_id/digital_signature eram editáveis por qualquer
-- membro (policy genérica de UPDATE). Agora:
--   - registro 'assinada' é imutável;
--   - aprovar/recusar (transição para aguardando_assinatura / ajustes_
--     solicitados) exige clinic_admin OU o coordenador da especialidade do
--     profissional da evolução (espelha o gate client-side em MonthlyDetail).
create or replace function public.is_monthly_coordinator(p_clinic bigint, p_professional_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.professionals me
    join public.professionals subj on subj.id = p_professional_id
    where me.user_id = auth.uid()
      and me.clinic_id = p_clinic
      and me.active = true
      and me.coordinator_specialty is not null
      and me.coordinator_specialty = subj.specialty
  );
$$;

revoke execute on function public.is_monthly_coordinator(bigint, bigint) from public, anon;
grant execute on function public.is_monthly_coordinator(bigint, bigint) to authenticated;

create or replace function public.enforce_monthly_workflow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Imutável após assinada.
  if OLD.workflow_status = 'assinada' then
    raise exception 'Evolução mensal assinada é imutável.' using errcode = '42501';
  end if;

  -- Transições de aprovação/recusa exigem coordenador ou admin.
  if NEW.workflow_status is distinct from OLD.workflow_status
     and NEW.workflow_status in ('aguardando_assinatura', 'ajustes_solicitados') then
    if not (
      public.is_clinic_admin(OLD.clinic_id)
      or public.is_monthly_coordinator(OLD.clinic_id, OLD.professional_id)
    ) then
      raise exception 'Apenas o coordenador da especialidade ou um administrador pode aprovar/recusar.'
        using errcode = '42501';
    end if;
  end if;

  return NEW;
end;
$$;

revoke execute on function public.enforce_monthly_workflow() from public, anon, authenticated;

create trigger trg_monthly_workflow
  before update on public.monthly_evolutions
  for each row execute function public.enforce_monthly_workflow();

-- ============================================================
-- 3) Correções: editar/excluir só pelo criador (regra de blindagem) ou admin.
-- ============================================================
drop policy if exists corrections_update on public.corrections;
create policy corrections_update on public.corrections for update to authenticated
  using (
    (public.is_clinic_member(clinic_id) and created_by = auth.uid())
    or public.is_clinic_admin(clinic_id)
  )
  with check (
    (public.is_clinic_member(clinic_id) and created_by = auth.uid())
    or public.is_clinic_admin(clinic_id)
  );

drop policy if exists corrections_delete on public.corrections;
create policy corrections_delete on public.corrections for delete to authenticated
  using (
    (public.is_clinic_member(clinic_id) and created_by = auth.uid())
    or public.is_clinic_admin(clinic_id)
    or public.is_platform_admin()
  );

-- ============================================================
-- 4) audit_logs: remover INSERT direto pela API (trilha não-forjável).
-- ============================================================
-- O preenchimento é feito pela trigger log_audit_event (SECURITY DEFINER), que
-- escreve independentemente de RLS. A policy genérica de INSERT permitia a
-- qualquer membro forjar entradas de auditoria — removida.
drop policy if exists audit_logs_insert on public.audit_logs;
