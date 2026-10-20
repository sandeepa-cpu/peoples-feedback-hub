import { NextResponse } from 'next/server'

import { verifyAnyAdminCredentials } from '@/lib/server/admin-accounts'
import { isAdminPasswordConfigured } from '@/lib/server/admin-password'
import { clientAddress, hitRateLimit } from '@/lib/server/rate-limit'

/**
 * Server-only admin login: built-in email + ADMIN_PASSWORD, or a stored admin account.
 */
export async function POST(request) {
  if (hitRateLimit(`admin-auth:${clientAddress(request)}`, 8, 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Too many sign-in attempts. Wait a minute and try again.' },
      { status: 429 },
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Incorrect email or password' },
      { status: 401 },
    )
  }

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password.trim() : ''

  if (await verifyAnyAdminCredentials(email, password)) {
    return NextResponse.json({ success: true })
  }

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

  return NextResponse.json(
    { success: false, error: 'Incorrect email or password' },
    { status: 401 },
  )
}
