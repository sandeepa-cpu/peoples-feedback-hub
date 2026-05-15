'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronRight,
  Loader2,
  Lock,
  LogOut,
  MessageSquareQuote,
  Star,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

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
  const px = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'

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

export default function AdminDashboardClient() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [rows, setRows] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      setAuthenticated(sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true')
    } catch {
      setAuthenticated(false)
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (!authChecked || !authenticated) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)

      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setLoadError(
            'Supabase env missing in this build: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel, then redeploy.',
          )
          setRows([])
          setLoading(false)
        }
        return
      }

      try {
        const client = createSupabaseClient()
        const { data, error } = await client
          .from('feedbacks')
          .select(
            'id, created_at, rating, message, name, phone_number, item_category, service_type, quick_tags',
          )
          .order('created_at', { ascending: false })

        if (cancelled) return
        if (error) {
          setLoadError(error.message || 'Unknown Supabase error')
          setRows([])
        } else {
          setRows(data ?? [])
        }
      } catch (e) {
        if (cancelled) return
        setLoadError(e instanceof Error ? e.message : String(e))
        setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authChecked, authenticated])

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

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setIsSubmitting(true)

    const trimmed = password.trim()

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      })

      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (res.ok && data && data.success === true) {
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
            'Administrator login is not configured on the server. Set ADMIN_PASSWORD (server-only, no NEXT_PUBLIC_) on Vercel or in .env.local, then redeploy.',
        )
        return
      }

      setLoginError(
        (data && typeof data.error === 'string' && data.error) ||
          'Incorrect password. Please try again.',
      )
    } catch {
      setLoginError('Unable to reach the server. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY)
    } catch {
      /* ignore */
    }
    setAuthenticated(false)
    setLoginError('')
    setIsSubmitting(false)
    setRows([])
    setLoadError(null)
    setLoading(false)
  }

  const purpleBackdrop = (
    <>
      <div
        className="fixed inset-0 -z-20 min-h-[100dvh]"
        style={{
          background: `linear-gradient(165deg, ${PURPLE_RICH} 0%, ${PURPLE_DEEP} 45%, #5c1460 100%)`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_10%,white,transparent_40%),radial-gradient(circle_at_90%_80%,white,transparent_35%)]" />
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

  if (!authenticated) {
    return (
      <>
        {purpleBackdrop}
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:p-10">
            <div className="text-center">
              <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-2xl bg-stone-50 ring-4 ring-[#fcee21]/70">
                <Image
                  src="/logo.jpg"
                  alt="Peoples Bakers logo"
                  width={112}
                  height={112}
                  className="h-[96px] w-[96px] object-contain"
                  priority
                />
              </div>
              <div className="mt-8">
                <h1 className="text-xl font-bold tracking-[0.2em] text-[#581c5c]" style={{ color: PURPLE_DEEP }}>
                  PEOPLES BAKERS
                </h1>
                <p className="mt-1 text-xl font-semibold text-stone-800">හිත ඉල්ලන රස</p>
                <div className="mx-auto mt-4 flex justify-center gap-1 text-yellow-600">
                  <UtensilsCrossed className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                  <ChevronRight className="h-5 w-5 opacity-50" aria-hidden />
                  <MessageSquareQuote className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-widest text-stone-500">Administrator portal</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="mt-10 space-y-5">
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
              {loginError ? (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-800"
                  role="alert"
                >
                  {loginError}
                </p>
              ) : null}
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

  const supabaseReady = isSupabaseConfigured()

  return (
    <>
      {purpleBackdrop}
      <div className="relative min-h-[100dvh] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <header className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/15 bg-white/10 px-6 py-8 shadow-xl backdrop-blur-md sm:px-10">
          <button
            type="button"
            onClick={handleLogout}
            className="absolute right-4 top-4 flex items-center gap-2 rounded-xl border border-white/30 bg-black/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 sm:right-6 sm:top-6 sm:px-4 sm:text-sm"
          >
            <LogOut className="h-4 w-4" aria-hidden strokeWidth={2.25} />
            Logout
          </button>
          <div className="flex flex-col items-center text-center pt-8 sm:pt-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-[3px] ring-[#fcee21]/80 sm:h-28 sm:w-28">
              <Image
                src="/logo.jpg"
                alt="Peoples Bakers logo"
                width={96}
                height={96}
                className="h-[88px] w-[88px] object-contain"
                priority
              />
            </div>
            <h1 className="mt-5 text-xl font-black tracking-[0.22em] text-white sm:text-2xl min-[480px]:tracking-[0.35em]">
              PEOPLES BAKERS
            </h1>
            <p className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#fcee21] drop-shadow-md sm:text-3xl">
              හිත ඉල්ලන රස
            </p>
          </div>
        </header>

        <main className="mx-auto mt-8 max-w-6xl pb-16">
          {!supabaseReady || loadError ? (
            <div
              role="alert"
              className="mb-8 rounded-2xl border border-amber-200/60 bg-[#fefce8] px-5 py-4 text-sm shadow-md text-amber-950"
            >
              <span className="font-bold">Unable to load data.</span>{' '}
              {loadError ??
                'Supabase keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel and redeploy. Also confirm anonymous SELECT policy on feedbacks.'}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PURPLE_DEEP }}>
                    Feedback today
                  </p>
                  <p className="mt-2 text-4xl font-black tabular-nums text-stone-900">{totalToday}</p>
                  <p className="mt-2 text-xs text-stone-500">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-950/10" style={{ color: PURPLE_DEEP }}>
                  <CalendarDays className="h-6 w-6" aria-hidden strokeWidth={2} />
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PURPLE_DEEP }}>
                    Overall rating
                  </p>
                  <p className="mt-2 text-4xl font-black tabular-nums text-amber-800">
                    {avgRating === null ? '—' : avgRating.toFixed(1)}
                    {avgRating !== null ? (
                      <span className="ml-2 text-xl font-semibold tabular-nums text-stone-500">/ 5</span>
                    ) : null}
                  </p>
                  <StarRow value={avgRating ?? 0} size="lg" className="mt-4 justify-start" />
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Star className="h-6 w-6 fill-amber-500 text-amber-600" aria-hidden strokeWidth={1.5} />
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04] sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: PURPLE_DEEP }}>
                    Weekly trends
                  </p>
                  <p className="mt-4 text-lg font-semibold text-stone-800">
                    This week{' '}
                    <span className="font-black tabular-nums text-purple-950">{weeklyTrend.thisCount}</span>
                    <span className="text-stone-500"> entries</span>
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
                    Previous week{' '}
                    <span className="font-semibold tabular-nums">{weeklyTrend.lastCount}</span>
                  </p>
                  {weeklyTrend.deltaPct !== null ? (
                    <p
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        weeklyTrend.deltaPct >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {weeklyTrend.deltaPct >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
                      )}
                      {weeklyTrend.deltaPct >= 0 ? '+' : ''}
                      {weeklyTrend.deltaPct}% vs prior week
                    </p>
                  ) : weeklyTrend.thisCount === 0 && weeklyTrend.lastCount === 0 ? (
                    <p className="mt-3 text-xs text-stone-500">Not enough weekly data yet.</p>
                  ) : weeklyTrend.lastCount === 0 && weeklyTrend.thisCount > 0 ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: PURPLE_DEEP }}>
                      New momentum this week
                    </p>
                  ) : null}
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${YELLOW_ACC}44`, color: '#3d073f' }}>
                  <TrendingUp className="h-6 w-6" aria-hidden strokeWidth={2.25} />
                </span>
              </div>
            </div>
          </section>

          <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-[0_28px_60px_-32px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.05]">
            <div className="flex flex-col gap-3 border-b border-stone-100 bg-gradient-to-r from-purple-950/[0.04] via-white to-amber-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} style={{ color: PURPLE_DEEP }} />
                  <h2 className="text-lg font-black tracking-wide text-purple-950">Recent Feedback Entries</h2>
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-stone-500">Newest first · Live from Supabase</p>
              </div>
              <Link
                href="/"
                className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: YELLOW_ACC, color: '#2d0830' }}
              >
                Open public form →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/90">
                    <th scope="col" className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Rating
                    </th>
                    <th scope="col" className="min-w-[7rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Customer Name
                    </th>
                    <th scope="col" className="min-w-[6.5rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Phone
                    </th>
                    <th scope="col" className="min-w-[5.5rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Category
                    </th>
                    <th scope="col" className="min-w-[5.5rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: PURPLE_DEEP }}>
                      Service
                    </th>
                    <th scope="col" className="min-w-[8rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-950">
                      Quick tags
                    </th>
                    <th scope="col" className="min-w-[12rem] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-950">
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
                      <td colSpan={8} className="px-6 py-20 text-center text-stone-500">
                        <span className="inline-flex items-center gap-3 text-base font-semibold">
                          <Loader2 className="h-6 w-6 animate-spin" style={{ color: PURPLE_DEEP }} aria-hidden />
                          Loading feedback…
                        </span>
                      </td>
                    </tr>
                  ) : null}
                  {!loading && rows.length === 0 && supabaseReady && !loadError ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-stone-500">
                        No feedback yet. Invite customers from the homepage form.
                      </td>
                    </tr>
                  ) : null}
                  {!loading && (loadError || !supabaseReady) ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center text-sm text-stone-500">
                        Rows could not be loaded — see the notice above for details.
                      </td>
                    </tr>
                  ) : null}
                  {!loading &&
                    supabaseReady &&
                    !loadError &&
                    rows.map((row) => {
                      const raw = typeof row.rating === 'number' ? row.rating : parseFloat(row.rating)
                      const rv = clampRating(Number.isFinite(raw) ? raw : 0)
                      const { dateLine, timeLine } = formatTableDateTime(row.created_at)
                      const shownName = displayCustomerName(row.name)
                      const phoneText = displayTextField(row.phone_number)
                      const categoryText = displayTextField(row.item_category)
                      const serviceText = displayTextField(row.service_type)
                      const tagsText = displayTextField(row.quick_tags)
                      return (
                        <tr key={row.id} className="transition-colors hover:bg-purple-500/[0.04] even:bg-stone-50/50">
                          <td className="px-6 py-4 align-middle">
                            <StarRow value={rv} size="sm" />
                          </td>
                          <td className="max-w-[10rem] px-6 py-4 align-middle">
                            {shownName ? (
                              <span className="font-medium text-purple-950">{shownName}</span>
                            ) : (
                              <span className="text-sm italic text-gray-400">Anonymous</span>
                            )}
                          </td>
                          <td className="max-w-[8rem] px-6 py-4 align-middle font-mono text-xs tabular-nums text-stone-800">
                            {phoneText ? (
                              <span title={phoneText}>{phoneText}</span>
                            ) : (
                              <span className="text-xs italic text-gray-400">—</span>
                            )}
                          </td>
                          <td className="max-w-[6.5rem] px-6 py-4 align-middle text-sm text-purple-950">
                            {categoryText ? categoryText : <span className="text-xs italic text-gray-400">—</span>}
                          </td>
                          <td className="max-w-[6rem] px-6 py-4 align-middle text-sm text-purple-950">
                            {serviceText ? serviceText : <span className="text-xs italic text-gray-400">—</span>}
                          </td>
                          <td className="max-w-[10rem] px-6 py-4 align-middle text-xs leading-snug text-stone-700" title={tagsText ?? ''}>
                            {tagsText ? tagsText : <span className="italic text-gray-400">—</span>}
                          </td>
                          <td className="max-w-md px-6 py-4 align-middle break-words whitespace-pre-wrap leading-relaxed text-stone-800">
                            {row.message && String(row.message).trim() !== '' ? (
                              row.message
                            ) : (
                              <span className="italic text-stone-400">No comment provided</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right align-middle">
                            <div className="inline-block text-right">
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
          </section>
        </main>
      </div>
    </>
  )
}
