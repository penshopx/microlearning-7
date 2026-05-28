import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function createNoopProxy(): SupabaseClient<Database> {
  const noopResult = { data: null, error: null, count: null, status: 200, statusText: 'OK' };

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
      if (prop === 'then') return undefined;
      if (prop === 'toJSON') return () => ({});
      return (..._args: any[]) => createChainableProxy();
    },
  });
}

let supabase: SupabaseClient<Database>;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Missing Supabase environment variables. Supabase features will not work until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.');
  supabase = createNoopProxy();
} else {
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

export { supabase };
