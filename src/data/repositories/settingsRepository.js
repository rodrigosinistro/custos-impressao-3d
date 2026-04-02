import { getSupabase } from '../../lib/supabaseClient.js';
import { authService } from '../../domain/services/authService.js';

const DEFAULT_SETTINGS = {
  public_app_name: 'Custos de Impressão 3D',
  company_name: 'Minha Impressão 3D',
  company_whatsapp: '',
  currency: 'BRL',
  energy_cost_kwh: 1.15,
  default_failure_rate: 8,
  default_profit_margin: 40,
  default_tax_rate: 6,
  default_card_fee_rate: 4.99,
  default_labor_cost: 0,
  default_finishing_cost: 0,
  default_packaging_cost: 0,
  allow_public_client_signup: true,
};

export const settingsRepository = {
  defaults() {
    return { ...DEFAULT_SETTINGS };
  },

  async getPublicSite() {
    const { data, error } = await getSupabase()
      .from('site_settings')
      .select('*')
      .eq('allow_public_client_signup', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || { ...DEFAULT_SETTINGS, owner_id: null };
  },

  async getMine() {
    const ownerId = authService.getUserId();
    if (!ownerId) throw new Error('Sessão não encontrada.');
    const { data, error } = await getSupabase()
      .from('site_settings')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (error) throw error;
    return data || { ...DEFAULT_SETTINGS, owner_id: ownerId };
  },

  async save(nextSettings) {
    const ownerId = authService.getUserId();
    if (!ownerId) throw new Error('Sessão não encontrada.');
    const payload = {
      ...DEFAULT_SETTINGS,
      ...nextSettings,
      owner_id: ownerId,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await getSupabase()
      .from('site_settings')
      .upsert(payload, { onConflict: 'owner_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async exportSnapshot() {
    const ownerId = authService.getUserId();
    if (!ownerId) throw new Error('Sessão não encontrada.');
    const supabase = getSupabase();
    const [settings, clients, printers, materials, quotes] = await Promise.all([
      this.getMine(),
      supabase.from('clients').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
      supabase.from('printers').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
      supabase.from('materials').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
      supabase.from('quotes').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
    ]);

    for (const result of [clients, printers, materials, quotes]) {
      if (result.error) throw result.error;
    }

    return {
      exported_at: new Date().toISOString(),
      owner_id: ownerId,
      settings,
      clients: clients.data || [],
      printers: printers.data || [],
      materials: materials.data || [],
      quotes: quotes.data || [],
    };
  },
};
