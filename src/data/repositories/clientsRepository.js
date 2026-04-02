import { createOwnedRepository } from './baseSupabaseRepository.js';
import { getSupabase } from '../../lib/supabaseClient.js';

const repository = createOwnedRepository('clients');

export const clientsRepository = {
  ...repository,
  async publicRegister(input) {
    const payload = {
      owner_id: input.ownerId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      notes: input.notes || null,
      source: 'public_form',
    };
    const { data, error } = await getSupabase().from('clients').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
};
