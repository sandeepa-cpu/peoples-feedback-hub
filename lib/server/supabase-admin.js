/**
 * Service-role REST helper. The anon key is never used for admin writes.
 */

export function getSupabaseAdminConfig() {
  const raw =
    (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
      : '') ||
    (typeof process.env.SUPABASE_URL === 'string' ? process.env.SUPABASE_URL.trim() : '')
  const host = raw.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const serviceKey =
    typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
      : ''
  return { host, serviceKey }
}

export async function supabaseAdminRest(path, { method = 'GET', body } = {}) {
  const { host, serviceKey } = getSupabaseAdminConfig()
  if (!host || !serviceKey) {
    return {
      ok: false,
      status: 503,
      data: null,
      error:
        'Server is not configured for admin data. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
    }
  }

  let res
  try {
    res = await fetch(`https://${host}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: method === 'GET' ? 'return=representation' : 'return=representation',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (err) {
    return {
      ok: false,
      status: 502,
      data: null,
      error: err instanceof Error ? err.message : 'Failed to reach Supabase.',
    }
  }

  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    const message =
      payload && typeof payload.message === 'string'
        ? payload.message
        : payload && typeof payload.error === 'string'
          ? payload.error
          : `Supabase request failed (${res.status}).`
    return { ok: false, status: res.status, data: payload, error: message }
  }

  return { ok: true, status: res.status, data: payload, error: null }
}
