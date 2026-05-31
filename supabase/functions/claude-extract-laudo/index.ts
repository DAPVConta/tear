// Edge Function: claude-extract-laudo
// OCR/IA do laudo médico via Claude (vision/PDF). Extrai médico assistente,
// CRM/UF, data de emissão e validade. A chave (CLAUDE_KEY) fica no servidor;
// requer JWT (verify_jwt). O arquivo é enviado em base64 e NÃO é persistido
// pela função — só processado para extração.
import Anthropic from "npm:@anthropic-ai/sdk@0.69.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

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
    const msg = e instanceof Error ? e.message : "Falha ao ler o laudo.";
    return json({ error: msg }, 502);
  }
});
