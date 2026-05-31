-- Correção #10 — CID-11 no cadastro de pacientes (compatibilidade CID-10).
-- A OMS adotou o CID-11, mas operadoras e auditorias ainda exigem o CID-10.
-- Guardamos o código CID-11 (principal e secundário) ao lado do CID-10 já
-- existente; o front faz o "De-Para" CID-11 → CID-10 ao selecionar, mantendo
-- ambos coerentes para faturamento.

alter table public.patients
  add column if not exists cid11_primary text,
  add column if not exists cid11_secondary text;

comment on column public.patients.cid11_primary is
  'Código CID-11 principal (OMS). O CID-10 equivalente fica em cid10_primary para compatibilidade com operadoras.';
comment on column public.patients.cid11_secondary is
  'Código CID-11 secundário (opcional).';
