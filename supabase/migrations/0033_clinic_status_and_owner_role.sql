-- Módulo Clínicas (parte 1/2) — novos valores de tipo.
-- Postgres não permite usar um valor de enum recém-adicionado na mesma
-- transação em que ele foi criado; por isso o ADD VALUE fica isolado nesta
-- migração e o uso (funções/RPCs) vai na 0034.

-- 1) Situação operacional da clínica (ciclo de vida do contrato), distinta de
--    `plan_status` (cobrança) e de `active` (chave de acesso).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'clinic_status') then
    create type public.clinic_status as enum (
      'em_implantacao', 'ativa', 'suspensa', 'encerrada'
    );
  end if;
end
$$;

alter table public.clinics
  add column if not exists status public.clinic_status not null default 'em_implantacao';

-- Backfill coerente com o estado atual das clínicas já cadastradas.
update public.clinics
   set status = case when active then 'ativa'::public.clinic_status
                     else 'suspensa'::public.clinic_status end
 where status = 'em_implantacao';

create index if not exists clinics_status_idx on public.clinics (status);

-- 2) Novo papel: administrador titular da clínica, criado pelo Super Admin no
--    módulo Clínicas. Tem os mesmos poderes de clinic_admin (ver 0034) e marca
--    o responsável formal pelo tenant.
alter type public.member_role add value if not exists 'clinic_owner';
