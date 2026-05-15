import { timingSafeEqual } from 'node:crypto'

/**
 * Constant-time comparison of body password to `ADMIN_PASSWORD`.
 * @returns {boolean}
 */
export function verifyAdminPassword(passwordInput) {
  const expectedRaw = process.env.ADMIN_PASSWORD
  const expected = typeof expectedRaw === 'string' ? expectedRaw.trim() : ''
  if (!expected) return false

  const password = typeof passwordInput === 'string' ? passwordInput.trim() : ''
  const a = Buffer.from(password, 'utf8')
  const b = Buffer.from(expected, 'utf8')

  if (a.length !== b.length) return false

  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** @returns {boolean} */
export function isAdminPasswordConfigured() {
  const expectedRaw = process.env.ADMIN_PASSWORD
  const expected = typeof expectedRaw === 'string' ? expectedRaw.trim() : ''
  return expected.length > 0
}
