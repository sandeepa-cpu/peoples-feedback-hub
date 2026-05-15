import { createClient } from '@supabase/supabase-js'

/**
 * Vercel / local: set exactly these names (Project Settings → Environment Variables):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// createClient(undefined, ...) throws "supabaseKey is required". Treat missing/blank like unset.
const url = typeof supabaseUrl === 'string' && supabaseUrl.trim() !== '' ? supabaseUrl.trim() : null
const anonKey =
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.trim() !== '' ? supabaseAnonKey.trim() : null

// Non-empty placeholders so `next build` / Vercel never calls createClient with an invalid key.
// Live traffic uses real values from env when defined.
const urlForClient = url ?? 'https://placeholder.supabase.co'
const anonKeyForClient =
  anonKey ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(urlForClient, anonKeyForClient)
