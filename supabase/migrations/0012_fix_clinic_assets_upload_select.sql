-- Correção do upload de logo (bucket clinic-assets).
--
-- Sintoma: POST /storage/v1/object/clinic-assets/... retornava 400 com
-- "new row violates row-level security policy for table objects", mesmo
-- com o usuário sendo clinic_admin.
--
-- Causa: o serviço de Storage faz INSERT ... RETURNING ao subir um arquivo.
-- Com RLS ativo, o RETURNING exige uma policy de SELECT que torne a linha
-- recém-criada visível. A migração 0004 removeu a policy de leitura por
-- considerá-la redundante (o bucket é público e serve via CDN), mas o CDN
-- público é um caminho distinto do INSERT autenticado — sem a policy SELECT o
-- upload autenticado quebra.
--
-- Restauramos a leitura, mas escopada ao clinic_admin da pasta (1º segmento =
-- clinic_id), igual às policies de insert/update/delete. Isso é suficiente
-- para o RETURNING do upload e evita que um cliente liste arquivos de outras
-- clínicas (isolamento multi-tenant). A exibição pública continua via
-- getPublicUrl/CDN, sem depender desta policy.
create policy "clinic_assets_admin_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'clinic-assets'
    and public.is_clinic_admin(((storage.foldername(name))[1])::bigint)
  );
