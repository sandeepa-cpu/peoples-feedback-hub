import { NextResponse } from 'next/server'

import {
  isAdminPasswordConfigured,
  verifyAdminCredentials,
  verifyAdminEmail,
} from '@/lib/server/admin-password'

/**
 * Server-only admin login: email + password.
 * Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Vercel / .env.local (no NEXT_PUBLIC_).
 */
export async function POST(request) {
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

  if (!verifyAdminEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'Incorrect email or password' },
      { status: 401 },
    )
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json(
      { success: false, error: 'Incorrect email or password' },
      { status: 401 },
    )
  }

  return NextResponse.json({ success: true })
}
