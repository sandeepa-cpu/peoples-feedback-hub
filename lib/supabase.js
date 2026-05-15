import { createClient } from '@supabase/supabase-js'

/**
 * Must match Vercel Environment Variables exactly:
 * NEXT_PUBLIC_SUPABASE_URL
 * NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
function trimEnv(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getSupabasePublicEnv() {
  return {
    url: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  }
}

/** True when both vars are non-empty (after trim). */
export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabasePublicEnv()
  return Boolean(url && anonKey)
}

/**
 * Builds credentials without invalid hosts that cause server-side `fetch failed`.
 * Fallback URL is your Supabase project ref (public); anon key must come from env for real data.
 */
function resolveCredentials() {
  const { url, anonKey } = getSupabasePublicEnv()
  const PUBLIC_PROJECT_URL = 'https://xyyhrnykodkcsaoliyef.supabase.co'
  const DEMO_ANON_JWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

  return {
    url: url || PUBLIC_PROJECT_URL,
    anonKey: anonKey || DEMO_ANON_JWT,
  }
}

const creds = resolveCredentials()

/** Shared singleton for the feedback form and other callers. */
export const supabase = createClient(creds.url, creds.anonKey)

/** Fresh client from current env — prefer for browser-only flows so NEXT_PUBLIC_* matches the bundle. */
export function createSupabaseClient() {
  const { url, anonKey } = resolveCredentials()
  return createClient(url, anonKey)
}
