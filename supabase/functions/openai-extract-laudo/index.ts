// Edge Function: openai-extract-laudo
// Fluxo "Novo paciente com IA". Analisa o laudo (PDF ou imagem) em DOIS PASSOS
// para máxima fidelidade: (1) transcrição OCR literal do documento inteiro;
// (2) extração estruturada A PARTIR DA TRANSCRIÇÃO, com JSON Schema estrito.
// Modelo padrão gpt-5 (OPENAI_MODEL sobrepõe; fallback gpt-4o se indisponível).
// Devolve: nome do paciente, terapias + periodicidade e metadados do laudo.
//
// O token da OpenAI é POR CLÍNICA (token_gpt), configurado em Configurações →
// IA e guardado em public.clinic_ai_settings (RLS admin-only). A função resolve
// o token no servidor com a service role — o navegador nunca o recebe, e
// terapeutas/recepcionistas conseguem usar a IA sem enxergar a chave.
//
// ATENÇÃO LGPD: como claude-extract-laudo, envia o documento completo (PHI
// identificável) a um provedor externo (OpenAI). Uso opt-in; cobrir em política
// de privacidade + DPA. Logs nunca incluem conteúdo do documento.
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

// ~10 MB de arquivo → ~13,5 MB em base64. Limite defensivo (custo/DoS).
const MAX_BASE64_CHARS = 14_000_000;

// Origens de produção conhecidas (domínio oficial). Ficam sempre na allowlist,
// além do que estiver em ALLOWED_ORIGINS, para não depender de o secret estar
// atualizado após troca de domínio (ex.: *.vercel.app → apptear.com).
const DEFAULT_ORIGINS = [
  "https://www.apptear.com",
  "https://apptear.com",
];

// CORS com allowlist (ALLOWED_ORIGINS ∪ defaults) e verificação defensiva do
// JWT em código. Reflete a origem quando permitida; caso contrário devolve a
// primeira conhecida (preflight de origem não permitida falha, como esperado).
function corsHeaders(req: Request): Record<string, string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const list = [...new Set([...configured, ...DEFAULT_ORIGINS])];
  const origin = req.headers.get("Origin") ?? "";
  const allow =
    list.length === 0 ? "*" : list.includes(origin) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Cliente com o JWT do usuário (respeita RLS) — usado para autenticar e para
// confirmar que o usuário é membro da clínica informada.
function userClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authHeader || !url || !anon) return null;
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Rate limit por usuário (RPC check_rate_limit, migração 0038). Fail-open:
// se a RPC falhar/não existir, loga e deixa passar — a função já exige JWT e
// o limite protege custo, não confidencialidade. Mesma chave "extract-laudo"
// da função Claude: o limite vale para a soma dos dois provedores.
async function withinRateLimit(
  client: ReturnType<typeof createClient>,
  action: string,
  maxCalls: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await client.rpc("check_rate_limit", {
    p_action: action,
    p_max_calls: maxCalls,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error(`rate-limit ${action}:`, error.message);
    return true;
  }
  return data === true;
}

type PageImage = { base64?: string; mediaType?: string };

type Payload = {
  // Formato preferido: páginas do documento renderizadas em alta resolução no
  // navegador (JPEG/PNG). Evita a rasterização de PDF do provedor, que sai em
  // resolução baixa e tornava scans ilegíveis para o modelo.
  pages?: PageImage[];
  // Formato legado (arquivo único em base64) — mantido por compatibilidade.
  fileBase64?: string;
  mediaType?: string;
  clinicId?: number;
};

const MAX_PAGES = 10;

type Therapy = { therapy: string; frequency: string };

type Extracted = {
  patient_name: string | null;
  therapies: Therapy[];
  doctor: string | null;
  crm_uf: string | null;
  issue_date: string | null;
  validity_date: string | null;
};

// PASSO 1 — OCR literal. Transcrever ≠ interpretar: o modelo copia o texto na
// ordem de leitura, o que o obriga a passar por TODOS os itens da lista de
// terapias antes de qualquer extração.
const TRANSCRIBE_PROMPT = `Você é um sistema de OCR de alta fidelidade para documentos médicos brasileiros digitalizados. Transcreva TODO o texto do documento, palavra por palavra, na ordem de leitura, cobrindo todas as páginas até o fim.

Regras:
- NÃO resuma, NÃO omita, NÃO parafraseie, NÃO corrija e NÃO interprete nada.
- Listas numeradas devem ser transcritas COMPLETAS, do primeiro ao último item, preservando os números.
- Preserve datas, números de registro profissional (CRM/RQE), CPF, nomes próprios e periodicidades exatamente como escritos.
- Ignore apenas elementos gráficos sem texto clínico (logotipo, marca d'água, endereço/rodapé da clínica).
- Se um trecho estiver ilegível, escreva [ilegível] no lugar.
- Responda SOMENTE com a transcrição, em texto puro.`;

// PASSO 2 — extração estruturada a partir da transcrição (texto → JSON com
// schema estrito imposto pela API; o formato não depende mais do modelo).
const EXTRACT_PROMPT = `Você recebe a transcrição literal de um laudo/relatório médico brasileiro (TEA / desenvolvimento infantil) e extrai dados estruturados.

Regras:
- "patient_name": nome completo do PACIENTE (não do médico nem do responsável). Se não constar, null.
- TERAPIAS — a parte mais importante. A transcrição costuma trazer uma lista NUMERADA de terapias/intervenções solicitadas (1., 2., 3., ...). Percorra item a item, até o último número, e gere um item de "therapies" para CADA um — omitir é ERRO GRAVE. Inclua também terapias citadas fora da lista numerada. Logotipos/nome da clínica NÃO são terapias.
- "therapies_count": conte quantas terapias a transcrição pede ANTES de montar o array; "therapies" deve ter exatamente esse número de itens.
- Em cada item:
  - "therapy": nome da terapia COMO ESCRITO na transcrição, incluindo abordagem/método/certificação (ex.: o que estiver entre parênteses). Copie fielmente; NÃO resuma nem normalize.
  - "frequency": periodicidade e duração EXATAMENTE como escritas para aquele item (frequência, horas semanais, duração mínima da sessão). Se não indicada, "".
  - Se uma mesma linha trouxer modalidades com periodicidades distintas, separe em itens distintos.
- "doctor": médico que assina (sem "Dr."/"Dra."). "crm_uf": registro como aparece, com UF.
- "issue_date": data de emissão/assinatura. "validity_date": validade explícita, se houver.
- Datas em YYYY-MM-DD. Campo não encontrado → null (therapies vazio → [] e therapies_count 0). NUNCA invente dados que não estejam na transcrição.`;

// JSON Schema estrito (Structured Outputs): a API garante o formato.
const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    patient_name: { type: ["string", "null"] },
    therapies_count: { type: "integer" },
    therapies: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          therapy: { type: "string" },
          frequency: { type: "string" },
        },
        required: ["therapy", "frequency"],
      },
    },
    doctor: { type: ["string", "null"] },
    crm_uf: { type: ["string", "null"] },
    issue_date: { type: ["string", "null"] },
    validity_date: { type: ["string", "null"] },
  },
  required: [
    "patient_name",
    "therapies_count",
    "therapies",
    "doctor",
    "crm_uf",
    "issue_date",
    "validity_date",
  ],
};

function addOneYear(iso: string): string | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// Remove marcadores [ilegível] para decidir se um item tem conteúdo real.
function legibleText(s: string): string {
  return s.replace(/\[ileg[íi]vel\]/gi, "").replace(/[\s,.;:-]+/g, " ").trim();
}

function normalizeTherapies(value: unknown): Therapy[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): Therapy | null => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const therapy = typeof o.therapy === "string" ? o.therapy.trim() : "";
      const frequency =
        typeof o.frequency === "string" ? o.frequency.trim() : "";
      // Descarta itens sem nenhum conteúdo legível ([ilegível] puro).
      if (!legibleText(therapy) && !legibleText(frequency)) return null;
      return { therapy, frequency };
    })
    .filter((t): t is Therapy => t !== null)
    .slice(0, 30);
}

function parseJson(text: string): Extracted | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]);
    return {
      patient_name:
        typeof o.patient_name === "string" ? o.patient_name.trim() || null : null,
      therapies: normalizeTherapies(o.therapies),
      doctor: typeof o.doctor === "string" ? o.doctor : null,
      crm_uf: typeof o.crm_uf === "string" ? o.crm_uf : null,
      issue_date: /^\d{4}-\d{2}-\d{2}$/.test(o.issue_date) ? o.issue_date : null,
      validity_date: /^\d{4}-\d{2}-\d{2}$/.test(o.validity_date)
        ? o.validity_date
        : null,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  // Defesa em profundidade: exige sessão válida mesmo se verify_jwt cair.
  const client = userClient(req);
  if (!client) return json({ error: "Não autenticado." }, 401);
  const { data: auth, error: authErr } = await client.auth.getUser();
  if (authErr || !auth.user) return json({ error: "Não autenticado." }, 401);

  // Leitura de laudo é cara (vision/PDF): 15 por usuário por hora.
  if (!(await withinRateLimit(client, "extract-laudo", 15, 3600))) {
    return json(
      { error: "Limite de leituras com IA atingido. Tente novamente em alguns minutos." },
      429,
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "Corpo inválido." }, 400);
  }
  const pages = (payload.pages ?? []).filter(
    (p): p is { base64: string; mediaType: string } =>
      !!p && typeof p.base64 === "string" && p.base64.length > 0 &&
      typeof p.mediaType === "string" && p.mediaType.startsWith("image/"),
  );
  const hasLegacyFile = !!payload.fileBase64 && !!payload.mediaType;
  if (pages.length === 0 && !hasLegacyFile) {
    return json({ error: "Arquivo do laudo ausente." }, 400);
  }
  if (!payload.clinicId) {
    return json({ error: "Clínica não informada." }, 400);
  }
  if (pages.length > MAX_PAGES) {
    return json({ error: `Documento com páginas demais (máx. ${MAX_PAGES}).` }, 413);
  }
  const totalChars =
    pages.reduce((acc, p) => acc + p.base64.length, 0) +
    (payload.fileBase64?.length ?? 0);
  if (totalChars > MAX_BASE64_CHARS) {
    return json({ error: "Arquivo muito grande (máx. ~10 MB)." }, 413);
  }

  // Confirma que o usuário pertence à clínica (RLS filtra clinic_members).
  const { data: membership } = await client
    .from("clinic_members")
    .select("clinic_id")
    .eq("clinic_id", payload.clinicId)
    .eq("user_id", auth.user.id)
    .eq("active", true)
    .maybeSingle();
  if (!membership) return json({ error: "Acesso negado à clínica." }, 403);

  // Token da OpenAI por clínica — lido com service role (RLS admin-only não
  // impede terapeutas de usar a IA, pois o token não passa pelo navegador).
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!serviceKey || !url) {
    return json({ error: "Configuração de servidor ausente." }, 500);
  }
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: settings } = await admin
    .from("clinic_ai_settings")
    .select("openai_token")
    .eq("clinic_id", payload.clinicId)
    .maybeSingle();
  const apiKey = settings?.openai_token?.trim();
  if (!apiKey) {
    return json(
      {
        error:
          "Token GPT não configurado. Um administrador deve informá-lo em Configurações → IA.",
      },
      400,
    );
  }

  // Blocos do documento: preferimos as páginas em alta resolução vindas do
  // navegador; o caminho legado (arquivo único) permanece para compat.
  let documentBlocks: unknown[];
  if (pages.length > 0) {
    documentBlocks = pages.map((p) => ({
      type: "image_url",
      image_url: {
        url: `data:${p.mediaType};base64,${p.base64}`,
        detail: "high",
      },
    }));
  } else {
    const isPdf = payload.mediaType === "application/pdf";
    const dataUrl = `data:${payload.mediaType};base64,${payload.fileBase64}`;
    documentBlocks = [
      isPdf
        ? {
            type: "file",
            file: { filename: "laudo.pdf", file_data: dataUrl },
          }
        : {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
    ];
  }

  // Chamada por família de modelo: gpt-5/o* são modelos de raciocínio (usam
  // max_completion_tokens e não aceitam temperature); gpt-4o/4.1 usam os
  // parâmetros clássicos.
  const chat = (
    model: string,
    system: string,
    user: unknown[],
    opts: { maxOut: number; schema?: Record<string, unknown> },
  ) => {
    const isReasoning = /^gpt-5/.test(model) || /^o\d/.test(model);
    const params = isReasoning
      ? { max_completion_tokens: opts.maxOut, reasoning_effort: "low" }
      : { temperature: 0, max_tokens: Math.min(opts.maxOut, 16000) };
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        ...params,
        ...(opts.schema
          ? {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "laudo_extraction",
                  strict: true,
                  schema: opts.schema,
                },
              },
            }
          : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  };

  const content = async (resp: Response): Promise<string> => {
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content ?? "";
  };

  try {
    const FALLBACK_MODEL = "gpt-4o";
    const configured = Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-5";
    let model = configured;

    // PASSO 1 — transcrição OCR literal do documento (com fallback de modelo
    // quando a chave da clínica não tem acesso ao configurado).
    const transcribeUser = [
      ...documentBlocks,
      {
        type: "text",
        text:
          "Transcreva fielmente TODO o texto das páginas acima, na ordem, incluindo a lista numerada completa de terapias.",
      },
    ];
    let resp = await chat(model, TRANSCRIBE_PROMPT, transcribeUser, {
      maxOut: 10000,
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error(
        `openai-extract-laudo transcribe error (${model}):`,
        resp.status,
        errText,
      );
      if (resp.status === 401) {
        return json({ error: "Token GPT inválido ou sem permissão." }, 400);
      }
      const modelUnavailable =
        (resp.status === 400 || resp.status === 404) && /model/i.test(errText);
      if (!modelUnavailable || model === FALLBACK_MODEL) {
        return json({ error: "Falha ao consultar a IA." }, 502);
      }
      model = FALLBACK_MODEL;
      resp = await chat(model, TRANSCRIBE_PROMPT, transcribeUser, {
        maxOut: 10000,
      });
      if (!resp.ok) {
        console.error(
          `openai-extract-laudo transcribe fallback error (${model}):`,
          resp.status,
          await resp.text(),
        );
        if (resp.status === 401) {
          return json({ error: "Token GPT inválido ou sem permissão." }, 400);
        }
        return json({ error: "Falha ao consultar a IA." }, 502);
      }
    }
    const transcript = (await content(resp)).trim();
    if (transcript.length < 50) {
      console.error(
        `openai-extract-laudo transcript too short (${model}): ${transcript.length} chars`,
      );
      return json({ error: "Não foi possível ler o documento." }, 422);
    }

    // PASSO 2 — extração estruturada a partir da transcrição (schema estrito).
    const extractResp = await chat(
      model,
      EXTRACT_PROMPT,
      [
        {
          type: "text",
          text: `TRANSCRIÇÃO DO LAUDO:\n\n${transcript}`,
        },
      ],
      { maxOut: 4000, schema: EXTRACTION_SCHEMA },
    );
    if (!extractResp.ok) {
      console.error(
        `openai-extract-laudo extract error (${model}):`,
        extractResp.status,
        await extractResp.text(),
      );
      return json({ error: "Falha ao consultar a IA." }, 502);
    }

    const extracted = parseJson(await content(extractResp));
    if (!extracted) {
      return json({ error: "Não foi possível interpretar o laudo." }, 422);
    }
    // Telemetria sem PHI: modelo, nº de páginas, transcrição e terapias.
    console.log(
      `openai-extract-laudo ok (${model}): pages=${pages.length || "legacy"}, transcript=${transcript.length} chars, therapies=${extracted.therapies.length}`,
    );

    // Cenário B: sem validade explícita mas com emissão → emissão + 1 ano.
    let validity_source: "explicit" | "computed" | null = null;
    if (extracted.validity_date) {
      validity_source = "explicit";
    } else if (extracted.issue_date) {
      extracted.validity_date = addOneYear(extracted.issue_date);
      validity_source = extracted.validity_date ? "computed" : null;
    }

    return json({ ...extracted, validity_source });
  } catch (e) {
    console.error("openai-extract-laudo error:", e);
    return json({ error: "Falha ao ler o laudo." }, 502);
  }
});
