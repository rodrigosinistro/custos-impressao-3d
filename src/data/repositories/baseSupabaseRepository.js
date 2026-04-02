import { getSupabase } from '../../lib/supabaseClient.js';
import { authService } from '../../domain/services/authService.js';

function getOwnerId() {
  const ownerId = authService.getUserId();
  if (!ownerId) throw new Error('Sessão não encontrada.');
  return ownerId;
}

export function createOwnedRepository(tableName, orderColumn = 'created_at') {
  return {
    async getAll() {
      const ownerId = getOwnerId();
      const { data, error } = await getSupabase()
        .from(tableName)
        .select('*')
        .eq('owner_id', ownerId)
        .order(orderColumn, { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async getById(id) {
      if (!id) return null;
      const ownerId = getOwnerId();
      const { data, error } = await getSupabase()
        .from(tableName)
        .select('*')
        .eq('owner_id', ownerId)
        .eq('id', id)
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
          .from(tableName)
          .update(payload)
          .eq('id', payload.id)
          .eq('owner_id', ownerId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await getSupabase()
        .from(tableName)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async remove(id) {
      const ownerId = getOwnerId();
      const { error } = await getSupabase()
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('owner_id', ownerId);
      if (error) throw error;
      return true;
    },
  };
}
