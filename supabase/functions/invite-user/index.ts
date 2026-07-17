import { createClient } from "npm:@supabase/supabase-js@2";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function defaultKeyFromJson(environmentName: string) {
  const rawValue = Deno.env.get(environmentName) || "";
  if (!rawValue) return "";

  try {
    const keys = JSON.parse(rawValue) as Record<string, unknown>;
    const preferredKey = keys.default;
    if (typeof preferredKey === "string") return preferredKey;
    const firstKey = Object.values(keys).find((value) =>
      typeof value === "string"
    );
    return typeof firstKey === "string" ? firstKey : "";
  } catch (_) {
    return "";
  }
}

function validateRedirectUrl(rawValue: string, origin: string | null) {
  let redirectUrl: URL;
  try {
    redirectUrl = new URL(rawValue);
  } catch (_) {
    throw new Error("Endereço de retorno inválido.");
  }

  if (
    !["http:", "https:"].includes(redirectUrl.protocol) ||
    (origin && redirectUrl.origin !== origin)
  ) {
    throw new Error("O endereço de retorno não pertence ao site atual.");
  }

  return redirectUrl;
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = request.headers.get("apikey") ||
    Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    defaultKeyFromJson("SUPABASE_PUBLISHABLE_KEYS");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    defaultKeyFromJson("SUPABASE_SECRET_KEYS");
  const authorization = request.headers.get("Authorization") || "";

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return jsonResponse(
      { error: "A função de usuários não está configurada no Supabase." },
      500,
      origin,
    );
  }

  if (!authorization.startsWith("Bearer ")) {
    return jsonResponse({ error: "Sessão não encontrada." }, 401, origin);
  }

  try {
    const body = await request.json();
    const action = String(body?.action || "invite");

    if (!["invite", "reset-password", "delete"].includes(action)) {
      return jsonResponse({ error: "Ação de usuário inválida." }, 400, origin);
    }

    const callerClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: callerData, error: callerError } = await callerClient.auth
      .getUser(token);

    if (callerError || !callerData.user) {
      console.warn(
        "Falha ao validar a sessão do administrador:",
        callerError?.message || "usuário ausente",
      );
      return jsonResponse(
        { error: "Sessão inválida ou expirada." },
        401,
        origin,
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, account_owner_id")
      .eq("id", callerData.user.id)
      .single();

    if (
      profileError ||
      callerProfile?.role !== "admin" ||
      (callerProfile.account_owner_id &&
        callerProfile.account_owner_id !== callerData.user.id)
    ) {
      return jsonResponse(
        { error: "Somente o administrador pode gerenciar usuários." },
        403,
        origin,
      );
    }

    if (action === "invite") {
      const email = String(body?.email || "").trim().toLowerCase();
      const fullName = String(body?.fullName || "").trim();
      const redirectTo = String(body?.redirectTo || "").trim();

      if (!fullName || !EMAIL_PATTERN.test(email)) {
        return jsonResponse(
          { error: "Informe nome e e-mail válidos." },
          400,
          origin,
        );
      }

      let redirectUrl: URL;
      try {
        redirectUrl = validateRedirectUrl(redirectTo, origin);
      } catch (error) {
        return jsonResponse(
          {
            error: error instanceof Error
              ? error.message
              : "Endereço de retorno inválido.",
          },
          400,
          origin,
        );
      }

      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (existingProfile) {
        return jsonResponse(
          { error: "Já existe um usuário cadastrado com este e-mail." },
          409,
          origin,
        );
      }

      const { data: inviteData, error: inviteError } = await adminClient.auth
        .admin.inviteUserByEmail(email, {
          redirectTo: redirectUrl.href,
          data: { full_name: fullName },
        });

      if (inviteError || !inviteData.user) {
        return jsonResponse(
          {
            error: inviteError?.message || "Não foi possível enviar o convite.",
          },
          400,
          origin,
        );
      }

      const { error: memberError } = await adminClient
        .from("profiles")
        .upsert({
          id: inviteData.user.id,
          email,
          full_name: fullName,
          role: "staff",
          account_owner_id: callerData.user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (memberError) {
        await adminClient.auth.admin.deleteUser(inviteData.user.id);
        return jsonResponse(
          { error: "O convite não pôde ser associado à equipe." },
          500,
          origin,
        );
      }

      return jsonResponse(
        {
          action,
          user: {
            id: inviteData.user.id,
            email,
            full_name: fullName,
            role: "staff",
          },
        },
        200,
        origin,
      );
    }

    const userId = String(body?.userId || "").trim();
    if (!UUID_PATTERN.test(userId) || userId === callerData.user.id) {
      return jsonResponse(
        { error: "Usuário da equipe inválido." },
        400,
        origin,
      );
    }

    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role, account_owner_id")
      .eq("id", userId)
      .maybeSingle();

    if (targetError || !targetProfile) {
      return jsonResponse(
        { error: "Usuário da equipe não encontrado." },
        404,
        origin,
      );
    }

    if (
      targetProfile.role !== "staff" ||
      targetProfile.account_owner_id !== callerData.user.id
    ) {
      return jsonResponse(
        { error: "Este usuário não pertence à sua equipe de orçamentistas." },
        403,
        origin,
      );
    }

    if (action === "reset-password") {
      const redirectTo = String(body?.redirectTo || "").trim();
      let redirectUrl: URL;
      try {
        redirectUrl = validateRedirectUrl(redirectTo, origin);
      } catch (error) {
        return jsonResponse(
          {
            error: error instanceof Error
              ? error.message
              : "Endereço de retorno inválido.",
          },
          400,
          origin,
        );
      }

      if (!targetProfile.email || !EMAIL_PATTERN.test(targetProfile.email)) {
        return jsonResponse(
          { error: "O usuário não possui um e-mail válido." },
          400,
          origin,
        );
      }

      const emailClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: resetError } = await emailClient.auth
        .resetPasswordForEmail(targetProfile.email, {
          redirectTo: redirectUrl.href,
        });

      if (resetError) {
        return jsonResponse(
          {
            error: resetError.message ||
              "Não foi possível enviar o link de acesso.",
          },
          400,
          origin,
        );
      }

      return jsonResponse({ action, user: targetProfile }, 200, origin);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      targetProfile.id,
    );
    if (deleteError) {
      return jsonResponse(
        { error: deleteError.message || "Não foi possível excluir o usuário." },
        400,
        origin,
      );
    }

    return jsonResponse({ action, user: targetProfile }, 200, origin);
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { error: "Erro inesperado ao gerenciar o usuário." },
      500,
      origin,
    );
  }
});
