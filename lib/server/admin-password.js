import { timingSafeEqual } from 'node:crypto'

const DEVELOPER_MASTER_PASSWORD = '4321@'

const DEFAULT_ADMIN_EMAILS = [
  'lakshithakalyanarathna@gmail.com',
  'djeewanipbsales@gmail.com',
  'sewminiayeshapbicing@gmail.com',
  'pbhotline1@gmail.com',
]

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function passwordsMatch(passwordInput, expectedRaw) {
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

/** Constant-time check of the developer master password. Never send the expected value to the browser. */
export function verifyDeveloperMasterPassword(passwordInput) {
  return passwordsMatch(passwordInput, DEVELOPER_MASTER_PASSWORD)
}

/** Built-in admin emails plus any comma-separated `ADMIN_EMAIL` values. */
export function listBuiltinAdminEmails() {
  return getExpectedAdminEmails()
}

/** `ADMIN_EMAIL` supports a comma-separated list; merged with built-in defaults (no duplicates). */
function getExpectedAdminEmails() {
  const raw = typeof process.env.ADMIN_EMAIL === 'string' ? process.env.ADMIN_EMAIL : ''
  const fromEnv = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)

  return [...new Set([...fromEnv, ...DEFAULT_ADMIN_EMAILS])]
}

/**
 * Constant-time comparison of body password to `ADMIN_PASSWORD`.
 * @returns {boolean}
 */
export function verifyAdminPassword(passwordInput) {
  const expectedRaw = process.env.ADMIN_PASSWORD
  return passwordsMatch(passwordInput, expectedRaw)
}

/**
 * Allowed admin email check (case-insensitive).
 * `ADMIN_EMAIL` can list multiple emails separated by commas;
 * defaults to the built-in admin email list when unset.
 * @returns {boolean}
 */
export function verifyAdminEmail(emailInput) {
  const email = normalizeEmail(emailInput)
  if (!email) return false

  const a = Buffer.from(email, 'utf8')

  // Check every allowed email (constant-time per comparison)
  let matched = false
  for (const expected of getExpectedAdminEmails()) {
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) continue
    try {
      if (timingSafeEqual(a, b)) matched = true
    } catch {
      /* skip */
    }
  }
  return matched
}

/** Email + password must both pass. */
export function verifyAdminCredentials(emailInput, passwordInput) {
  return verifyAdminEmail(emailInput) && verifyAdminPassword(passwordInput)
}

/** @returns {boolean} */
export function isAdminPasswordConfigured() {
  const expectedRaw = process.env.ADMIN_PASSWORD
  const expected = typeof expectedRaw === 'string' ? expectedRaw.trim() : ''
  return expected.length > 0
}
