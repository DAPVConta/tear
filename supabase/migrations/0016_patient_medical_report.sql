-- Correção #5 — Laudo médico do paciente + base para OCR/IA.
-- Campos do laudo (médico assistente, CRM/UF, emissão e validade) e o caminho
-- do arquivo no Storage. A extração automática (OCR/IA via Claude) preenche
-- esses campos, sempre editáveis pelo usuário.

alter table public.patients
  add column if not exists report_path text,
  add column if not exists report_doctor text,
  add column if not exists report_crm text,
  add column if not exists report_issue_date date,
  add column if not exists report_validity_date date;

-- Bucket PRIVADO para laudos (documento sensível de saúde — LGPD). Acesso por
-- URLs assinadas; primeiro segmento da pasta = clinic_id. Leitura/escrita só
-- por membros da clínica.
insert into storage.buckets (id, name, public)
values ('medical-reports', 'medical-reports', false)
on conflict (id) do nothing;

create policy "medical_reports_member_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'medical-reports'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );

create policy "medical_reports_member_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'medical-reports'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );

create policy "medical_reports_member_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'medical-reports'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );
