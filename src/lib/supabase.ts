import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Per-request client authenticated as the calling user, for use inside
 * server actions that write to RLS-protected tables. The shared `supabase`
 * client above carries no session on the server, so `auth.uid()` is NULL
 * for any query made with it — this attaches the caller's access token so
 * RLS policies keyed on `auth.uid()` resolve correctly.
 */
export function createAuthedClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
