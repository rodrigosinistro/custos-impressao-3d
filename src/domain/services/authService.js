import { getSupabase } from '../../lib/supabaseClient.js';

const listeners = new Set();
const state = {
  initialized: false,
  session: null,
  user: null,
  profile: null,
};

let authSubscription = null;
let initPromise = null;

function snapshot() {
  return JSON.stringify({
    userId: state.user?.id ?? null,
    accessToken: state.session?.access_token ?? null,
    role: state.profile?.role ?? null,
  });
}

function notify() {
  const current = getState();
  listeners.forEach((listener) => listener(current));
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

async function applySession(session, { notifyListeners = true } = {}) {
  const before = snapshot();

  state.session = session ?? null;
  state.user = session?.user ?? null;

  try {
    await loadProfile();
  } catch (error) {
    console.error(error);
    state.profile = null;
  }

  const after = snapshot();
  if (notifyListeners && before !== after) {
    notify();
  }

  return getState();
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
  getState,

  async initialize() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const supabase = getSupabase();

      if (!authSubscription) {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!state.initialized) {
            state.session = session ?? null;
            state.user = session?.user ?? null;
            state.profile = null;
            return;
          }

          queueMicrotask(() => {
            applySession(session, { notifyListeners: true }).catch((error) => {
              console.error(error);
            });
          });
        });
        authSubscription = data.subscription;
      }

      if (!state.initialized) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        state.initialized = true;
        await applySession(data.session, { notifyListeners: false });
      }

      return getState();
    })();

    try {
      return await initPromise;
    } finally {
      initPromise = null;
    }
  },

  async login(email, password) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    await applySession(data.session, { notifyListeners: false });
    return data;
  },

  async logout() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    await applySession(null, { notifyListeners: true });
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
