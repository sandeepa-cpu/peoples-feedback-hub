import { NextResponse } from 'next/server'

import { createStoredAdmin, listAllAdminEmails, verifyAnyAdminCredentials } from '@/lib/server/admin-accounts'
import { verifyDeveloperMasterPassword } from '@/lib/server/admin-password'
import { clientAddress, hitRateLimit } from '@/lib/server/rate-limit'

async function requireAdminAndDeveloper(body) {
  if (!(await verifyAnyAdminCredentials(body?.email, body?.password))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (!verifyDeveloperMasterPassword(body?.developerPassword)) {
    return NextResponse.json({ success: false, error: 'Incorrect developer password' }, { status: 403 })
  }
  return null
}

/** POST { email, password } lists admins. Include developerPassword plus newEmail/newPassword to create one. */
export async function POST(request) {
  if (hitRateLimit(`admin-accounts:${clientAddress(request)}`, 12, 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Too many admin account attempts. Wait a minute and try again.' },
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

  const creating = typeof body?.newEmail === 'string' && body.newEmail.trim().length > 0
  if (creating) {
    const denied = await requireAdminAndDeveloper(body)
    if (denied) return denied
    const created = await createStoredAdmin(body.newEmail, body?.newPassword)
    if (!created.ok) {
      return NextResponse.json({ success: false, error: created.error }, { status: created.status })
    }
  }

  const listed = await listAllAdminEmails()
  return NextResponse.json({
    success: true,
    emails: listed.emails,
    storedError: listed.storedError,
  })
}
