-- Módulo de Correções (Configurações → Correções)
-- Registro de erros/melhorias reportados pelos usuários da clínica:
-- data, usuário logado, link, imagens (bucket Supabase), descrição e status.

create type correction_status as enum (
  'aberto',
  'em_andamento',
  'resolvido',
  'cancelado'
);

create table public.corrections (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  -- "data" do registro = created_at (preenchido automaticamente).
  link text,
  description text not null,
  -- URLs públicas das imagens anexadas (bucket correction-attachments).
  images text[] not null default '{}',
  status correction_status not null default 'aberto',
  -- usuário logado que abriu a correção (uuid + nome denormalizado para
  -- exibição, já que profiles_select só expõe o próprio perfil).
  created_by uuid references public.profiles(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_corrections_clinic on public.corrections(clinic_id);

create trigger trg_corrections_updated before update on public.corrections
  for each row execute function public.set_updated_at();

-- RLS por clínica: qualquer membro lê e registra; status editável por membro;
-- exclusão por membro ou platform_admin.
alter table public.corrections enable row level security;

create policy corrections_select on public.corrections for select to authenticated
  using (public.is_clinic_member(clinic_id) or public.is_platform_admin());
create policy corrections_insert on public.corrections for insert to authenticated
  with check (public.is_clinic_member(clinic_id));
create policy corrections_update on public.corrections for update to authenticated
  using (public.is_clinic_member(clinic_id))
  with check (public.is_clinic_member(clinic_id));
create policy corrections_delete on public.corrections for delete to authenticated
  using (public.is_clinic_member(clinic_id) or public.is_platform_admin());

-- Auto-rastreamento em audit_logs (mesmo padrão das demais tabelas clínicas).
create trigger audit_corrections after insert or update or delete on public.corrections
  for each row execute function public.log_audit_event();

-- Bucket PRIVADO para anexos de correções (screenshots podem conter dados de
-- paciente — LGPD). O acesso é feito por URLs assinadas de curta duração; o
-- primeiro segmento da pasta = clinic_id. Leitura/escrita só por membros.
insert into storage.buckets (id, name, public)
values ('correction-attachments', 'correction-attachments', false)
on conflict (id) do nothing;

-- Leitura para membros da clínica. Necessária para o INSERT ... RETURNING que
-- o serviço de Storage executa ao subir o arquivo (sem ela, o upload falha com
-- "new row violates row-level security policy"); a exibição usa getPublicUrl.
create policy "correction_attachments_member_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'correction-attachments'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );

create policy "correction_attachments_member_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'correction-attachments'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );

create policy "correction_attachments_member_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'correction-attachments'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );
