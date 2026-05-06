import { createClient } from '@supabase/supabase-js'

// Using hardcoded values as fallback to ensure Vercel build succeeds
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyyhrnykodkcsaoliyef.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4Ws0wkh4I6hNQ4FRnktMKw_Qb2oekw-'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
