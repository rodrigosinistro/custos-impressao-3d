import { getSupabase } from '../../lib/supabaseClient.js';
import { authService } from '../../domain/services/authService.js';

function getOwnerId() {
  const ownerId = authService.getAccountOwnerId();
  if (!ownerId) throw new Error('Sessão não encontrada.');
  return ownerId;
}

function addDaysDateString(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildQuoteProductionPayload(quote) {
  return {
    quote_id: quote.id,
    client_id: quote.client_id || null,
    client_name: quote.client_name || '',
    piece_name: quote.piece_name || 'Peça sem nome',
    printer_id: quote.printer_id || null,
    printer_name: quote.printer_name || '',
    material_id: quote.material_id || null,
    material_name: quote.material_name || '',
    quantity: 1,
    weight_g: Number(quote.weight_g || 0),
    print_time_minutes: Number(quote.print_time_minutes || 0),
    final_price: Number(quote.final_price || 0),
    expected_profit: Number(quote.expected_profit || 0),
    status: 'queued',
    queued_at: new Date().toISOString(),
    due_date: addDaysDateString(7),
    notes: quote.notes || '',
  };
}

export const productionRepository = {
  async getAll() {
    const ownerId = getOwnerId();
    const { data, error } = await getSupabase()
      .from('production_items')
      .select('*')
      .eq('owner_id', ownerId)
      .order('queued_at', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    if (!id) return null;
    const ownerId = getOwnerId();
    const { data, error } = await getSupabase()
      .from('production_items')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async getByQuoteId(quoteId) {
    if (!quoteId) return null;
    const ownerId = getOwnerId();
    const { data, error } = await getSupabase()
      .from('production_items')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('quote_id', quoteId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async save(item) {
    const ownerId = getOwnerId();
    const payload = { ...item, owner_id: ownerId };
    if (payload.id) {
      payload.updated_at = new Date().toISOString();
      const { data, error } = await getSupabase()
        .from('production_items')
        .update(payload)
        .eq('id', payload.id)
        .eq('owner_id', ownerId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await getSupabase()
      .from('production_items')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    const now = new Date().toISOString();
    const patch = { id, status };
    if (status === 'finished') patch.completed_at = now;
    if (status === 'delivered') {
      patch.completed_at = now;
      patch.delivered_at = now;
    }
    return this.save(patch);
  },

  async createFromQuote(quote) {
    const existing = await this.getByQuoteId(quote.id);
    if (existing) return { item: existing, alreadyExisted: true };

    try {
      const item = await this.save(buildQuoteProductionPayload(quote));
      return { item, alreadyExisted: false };
    } catch (error) {
      if (String(error?.code || '') === '23505') {
        const item = await this.getByQuoteId(quote.id);
        if (item) return { item, alreadyExisted: true };
      }
      throw error;
    }
  },

  async remove(id) {
    const ownerId = getOwnerId();
    const { error } = await getSupabase()
      .from('production_items')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);
    if (error) throw error;
    return true;
  },
};
