import { createOwnedRepository } from './baseSupabaseRepository.js';
import { getSupabase } from '../../lib/supabaseClient.js';

const repository = createOwnedRepository('clients');

export const clientsRepository = {
  ...repository,
  async publicRegister(input) {
    const payload = {
      owner_id: input.ownerId,
      name: String(input.name || '').trim(),
      email: String(input.email || '').trim() || null,
      phone: String(input.phone || '').trim() || null,
      whatsapp: String(input.whatsapp || '').trim() || null,
      notes: String(input.notes || '').trim() || null,
      source: 'public_form',
    };

    const supabase = getSupabase();

    const tryDirectInsert = async () => {
      const { error } = await supabase
        .from('clients')
        .insert(payload);
      if (error) throw error;
      return payload;
    };

    const tryRpc = async () => {
      const { data, error } = await supabase.rpc('register_public_client', {
        p_owner_id: payload.owner_id,
        p_name: payload.name,
        p_email: payload.email,
        p_phone: payload.phone,
        p_whatsapp: payload.whatsapp,
        p_notes: payload.notes,
      });
      if (error) throw error;
      return data;
    };

    try {
      return await tryDirectInsert();
    } catch (directError) {
      const directMessage = String(directError?.message || '');
      const isRlsIssue = /row-level security|violates row-level security|permission denied/i.test(directMessage);

      try {
        return await tryRpc();
      } catch (rpcError) {
        const rpcMessage = String(rpcError?.message || '');
        const missingRpc = /Could not find the function|schema cache/i.test(rpcMessage);

        if (isRlsIssue || missingRpc) {
          throw new Error('O cadastro público precisa da migração SQL v1.1.7 no Supabase para funcionar. Rode o arquivo supabase/migrations/v1.1.7-public-signup-and-quotes.sql no SQL Editor.');
        }

        throw rpcError;
      }
    }
  },
};
