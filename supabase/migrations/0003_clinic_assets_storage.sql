-- Bucket público para logos / assets das clínicas.
insert into storage.buckets (id, name, public)
values ('clinic-assets', 'clinic-assets', true)
on conflict (id) do nothing;

-- Leitura pública (bucket é público; a policy explicita o acesso anônimo).
create policy "clinic_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'clinic-assets');

-- Escrita restrita ao clinic_admin da pasta (primeiro segmento = clinic_id).
create policy "clinic_assets_admin_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clinic-assets'
    and public.is_clinic_admin(((storage.foldername(name))[1])::bigint)
  );

create policy "clinic_assets_admin_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'clinic-assets'
    and public.is_clinic_admin(((storage.foldername(name))[1])::bigint)
  )
  with check (
    bucket_id = 'clinic-assets'
    and public.is_clinic_admin(((storage.foldername(name))[1])::bigint)
  );

create policy "clinic_assets_admin_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'clinic-assets'
    and public.is_clinic_admin(((storage.foldername(name))[1])::bigint)
  );
