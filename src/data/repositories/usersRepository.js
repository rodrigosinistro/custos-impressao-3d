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
    const { data, error } = await getSupabase().functions.invoke('invite-user', {
      body: {
        email: String(email || '').trim().toLowerCase(),
        fullName: String(fullName || '').trim(),
        redirectTo: getInviteRedirectUrl(),
      },
    });

    if (error) {
      let message = error.message;
      try {
        const details = await error.context?.json?.();
        message = details?.error || details?.message || message;
      } catch (_) {}
      throw new Error(message || 'Não foi possível enviar o convite.');
    }

    if (!data?.user) throw new Error('O Supabase não confirmou o envio do convite.');
    return data.user;
  },
};
