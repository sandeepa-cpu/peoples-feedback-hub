import { NextResponse } from 'next/server'

import { verifyAnyAdminCredentials } from '@/lib/server/admin-accounts'
import { isAdminPasswordConfigured } from '@/lib/server/admin-password'
import { supabaseAdminRest } from '@/lib/server/supabase-admin'

/**
 * POST { email, password } — built-in admin or a stored admin account, then loads feedbacks.
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await verifyAnyAdminCredentials(body?.email, body?.password))) {
    if (!isAdminPasswordConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Authentication is not configured on the server. Set ADMIN_PASSWORD (and optionally ADMIN_EMAIL) then redeploy.',
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result = await supabaseAdminRest('feedbacks?select=*&order=created_at.desc')
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status >= 500 ? 502 : result.status },
    )
  }

  const data = Array.isArray(result.data) ? result.data : []
  return NextResponse.json({ success: true, data })
}
