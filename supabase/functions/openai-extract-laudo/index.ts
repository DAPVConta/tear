// Edge Function: openai-extract-laudo
// Fluxo "Novo paciente com IA". Analisa o laudo (PDF ou imagem) com o modelo
// gpt-5 da OpenAI (OPENAI_MODEL sobrepõe; fallback gpt-4o se indisponível) e
// devolve: nome do paciente, lista de terapias + periodicidade e os metadados
// do laudo (médico, CRM/UF, emissão, validade).
//
// O token da OpenAI é POR CLÍNICA (token_gpt), configurado em Configurações →
// IA e guardado em public.clinic_ai_settings (RLS admin-only). A função resolve
// o token no servidor com a service role — o navegador nunca o recebe, e
// terapeutas/recepcionistas conseguem usar a IA sem enxergar a chave.
//
// ATENÇÃO LGPD: como claude-extract-laudo, envia o documento completo (PHI
// identificável) a um provedor externo (OpenAI). Uso opt-in; cobrir em política
// de privacidade + DPA.
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

type Payload = {
  fileBase64?: string;
  mediaType?: string;
  clinicId?: number;
};

type Therapy = { therapy: string; frequency: string };

type Extracted = {
  patient_name: string | null;
  therapies: Therapy[];
  doctor: string | null;
  crm_uf: string | null;
  issue_date: string | null;
  validity_date: string | null;
};

// Prompt calibrado para laudos ESCANEADOS: obriga varrer todas as páginas e
// transcrever a lista numerada de terapias item a item ("therapies_count"
// força o modelo a contar antes de listar). Sem exemplos de periodicidade no
// prompt — em versão anterior o modelo copiava os exemplos para a resposta.
const SYSTEM_PROMPT = `Você transcreve dados estruturados de laudos e relatórios médicos brasileiros (TEA / desenvolvimento infantil). O documento geralmente é DIGITALIZADO (scan): leia TODAS as páginas, do início ao fim, antes de responder. Responda SOMENTE com um objeto JSON válido, sem texto fora dele, no formato:
{"patient_name": string|null, "therapies_count": number, "therapies": [{"therapy": string, "frequency": string}], "doctor": string|null, "crm_uf": string|null, "issue_date": "YYYY-MM-DD"|null, "validity_date": "YYYY-MM-DD"|null}

Regras:
- "patient_name": nome completo do PACIENTE (não do médico nem do responsável). Se não encontrar, null.
- TERAPIAS — a parte mais importante. Os laudos costumam trazer uma lista NUMERADA de terapias/intervenções solicitadas (1., 2., 3., ...), muitas vezes continuando na página seguinte. Percorra a lista item a item, até o último número, e transcreva TODOS os itens — omitir um item da lista é ERRO GRAVE. Inclua também terapias citadas fora da lista numerada.
- "therapies_count": conte quantas terapias o documento pede ANTES de montar o array; "therapies" deve ter exatamente esse número de itens.
- Cada item de "therapies":
  - "therapy": nome da terapia COMO ESCRITO no documento, incluindo abordagem/método/certificação citados (ex.: o que estiver entre parênteses). NÃO resuma, NÃO normalize, NÃO agrupe itens diferentes. IGNORE logotipos, cabeçalhos e rodapés da clínica — não são terapias.
  - "frequency": periodicidade e duração EXATAMENTE como escritas no documento para aquele item (frequência semanal/mensal, horas, duração mínima da sessão). Se o documento não indicar, use "".
  - Se uma mesma linha trouxer mais de uma modalidade com periodicidades distintas, separe em itens distintos.
  - Se o documento não listar terapias, use [] e therapies_count 0.
- "doctor": nome do médico que assina o laudo (sem títulos como "Dr." ou "Dra.").
- "crm_uf": registro do conselho como aparece, incluindo a UF (ex.: "CRM/PE 21.724").
- "issue_date": data de emissão/assinatura do laudo.
- "validity_date": validade explícita ("válido até ...") se houver; caso contrário null.
- Datas sempre em YYYY-MM-DD. Se um campo não for encontrado, use null. Transcreva SOMENTE o que está no documento — NUNCA invente nomes, números ou periodicidades.`;

function addOneYear(iso: string): string | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
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
      if (!therapy && !frequency) return null;
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

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "Corpo inválido." }, 400);
  }
  if (!payload.fileBase64 || !payload.mediaType) {
    return json({ error: "Arquivo do laudo ausente." }, 400);
  }
  if (!payload.clinicId) {
    return json({ error: "Clínica não informada." }, 400);
  }
  if (payload.fileBase64.length > MAX_BASE64_CHARS) {
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

  const isPdf = payload.mediaType === "application/pdf";
  const dataUrl = `data:${payload.mediaType};base64,${payload.fileBase64}`;
  const documentBlock = isPdf
    ? {
        type: "file",
        file: { filename: "laudo.pdf", file_data: dataUrl },
      }
    : {
        type: "image_url",
        image_url: { url: dataUrl, detail: "high" },
      };

  // Chamada por família de modelo: gpt-5/o* são modelos de raciocínio (usam
  // max_completion_tokens e não aceitam temperature); gpt-4o/4.1 usam os
  // parâmetros clássicos.
  const callModel = (model: string) => {
    const isReasoning = /^gpt-5/.test(model) || /^o\d/.test(model);
    const params = isReasoning
      ? { max_completion_tokens: 8000, reasoning_effort: "low" }
      : { temperature: 0, max_tokens: 3000 };
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        ...params,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              documentBlock,
              {
                type: "text",
                text: "Transcreva os dados do laudo acima no formato JSON especificado. Atenção: percorra a lista numerada de terapias até o último item e inclua TODAS, sem omitir nenhuma.",
              },
            ],
          },
        ],
      }),
    });
  };

  try {
    // Padrão gpt-5: gerações anteriores (4o-mini e 4o) omitiam/manglavam itens
    // de laudos escaneados. OPENAI_MODEL (secret) sobrepõe sem novo deploy;
    // se a chave da clínica não tiver acesso ao modelo, cai para o FALLBACK.
    const FALLBACK_MODEL = "gpt-4o";
    const configured = Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-5";
    let resp = await callModel(configured);
    if (!resp.ok) {
      const errText = await resp.text();
      console.error(
        `openai-extract-laudo upstream error (${configured}):`,
        resp.status,
        errText,
      );
      if (resp.status === 401) {
        return json({ error: "Token GPT inválido ou sem permissão." }, 400);
      }
      const modelUnavailable =
        (resp.status === 400 || resp.status === 404) && /model/i.test(errText);
      if (modelUnavailable && configured !== FALLBACK_MODEL) {
        resp = await callModel(FALLBACK_MODEL);
        if (!resp.ok) {
          const fbText = await resp.text();
          console.error(
            `openai-extract-laudo fallback error (${FALLBACK_MODEL}):`,
            resp.status,
            fbText,
          );
          if (resp.status === 401) {
            return json({ error: "Token GPT inválido ou sem permissão." }, 400);
          }
          return json({ error: "Falha ao consultar a IA." }, 502);
        }
      } else {
        return json({ error: "Falha ao consultar a IA." }, 502);
      }
    }

    const data = await resp.json();
    const text: string =
      data?.choices?.[0]?.message?.content ?? "";
    const extracted = parseJson(text);
    if (!extracted) {
      return json({ error: "Não foi possível interpretar o laudo." }, 422);
    }

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
