import { NextResponse } from 'next/server'

import { verifyAnyAdminCredentials } from '@/lib/server/admin-accounts'
import { isAdminPasswordConfigured } from '@/lib/server/admin-password'

/**
 * Server-only admin login: built-in email + ADMIN_PASSWORD, or a stored admin account.
 */
export async function POST(request) {
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
