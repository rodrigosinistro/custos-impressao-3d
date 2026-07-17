import { createClient } from 'npm:@supabase/supabase-js@2';

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
  const authorization = request.headers.get('Authorization') || '';

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return jsonResponse({ error: 'A função de convite não está configurada no Supabase.' }, 500, origin);
  }

  if (!authorization.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Sessão não encontrada.' }, 401, origin);
  }

  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const fullName = String(body?.fullName || '').trim();
    const redirectTo = String(body?.redirectTo || '').trim();

    if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Informe nome e e-mail válidos.' }, 400, origin);
    }

    let redirectUrl: URL;
    try {
      redirectUrl = new URL(redirectTo);
    } catch (_) {
      return jsonResponse({ error: 'Endereço de retorno inválido.' }, 400, origin);
    }

    if (!['http:', 'https:'].includes(redirectUrl.protocol) || (origin && redirectUrl.origin !== origin)) {
      return jsonResponse({ error: 'O endereço de retorno não pertence ao site atual.' }, 400, origin);
    }

    const callerClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authorization.replace(/^Bearer\s+/i, '');
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(token);

    if (callerError || !callerData.user) {
      return jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401, origin);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, account_owner_id')
      .eq('id', callerData.user.id)
      .single();

    if (
      profileError
      || callerProfile?.role !== 'admin'
      || (callerProfile.account_owner_id && callerProfile.account_owner_id !== callerData.user.id)
    ) {
      return jsonResponse({ error: 'Somente o administrador pode convidar usuários.' }, 403, origin);
    }

    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingProfile) {
      return jsonResponse({ error: 'Já existe um usuário cadastrado com este e-mail.' }, 409, origin);
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl.href,
      data: { full_name: fullName },
    });

    if (inviteError || !inviteData.user) {
      return jsonResponse({ error: inviteError?.message || 'Não foi possível enviar o convite.' }, 400, origin);
    }

    const { error: memberError } = await adminClient
      .from('profiles')
      .upsert({
        id: inviteData.user.id,
        email,
        full_name: fullName,
        role: 'staff',
        account_owner_id: callerData.user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (memberError) {
      await adminClient.auth.admin.deleteUser(inviteData.user.id);
      return jsonResponse({ error: 'O convite não pôde ser associado à equipe.' }, 500, origin);
    }

    return jsonResponse({
      user: {
        id: inviteData.user.id,
        email,
        full_name: fullName,
        role: 'staff',
      },
    }, 200, origin);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Erro inesperado ao enviar o convite.' }, 500, origin);
  }
});
