import { createOwnedRepository } from './baseSupabaseRepository.js';
import { getSupabase } from '../../lib/supabaseClient.js';

const repository = createOwnedRepository('clients');

export const clientsRepository = {
  ...repository,
  async publicRegister(input) {
    const { data, error } = await getSupabase().rpc('register_public_client', {
      p_owner_id: input.ownerId,
      p_name: input.name,
      p_email: input.email || null,
      p_phone: input.phone || null,
      p_whatsapp: input.whatsapp || null,
      p_notes: input.notes || null,
    });
    if (error) throw error;
    return data;
  },
};
