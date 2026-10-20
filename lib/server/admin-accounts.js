import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import { listBuiltinAdminEmails, verifyAdminCredentials, isAdminPasswordConfigured } from './admin-password'
import { supabaseAdminRest } from './supabase-admin'

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function hashAdminPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 32).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyStoredPassword(password, stored) {
  if (typeof stored !== 'string' || typeof password !== 'string') return false
  const [algo, salt, hash] = stored.split('$')
  if (algo !== 'scrypt' || !salt || !hash) return false
  const next = scryptSync(password.trim(), salt, 32)
  const prev = Buffer.from(hash, 'hex')
  if (next.length !== prev.length) return false
  try {
    return timingSafeEqual(next, prev)
  } catch {
    return false
  }
}

export async function findStoredAdmin(emailInput) {
  const email = normalizeEmail(emailInput)
  if (!email) return { row: null, error: null }
  const result = await supabaseAdminRest(
    `admin_accounts?select=email,password_hash&email=eq.${encodeURIComponent(email)}&limit=1`,
  )
  if (!result.ok) return { row: null, error: result.error }
  const row = Array.isArray(result.data) ? result.data[0] : null
  return { row: row ?? null, error: null }
}

export async function verifyStoredAdminCredentials(emailInput, passwordInput) {
  const { row, error } = await findStoredAdmin(emailInput)
  if (error || !row) return false
  return verifyStoredPassword(passwordInput, row.password_hash)
}

export async function listStoredAdminEmails() {
  const result = await supabaseAdminRest('admin_accounts?select=email,created_at&order=created_at.desc')
  if (!result.ok) return { emails: [], error: result.error }
  const emails = Array.isArray(result.data)
    ? result.data
        .map((row) => (typeof row.email === 'string' ? row.email : ''))
        .filter(Boolean)
    : []
  return { emails, error: null }
}

export async function verifyAnyAdminCredentials(emailInput, passwordInput) {
  if (isAdminPasswordConfigured() && verifyAdminCredentials(emailInput, passwordInput)) {
    return true
  }
  return verifyStoredAdminCredentials(emailInput, passwordInput)
}

export async function listAllAdminEmails() {
  const builtin = listBuiltinAdminEmails()
  const stored = await listStoredAdminEmails()
  const emails = [...new Set([...builtin, ...stored.emails])]
  return { emails, storedError: stored.error }
}

export async function createStoredAdmin(emailInput, passwordInput) {
  const email = normalizeEmail(emailInput)
  const password = typeof passwordInput === 'string' ? passwordInput.trim() : ''
  if (!email || !email.includes('@') || password.length < 6) {
    return { ok: false, status: 400, error: 'Enter a valid email and a password of at least 6 characters.' }
  }

  if (listBuiltinAdminEmails().includes(email)) {
    return { ok: false, status: 409, error: 'That email is already a built-in admin.' }
  }

  const existing = await findStoredAdmin(email)
  if (existing.error) return { ok: false, status: 502, error: existing.error }
  if (existing.row) return { ok: false, status: 409, error: 'That admin email already exists.' }

  const result = await supabaseAdminRest('admin_accounts', {
    method: 'POST',
    body: { email, password_hash: hashAdminPassword(password) },
  })
  if (!result.ok) return { ok: false, status: result.status >= 500 ? 502 : 500, error: result.error }
  return { ok: true, email }
}
