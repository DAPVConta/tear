-- Assinatura digital via ClickSign na evolução diária.
--
-- Coluna clicksign (jsonb): metadados do envelope criado na ClickSign pela
-- Edge Function clicksign-signature (envelope_id, document_id, signer_id,
-- nome/e-mail do signatário, status pending/signed, timestamps). O token da
-- API (CLICKSIGN_TOKEN) vive apenas nos Secrets do servidor — nunca no front.
--
-- A coluna fica intencionalmente FORA da lista protegida pela trigger
-- enforce_evolution_lock (como addendum e digital_signature): o registro do
-- resultado da assinatura é permitido mesmo com a evolução travada.

alter table public.daily_evolutions
  add column if not exists clicksign jsonb;

comment on column public.daily_evolutions.clicksign is
  'Envelope de assinatura digital ClickSign (id do envelope/documento/signatário, status e timestamps). Gerenciado pela Edge Function clicksign-signature.';
