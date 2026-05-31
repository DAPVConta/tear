// Assinatura digital ICP-Brasil (A1) feita 100% no navegador, com o certificado
// instalado/disponível na máquina do usuário (arquivo .pfx/.p12). Nenhum dado
// clínico nem a chave privada saem do dispositivo — o conteúdo da evolução é
// transformado num hash SHA-256 e assinado localmente, produzindo um envelope
// PKCS#7 (CMS) que comprova autoria e inalterabilidade do registro.
import forge from "node-forge";

export type DigitalSignature = {
  format: "PKCS7";
  algorithm: "SHA256withRSA";
  // Hash SHA-256 (hex) do conteúdo canônico assinado — vincula a assinatura
  // ao texto exato da evolução no momento da finalização.
  content_hash: string;
  // Envelope PKCS#7 destacado (detached) em base64.
  signature: string;
  signer_name: string;
  signer_cpf: string | null;
  certificate_issuer: string;
  certificate_serial: string;
  certificate_valid_from: string;
  certificate_valid_to: string;
  signed_at: string;
};

async function fileToBinaryString(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return binary;
}

// e-CPF da ICP-Brasil costuma trazer o CPF anexado ao CN ("NOME:12345678900").
function extractCpf(commonName: string): string | null {
  const match = commonName.match(/:(\d{11})\b/);
  if (match) {
    const d = match[1];
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return null;
}

function field(
  attrs: { getField(name: string): { value?: string } | null },
  name: string,
): string {
  return attrs.getField(name)?.value ?? "";
}

/**
 * Assina o payload com o certificado A1 (PKCS#12) fornecido pelo usuário.
 * Lança erro amigável se o arquivo/senha forem inválidos.
 */
export async function signWithA1Certificate(
  file: File,
  password: string,
  payload: string,
): Promise<DigitalSignature> {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const der = await fileToBinaryString(file);
    const asn1 = forge.asn1.fromDer(der);
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);
  } catch {
    throw new Error(
      "Não foi possível abrir o certificado. Verifique o arquivo (.pfx/.p12) e a senha.",
    );
  }

  const shrouded = p12.getBags({
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
  })[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  const plain = p12.getBags({ bagType: forge.pki.oids.keyBag })[
    forge.pki.oids.keyBag
  ]?.[0];
  const keyBag = shrouded ?? plain;
  const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[
    forge.pki.oids.certBag
  ]?.[0];

  if (!keyBag?.key || !certBag?.cert) {
    throw new Error(
      "Certificado sem chave privada utilizável. Confirme que é um e-CPF/e-CNPJ A1 válido.",
    );
  }

  const privateKey = keyBag.key;
  const cert = certBag.cert;

  // Hash do conteúdo (para exibição/auditoria).
  const md = forge.md.sha256.create();
  md.update(payload, "utf8");
  const contentHash = md.digest().toHex();

  // Envelope PKCS#7 destacado, assinado com SHA-256.
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(payload, "utf8");
  p7.addCertificate(cert);
  p7.addSigner({
    key: privateKey as forge.pki.rsa.PrivateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toString() },
    ],
  });
  p7.sign({ detached: true });
  const signatureDer = forge.asn1.toDer(p7.toAsn1()).getBytes();

  const commonName = field(cert.subject, "CN");

  return {
    format: "PKCS7",
    algorithm: "SHA256withRSA",
    content_hash: contentHash,
    signature: forge.util.encode64(signatureDer),
    signer_name: commonName.split(":")[0]?.trim() || commonName,
    signer_cpf: extractCpf(commonName),
    certificate_issuer: field(cert.issuer, "CN") || field(cert.issuer, "O"),
    certificate_serial: cert.serialNumber,
    certificate_valid_from: cert.validity.notBefore.toISOString(),
    certificate_valid_to: cert.validity.notAfter.toISOString(),
    signed_at: new Date().toISOString(),
  };
}
