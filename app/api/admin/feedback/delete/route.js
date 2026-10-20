import { NextResponse } from 'next/server'

import { verifyAnyAdminCredentials } from '@/lib/server/admin-accounts'
import { verifyDeveloperMasterPassword } from '@/lib/server/admin-password'
import { clientAddress, hitRateLimit } from '@/lib/server/rate-limit'
import { supabaseAdminRest } from '@/lib/server/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const INT_ID_RE = /^[1-9][0-9]{0,18}$/

/** Accept a UUID string or a numeric primary key from JSON. */
function feedbackIdFromBody(value) {
  const id =
    typeof value === 'number' && Number.isSafeInteger(value)
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : ''
  if (UUID_RE.test(id) || INT_ID_RE.test(id)) return id
  return ''
}

/**
 * POST { email, password, developerPassword, id } — delete one feedback row.
 */
export async function POST(request) {
  if (hitRateLimit(`admin-delete:${clientAddress(request)}`, 12, 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Too many delete attempts. Wait a minute and try again.' },
      { status: 429 },
    )
  }

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

  const id = feedbackIdFromBody(body?.id)
  if (!id) {
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
