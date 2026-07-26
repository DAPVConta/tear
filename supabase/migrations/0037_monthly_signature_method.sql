-- Evolução mensal: duas formas de assinar o relatório.
--   certificado — ICP-Brasil A1 (e-CPF), envelope PKCS#7 gravado em
--                 digital_signature. É a assinatura com valor jurídico pleno.
--   digital     — aplica a assinatura digitalizada (rubrica) que o profissional
--                 tem no cadastro; vale como aceite eletrônico registrado.
-- Nos dois casos o relatório vai de 'aguardando_assinatura' para 'assinada'.

create type public.monthly_signature_method as enum ('certificado', 'digital');

alter table public.monthly_evolutions
  add column if not exists signature_method public.monthly_signature_method;

-- Registros já assinados usaram, por definição, o certificado A1.
update public.monthly_evolutions
set signature_method = 'certificado'
where digital_signature is not null and signature_method is null;

-- Blindagem: não dá para "assinar digitalmente" sem rubrica cadastrada — o
-- documento sairia sem nenhuma marca de autoria.
create or replace function public.enforce_monthly_signature_method()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if NEW.signature_method = 'digital'
     and NEW.signature_method is distinct from OLD.signature_method
     and not exists (
       select 1
       from public.professionals p
       where p.id = NEW.professional_id
         and p.signature_path is not null
     )
  then
    raise exception 'O profissional responsável não tem assinatura digitalizada no cadastro.';
  end if;
  return NEW;
end;
$$;

revoke execute on function public.enforce_monthly_signature_method()
  from public, anon, authenticated;

create trigger trg_monthly_signature_method
  before update on public.monthly_evolutions
  for each row execute function public.enforce_monthly_signature_method();
