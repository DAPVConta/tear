// Edge Function: clinic-admin-user
// Criação/gestão do usuário administrador de uma clínica pelo módulo Clínicas
// (Super Admin). Criar um usuário no Supabase Auth exige a service role, que
// NUNCA pode chegar ao navegador — por isso a operação vive aqui.
//
// Regras:
//   - Só platform_admin executa (JWT verificado + checagem do platform_role).
//   - `create`: cria o usuário no Auth (ou reaproveita um e-mail já existente)
//     e vincula à clínica como `clinic_owner` (ou `clinic_admin`).
//   - `reset_password`: define uma nova senha para um administrador da clínica.
//   - A senha temporária é devolvida UMA única vez, para o Super Admin repassar
//     ao responsável; não é persistida em lugar nenhum.
//
// Ações:
//   { action: "create", clinicId, name, email, password?, role? }
//   { action: "reset_password", clinicId, userId, password? }
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.46.1";

const MAX_BODY_BYTES = 16 * 1024;

// --- CORS (mesmo padrão das demais funções: allowlist + previews Vercel) ---
const DEFAULT_ORIGINS = ["https://www.apptear.com", "https://apptear.com"];
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

// Rate limit por usuário (RPC check_rate_limit, migração 0038). Fail-open:
// se a RPC falhar/não existir, loga e deixa passar — a função já exige
// platform_admin; o limite barra loop/script acidental em ação sensível.
async function withinRateLimit(
  client: SupabaseClient,
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

function getServiceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Senha temporária forte e legível para ditar por telefone se preciso.
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const symbols = "!@#$%&*";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  const core = Array.from(bytes.slice(0, 12), (n) => alphabet[n % alphabet.length]).join("");
  return `${core}${symbols[bytes[12] % symbols.length]}${bytes[13] % 10}`;
}

type Action = "create" | "reset_password";

type Payload = {
  action?: Action;
  clinicId?: number;
  name?: string;
  email?: string;
  password?: string;
  role?: "clinic_owner" | "clinic_admin";
  userId?: string;
};

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405, req);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "Requisição muito grande" }, 413, req);
  }

  const userClient = getUserClient(req);
  if (!userClient) return json({ error: "Não autenticado" }, 401, req);
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: "Não autenticado" }, 401, req);
  }

  const admin = getServiceClient();
  if (!admin) {
    return json(
      { error: "Função não configurada (SUPABASE_SERVICE_ROLE_KEY ausente)." },
      500,
      req,
    );
  }

  // Autorização: apenas Super Admin da plataforma.
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profile?.platform_role !== "platform_admin") {
    return json(
      { error: "Apenas administradores da plataforma podem executar esta ação." },
      403,
      req,
    );
  }

  // Criação de usuário/reset de senha: 30 por hora cobre qualquer implantação
  // real e barra automação descontrolada com credencial de platform_admin.
  if (!(await withinRateLimit(userClient, "clinic-admin-user", 30, 3600))) {
    return json(
      { error: "Muitas operações em sequência. Tente novamente em alguns minutos." },
      429,
      req,
    );
  }

  let payload: Payload;
  try {
    payload = raw ? (JSON.parse(raw) as Payload) : {};
  } catch {
    return json({ error: "JSON inválido" }, 400, req);
  }

  const clinicId = Number(payload.clinicId);
  if (!Number.isFinite(clinicId) || clinicId <= 0) {
    return json({ error: "Clínica inválida" }, 400, req);
  }

  const { data: clinic } = await admin
    .from("clinics")
    .select("id, name")
    .eq("id", clinicId)
    .maybeSingle();
  if (!clinic) return json({ error: "Clínica não encontrada" }, 404, req);

  try {
    if (payload.action === "reset_password") {
      const userId = (payload.userId ?? "").trim();
      if (!userId) return json({ error: "Usuário inválido" }, 400, req);

      // O usuário precisa ser membro desta clínica (evita usar a função como
      // troca de senha genérica da plataforma).
      const { data: membership } = await admin
        .from("clinic_members")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!membership) {
        return json({ error: "Usuário não pertence a esta clínica" }, 404, req);
      }

      const password = payload.password?.trim() || generatePassword();
      if (password.length < 8) {
        return json({ error: "A senha deve ter ao menos 8 caracteres" }, 400, req);
      }
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return json({ userId, password }, 200, req);
    }

    // --- create ---
    const name = (payload.name ?? "").trim();
    const email = (payload.email ?? "").trim().toLowerCase();
    const role = payload.role === "clinic_admin" ? "clinic_admin" : "clinic_owner";
    if (!name) return json({ error: "Informe o nome do administrador" }, 400, req);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "E-mail inválido" }, 400, req);
    }
    const password = payload.password?.trim() || generatePassword();
    if (password.length < 8) {
      return json({ error: "A senha deve ter ao menos 8 caracteres" }, 400, req);
    }

    // Reaproveita o usuário quando o e-mail já existe no Auth (ex.: profissional
    // que já atua em outra clínica) em vez de falhar com "already registered".
    let userId: string | null = null;
    let created = false;
    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (createError) {
      const alreadyExists = /already|exists|registered|duplicate/i.test(
        createError.message ?? "",
      );
      if (!alreadyExists) throw createError;
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      userId = existing?.id ?? null;
      if (!userId) {
        return json(
          {
            error:
              "Este e-mail já existe no Auth, mas não foi possível localizar o perfil correspondente.",
          },
          409,
          req,
        );
      }
    } else {
      userId = createdUser.user?.id ?? null;
      created = true;
    }
    if (!userId) return json({ error: "Falha ao criar o usuário" }, 500, req);

    // O trigger handle_new_user cria o profile; o upsert garante nome/e-mail
    // atualizados (e cobre o caminho de usuário pré-existente).
    await admin
      .from("profiles")
      .upsert({ id: userId, name, email }, { onConflict: "id" });

    const { error: memberError } = await admin.from("clinic_members").upsert(
      {
        clinic_id: clinicId,
        user_id: userId,
        role,
        active: true,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "clinic_id,user_id" },
    );
    if (memberError) throw memberError;

    return json(
      {
        userId,
        email,
        created,
        // Só faz sentido devolver a senha do usuário recém-criado.
        password: created ? password : null,
        role,
      },
      200,
      req,
    );
  } catch (e) {
    console.error("clinic-admin-user:", e);
    return json(
      { error: e instanceof Error ? e.message : "Erro inesperado" },
      500,
      req,
    );
  }
});
