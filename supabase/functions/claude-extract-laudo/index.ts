// Edge Function: claude-extract-laudo
// OCR/IA do laudo médico via Claude (vision/PDF). Extrai médico assistente,
// CRM/UF, data de emissão e validade. A chave (CLAUDE_KEY) fica no servidor;
// requer JWT (verify_jwt + checagem em código). O arquivo é enviado em base64 e
// NÃO é persistido pela função — só processado para extração.
// ATENÇÃO LGPD: diferente de claude-analysis, esta função envia o documento
// completo (PHI identificável) ao provedor externo (Anthropic). Uso opt-in;
// cobrir em política de privacidade + DPA.
import Anthropic from "npm:@anthropic-ai/sdk@0.69.0";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

// ~10 MB de arquivo → ~13,5 MB em base64. Limite defensivo (custo/DoS).
const MAX_BASE64_CHARS = 14_000_000;

// --- Helpers compartilhados (inline para deploy independente de layout) ---
// CORS com allowlist (ALLOWED_ORIGINS) e verificação defensiva do JWT no código
// (além do verify_jwt do config.toml): se a flag cair num deploy, a função
// ainda recusa chamadas anônimas.
function corsHeaders(req: Request): Record<string, string> {
  const list = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
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

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, client };
}

// Rate limit por usuário (RPC check_rate_limit, migração 0038). Fail-open:
// se a RPC falhar/não existir, loga e deixa passar — a função já exige JWT e
// o limite protege custo, não confidencialidade.
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

type Payload = { fileBase64?: string; mediaType?: string };

type Extracted = {
  doctor: string | null;
  crm_uf: string | null;
  issue_date: string | null;
  validity_date: string | null;
};

const SYSTEM_PROMPT = `Você extrai dados estruturados de laudos médicos brasileiros. Responda SOMENTE com um objeto JSON válido, sem texto fora dele, no formato:
{"doctor": string|null, "crm_uf": string|null, "issue_date": "YYYY-MM-DD"|null, "validity_date": "YYYY-MM-DD"|null}

Regras:
- "doctor": nome do médico que assina o laudo (sem títulos como "Dr.").
- "crm_uf": registro do conselho como aparece, incluindo a UF (ex.: "CRM/SP 123456").
- "issue_date": data de emissão/assinatura do laudo.
- "validity_date": se o texto trouxer validade explícita ("válido até DD/MM/AAAA"), use-a; se trouxer retorno relativo ("retorno em 6 meses"), some esse prazo à data de emissão e retorne a data resultante; caso contrário, null.
- Datas sempre em YYYY-MM-DD. Se um campo não for encontrado, use null. NUNCA invente dados.`;

function addOneYear(iso: string): string | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function parseJson(text: string): Extracted | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]);
    return {
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
  const authed = await getAuthedUser(req);
  if (!authed) return json({ error: "Não autenticado." }, 401);

  // Leitura de laudo é cara (vision/PDF): 15 por usuário por hora.
  if (!(await withinRateLimit(authed.client, "extract-laudo", 15, 3600))) {
    return json(
      { error: "Limite de leituras com IA atingido. Tente novamente em alguns minutos." },
      429,
    );
  }

  const apiKey = Deno.env.get("CLAUDE_KEY");
  if (!apiKey) return json({ error: "CLAUDE_KEY não configurada." }, 500);

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "Corpo inválido." }, 400);
  }
  if (!payload.fileBase64 || !payload.mediaType) {
    return json({ error: "Arquivo do laudo ausente." }, 400);
  }
  if (payload.fileBase64.length > MAX_BASE64_CHARS) {
    return json({ error: "Arquivo muito grande (máx. ~10 MB)." }, 413);
  }

  const isPdf = payload.mediaType === "application/pdf";
  const documentBlock = isPdf
    ? {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: payload.fileBase64,
        },
      }
    : {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: payload.mediaType as
            | "image/png"
            | "image/jpeg"
            | "image/webp"
            | "image/gif",
          data: payload.fileBase64,
        },
      };

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            documentBlock,
            {
              type: "text",
              text: "Extraia os dados do laudo acima no formato JSON especificado.",
            },
          ],
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

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
    console.error("claude-extract-laudo error:", e);
    return json({ error: "Falha ao ler o laudo." }, 502);
  }
});
