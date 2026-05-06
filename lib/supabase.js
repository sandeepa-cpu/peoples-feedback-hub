import { createClient } from "@supabase/supabase-js";

/**
 * Client reads Vercel / local env at build & runtime (NEXT_PUBLIC_* is inlined in bundles).
 * Set both in Vercel: Settings → Environment Variables.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === "undefined") {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
