import { timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'

/**
 * Server-only admin password check.
 * Set `ADMIN_PASSWORD` in Vercel / .env (never use NEXT_PUBLIC_ for this value).
 */
export async function POST(request) {
  const expectedRaw = process.env.ADMIN_PASSWORD
  const expected = typeof expectedRaw === 'string' ? expectedRaw.trim() : ''

  if (!expected) {
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

  const a = Buffer.from(password, 'utf8')
  const b = Buffer.from(expected, 'utf8')

  if (a.length !== b.length) {
    return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 })
  }

  let match = false
  try {
    match = timingSafeEqual(a, b)
  } catch {
    match = false
  }

  if (match) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 })
}
