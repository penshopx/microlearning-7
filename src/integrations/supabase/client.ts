import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
export const isSupabaseConfigured = (() => {
  try {
    const url = new URL(SUPABASE_URL);
    return ["https:", "http:"].includes(url.protocol) && !!SUPABASE_PUBLISHABLE_KEY;
  } catch {
    return false;
  }
})();

function createNoopProxy(): SupabaseClient<Database> {
  const error = new Error("Konfigurasi login belum tersedia. Hubungi administrator aplikasi.");
  const noopResult = { data: null, error, count: null, status: 503, statusText: 'Unavailable' };
  const auth = {
    getSession: async () => ({ data: { session: null }, error }),
    getUser: async () => ({ data: { user: null }, error }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error }),
    signUp: async () => ({ data: { user: null, session: null }, error }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error }),
    signInWithOAuth: async () => ({ data: { url: null }, error }),
    resetPasswordForEmail: async () => ({ data: null, error }),
    updateUser: async () => ({ data: { user: null }, error }),
    exchangeCodeForSession: async () => ({ data: { session: null }, error }),
    setSession: async () => ({ data: { session: null }, error }),
  };

  function createChainableProxy(): any {
    const proxy: any = new Proxy(() => {}, {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: any) => resolve(noopResult);
        }
        if (prop === 'toJSON') return () => ({});
        return (..._args: any[]) => createChainableProxy();
      },
      apply() {
        return createChainableProxy();
      },
    });
    return proxy;
  }

  return new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop) {
      if (prop === 'auth') return auth;
      if (prop === 'then') return undefined;
      if (prop === 'toJSON') return () => ({});
      return (..._args: any[]) => createChainableProxy();
    },
  });
}

let supabase: SupabaseClient<Database>;

if (!isSupabaseConfigured) {
  console.warn('Missing Supabase environment variables. Supabase features will not work until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.');
  supabase = createNoopProxy();
} else {
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

export { supabase };
