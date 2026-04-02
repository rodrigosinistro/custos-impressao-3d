let client = null;

export function getAppConfig() {
  return window.APP_CONFIG || {};
}

export function hasSupabaseConfig() {
  const config = getAppConfig();
  return Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_ANON_KEY &&
    !String(config.SUPABASE_URL).includes('COLE_AQUI') &&
    !String(config.SUPABASE_ANON_KEY).includes('COLE_AQUI'),
  );
}

export function getSupabase() {
  if (client) return client;
  const config = getAppConfig();
  const factory = window.supabase?.createClient;
  if (!factory) {
    throw new Error('Biblioteca do Supabase não foi carregada.');
  }
  if (!hasSupabaseConfig()) {
    throw new Error('Configuração do Supabase ausente em config.js.');
  }
  client = factory(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
