-- Assinatura digitalizada do profissional.
--
-- Cada profissional pode ter a imagem da própria assinatura (rubrica
-- escaneada/manuscrita). Ela é aplicada automaticamente nos relatórios que o
-- profissional assina — começando por evolução diária e evolução mensal.
--
-- A imagem NÃO substitui a assinatura digital ICP-Brasil (A1) nem a assinatura
-- eletrônica: é o elemento visual do documento. O valor jurídico continua vindo
-- do envelope PKCS#7 (digital_signature) ou do aceite eletrônico registrado.

alter table public.professionals
  add column if not exists signature_path text;

comment on column public.professionals.signature_path is
  'Caminho no bucket professional-signatures da imagem da assinatura digitalizada (clinic_id/arquivo).';

-- Bucket PRIVADO: a rubrica é dado sensível (risco de falsificação). Acesso só
-- por URL assinada / download autenticado; primeiro segmento da pasta =
-- clinic_id, como nos demais buckets do sistema.
insert into storage.buckets (id, name, public)
values ('professional-signatures', 'professional-signatures', false)
on conflict (id) do nothing;

-- Quem pode gerenciar rubricas na clínica: administrador (titular ou admin) ou
-- profissional com conta de acesso vinculada (sobe a própria assinatura).
create or replace function public.can_manage_professional_signature(
  target_clinic_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_clinic_admin(target_clinic_id)
      or exists (
        select 1
          from public.professionals p
         where p.user_id = auth.uid()
           and p.clinic_id = target_clinic_id
           and p.active
      );
$$;

revoke execute on function public.can_manage_professional_signature(bigint)
  from public, anon;
grant execute on function public.can_manage_professional_signature(bigint)
  to authenticated;

-- Leitura: qualquer membro da clínica — necessário para gerar o PDF de uma
-- evolução assinada (coordenador, recepção ao imprimir, etc.).
create policy "professional_signatures_member_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'professional-signatures'
    and public.is_clinic_member(((storage.foldername(name))[1])::bigint)
  );

-- Escrita/remoção: só administradores da clínica ou profissionais com conta de
-- acesso vinculada. Recepção não sobe nem troca rubrica de terceiros.
create policy "professional_signatures_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'professional-signatures'
    and public.can_manage_professional_signature(
      ((storage.foldername(name))[1])::bigint
    )
  );

create policy "professional_signatures_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'professional-signatures'
    and public.can_manage_professional_signature(
      ((storage.foldername(name))[1])::bigint
    )
  )
  with check (
    bucket_id = 'professional-signatures'
    and public.can_manage_professional_signature(
      ((storage.foldername(name))[1])::bigint
    )
  );

create policy "professional_signatures_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'professional-signatures'
    and public.can_manage_professional_signature(
      ((storage.foldername(name))[1])::bigint
    )
  );
