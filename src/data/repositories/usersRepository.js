import { getAppConfig, getSupabase } from '../../lib/supabaseClient.js';
import { authService } from '../../domain/services/authService.js';

function getInviteRedirectUrl() {
  const configuredUrl = String(getAppConfig().PAGES_URL || '').trim();
  const baseUrl = configuredUrl || `${window.location.origin}${window.location.pathname}`;
  const url = new URL(baseUrl, window.location.href);
  url.searchParams.set('invite', '1');
  url.hash = '';
  return url.href;
}

async function invokeUserAction(body) {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }

  const { data, error } = await supabase.functions.invoke('invite-user', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });

  if (error) {
    let message = error.message;
    try {
      const details = await error.context?.json?.();
      message = details?.error || details?.message || message;
    } catch (_) {}
    throw new Error(message || 'Não foi possível gerenciar o usuário.');
  }

  if (!data?.user) throw new Error('O Supabase não confirmou a operação.');
  return data.user;
}

export const usersRepository = {
  async getAll() {
    const ownerId = authService.getAccountOwnerId();
    if (!ownerId) throw new Error('Sessão não encontrada.');

    const { data, error } = await getSupabase()
      .from('profiles')
      .select('id, email, full_name, role, account_owner_id, created_at')
      .eq('account_owner_id', ownerId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async invite({ email, fullName }) {
    return invokeUserAction({
      action: 'invite',
      email: String(email || '').trim().toLowerCase(),
      fullName: String(fullName || '').trim(),
      redirectTo: getInviteRedirectUrl(),
    });
  },

  async sendPasswordReset(userId) {
    return invokeUserAction({
      action: 'reset-password',
      userId: String(userId || ''),
      redirectTo: getInviteRedirectUrl(),
    });
  },

  async remove(userId) {
    return invokeUserAction({
      action: 'delete',
      userId: String(userId || ''),
    });
  },
};
