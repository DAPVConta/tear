-- Correção #9 — Frequência: ciência dos pais, detalhamento de falta com
-- anexo (atestado) e regra de "falta passível de cobrança" (tempo hábil).

alter table public.attendance_records
  add column if not exists absence_reason text,
  add column if not exists attachment_path text,
  add column if not exists guardian_ack_method text,
  add column if not exists notified_in_time boolean,
  add column if not exists billable_absence boolean not null default false;

-- Bucket PRIVADO para atestados/comprovantes de falta. Acesso por URL assinada;
-- primeiro segmento da pasta = clinic_id. Leitura/escrita só por membros.
insert into storage.buckets (id, name, public)
values ('attendance-attachments', 'attendance-attachments', false)
on conflict (id) do nothing;

create policy "attendance_attachments_member_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attendance-attachments'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );

create policy "attendance_attachments_member_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attendance-attachments'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );

create policy "attendance_attachments_member_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'attendance-attachments'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );
