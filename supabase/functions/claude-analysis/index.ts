// Edge Function: claude-analysis
// Gera a "Análise profissional" da evolução mensal a partir dos dados clínicos
// já agregados (síntese, metas, frequência). A chave da API Claude fica em
// segredo no servidor (CLAUDE_KEY) — nunca chega ao navegador. Recebe apenas
// agregados clínicos (sem nome/CPF do paciente) para minimizar exposição de
// dados pessoais (LGPD). Requer JWT válido (verify_jwt + checagem em código).
import Anthropic from "npm:@anthropic-ai/sdk@0.69.0";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

// Limite defensivo do corpo da requisição (agregados são pequenos).
const MAX_BODY_BYTES = 64 * 1024;
const MAX_GOALS = 200;

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

type Goal = {
  description: string;
  category: string;
  current_progress: number;
  status: string;
};

type Payload = {
  period?: string;
  specialty?: string;
  totals?: { sessions?: number; present?: number; absent?: number };
  summary?: string;
  goals?: Goal[];
};

const SYSTEM_PROMPT = `Você é um profissional clínico experiente de uma clínica especializada em TEA (Transtorno do Espectro Autista). Sua tarefa é redigir a "Análise profissional" de uma evolução mensal, em português do Brasil.

Diretrizes:
- Baseie-se ESTRITAMENTE nos dados fornecidos. Nunca invente fatos, números, nomes ou diagnósticos.
- Tom clínico, objetivo e respeitoso. NUNCA infantilizado.
- 2 a 4 parágrafos curtos, em texto corrido (sem títulos, sem listas, sem markdown).
- Destaque: panorama de frequência, progresso e tendência das metas, desafios observados e direcionamento clínico geral.
- Se os dados forem insuficientes para alguma afirmação, seja conciso e não especule.
- Escreva apenas o texto da análise, sem preâmbulos como "Aqui está" ou "Segue".`;

function buildUserPrompt(p: Payload): string {
  const t = p.totals ?? {};
  const lines: string[] = [];
  if (p.period) lines.push(`Período de referência: ${p.period}`);
  if (p.specialty) lines.push(`Especialidade do profissional: ${p.specialty}`);
  lines.push(
    `Frequência: ${t.sessions ?? 0} sessões previstas, ${t.present ?? 0} presenças, ${t.absent ?? 0} ausências.`,
  );
  if (p.summary) lines.push(`\nSíntese automática do período:\n${p.summary}`);
  if (p.goals?.length) {
    lines.push("\nMetas terapêuticas acompanhadas:");
    for (const g of p.goals) {
      lines.push(
        `- ${g.description} (categoria: ${g.category}; progresso: ${g.current_progress}%; status: ${g.status.replace(/_/g, " ")})`,
      );
    }
  } else {
    lines.push("\nSem metas terapêuticas associadas no período.");
  }
  lines.push(
    "\nRedija a análise profissional do mês com base nesses dados.",
  );
  return lines.join("\n");
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

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  // Defesa em profundidade: exige sessão válida mesmo se verify_jwt cair.
  const authed = await getAuthedUser(req);
  if (!authed) {
    return json({ error: "Não autenticado." }, 401);
  }

  // Custo de LLM por clique: 20 gerações por usuário por hora é folga para uso
  // clínico legítimo e barra script/loop acidental.
  if (!(await withinRateLimit(authed.client, "claude-analysis", 20, 3600))) {
    return json(
      { error: "Limite de gerações com IA atingido. Tente novamente em alguns minutos." },
      429,
    );
  }

  const apiKey = Deno.env.get("CLAUDE_KEY");
  if (!apiKey) {
    return json({ error: "CLAUDE_KEY não configurada no servidor." }, 500);
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
  if (payload.goals && payload.goals.length > MAX_GOALS) {
    return json({ error: "Número de metas excede o limite." }, 413);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildUserPrompt(payload) }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return json({ text });
  } catch (e) {
    // Loga o detalhe no servidor; ao cliente, mensagem genérica.
    console.error("claude-analysis error:", e);
    return json({ error: "Falha ao gerar análise." }, 502);
  }
});
