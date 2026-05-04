"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, Star, User } from "lucide-react";

import { FEEDBACK_SCRIPT_POST_URL, ratingEmojiForStars } from "./lib/feedback-script";
import { WHATSAPP_CHAT_URL, WHATSAPP_PHONE_DISPLAY } from "./lib/whatsapp";

async function launchFullScreenConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const colors = [
    "#fde68a",
    "#fbbf24",
    "#f97316",
    "#fecdd3",
    "#fda4af",
    "#ffffff",
    "#fcd34d",
    "#fdba74",
  ];
  const base = {
    zIndex: 99999,
    colors,
    disableForReducedMotion: true,
  };

  confetti({
    ...base,
    particleCount: 150,
    spread: 88,
    startVelocity: 52,
    origin: { x: 0.5, y: 0.52 },
  });

  setTimeout(() => {
    confetti({ ...base, particleCount: 95, angle: 55, spread: 64, origin: { x: 0, y: 0.62 }, startVelocity: 48 });
    confetti({ ...base, particleCount: 95, angle: 125, spread: 64, origin: { x: 1, y: 0.62 }, startVelocity: 48 });
  }, 110);

  setTimeout(() => {
    confetti({ ...base, particleCount: 70, spread: 110, origin: { x: 0.18, y: 0.58 }, startVelocity: 38 });
    confetti({ ...base, particleCount: 70, spread: 110, origin: { x: 0.82, y: 0.58 }, startVelocity: 38 });
  }, 230);
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const staggerParent = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/** Centered glass card — frost, depth, subtle specular edge */
const glassPanel =
  "relative w-full rounded-[1.875rem] border border-white/50 bg-white/[0.27] p-6 shadow-[0_32px_80px_-24px_rgba(61,47,36,0.32),0_12px_40px_-18px_rgba(180,83,9,0.14),inset_0_1px_0_0_rgba(255,255,255,0.92)] backdrop-blur-2xl ring-1 ring-white/45 sm:p-9";

const fieldClass =
  "mx-auto w-full max-w-sm rounded-xl border border-white/55 bg-white/50 px-3.5 py-2.5 text-center text-base leading-snug text-stone-900 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] outline-none backdrop-blur-md transition placeholder:text-stone-400 focus:border-amber-400/80 focus:bg-white/65 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.25),inset_0_1px_2px_rgba(255,255,255,0.95)]";

const labelClass =
  "flex items-center justify-center gap-2 font-peoples-bakers-display text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-stone-600";

function InteractiveRatingFace({ rating }: { rating: number | null }) {
  const emoji = rating === null ? "✨" : ratingEmojiForStars(rating);

  const mood = useMemo(() => {
    if (rating === null) return "idle" as const;
    if (rating <= 1) return "low" as const;
    if (rating === 2) return "low" as const;
    if (rating === 3) return "mid" as const;
    if (rating === 4) return "bounce" as const;
    return "heart" as const;
  }, [rating]);

  const motionByMood = {
    idle: {
      animate: { opacity: [0.4, 0.65, 0.4], scale: [1, 1.05, 1] },
      transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" as const },
    },
    low: {
      animate: { x: [0, -5, 5, -4, 4, -3, 3, 0] },
      transition: { duration: 0.48, repeat: Infinity, repeatDelay: 1.15, ease: "easeInOut" as const },
    },
    mid: {
      animate: { scale: [1, 1.07, 1] },
      transition: { duration: 2.35, repeat: Infinity, ease: "easeInOut" as const },
    },
    bounce: {
      animate: { y: [0, -12, 0], scale: [1, 1.05, 1] },
      transition: {
        duration: 0.72,
        repeat: Infinity,
        repeatDelay: 0.28,
        ease: [0.34, 1.45, 0.64, 1] as const,
      },
    },
    heart: {
      animate: { scale: [1, 1.16, 1, 1.1, 1] },
      transition: {
        duration: 0.88,
        repeat: Infinity,
        repeatDelay: 0.42,
        times: [0, 0.18, 0.34, 0.55, 1],
        ease: "easeOut" as const,
      },
    },
  }[mood];

  return (
    <div
      className="flex min-h-[4.75rem] flex-col items-center justify-center rounded-2xl border border-white/35 bg-white/20 px-4 py-3 backdrop-blur-md"
      aria-hidden
    >
      <motion.span
        key={`${mood}-${rating ?? "x"}`}
        className="select-none text-5xl leading-none drop-shadow-sm sm:text-6xl"
        initial={false}
        animate={motionByMood.animate}
        transition={motionByMood.transition}
      >
        {emoji}
      </motion.span>
      <span className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-stone-500">
        {rating === null ? "Pick a rating" : "Your reaction"}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showRatingHint, setShowRatingHint] = useState(false);
  const [showNameHint, setShowNameHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let ok = true;
    if (!name.trim()) {
      setShowNameHint(true);
      ok = false;
    } else setShowNameHint(false);
    if (rating === null) {
      setShowRatingHint(true);
      ok = false;
    } else setShowRatingHint(false);
    if (!ok) return;

    const stars = rating;
    if (stars === null) return;

    setSubmitError(null);
    setIsSubmitting(true);

    const text = message.trim();
    const timestamp = new Date().toISOString();
    const body = new URLSearchParams({
      name: name.trim(),
      rating: String(stars),
      ratingEmoji: ratingEmojiForStars(stars),
      message: text,
      feedback: text,
      comments: text,
      timestamp,
      submittedAt: timestamp,
    });

    try {
      const res = await fetch(FEEDBACK_SCRIPT_POST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      setSubmitError(
        "We could not send your feedback just now. Please try again or message us on WhatsApp.",
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    void launchFullScreenConfetti();
    setSubmitted(true);
  }

  function reset() {
    setName("");
    setRating(null);
    setMessage("");
    setSubmitted(false);
    setShowRatingHint(false);
    setShowNameHint(false);
    setSubmitError(null);
    setIsSubmitting(false);
  }

  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className="pb-bakery-bg flex min-h-screen w-full flex-col items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1.25rem)] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-12"
      >
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.04, ease: [0.22, 1, 0.36, 1] as const }}
            className="shrink-0 px-1"
          >
            <p className="font-peoples-bakers-display text-[clamp(1.85rem,5.5vw,2.45rem)] font-semibold tracking-[0.02em] text-[#3d2f24]">
              Peoples Bakers
            </p>
            <p className="mt-2 font-peoples-bakers-display text-sm font-medium italic tracking-wide text-amber-900/80 sm:text-base">
              Artisan warmth, every day
            </p>
            <h1 className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-stone-600 sm:text-[0.8125rem]">
              අදහස් දැක්වීම · Feedback
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
              Share a moment—we read every note with care.
            </p>
          </motion.header>

          <motion.section
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }}
            className={`mt-8 w-full ${glassPanel}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!submitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="flex w-full flex-col items-center gap-6"
                >
                  <motion.div
                    variants={staggerParent}
                    initial="hidden"
                    animate="visible"
                    className="flex w-full flex-col items-center gap-6"
                  >
                    <motion.div variants={staggerItem} className="w-full max-w-sm space-y-2">
                      <label htmlFor="name" className={labelClass}>
                        <User className="size-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                        <span>නම / Name</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setShowNameHint(false);
                        }}
                        placeholder="Your name"
                        className={fieldClass}
                      />
                      {showNameHint ? (
                        <p className="text-center text-xs font-medium text-red-600" role="alert">
                          නම අවශ්‍යයි / Name required
                        </p>
                      ) : null}
                    </motion.div>

                    <motion.div variants={staggerItem} className="w-full space-y-3">
                      <p className={labelClass}>
                        <Star className="size-3.5 shrink-0 fill-amber-400/90 text-amber-600/90" strokeWidth={2} aria-hidden />
                        <span>තක්සේරුව / Rating</span>
                      </p>
                      <InteractiveRatingFace rating={rating} />
                      <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Rating">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-checked={rating === n}
                            role="radio"
                            onClick={() => {
                              setRating(n);
                              setShowRatingHint(false);
                            }}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold shadow-sm backdrop-blur-sm transition active:scale-[0.97] sm:h-12 sm:w-12 ${
                              rating === n
                                ? "border-amber-500/90 bg-gradient-to-b from-amber-50 to-orange-50/95 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_4px_16px_-4px_rgba(217,119,6,0.4)]"
                                : "border-white/60 bg-white/45 text-stone-600 hover:border-amber-300/80 hover:bg-white/60 hover:shadow-md"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {showRatingHint ? (
                        <p className="text-center text-xs font-medium text-red-600" role="alert">
                          තක්සේරුවක් තෝරන්න / Pick a rating
                        </p>
                      ) : null}
                    </motion.div>

                    <motion.div variants={staggerItem} className="w-full max-w-sm space-y-2">
                      <label htmlFor="message" className={labelClass}>
                        <MessageSquare className="size-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                        <span>පණිවිඩය / Message</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Pastries, staff, favourites…"
                        className={`${fieldClass} resize-none py-3 placeholder:text-xs`}
                      />
                    </motion.div>

                    <motion.div variants={staggerItem} className="w-full max-w-sm space-y-3 pt-1">
                      <input type="hidden" name="rating" value={rating ?? ""} />
                      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          aria-busy={isSubmitting}
                          className="flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-900 via-amber-800 to-orange-800 px-4 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_32px_-8px_rgba(120,53,15,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:brightness-[1.06] active:scale-[0.99] active:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          <Send className="size-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                          {isSubmitting ? "යවමින් · Sending…" : "ප්‍රතිචාරය එවන්න · Submit"}
                        </button>
                        <a
                          href={WHATSAPP_CHAT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pb-whatsapp-premium flex min-h-[3.25rem] flex-1 flex-row items-center justify-center gap-2.5 rounded-2xl px-4 py-3 text-white ring-2 ring-white/50 transition hover:brightness-110 active:scale-[0.99] sm:flex-col sm:justify-center sm:gap-2 sm:py-3.5"
                          aria-label={`WhatsApp feedback — ${WHATSAPP_PHONE_DISPLAY}`}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/10 shadow-inner ring-1 ring-white/35 sm:h-11 sm:w-11">
                            <WhatsAppGlyph className="h-5 w-5 sm:h-6 sm:w-6" />
                          </span>
                          <span className="min-w-0 flex-1 text-left sm:flex-none sm:text-center">
                            <span className="block text-[0.7rem] font-bold uppercase leading-snug tracking-wide sm:text-xs">
                              Feedback on WhatsApp
                            </span>
                            <span className="mt-0.5 block font-mono text-[0.65rem] font-semibold text-white/95 tabular-nums sm:text-xs">
                              {WHATSAPP_PHONE_DISPLAY}
                            </span>
                          </span>
                        </a>
                      </div>
                      {submitError ? (
                        <p className="px-1 text-center text-xs font-medium text-red-600" role="alert">
                          {submitError}
                        </p>
                      ) : null}
                      <p className="px-1 text-center text-[0.65rem] leading-relaxed text-stone-500">
                        WhatsApp opens to {WHATSAPP_PHONE_DISPLAY} with a pre-filled feedback note.
                      </p>
                    </motion.div>
                  </motion.div>
                </motion.form>
              ) : (
                <motion.div
                  key="thanks"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                  className="py-4 text-center"
                >
                  <p className="font-peoples-bakers-display text-2xl font-semibold tracking-wide text-[#3d2f24]">
                    ස්තුතියි · Thank you
                  </p>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone-600">
                    We received your feedback with gratitude.
                  </p>
                  <a
                    href={WHATSAPP_CHAT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pb-whatsapp-premium mx-auto mt-6 flex min-h-[3.25rem] w-full max-w-sm items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white ring-2 ring-white/50 transition hover:brightness-110 active:scale-[0.99]"
                    aria-label={`WhatsApp — ${WHATSAPP_PHONE_DISPLAY}`}
                  >
                    <WhatsAppGlyph className="h-5 w-5 shrink-0" />
                    WhatsApp · {WHATSAPP_PHONE_DISPLAY}
                  </a>
                  <motion.button
                    type="button"
                    onClick={reset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 rounded-2xl border border-white/55 bg-white/50 px-8 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-800 shadow-[0_6px_24px_-8px_rgba(61,47,36,0.18)] backdrop-blur-md transition hover:bg-white/70"
                  >
                    නැවත යොමු කරන්න · Send another
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-10 font-peoples-bakers-display text-[0.625rem] uppercase tracking-[0.42em] text-stone-500"
          >
            Peoples Bakers
          </motion.p>
        </div>
      </motion.main>
    </>
  );
}
