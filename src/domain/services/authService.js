import { getSupabase } from '../../lib/supabaseClient.js';

const listeners = new Set();
const state = {
  initialized: false,
  session: null,
  user: null,
  profile: null,
};

let authSubscription = null;

function notify() {
  listeners.forEach((listener) => listener(getState()));
}

async function loadProfile() {
  if (!state.user) {
    state.profile = null;
    return null;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', state.user.id)
    .maybeSingle();
  if (error) throw error;
  state.profile = data || null;
  return state.profile;
}

export function getState() {
  return {
    initialized: state.initialized,
    session: state.session,
    user: state.user,
    profile: state.profile,
  };
}

export const authService = {
  async initialize() {
    if (!authSubscription) {
      const supabase = getSupabase();
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        state.session = session;
        state.user = session?.user ?? null;
        try {
          await loadProfile();
        } catch (error) {
          console.error(error);
          state.profile = null;
        }
        notify();
      });
      authSubscription = data.subscription;
    }

    if (!state.initialized) {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      state.session = data.session;
      state.user = data.session?.user ?? null;
      await loadProfile();
      state.initialized = true;
    }
    return getState();
  },

  async login(email, password) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    state.session = data.session;
    state.user = data.user;
    await loadProfile();
    notify();
    return data;
  },

  async logout() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    state.session = null;
    state.user = null;
    state.profile = null;
    notify();
  },

  async refreshProfile() {
    await loadProfile();
    notify();
    return state.profile;
  },

  isAuthenticated() {
    return Boolean(state.session?.access_token);
  },

  isAdmin() {
    return state.profile?.role === 'admin';
  },

  getUserId() {
    return state.user?.id ?? null;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
