'use client'

import { Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

/**
 * Collects the developer password. The expected value lives only on the server.
 */
export default function DeveloperAuthModal({
  open,
  title,
  description,
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  const fieldId = useId()
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  if (!open) return null

  function submit(event) {
    event.preventDefault()
    if (busy || value.trim() === '') return
    onConfirm(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 bg-purple-950/55 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldId}-title`}
        onSubmit={submit}
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/20 bg-white p-4 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-900">
            <ShieldCheck className="h-5 w-5" aria-hidden strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h2 id={`${fieldId}-title`} className="text-base font-black text-purple-950 sm:text-lg">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{description}</p>
          </div>
        </div>

        <label htmlFor={fieldId} className="mt-5 block text-xs font-bold uppercase tracking-widest text-purple-900">
          Developer password
        </label>
        <input
          id={fieldId}
          type="password"
          autoComplete="current-password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
          className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-950/10"
        />
        {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || value.trim() === ''}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Confirm
          </button>
        </div>
      </form>
    </div>
  )
}
