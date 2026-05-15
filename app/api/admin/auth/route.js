import { NextResponse } from 'next/server'

import { isAdminPasswordConfigured, verifyAdminPassword } from '@/lib/server/admin-password'

/**
 * Server-only admin password check.
 * Set `ADMIN_PASSWORD` in Vercel / .env (never use NEXT_PUBLIC_ for this value).
 */
export async function POST(request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication is not configured on the server.',
      },
      { status: 503 },
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 })
  }

  const password = typeof body?.password === 'string' ? body.password.trim() : ''

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
