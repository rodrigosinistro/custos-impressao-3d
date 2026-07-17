import { getSupabase } from '../../lib/supabaseClient.js';

export const clientDirectoryRepository = {
  async getAll() {
    const { data, error } = await getSupabase().rpc('list_client_directory');
    if (error) throw error;
    return data || [];
  },
};
