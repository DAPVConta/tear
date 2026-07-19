// Edge Function: clicksign-signature
// Assinatura digital da evolução diária via ClickSign (API v3 — Envelopes).
// O front gera o PDF da evolução (jsPDF) e envia aqui em base64; esta função
// cria o envelope na ClickSign, anexa o documento, cadastra o signatário,
// adiciona os requisitos (qualificação de assinatura + autenticação por
// e-mail), ativa o envelope e dispara a notificação com o link de assinatura.
//
// O token da API (CLICKSIGN_TOKEN) fica apenas nos Secrets do servidor —
// nunca chega ao navegador. O acesso à evolução é validado pelo JWT do
// usuário: todas as leituras/escritas no banco usam o client com o token da
// sessão, então a RLS por clínica continua valendo.
//
// Ações:
//   { action: "request", evolutionId, clinicId, filename, contentBase64,
//     signer: { name, email, documentation? } }
//     → cria o envelope e grava os metadados em daily_evolutions.clicksign
//   { action: "status", evolutionId, clinicId }
//     → consulta o envelope; se finalizado, marca a evolução como assinada
//
// Referência: https://developers.clicksign.com/ (API v3 — JSON:API).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.46.1";

// PDF de uma evolução é pequeno; 10 MB de folga cobre anexos futuros.
const MAX_BODY_BYTES = 10 * 1024 * 1024;

const CLICKSIGN_BASE_URL = (
  Deno.env.get("CLICKSIGN_BASE_URL") ?? "https://app.clicksign.com/api/v3"
).replace(/\/$/, "");

// --- Helpers compartilhados (inline para deploy independente de layout) ---
// Origens de produção conhecidas, sempre na allowlist além do que estiver em
// ALLOWED_ORIGINS (mesmo padrão de openai-extract-laudo). Previews do Vercel
// do próprio projeto (tear-*-dapvcontas-projects.vercel.app) também são
// aceitos: a URL muda a cada deploy, então allowlist estática não os cobre.
// CORS aqui é defesa em profundidade — a função já exige JWT válido.
const DEFAULT_ORIGINS = [
  "https://www.apptear.com",
  "https://apptear.com",
];
const VERCEL_PREVIEW_RE =
  /^https:\/\/[a-z0-9-]+-dapvcontas-projects\.vercel\.app$/;

function corsHeaders(req: Request): Record<string, string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const list = [...new Set([...configured, ...DEFAULT_ORIGINS])];
  const origin = req.headers.get("Origin") ?? "";
  const allow =
    list.includes(origin) || VERCEL_PREVIEW_RE.test(origin) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function getUserClient(req: Request): SupabaseClient | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// --- Cliente mínimo da API v3 da ClickSign (JSON:API) ---------------------
type JsonApiResource = {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
};

async function clicksign(
  token: string,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<JsonApiResource> {
  const res = await fetch(`${CLICKSIGN_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: token,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: { data?: JsonApiResource; errors?: unknown } = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // resposta não-JSON tratada abaixo pelo status
  }
  if (!res.ok) {
    console.error(
      `clicksign ${method} ${path} → ${res.status}:`,
      text.slice(0, 2000),
    );
    throw new Error(`ClickSign respondeu ${res.status} em ${method} ${path}.`);
  }
  return parsed.data ?? { id: "", type: "" };
}

type Signer = { name?: string; email?: string; documentation?: string };

type Payload = {
  action?: "request" | "status" | "download";
  evolutionId?: number;
  clinicId?: number;
  filename?: string;
  contentBase64?: string;
  signer?: Signer;
};

// Varre (recursivamente) os atributos de um recurso à procura da URL do
// arquivo assinado. O nome exato do campo varia entre versões da API
// (downloads.signed_file_url, signed_file_url, etc.); em vez de fixar um,
// coletamos toda URL http(s) e priorizamos a que contém "signed", caindo
// para qualquer "file"/"download" como fallback.
function findSignedUrl(attrs: Record<string, unknown>): string | null {
  const urls: { key: string; url: string }[] = [];
  const walk = (obj: unknown, prefix: string) => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === "string" && /^https?:\/\//.test(v)) {
        urls.push({ key: (prefix + k).toLowerCase(), url: v });
      } else if (v && typeof v === "object") {
        walk(v, `${prefix}${k}.`);
      }
    }
  };
  walk(attrs, "");
  const signed = urls.find((u) => u.key.includes("signed"));
  if (signed) return signed.url;
  const file = urls.find(
    (u) => u.key.includes("file") || u.key.includes("download"),
  );
  return file?.url ?? urls[0]?.url ?? null;
}

type ClickSignEnvelope = {
  envelope_id: string;
  document_id: string;
  signer_id: string;
  signer_name: string;
  signer_email: string;
  status: "pending" | "signed";
  requested_at: string;
  finished_at: string | null;
};

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

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  // Defesa em profundidade: exige sessão válida mesmo se verify_jwt cair.
  const db = getUserClient(req);
  const { data: userData } = (await db?.auth.getUser()) ?? { data: null };
  if (!db || !userData?.user) {
    return json({ error: "Não autenticado." }, 401);
  }

  const token = Deno.env.get("CLICKSIGN_TOKEN");
  if (!token) {
    return json({ error: "CLICKSIGN_TOKEN não configurado no servidor." }, 500);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "Requisição muito grande." }, 413);
  }
  let payload: Payload;
  try {
    payload = JSON.parse(raw) as Payload;
  } catch {
    return json({ error: "Corpo inválido." }, 400);
  }

  const { action, evolutionId, clinicId } = payload;
  if (!evolutionId || !clinicId) {
    return json({ error: "evolutionId e clinicId são obrigatórios." }, 400);
  }

  // A leitura via client do usuário garante (RLS) que ele pertence à clínica
  // dona da evolução — sem isso a linha simplesmente não é visível.
  const { data: evolution, error: evoError } = await db
    .from("daily_evolutions")
    .select("id, clicksign, signed_at, professional_signature")
    .eq("id", evolutionId)
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (evoError) {
    console.error("clicksign-signature: leitura da evolução falhou", evoError);
    return json({ error: "Falha ao carregar a evolução." }, 500);
  }
  if (!evolution) {
    return json({ error: "Evolução não encontrada." }, 404);
  }
  const current = (evolution.clicksign ?? null) as ClickSignEnvelope | null;

  try {
    if (action === "request") {
      const { filename, contentBase64, signer } = payload;
      if (!filename || !contentBase64 || !signer?.name || !signer?.email) {
        return json(
          { error: "filename, contentBase64 e signer (nome/e-mail) são obrigatórios." },
          400,
        );
      }
      if (current?.status === "pending") {
        return json(
          { error: "Já existe uma solicitação de assinatura pendente para esta evolução." },
          409,
        );
      }
      if (current?.status === "signed") {
        return json({ error: "Esta evolução já foi assinada via ClickSign." }, 409);
      }

      // 1) Envelope (pasta digital do processo de assinatura).
      const envelope = await clicksign(token, "POST", "/envelopes", {
        data: {
          type: "envelopes",
          attributes: {
            name: filename,
            locale: "pt-BR",
            auto_close: true,
          },
        },
      });

      // 2) Documento (PDF gerado no front, como data URI base64).
      const document = await clicksign(
        token,
        "POST",
        `/envelopes/${envelope.id}/documents`,
        {
          data: {
            type: "documents",
            attributes: { filename, content_base64: contentBase64 },
          },
        },
      );

      // 3) Signatário (o profissional responsável pela evolução).
      const documentation = signer.documentation?.trim() || null;
      const signerRes = await clicksign(
        token,
        "POST",
        `/envelopes/${envelope.id}/signers`,
        {
          data: {
            type: "signers",
            attributes: {
              name: signer.name,
              email: signer.email,
              refusable: false,
              has_documentation: !!documentation,
              ...(documentation ? { documentation } : {}),
              communicate_events: {
                signature_request: "email",
                signature_reminder: "email",
                document_signed: "email",
              },
            },
          },
        },
      );

      // 4) Requisitos: qualificação (assinar) + evidência de autenticação
      // por e-mail, ligando signatário e documento.
      const relationships = {
        document: { data: { type: "documents", id: document.id } },
        signer: { data: { type: "signers", id: signerRes.id } },
      };
      await clicksign(token, "POST", `/envelopes/${envelope.id}/requirements`, {
        data: {
          type: "requirements",
          attributes: { action: "agree", role: "sign" },
          relationships,
        },
      });
      await clicksign(token, "POST", `/envelopes/${envelope.id}/requirements`, {
        data: {
          type: "requirements",
          attributes: { action: "provide_evidence", auth: "email" },
          relationships,
        },
      });

      // 5) Ativa o envelope (draft → running) e 6) dispara a notificação
      // com o link de assinatura para o e-mail do signatário.
      await clicksign(token, "PATCH", `/envelopes/${envelope.id}`, {
        data: {
          id: envelope.id,
          type: "envelopes",
          attributes: { status: "running" },
        },
      });
      await clicksign(token, "POST", `/envelopes/${envelope.id}/notifications`, {
        data: {
          type: "notifications",
          attributes: {
            message:
              "Você recebeu um relatório de evolução diária do TEAR para assinatura digital.",
          },
        },
      });

      const record: ClickSignEnvelope = {
        envelope_id: envelope.id,
        document_id: document.id,
        signer_id: signerRes.id,
        signer_name: signer.name,
        signer_email: signer.email,
        status: "pending",
        requested_at: new Date().toISOString(),
        finished_at: null,
      };
      const { error: updateError } = await db
        .from("daily_evolutions")
        .update({ clicksign: record })
        .eq("id", evolutionId)
        .eq("clinic_id", clinicId);
      if (updateError) {
        console.error("clicksign-signature: gravação do envelope falhou", updateError);
        return json(
          { error: "Envelope criado na ClickSign, mas houve falha ao gravar na evolução." },
          500,
        );
      }
      return json({ clicksign: record });
    }

    if (action === "status") {
      if (!current) {
        return json(
          { error: "Nenhuma solicitação de assinatura ClickSign para esta evolução." },
          404,
        );
      }
      const envelope = await clicksign(
        token,
        "GET",
        `/envelopes/${current.envelope_id}`,
      );
      const envelopeStatus = String(envelope.attributes?.status ?? "");
      // Ground truth para diagnóstico: status e atributos crus do envelope.
      console.log(
        `clicksign status envelope=${current.envelope_id} status=${envelopeStatus}`,
        JSON.stringify(envelope.attributes ?? {}),
      );

      // Envelope finalizado (todos assinaram + auto_close). Se, por algum
      // motivo, o envelope ainda constar como "running" mas o signatário já
      // tiver assinado, também tratamos como concluído (checagem dos
      // signatários abaixo) — evita ficar preso em "pendente".
      let finished = envelopeStatus === "closed" || envelopeStatus === "finished";
      if (!finished && envelopeStatus === "running") {
        try {
          const signers = await clicksign(
            token,
            "GET",
            `/envelopes/${current.envelope_id}/signers`,
          );
          // A resposta pode vir como lista (data[]) — normaliza e procura por
          // qualquer indício de assinatura concluída no signatário-alvo.
          const arr = Array.isArray((signers as unknown as { length?: number }))
            ? (signers as unknown as JsonApiResource[])
            : ([signers] as JsonApiResource[]);
          const target =
            arr.find((s) => s?.id === current.signer_id) ?? arr[0];
          const attrs = (target?.attributes ?? {}) as Record<string, unknown>;
          console.log(
            `clicksign status signer=${current.signer_id}`,
            JSON.stringify(attrs),
          );
          const signedFlag = Object.entries(attrs).some(([k, v]) => {
            if (!/sign/i.test(k)) return false;
            if (typeof v === "boolean") return v;
            if (typeof v === "string") return v.length > 0 && v !== "pending";
            return false;
          });
          if (signedFlag) finished = true;
        } catch (e) {
          console.error("clicksign status: falha ao ler signatários", e);
        }
      }

      if (!finished || current.status === "signed") {
        return json({ clicksign: current, envelope_status: envelopeStatus });
      }

      const record: ClickSignEnvelope = {
        ...current,
        status: "signed",
        finished_at: new Date().toISOString(),
      };
      // Marca a evolução como assinada; preserva signed_at existente para não
      // reiniciar o contador da trava de 24h.
      const { error: updateError } = await db
        .from("daily_evolutions")
        .update({
          clicksign: record,
          professional_signature: true,
          ...(evolution.signed_at ? {} : { signed_at: record.finished_at }),
        })
        .eq("id", evolutionId)
        .eq("clinic_id", clinicId);
      if (updateError) {
        console.error("clicksign-signature: atualização de status falhou", updateError);
        return json({ error: "Falha ao atualizar o status da assinatura." }, 500);
      }
      return json({ clicksign: record, envelope_status: envelopeStatus });
    }

    if (action === "download") {
      if (!current) {
        return json(
          { error: "Nenhuma solicitação de assinatura ClickSign para esta evolução." },
          404,
        );
      }
      // Documento assinado só existe após a finalização (todos assinaram).
      const doc = await clicksign(
        token,
        "GET",
        `/envelopes/${current.envelope_id}/documents/${current.document_id}`,
      );
      const docAttrs = (doc.attributes ?? {}) as Record<string, unknown>;
      console.log(
        `clicksign download doc=${current.document_id}`,
        JSON.stringify(docAttrs),
      );
      let url = findSignedUrl(docAttrs);

      // Fallback: alguns retornos trazem as URLs de download apenas no nível
      // do envelope (ou na listagem de documentos), não no detalhe.
      let envAttrs: Record<string, unknown> = {};
      let listAttrs: Record<string, unknown> = {};
      if (!url) {
        try {
          const env = await clicksign(
            token,
            "GET",
            `/envelopes/${current.envelope_id}`,
          );
          envAttrs = (env.attributes ?? {}) as Record<string, unknown>;
          url = findSignedUrl(envAttrs);
        } catch (e) {
          console.error("clicksign download: falha ao ler envelope", e);
        }
      }
      if (!url) {
        try {
          const list = await clicksign(
            token,
            "GET",
            `/envelopes/${current.envelope_id}/documents`,
          );
          const arr = Array.isArray(list as unknown as unknown[])
            ? (list as unknown as JsonApiResource[])
            : [list as JsonApiResource];
          listAttrs = { documents: arr.map((d) => d?.attributes ?? {}) };
          for (const d of arr) {
            url = findSignedUrl((d?.attributes ?? {}) as Record<string, unknown>);
            if (url) break;
          }
        } catch (e) {
          console.error("clicksign download: falha ao listar documentos", e);
        }
      }

      if (!url) {
        // DIAGNÓSTICO TEMPORÁRIO: guarda as respostas cruas no registro para
        // inspeção (o painel de logs não expõe console.log de forma confiável).
        await db
          .from("daily_evolutions")
          .update({
            clicksign: {
              ...current,
              _debug: { doc: docAttrs, envelope: envAttrs, list: listAttrs },
            },
          })
          .eq("id", evolutionId)
          .eq("clinic_id", clinicId);
        return json(
          { error: "O documento assinado ainda não está disponível para download." },
          404,
        );
      }
      return json({ url });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    // Loga o detalhe no servidor; ao cliente, mensagem enxuta.
    console.error("clicksign-signature error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Falha na integração com a ClickSign." },
      502,
    );
  }
});
