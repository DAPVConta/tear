// Edge Function: claude-analysis
// Gera a "Análise profissional" da evolução mensal a partir dos dados clínicos
// já agregados (síntese, metas, frequência). A chave da API Claude fica em
// segredo no servidor (CLAUDE_KEY) — nunca chega ao navegador. Recebe apenas
// agregados clínicos (sem nome/CPF do paciente) para minimizar exposição de
// dados pessoais (LGPD). Requer JWT válido (verify_jwt + checagem em código).
import Anthropic from "npm:@anthropic-ai/sdk@0.69.0";
import { corsHeaders, getAuthedUser } from "../_shared/auth.ts";

// Limite defensivo do corpo da requisição (agregados são pequenos).
const MAX_BODY_BYTES = 64 * 1024;
const MAX_GOALS = 200;

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
  const user = await getAuthedUser(req);
  if (!user) {
    return json({ error: "Não autenticado." }, 401);
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
