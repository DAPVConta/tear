-- Bucket público (clinic-assets) já serve URLs sem RLS; uma policy SELECT
-- explícita só ampliaria o escopo permitindo listagem de objetos.
drop policy if exists "clinic_assets_public_read" on storage.objects;
