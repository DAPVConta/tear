-- Correção #3/#4 — Evolução mensal: workflow de aprovação do coordenador +
-- assinatura digital. (A trava de 22 dias é client-side, no gerador.)

create type public.monthly_status as enum (
  'rascunho',
  'pendente_aprovacao',
  'ajustes_solicitados',
  'aguardando_assinatura',
  'assinada'
);

alter table public.monthly_evolutions
  add column if not exists workflow_status public.monthly_status not null default 'rascunho',
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewer_id bigint references public.professionals(id) on delete set null,
  add column if not exists reviewer_name text,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists digital_signature jsonb,
  add column if not exists signed_at timestamptz;

-- Registros já aprovados entram no fluxo aguardando a assinatura digital.
update public.monthly_evolutions
  set workflow_status = 'aguardando_assinatura'
  where approved = true;
