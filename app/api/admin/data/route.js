import { createClient } from '@supabase/supabase-js'

import { NextResponse } from 'next/server'

import { verifyAdminPassword } from '@/lib/server/admin-password'

function getSupabaseProjectUrl() {
  const fromPublic =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
      : ''
  const fromSecret = typeof process.env.SUPABASE_URL === 'string' ? process.env.SUPABASE_URL.trim() : ''
  return fromPublic || fromSecret || ''
}

/**
 * POST { password } — validates admin password, then loads `feedbacks` with service role (bypasses RLS).
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!verifyAdminPassword(body?.password)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const url = getSupabaseProjectUrl()
  const serviceKey =
    typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
      : ''

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Server is not configured for admin data. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      },
      { status: 503 },
    )
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load feedback data.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}
