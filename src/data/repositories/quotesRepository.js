import { createOwnedRepository } from './baseSupabaseRepository.js';
import { getSupabase } from '../../lib/supabaseClient.js';
import { authService } from '../../domain/services/authService.js';

const repository = createOwnedRepository('quotes');

const OPTIONAL_COLUMNS = [
  'calculated_final_price',
  'adjusted_price',
  'manual_adjusted_price',
  'discount_amount',
];

function getOwnerId() {
  const ownerId = authService.getUserId();
  if (!ownerId) throw new Error('Sessão não encontrada.');
  return ownerId;
}

function stripOptionalColumns(item) {
  const payload = { ...item };
  for (const column of OPTIONAL_COLUMNS) delete payload[column];
  return payload;
}

function isMissingColumnError(error) {
  const message = String(error?.message || '');
  return /schema cache|adjusted_price|manual_adjusted_price|discount_amount|calculated_final_price/i.test(message);
}

export const quotesRepository = {
  ...repository,
  async save(item) {
    const ownerId = getOwnerId();
    const payload = { ...item, owner_id: ownerId };
    const supabase = getSupabase();

    const performSave = async (candidate) => {
      if (candidate.id) {
        candidate.updated_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('quotes')
          .update(candidate)
          .eq('id', candidate.id)
          .eq('owner_id', ownerId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('quotes')
        .insert(candidate)
        .select()
        .single();
      if (error) throw error;
      return data;
    };

    try {
      return await performSave(payload);
    } catch (error) {
      if (!isMissingColumnError(error)) throw error;

      const legacyPayload = stripOptionalColumns(payload);
      return await performSave(legacyPayload);
    }
  },
};
