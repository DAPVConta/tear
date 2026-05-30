// Wrappers para integrações BrasilAPI (gratuita, sem chave).
// Docs: https://brasilapi.com.br/docs

export type CepInfo = {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
};

export async function fetchCep(rawCep: string): Promise<CepInfo | null> {
  const cep = rawCep.replace(/\D/g, "");
  if (cep.length !== 8) return null;
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
  if (!res.ok) return null;
  const data = (await res.json()) as Partial<CepInfo>;
  return {
    cep: data.cep ?? cep,
    state: data.state ?? "",
    city: data.city ?? "",
    neighborhood: data.neighborhood ?? "",
    street: data.street ?? "",
  };
}

export type CnpjInfo = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  email: string | null;
  ddd_telefone_1: string | null;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
};

export async function fetchCnpj(rawCnpj: string): Promise<CnpjInfo | null> {
  const cnpj = rawCnpj.replace(/\D/g, "");
  if (cnpj.length !== 14) return null;
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
  if (!res.ok) return null;
  return (await res.json()) as CnpjInfo;
}
