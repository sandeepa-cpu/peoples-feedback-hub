import { NextResponse } from 'next/server'

import { verifyAdminPassword } from '@/lib/server/admin-password'

function getSupabaseHost() {
  const raw =
    (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
      : '') ||
    (typeof process.env.SUPABASE_URL === 'string' ? process.env.SUPABASE_URL.trim() : '')

  if (!raw) return ''

  return raw.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

/**
 * POST { password } — validates admin password, then loads `feedbacks` via Supabase REST (service role).
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

  const host = getSupabaseHost()
  const serviceKey =
    typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
      : ''

  if (!host || !serviceKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Server is not configured for admin data. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
      },
      { status: 503 },
    )
  }

  const supabaseRestUrl = `https://${host}/rest/v1/feedbacks?select=*&order=created_at.desc`

  let res
  try {
    res = await fetch(supabaseRestUrl, {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to reach Supabase.'
    return NextResponse.json({ success: false, error: msg }, { status: 502 })
  }

  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    const message =
      payload && typeof payload.message === 'string'
        ? payload.message
        : payload && typeof payload.error === 'string'
          ? payload.error
          : `Supabase request failed (${res.status}).`
    return NextResponse.json({ success: false, error: message }, { status: res.status >= 500 ? 502 : 500 })
  }

  const data = Array.isArray(payload) ? payload : []

  return NextResponse.json({ success: true, data })
}
