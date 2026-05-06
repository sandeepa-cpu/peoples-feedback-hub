import { createClient } from "@supabase/supabase-js";

/** Project ref: `xyyhrnykodkcsaoliyef`. Override with `NEXT_PUBLIC_SUPABASE_URL` if needed. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://xyyhrnykodkcsaoliyef.supabase.co";

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseAnonKey) {
  console.warn(
    "[supabase] Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (Project Settings → API → anon public).",
  );
}

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey);
