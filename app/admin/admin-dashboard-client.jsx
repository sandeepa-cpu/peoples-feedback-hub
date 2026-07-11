'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageSquareQuote,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const ADMIN_SESSION_KEY = 'is_admin_authenticated'

const PURPLE_DEEP = '#8e248d'
const PURPLE_RICH = '#902391'
const YELLOW_ACC = '#fcee21'

function clampRating(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0
  return Math.min(5, Math.max(0, n))
}

/** Fractional gold stars using Lucide (0–5). */
function StarRow({ value, size = 'md', className = '' }) {
  const v = clampRating(value)
  const px = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-6 w-6'

  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Rating ${v} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, v - i))
        return (
          <span key={i} className={`relative shrink-0 ${px}`}>
            <Star
              className={`absolute inset-0 ${px} fill-stone-200/90 text-stone-300`}
              aria-hidden
              strokeWidth={0.55}
            />
            <span className="absolute inset-0 overflow-hidden text-amber-500" style={{ width: `${fill * 100}%` }}>
              <Star className={`${px} fill-amber-400 text-amber-400`} aria-hidden strokeWidth={0} />
            </span>
          </span>
        )
      })}
    </div>
  )
}

function startOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isSameLocalDay(isoA, isoB) {
  return startOfLocalDay(isoA).getTime() === startOfLocalDay(isoB).getTime()
}

function weekBoundsLocal(reference = new Date()) {
  const d = new Date(reference)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = new Date(d)
  start.setDate(d.getDate() + mondayOffset)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  const prevEnd = new Date(start)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevEnd.getDate() - 7)
  return {
    weekStart: start,
    weekEnd: end,
    prevWeekStart: prevStart,
    prevWeekEnd: prevEnd,
  }
}

function inRange(iso, start, end) {
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

function formatTableDateTime(iso) {
  const d = new Date(iso)
  const dateLine = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeLine = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return { dateLine, timeLine }
}

function relativeDayLabel(iso) {
  const now = new Date()
  const target = new Date(iso)
  const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(target)) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return null
}

function displayCustomerName(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  return s.length > 0 ? s : null
}

/** Treat empty, whitespace, and legacy bad values as missing for display */
function displayTextField(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  if (s === 'true' || s === 'false') return null
  return s
}

function nameInitials(name) {
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_PALETTES = [
  'bg-purple-100 text-purple-900',
  'bg-amber-100 text-amber-900',
  'bg-emerald-100 text-emerald-900',
  'bg-sky-100 text-sky-900',
  'bg-rose-100 text-rose-900',
  'bg-indigo-100 text-indigo-900',
]

function avatarPalette(name) {
  if (!name) return 'bg-stone-100 text-stone-500'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
}

function ratingBadgeTone(v) {
  if (v >= 4) return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
  if (v >= 3) return 'bg-amber-50 text-amber-800 ring-amber-200'
  return 'bg-red-50 text-red-700 ring-red-200'
}

export default function AdminDashboardClient() {
  const adminPasswordRef = useRef('')
  const adminEmailRef = useRef('')

  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [rows, setRows] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState(null)

  useEffect(() => {
    try {
      if (
        sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true' &&
        (!adminPasswordRef.current || !adminEmailRef.current)
      ) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY)
      }
      setAuthenticated(
        sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true' &&
          Boolean(adminPasswordRef.current) &&
          Boolean(adminEmailRef.current),
      )
    } catch {
      setAuthenticated(false)
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (!authChecked || !authenticated) return

    const pwd = adminPasswordRef.current
    const mail = adminEmailRef.current
    if (!pwd || !mail) {
      setRows([])
      setLoadError('Unauthorized. Please sign in with your admin email and password.')
      setLoading(false)
      setAuthenticated(false)
      try {
        sessionStorage.removeItem(ADMIN_SESSION_KEY)
      } catch {
        /* ignore */
      }
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)

      try {
        const res = await fetch('/api/admin/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mail, password: pwd }),
        })

        let json = null
        try {
          json = await res.json()
        } catch {
          json = null
        }

        if (cancelled) return

        if (res.status === 401) {
          setLoadError(json?.error || 'Unauthorized')
          setRows([])
          adminPasswordRef.current = ''
          adminEmailRef.current = ''
          setAuthenticated(false)
          try {
            sessionStorage.removeItem(ADMIN_SESSION_KEY)
          } catch {
            /* ignore */
          }
          return
        }

        if (!res.ok || !json || json.success !== true) {
          setLoadError(
            (json && typeof json.error === 'string' && json.error) ||
              'Could not load feedback. Check server configuration.',
          )
          setRows([])
          return
        }

        setRows(Array.isArray(json.data) ? json.data : [])
        setLastUpdated(new Date())
      } catch (e) {
        if (cancelled) return
        setLoadError(e instanceof Error ? e.message : 'Network error while loading data.')
        setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authChecked, authenticated, reloadKey])

  const today = useMemo(() => new Date(), [rows])

  const totalToday = useMemo(() => {
    return rows.filter((r) => r.created_at && isSameLocalDay(r.created_at, today)).length
  }, [rows, today])

  const avgRating = useMemo(() => {
    if (rows.length === 0) return null
    const sum = rows.reduce((acc, row) => {
      const r = typeof row.rating === 'number' ? row.rating : parseFloat(row.rating)
      return acc + (Number.isFinite(r) ? r : 0)
    }, 0)
    return sum / rows.length
  }, [rows])

  const weeklyTrend = useMemo(() => {
    const { weekStart, weekEnd, prevWeekStart, prevWeekEnd } = weekBoundsLocal()
    const thisCount = rows.filter((r) => r.created_at && inRange(r.created_at, weekStart, weekEnd)).length
    const lastCount = rows.filter((r) => r.created_at && inRange(r.created_at, prevWeekStart, prevWeekEnd)).length
    let deltaPct = null
    if (lastCount > 0) deltaPct = Math.round(((thisCount - lastCount) / lastCount) * 100)
    else if (thisCount > 0 && lastCount === 0) deltaPct = null
    return { thisCount, lastCount, deltaPct }
  }, [rows])

  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const row of rows) {
      const r = typeof row.rating === 'number' ? row.rating : parseFloat(row.rating)
      const idx = Math.round(clampRating(Number.isFinite(r) ? r : 0)) - 1
      if (idx >= 0 && idx <= 4) counts[idx]++
    }
    const max = Math.max(1, ...counts)
    return { counts, max }
  }, [rows])

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return rows.filter((row) => {
      if (ratingFilter !== null) {
        const r = typeof row.rating === 'number' ? row.rating : parseFloat(row.rating)
        if (Math.round(clampRating(Number.isFinite(r) ? r : 0)) !== ratingFilter) return false
      }
      if (!q) return true
      const hay = [row.name, row.message, row.phone_number, row.item_category, row.service_type, row.quick_tags]
        .map((v) => (v == null ? '' : String(v).toLowerCase()))
        .join(' ')
      return hay.includes(q)
    })
  }, [rows, searchQuery, ratingFilter])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setIsSubmitting(true)

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      })

      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (res.ok && data && data.success === true) {
        adminEmailRef.current = trimmedEmail
        adminPasswordRef.current = trimmedPassword
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
        } catch {
          /* ignore quota / privacy mode */
        }
        setAuthenticated(true)
        setPassword('')
        return
      }

      if (res.status === 503) {
        setLoginError(
          (data && typeof data.error === 'string' && data.error) ||
            'Administrator login is not configured. Set ADMIN_PASSWORD (and ADMIN_EMAIL) on Vercel or in .env.local, then redeploy.',
        )
        return
      }

      setLoginError(
        (data && typeof data.error === 'string' && data.error) ||
          'Incorrect email or password. Please try again.',
      )
    } catch {
      setLoginError('Unable to reach the server. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    adminPasswordRef.current = ''
    adminEmailRef.current = ''
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY)
    } catch {
      /* ignore */
    }
    setAuthenticated(false)
    setLoginError('')
    setIsSubmitting(false)
    setEmail('')
    setRows([])
    setLoadError(null)
    setLoading(false)
    setSearchQuery('')
    setRatingFilter(null)
  }

  const purpleBackdrop = (
    <>
      <div
        className="fixed inset-0 -z-20 min-h-[100dvh]"
        style={{
          background: `linear-gradient(165deg, ${PURPLE_RICH} 0%, ${PURPLE_DEEP} 45%, #4b0f4e 100%)`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.14] [background-image:radial-gradient(circle_at_15%_15%,white,transparent_42%),radial-gradient(circle_at_85%_8%,#fcee21,transparent_34%),radial-gradient(circle_at_92%_85%,white,transparent_38%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05] [background-image:repeating-linear-gradient(45deg,white_0,white_1px,transparent_1px,transparent_18px)]" />
    </>
  )

  if (!authChecked) {
    return (
      <>
        {purpleBackdrop}
        <div className="flex min-h-[100dvh] items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-white shadow-lg backdrop-blur-md">
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-[#fcee21]" aria-hidden />
            <span className="text-sm font-medium tracking-wide">Loading…</span>
          </div>
        </div>
      </>
    )
  }

  /* —— Login —— */

  if (!authenticated) {
    return (
      <>
        {purpleBackdrop}
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-[0_32px_90px_-30px_rgba(0,0,0,0.5)] ring-1 ring-black/5"
          >
            <div
              className="h-2 w-full"
              style={{ background: `linear-gradient(90deg, ${YELLOW_ACC}, ${PURPLE_DEEP}, ${YELLOW_ACC})` }}
            />
            <div className="p-8 sm:p-10">
              <div className="text-center">
                <div className="mx-auto flex h-[116px] w-[116px] items-center justify-center overflow-hidden rounded-3xl bg-stone-50 shadow-md ring-4 ring-[#fcee21]/70">
                  <Image
                    src="/logo.jpg"
                    alt="Peoples Bakers logo"
                    width={112}
                    height={112}
                    className="h-[94px] w-[94px] object-contain"
                    priority
                  />
                </div>
                <div className="mt-7">
                  <h1 className="text-xl font-black tracking-[0.22em]" style={{ color: PURPLE_DEEP }}>
                    PEOPLES BAKERS
                  </h1>
                  <p className="mt-1 text-xl font-semibold text-stone-800">හිත ඉල්ලන රස</p>
                  <div className="mx-auto mt-4 flex justify-center gap-1 text-yellow-600">
                    <UtensilsCrossed className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                    <ChevronRight className="h-5 w-5 opacity-50" aria-hidden />
                    <MessageSquareQuote className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-950/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-purple-950">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden strokeWidth={2.25} />
                    Administrator Portal
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="mt-9 space-y-5">
                <div>
                  <label htmlFor="admin-email" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                    <Mail className="h-4 w-4 shrink-0 text-purple-900/70" aria-hidden strokeWidth={2} />
                    Admin Email
                  </label>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(ev) => {
                      setEmail(ev.target.value)
                      setLoginError('')
                    }}
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-stone-900 shadow-inner outline-none ring-purple-950/15 transition placeholder:text-stone-400 focus:border-[#902391]/40 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="admin-password" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                    <Lock className="h-4 w-4 shrink-0 text-purple-900/70" aria-hidden strokeWidth={2} />
                    Administrator Password
                  </label>
                  <input
                    id="admin-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(ev) => {
                      setPassword(ev.target.value)
                      setLoginError('')
                    }}
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-stone-900 shadow-inner outline-none ring-purple-950/15 transition placeholder:text-stone-400 focus:border-[#902391]/40 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Enter password"
                  />
                </div>
                <AnimatePresence>
                  {loginError ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-800"
                      role="alert"
                    >
                      {loginError}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="flex w-full min-h-[3.25rem] items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold uppercase tracking-[0.12em] shadow-lg transition hover:brightness-105 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100"
                  style={{ backgroundColor: YELLOW_ACC, color: '#2d0830' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                      Verifying…
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
          <Link
            href="/"
            className="mt-8 text-sm font-medium text-white/90 underline underline-offset-4 hover:text-[#fcee21]"
          >
            ← Back to feedback form
          </Link>
        </div>
      </>
    )
  }

  /* —— Dashboard —— */

  const statCards = [
    {
      key: 'total',
      label: 'Total Feedback',
      value: rows.length,
      sub: 'All time entries',
      icon: Users,
      iconBg: 'bg-purple-950/10',
      iconColor: PURPLE_DEEP,
    },
    {
      key: 'today',
      label: 'Feedback Today',
      value: totalToday,
      sub: today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      icon: CalendarDays,
      iconBg: 'bg-amber-100',
      iconColor: '#92400e',
    },
    {
      key: 'week',
      label: 'This Week',
      value: weeklyTrend.thisCount,
      sub: `Previous week ${weeklyTrend.lastCount}`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100',
      iconColor: '#065f46',
      trend: weeklyTrend.deltaPct,
    },
  ]

  return (
    <>
      {purpleBackdrop}
      <div className="relative min-h-[100dvh] pb-16">
        {/* —— Top navbar —— */}
        <div className="sticky top-0 z-40 border-b border-white/10 bg-[#7c1f7b]/80 shadow-lg backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow ring-2 ring-[#fcee21]/80">
                <Image src="/logo.jpg" alt="Peoples Bakers logo" width={40} height={40} className="h-9 w-9 object-contain" priority />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase tracking-[0.18em] text-white sm:text-base">
                  Peoples Bakers
                </p>
                <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-[#fcee21]/90">
                  Admin Dashboard
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                disabled={loading}
                title="Refresh data"
                className="flex h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden strokeWidth={2.25} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold uppercase tracking-wide shadow transition hover:brightness-105 active:scale-[0.98] sm:px-4"
                style={{ backgroundColor: YELLOW_ACC, color: '#2d0830' }}
              >
                <LogOut className="h-4 w-4" aria-hidden strokeWidth={2.5} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          {/* —— Hero —— */}
          <motion.header
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative mt-6 overflow-hidden rounded-3xl border border-white/15 bg-white/10 px-6 py-7 shadow-xl backdrop-blur-md sm:px-10"
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-25 blur-2xl"
              style={{ background: YELLOW_ACC }}
            />
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Welcome back 👋
                </h1>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/85">
                  Live customer feedback insights for{' '}
                  <span className="font-bold text-[#fcee21]">Peoples Bakers</span> — හිත ඉල්ලන රස
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                <ShieldCheck className="h-3.5 w-3.5 text-[#fcee21]" aria-hidden strokeWidth={2.25} />
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                  : 'Secure server API'}
              </p>
            </div>
          </motion.header>

          {loadError ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-amber-200/60 bg-[#fefce8] px-5 py-4 text-sm shadow-md text-amber-950"
            >
              <span className="font-bold">Unable to load data.</span> {loadError}
            </div>
          ) : null}

          {/* —— Stat cards —— */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-5">
            {statCards.map((card, i) => (
              <motion.div
                key={card.key}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-28px_rgba(0,0,0,0.45)]"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90"
                  style={{ background: `linear-gradient(90deg, ${PURPLE_DEEP}, ${YELLOW_ACC})` }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PURPLE_DEEP }}>
                      {card.label}
                    </p>
                    <p className="mt-2 text-4xl font-black tabular-nums text-stone-900">{card.value}</p>
                    <p className="mt-2 truncate text-xs text-stone-500">{card.sub}</p>
                    {typeof card.trend === 'number' ? (
                      <p
                        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          card.trend >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {card.trend >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
                        )}
                        {card.trend >= 0 ? '+' : ''}
                        {card.trend}% vs prior week
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} transition group-hover:scale-110`}
                    style={{ color: card.iconColor }}
                  >
                    <card.icon className="h-6 w-6" aria-hidden strokeWidth={2} />
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Rating summary card */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
              style={{ background: `linear-gradient(150deg, ${PURPLE_DEEP}, #5b1259)` }}
            >
              <div
                className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
                style={{ background: YELLOW_ACC }}
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fcee21]">Overall Rating</p>
              <p className="mt-2 text-4xl font-black tabular-nums">
                {avgRating === null ? '—' : avgRating.toFixed(1)}
                {avgRating !== null ? <span className="ml-1.5 text-lg font-semibold text-white/70">/ 5</span> : null}
              </p>
              <StarRow value={avgRating ?? 0} size="md" className="mt-3" />
              <p className="mt-3 text-xs text-white/75">
                Based on <span className="font-bold tabular-nums text-white">{rows.length}</span> total review{rows.length === 1 ? '' : 's'}
              </p>
            </motion.div>
          </section>

          {/* —— Rating distribution —— */}
          <motion.section
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-6 rounded-3xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.04] sm:p-8"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} style={{ color: PURPLE_DEEP }} />
              <h2 className="text-base font-black tracking-wide text-purple-950 sm:text-lg">Rating Distribution</h2>
            </div>
            <div className="mt-5 space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution.counts[star - 1]
                const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0
                const width = (count / ratingDistribution.max) * 100
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                    title={`Filter table to ${star}-star reviews`}
                    className={`group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-purple-500/[0.05] ${
                      ratingFilter === star ? 'bg-purple-500/[0.08] ring-1 ring-purple-300' : ''
                    }`}
                  >
                    <span className="flex w-10 shrink-0 items-center justify-end gap-1 text-sm font-bold tabular-nums text-stone-700">
                      {star}
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden strokeWidth={0} />
                    </span>
                    <span className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background:
                            star >= 4
                              ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                              : star === 3
                                ? 'linear-gradient(90deg,#d97706,#f59e0b)'
                                : 'linear-gradient(90deg,#dc2626,#f87171)',
                        }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums text-stone-500">
                      {count} · {pct}%
                    </span>
                  </button>
                )
              })}
            </div>
            {ratingFilter !== null ? (
              <button
                type="button"
                onClick={() => setRatingFilter(null)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-950/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-purple-950 transition hover:bg-purple-950/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
                Clear {ratingFilter}-star filter
              </button>
            ) : null}
          </motion.section>

          {/* —— Feedback table —— */}
          <motion.section
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-6 overflow-hidden rounded-3xl bg-white shadow-[0_28px_60px_-32px_rgba(0,0,0,0.45)] ring-1 ring-black/[0.05]"
          >
            <div className="flex flex-col gap-4 border-b border-stone-100 bg-gradient-to-r from-purple-950/[0.04] via-white to-amber-50/40 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquareQuote className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} style={{ color: PURPLE_DEEP }} />
                    <h2 className="text-lg font-black tracking-wide text-purple-950">Recent Feedback Entries</h2>
                  </div>
                  <p className="mt-1 text-xs font-medium uppercase tracking-widest text-stone-500">
                    {filteredRows.length} of {rows.length} shown · Newest first
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition hover:brightness-110 active:scale-[0.98]"
                  style={{ backgroundColor: YELLOW_ACC, color: '#2d0830' }}
                >
                  Open public form →
                </Link>
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                  aria-hidden
                  strokeWidth={2}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, comment, phone, category…"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/80 py-2.5 pl-10 pr-4 text-sm text-stone-900 shadow-inner outline-none transition placeholder:text-stone-400 focus:border-[#902391]/40 focus:bg-white focus:ring-4 focus:ring-purple-950/10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-left">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/90">
                    <th scope="col" className="min-w-[11rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Rating
                    </th>
                    <th scope="col" className="min-w-[7rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Details
                    </th>
                    <th scope="col" className="min-w-[14rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-950">
                      Comment
                    </th>
                    <th scope="col" className="whitespace-nowrap px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Date &amp; time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-stone-500">
                        <span className="inline-flex items-center gap-3 text-base font-semibold">
                          <Loader2 className="h-6 w-6 animate-spin" style={{ color: PURPLE_DEEP }} aria-hidden />
                          Loading feedback…
                        </span>
                      </td>
                    </tr>
                  ) : null}
                  {!loading && !loadError && rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Inbox className="mx-auto h-10 w-10 text-stone-300" aria-hidden strokeWidth={1.5} />
                        <p className="mt-3 text-sm font-medium text-stone-500">
                          No feedback yet. Invite customers from the homepage form.
                        </p>
                      </td>
                    </tr>
                  ) : null}
                  {!loading && !loadError && rows.length > 0 && filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Search className="mx-auto h-10 w-10 text-stone-300" aria-hidden strokeWidth={1.5} />
                        <p className="mt-3 text-sm font-medium text-stone-500">
                          No results for this search or filter.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setRatingFilter(null)
                          }}
                          className="mt-3 text-sm font-bold text-purple-800 underline underline-offset-4 hover:text-purple-950"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  ) : null}
                  {!loading && loadError ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center text-sm text-stone-500">
                        Rows could not be loaded — see the notice above for details.
                      </td>
                    </tr>
                  ) : null}
                  {!loading &&
                    !loadError &&
                    filteredRows.map((row) => {
                      const raw = typeof row.rating === 'number' ? row.rating : parseFloat(row.rating)
                      const rv = clampRating(Number.isFinite(raw) ? raw : 0)
                      const { dateLine, timeLine } = formatTableDateTime(row.created_at)
                      const dayLabel = row.created_at ? relativeDayLabel(row.created_at) : null
                      const shownName = displayCustomerName(row.name)
                      const phoneText = displayTextField(row.phone_number)
                      const categoryText = displayTextField(row.item_category)
                      const serviceText = displayTextField(row.service_type)
                      const tagsText = displayTextField(row.quick_tags)
                      return (
                        <tr key={row.id} className="align-top transition-colors hover:bg-purple-500/[0.04] even:bg-stone-50/40">
                          {/* Customer */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${avatarPalette(shownName)}`}
                                aria-hidden
                              >
                                {nameInitials(shownName)}
                              </span>
                              <div className="min-w-0">
                                {shownName ? (
                                  <p className="truncate font-semibold text-purple-950">{shownName}</p>
                                ) : (
                                  <p className="truncate text-sm italic text-gray-400">Anonymous</p>
                                )}
                                {phoneText ? (
                                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] tabular-nums text-stone-500">
                                    <Phone className="h-3 w-3 shrink-0" aria-hidden strokeWidth={2} />
                                    {phoneText}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          {/* Rating */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <StarRow value={rv} size="sm" />
                              <span
                                className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ring-1 ${ratingBadgeTone(rv)}`}
                              >
                                {rv}.0 / 5
                              </span>
                            </div>
                          </td>
                          {/* Details: category, service, tags */}
                          <td className="px-6 py-4">
                            <div className="flex max-w-[13rem] flex-wrap gap-1.5">
                              {categoryText ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-900">
                                  <UtensilsCrossed className="h-3 w-3" aria-hidden strokeWidth={2} />
                                  {categoryText}
                                </span>
                              ) : null}
                              {serviceText ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                                  <Sparkles className="h-3 w-3" aria-hidden strokeWidth={2} />
                                  {serviceText}
                                </span>
                              ) : null}
                              {tagsText
                                ? tagsText.split(',').map((t) => {
                                    const tag = t.trim()
                                    if (!tag) return null
                                    return (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700"
                                      >
                                        <Tag className="h-3 w-3" aria-hidden strokeWidth={2} />
                                        {tag}
                                      </span>
                                    )
                                  })
                                : null}
                              {!categoryText && !serviceText && !tagsText ? (
                                <span className="text-xs italic text-gray-400">—</span>
                              ) : null}
                            </div>
                          </td>
                          {/* Comment */}
                          <td className="max-w-md px-6 py-4 break-words whitespace-pre-wrap leading-relaxed text-stone-800">
                            {row.message && String(row.message).trim() !== '' ? (
                              row.message
                            ) : (
                              <span className="italic text-stone-400">No comment provided</span>
                            )}
                          </td>
                          {/* Date */}
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <div className="inline-block text-right">
                              {dayLabel ? (
                                <span
                                  className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                                  style={{ backgroundColor: `${YELLOW_ACC}55`, color: '#3d073f' }}
                                >
                                  {dayLabel}
                                </span>
                              ) : null}
                              <p className="text-sm font-bold tabular-nums text-purple-950">{dateLine}</p>
                              <p className="text-xs tabular-nums text-stone-500">{timeLine}</p>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </motion.section>

          <p className="mt-8 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-white/50">
            Peoples Bakers · Admin
          </p>
        </div>
      </div>
    </>
  )
}
