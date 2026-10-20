const buckets = new Map()

/** Per-instance window. Enough to slow bursts on one serverless isolate. */
export function hitRateLimit(key, limit, windowMs) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || now - current.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 })
    return false
  }
  current.count += 1
  return current.count > limit
}

export function clientAddress(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first.slice(0, 80)
  }
  return request.headers.get("x-real-ip")?.slice(0, 80) || "unknown"
}
