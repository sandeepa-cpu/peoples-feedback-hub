import { NextResponse } from 'next/server'

import { verifyAnyAdminCredentials } from '@/lib/server/admin-accounts'
import { verifyDeveloperMasterPassword } from '@/lib/server/admin-password'
import { supabaseAdminRest } from '@/lib/server/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * POST { email, password, developerPassword, id } — delete one feedback row.
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await verifyAnyAdminCredentials(body?.email, body?.password))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!verifyDeveloperMasterPassword(body?.developerPassword)) {
    return NextResponse.json({ success: false, error: 'Incorrect developer password' }, { status: 403 })
  }

  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid feedback id' }, { status: 400 })
  }

  const result = await supabaseAdminRest(`feedbacks?id=eq.${id}`, { method: 'DELETE' })
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status >= 500 ? 502 : result.status },
    )
  }

  return NextResponse.json({ success: true })
}
