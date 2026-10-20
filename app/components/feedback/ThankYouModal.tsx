"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export const THANK_YOU_COUPON = "THANKYOU10";

type ThankYouModalProps = {
  open: boolean;
  name: string;
  onSendAnother: () => void;
};

export function ThankYouModal({ open, name, onSendAnother }: ThankYouModalProps) {
  const [copied, setCopied] = useState(false);
  const greeting = name.trim() ? `Thanks, ${name.trim()}` : "ස්තුතියි · Thank you";

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onSendAnother();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onSendAnother]);

  async function copyCoupon() {
    try {
      await navigator.clipboard.writeText(THANK_YOU_COUPON);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#3b0764]/45 px-4 py-6 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          onClick={onSendAnother}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="thank-you-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white/75 p-6 text-center shadow-[0_28px_70px_-20px_rgba(107,33,168,0.55),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl sm:p-8"
          >
            <div className="pb-success-badge mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-white to-[#f3e8ff] shadow-[0_8px_28px_-8px_rgba(107,33,168,0.45)] ring-4 ring-[var(--pb-yellow)]/70">
              <CheckCircle2 className="size-9 text-[var(--pb-purple)]" strokeWidth={2} aria-hidden />
            </div>
            <h2
              id="thank-you-title"
              className="mt-5 font-peoples-bakers-display text-2xl font-semibold tracking-wide text-[#4c1d95]"
            >
              {greeting}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone-600">
              We received your feedback. Enjoy a thank-you treat on your next visit.
            </p>
            <div className="mt-6 rounded-2xl border border-[var(--pb-purple)]/15 bg-white/70 px-4 py-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Your coupon
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-[var(--pb-purple)]">
                {THANK_YOU_COUPON}
              </p>
              <button
                type="button"
                onClick={() => void copyCoupon()}
                className="mt-3 rounded-full border border-[var(--pb-purple)]/20 bg-[#f3e8ff] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--pb-purple)] transition hover:bg-[#e9d5ff]"
              >
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
            <button
              type="button"
              onClick={onSendAnother}
              className="mt-6 rounded-2xl bg-gradient-to-br from-[var(--pb-purple-light)] via-[var(--pb-purple)] to-[#581c87] px-8 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_-10px_rgba(107,33,168,0.7)]"
            >
              නැවත යොමු කරන්න · Send another
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
