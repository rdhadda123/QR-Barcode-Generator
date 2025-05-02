import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SBURL;
  const key = process.env.NEXT_PUBLIC_SBKEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are not set');
  }

  return createClient(url, key);
}
