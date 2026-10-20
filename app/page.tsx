"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  UtensilsCrossed,
  User,
} from "lucide-react";

import { ThankYouModal } from "./components/feedback/ThankYouModal";
import { ShopLocationPicker } from "./components/feedback/ShopLocationPicker";
import { useFeedbackDraft, clearFeedbackDraft, type FeedbackDraft } from "./hooks/useFeedbackDraft";
import {
  ITEM_CATEGORY_OPTIONS,
  QUICK_TAG_LABELS,
  SERVICE_TYPE_OPTIONS,
  type QuickTag,
} from "./lib/feedback-options";
import { ratingEmojiForStars } from "./lib/rating-emoji";
import { getCooldownRemainingMs, startSubmitCooldown, SUBMIT_DEBOUNCE_MS } from "./lib/submit-guard";
import { supabase } from "@/lib/supabase";
import type { FeedbackInsert } from "@/lib/database.types";
import { WHATSAPP_CHAT_URL, WHATSAPP_PHONE_DISPLAY } from "./lib/whatsapp";

async function launchFullScreenConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const colors = [
    "#fcee21",
    "#fff9a8",
    "#ffd43b",
    "#6B21A8",
    "#A855F7",
    "#e9d5ff",
    "#ffffff",
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
    transition: { staggerChildren: 0.04 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/** Form card — frosted glass over the purple backdrop */
const glassPanel =
  "pb-card-shine pb-form-pattern relative w-full rounded-[1.875rem] border border-white/55 p-6 shadow-[0_36px_90px_-28px_rgba(107,33,168,0.55),0_14px_44px_-20px_rgba(168,85,247,0.28),inset_0_1px_0_0_rgba(255,255,255,0.72)] ring-1 ring-white/40 backdrop-blur-2xl sm:p-9";

const fieldClass =
  "w-full rounded-xl border border-[var(--pb-purple)]/15 bg-white/55 px-3.5 py-2.5 text-base leading-snug text-stone-900 shadow-[inset_0_1px_3px_rgba(107,33,168,0.06)] outline-none backdrop-blur-md transition placeholder:text-stone-400 focus:border-[var(--pb-purple-light)] focus:bg-white/80 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.22)]";

const labelClass =
  "flex items-center justify-center gap-2 font-peoples-bakers-display text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[var(--pb-purple)]";

/** Section blocks — glass panels inside the card */
const sectionCard =
  "pb-section-pattern w-full space-y-3 rounded-2xl border border-white/60 p-4 shadow-[0_8px_28px_-16px_rgba(107,33,168,0.35)] backdrop-blur-xl sm:p-5";

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  children: ReactNode;
}) {
  return (
    <p className={labelClass}>
      <span className="flex size-6 items-center justify-center rounded-lg bg-[var(--pb-purple)]/10">
        <Icon className="size-3.5 shrink-0 text-[var(--pb-purple)]" strokeWidth={2} aria-hidden />
      </span>
      <span>{children}</span>
    </p>
  );
}

function choiceChipClass(active: boolean) {
  return `relative max-w-[11rem] min-w-[5.75rem] flex-1 px-3 py-2 text-center text-[0.6875rem] font-semibold uppercase leading-snug tracking-wide transition active:scale-[0.97] sm:max-w-none sm:min-w-0 sm:px-3.5 sm:py-2.5 sm:text-xs ${
    active
      ? "border-[var(--pb-purple)]/70 bg-white/75 text-[#4c1d95] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_16px_-4px_rgba(107,33,168,0.4)]"
      : "border-white/70 bg-white/45 text-stone-600 hover:border-[var(--pb-purple-light)]/50 hover:bg-white/70 hover:shadow-md"
  } rounded-xl border shadow-sm backdrop-blur-sm`;
}

function tagChipClass(active: boolean) {
  return `relative px-3.5 py-2 text-center text-[0.75rem] font-semibold normal-case leading-snug tracking-normal transition active:scale-[0.97] sm:px-4 sm:py-2.5 ${
    active
      ? "border-[var(--pb-purple)]/70 bg-white/80 text-[#4c1d95] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_16px_-4px_rgba(107,33,168,0.4)]"
      : "border-white/70 bg-white/45 text-stone-700 hover:border-[var(--pb-purple-light)]/55 hover:bg-white/75 hover:shadow-md"
  } rounded-full border shadow-sm backdrop-blur-sm`;
}

function ChipCheckBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.34, 1.45, 0.64, 1] as const }}
      className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--pb-purple)] shadow-md ring-2 ring-white"
      aria-hidden
    >
      <Check className="size-2.5 text-[#fcee21]" strokeWidth={3.5} />
    </motion.span>
  );
}

const RATING_WORDS: Record<number, string> = {
  1: "දුර්වලයි · Poor",
  2: "සාමාන්‍යයි · Fair",
  3: "හොඳයි · Good",
  4: "ඉතා හොඳයි · Very good",
  5: "විශිෂ්ටයි · Excellent",
};

function StarRating({
  rating,
  onSelect,
}: {
  rating: number | null;
  onSelect: (n: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeUpTo = hovered ?? rating ?? 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center gap-1.5 sm:gap-2"
        role="radiogroup"
        aria-label="Rating"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= activeUpTo;
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHovered(n)}
              onFocus={() => setHovered(n)}
              onBlur={() => setHovered(null)}
              onClick={() => onSelect(n)}
              whileTap={{ scale: 0.82 }}
              animate={rating === n ? { scale: [1, 1.28, 1] } : { scale: 1 }}
              transition={{ duration: 0.34, ease: [0.34, 1.45, 0.64, 1] as const }}
              className="rounded-xl p-1 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--pb-purple-light)]/70 sm:p-1.5"
            >
              <Star
                strokeWidth={1.6}
                className={`size-9 transition-all duration-150 sm:size-10 ${
                  filled
                    ? "fill-[#fcc419] text-[#e8a600] drop-shadow-[0_3px_8px_rgba(252,196,25,0.55)]"
                    : "fill-stone-100 text-stone-300"
                }`}
              />
            </motion.button>
          );
        })}
      </div>
      <div className="flex min-h-[1.25rem] items-center justify-center">
        <AnimatePresence mode="wait">
          {activeUpTo > 0 ? (
            <motion.span
              key={activeUpTo}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16 }}
              className="text-xs font-semibold tracking-wide text-[var(--pb-purple)]"
            >
              {RATING_WORDS[activeUpTo]}
            </motion.span>
          ) : (
            <motion.span
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-stone-400"
            >
              තරු ඔබන්න · Tap the stars
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

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
      className="flex min-h-[4.75rem] flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/40 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md"
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
      <span className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[var(--pb-purple)]/70">
        {rating === null ? "Pick a rating" : "Your reaction"}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [rating, setRating] = useState<number | null>(null);
  const [shopLocation, setShopLocation] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [quickTags, setQuickTags] = useState<QuickTag[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showRatingHint, setShowRatingHint] = useState(false);
  const [showShopHint, setShowShopHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const lastSubmitAttemptRef = useRef(0);
  const ratingSectionRef = useRef<HTMLDivElement>(null);
  const shopSectionRef = useRef<HTMLDivElement>(null);

  const draft = useMemo<FeedbackDraft>(
    () => ({
      v: 1,
      rating,
      shopLocation,
      itemCategory,
      serviceType,
      quickTags,
      name,
      phone,
      message,
    }),
    [rating, shopLocation, itemCategory, serviceType, quickTags, name, phone, message],
  );

  function applyDraft(saved: FeedbackDraft) {
    setRating(saved.rating);
    setShopLocation(saved.shopLocation);
    setItemCategory(saved.itemCategory);
    setServiceType(saved.serviceType);
    setQuickTags(saved.quickTags);
    setName(saved.name);
    setPhone(saved.phone);
    setMessage(saved.message);
  }

  useFeedbackDraft({
    draft,
    onHydrate: applyDraft,
    persist: !submitted,
  });

  function toggleQuickTag(label: QuickTag) {
    setQuickTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label],
    );
  }

  const completionPercent = useMemo(() => {
    const parts = [
      rating !== null,
      shopLocation !== "",
      itemCategory !== "",
      serviceType !== "",
      quickTags.length > 0,
      name.trim() !== "",
      phone.trim() !== "",
      message.trim() !== "",
    ];
    return Math.round((parts.filter(Boolean).length / parts.length) * 100);
  }, [rating, shopLocation, itemCategory, serviceType, quickTags, name, phone, message]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSubmitAttemptRef.current < SUBMIT_DEBOUNCE_MS) return;
    lastSubmitAttemptRef.current = now;
    if (isSubmitting) return;

    const cooldownMs = getCooldownRemainingMs(now);
    if (cooldownMs > 0) {
      setSubmitError(
        `Please wait ${Math.ceil(cooldownMs / 1000)}s before sending another note.`,
      );
      return;
    }

    const ratingMissing = rating === null || rating === 0;
    const shopMissing = shopLocation.trim() === "";
    if (ratingMissing) {
      setShowRatingHint(true);
      if (shopMissing) setShowShopHint(true);
      else setShowShopHint(false);
      ratingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowRatingHint(false);
    if (shopMissing) {
      setShowShopHint(true);
      shopSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowShopHint(false);

    const stars = rating;
    setSubmitError(null);
    setIsSubmitting(true);

    /** Plain strings / null — never booleans or UI-validation flags */
    const nameTrimmed = name.trim();
    const phoneTrimmed = phone.trim();
    const categoryTrimmed = itemCategory.trim();
    const serviceTrimmed = serviceType.trim();
    const shopTrimmed = shopLocation.trim();
    const messageTrimmed = message.trim();
    const tagLabelsSorted =
      quickTags.length > 0 ? [...quickTags].sort((a, b) => a.localeCompare(b)).join(", ") : null;

    const insertPayload: FeedbackInsert = {
      rating: stars,
      message: messageTrimmed,
      name: nameTrimmed.length > 0 ? nameTrimmed : null,
      phone_number: phoneTrimmed.length > 0 ? phoneTrimmed : null,
      item_category: categoryTrimmed.length > 0 ? categoryTrimmed : null,
      service_type: serviceTrimmed.length > 0 ? serviceTrimmed : null,
      shop_location: shopTrimmed.length > 0 ? shopTrimmed : null,
      quick_tags: tagLabelsSorted,
    };

    try {
      const { error } = await supabase.from("feedbacks").insert(insertPayload);

      if (error) {
        console.error("[supabase] insert feedback", error);
        setSubmitError(
          "We could not save your feedback. Check your connection or try WhatsApp.",
        );
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setSubmitError(
        "We could not save your feedback. Please try again or message us on WhatsApp.",
      );
      setIsSubmitting(false);
      return;
    }

    clearFeedbackDraft();
    startSubmitCooldown();
    setIsSubmitting(false);
    void launchFullScreenConfetti();
    setSubmitted(true);
  }

  function reset() {
    setRating(null);
    setShopLocation("");
    setItemCategory("");
    setServiceType("");
    setQuickTags([]);
    setName("");
    setPhone("");
    setMessage("");
    setSubmitted(false);
    setShowRatingHint(false);
    setShowShopHint(false);
    setSubmitError(null);
    setIsSubmitting(false);
    clearFeedbackDraft();
  }

  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
        className="pb-bakery-bg relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1.25rem)] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-12"
      >
        {/* Animated blur blobs are desktop-only: large blurred layers hurt mobile scrolling/typing performance */}
        <div
          className="pb-blob-a pointer-events-none absolute -left-24 top-16 hidden h-72 w-72 rounded-full bg-[#fcee21]/14 blur-3xl sm:block"
          aria-hidden
        />
        <div
          className="pb-blob-b pointer-events-none absolute -right-20 bottom-24 hidden h-80 w-80 rounded-full bg-white/12 blur-3xl sm:block"
          aria-hidden
        />
        <div className="relative mx-auto flex w-full max-w-lg flex-col items-center text-center">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            className="shrink-0 px-1"
          >
            <p className="font-peoples-bakers-display text-[clamp(1.85rem,5.5vw,2.45rem)] font-semibold tracking-[0.02em] text-white drop-shadow-[0_2px_12px_rgba(30,6,32,0.45)]">
              Peoples Bakers
            </p>
            <p className="mt-2 font-peoples-bakers-display text-sm font-medium italic tracking-wide text-[#fcee21]/95 sm:text-base">
              Artisan warmth, every day
            </p>
            <h1 className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#fcee21]/45 bg-white/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-[0_4px_18px_-6px_rgba(30,6,32,0.5)] sm:text-[0.8125rem]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#fcee21]" aria-hidden />
              අදහස් දැක්වීම · Feedback
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/75">
              Share a moment—we read every note with care.
            </p>
          </motion.header>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] as const }}
            className={`mt-8 w-full ${glassPanel}`}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-[1.875rem] bg-gradient-to-r from-[#fcee21] via-[var(--pb-purple-light)] to-[var(--pb-purple)]"
              aria-hidden
            />
            <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="relative z-[1] flex w-full flex-col items-center gap-6"
                >
                  <motion.div
                    variants={staggerParent}
                    initial="hidden"
                    animate="visible"
                    className="relative z-[1] flex w-full flex-col items-center gap-6"
                  >
                    <motion.div variants={staggerItem} className="flex flex-col items-center">
                      <div
                        className="relative flex h-[5.75rem] w-[5.75rem] items-center justify-center overflow-hidden rounded-[1.125rem] bg-white/75 shadow-[0_16px_40px_-18px_rgba(142,36,141,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] ring-[3px] ring-[#fcee21]/85 ring-offset-[3px] ring-offset-white/40 sm:h-[6.75rem] sm:w-[6.75rem]"
                      >
                        <Image
                          src="/logo.jpg"
                          alt="Peoples Bakers logo"
                          width={104}
                          height={104}
                          className="h-[5.25rem] w-[5.25rem] object-contain sm:h-[6rem] sm:w-[6rem]"
                          priority
                        />
                      </div>
                      <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--pb-purple)]/90">
                        Peoples Bakers
                      </p>
                    </motion.div>

                    <motion.div variants={staggerItem} className="w-full max-w-sm space-y-1.5">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-stone-500">
                          ප්‍රගතිය · Progress
                        </span>
                        <span className="relative inline-flex h-4 min-w-[2.5rem] justify-end overflow-hidden">
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={completionPercent}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
                              className={`text-[0.6875rem] font-bold tabular-nums ${
                                completionPercent === 100 ? "text-[#16a34a]" : "text-[var(--pb-purple)]"
                              }`}
                            >
                              {completionPercent}%
                            </motion.span>
                          </AnimatePresence>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50 shadow-inner">
                        <motion.div
                          className={`h-full rounded-full ${
                            completionPercent === 100
                              ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a]"
                              : "bg-gradient-to-r from-[var(--pb-yellow)] via-[var(--pb-purple-light)] to-[var(--pb-purple)]"
                          }`}
                          initial={false}
                          animate={{ width: `${Math.max(completionPercent, 3)}%` }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
                        />
                      </div>
                    </motion.div>

                    <motion.div ref={ratingSectionRef} variants={staggerItem} className={sectionCard}>
                      <SectionLabel icon={Star}>තක්සේරුව / Rating</SectionLabel>
                      <InteractiveRatingFace rating={rating} />
                      <StarRating
                        rating={rating}
                        onSelect={(n) => {
                          setRating(n);
                          setShowRatingHint(false);
                        }}
                      />
                      {showRatingHint ? (
                        <p className="text-center text-xs font-medium text-red-600" role="alert">
                          තක්සේරුවක් තෝරන්න / Pick a rating
                        </p>
                      ) : null}
                    </motion.div>

                    <motion.div ref={shopSectionRef} variants={staggerItem} className={sectionCard}>
                      <SectionLabel icon={MapPin}>ශාඛාව / Shop location (REQUIRED / අනිවාර්යයි)</SectionLabel>
                      <ShopLocationPicker
                        value={shopLocation}
                        invalid={showShopHint}
                        onChange={(next) => {
                          setShopLocation(next);
                          setShowShopHint(false);
                        }}
                      />
                      {showShopHint ? (
                        <p className="text-center text-xs font-semibold text-red-600" role="alert">
                          කරුණාකර ශාඛාව තෝරන්න / Please select a shop location
                        </p>
                      ) : null}
                    </motion.div>

                    <motion.div variants={staggerItem} className={sectionCard}>
                      <SectionLabel icon={Layers}>නිෂ්පාදන ගණය / Product category (optional)</SectionLabel>
                      <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Product category">
                        {ITEM_CATEGORY_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={itemCategory === opt}
                            onClick={() => setItemCategory(itemCategory === opt ? "" : opt)}
                            className={choiceChipClass(itemCategory === opt)}
                          >
                            {opt}
                            <ChipCheckBadge visible={itemCategory === opt} />
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={staggerItem} className={sectionCard}>
                      <SectionLabel icon={UtensilsCrossed}>සේවා වර්ගය / Service type (optional)</SectionLabel>
                      <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Service type">
                        {SERVICE_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={serviceType === opt}
                            onClick={() => setServiceType(serviceType === opt ? "" : opt)}
                            className={choiceChipClass(serviceType === opt)}
                          >
                            {opt}
                            <ChipCheckBadge visible={serviceType === opt} />
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={staggerItem} className={sectionCard}>
                      <SectionLabel icon={Sparkles}>කෙටි සටහන් / Quick tags (optional)</SectionLabel>
                      <div className="flex flex-wrap justify-center gap-2" aria-label="Quick tags">
                        {QUICK_TAG_LABELS.map((tag) => {
                          const on = quickTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleQuickTag(tag)}
                              className={tagChipClass(on)}
                            >
                              {tag}
                              <ChipCheckBadge visible={on} />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>

                    <motion.div variants={staggerItem} className={`${sectionCard} space-y-4`}>
                      <SectionLabel icon={User}>ඔබ ගැන / Your details (optional)</SectionLabel>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="customer-name" className="block text-left text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-500">
                            Your name
                          </label>
                          <input
                            id="customer-name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Anonymous is fine"
                            autoComplete="name"
                            maxLength={120}
                            className={fieldClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="customer-phone" className="block text-left text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-500">
                            Phone
                          </label>
                          <input
                            id="customer-phone"
                            name="phone_number"
                            type="tel"
                            inputMode="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 077 123 4567"
                            autoComplete="tel"
                            maxLength={32}
                            className={fieldClass}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="message" className="flex items-center gap-2 text-left text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-500">
                          <MessageSquare className="size-3 shrink-0 text-[var(--pb-purple)]/70" strokeWidth={2} aria-hidden />
                          පණිවිඩය / Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          value={message}
                          maxLength={500}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Pastries, staff, favourites…"
                          className={`${fieldClass} resize-none py-3 placeholder:text-xs`}
                        />
                        <p
                          className={`text-right text-[0.625rem] tabular-nums ${
                            message.length >= 450 ? "font-semibold text-[var(--pb-purple)]" : "text-stone-400"
                          }`}
                          aria-hidden
                        >
                          {message.length}/500
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={staggerItem} className="w-full space-y-3 pt-1">
                      <input type="hidden" name="rating" value={rating ?? ""} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                        className="pb-shimmer flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[var(--pb-purple-light)] via-[var(--pb-purple)] to-[#581c87] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_32px_-8px_rgba(107,33,168,0.65),inset_0_1px_0_rgba(255,255,255,0.22)] ring-1 ring-[var(--pb-yellow)]/40 transition hover:brightness-[1.08] active:scale-[0.99] active:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-65"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2} aria-hidden />
                        ) : (
                          <Send className="size-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                        )}
                        {isSubmitting ? "යවමින් · Sending…" : "ප්‍රතිචාරය එවන්න · Submit"}
                      </button>

                      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_8px_28px_-12px_rgba(16,185,129,0.45)]">
                        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-emerald-200/40 blur-2xl" aria-hidden />
                        <p className="text-center text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
                          හෝ WhatsApp එකෙන් · Or via WhatsApp
                        </p>
                        <a
                          href={WHATSAPP_CHAT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pb-whatsapp-premium mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-white transition hover:brightness-110 active:scale-[0.99]"
                          aria-label={`WhatsApp feedback — ${WHATSAPP_PHONE_DISPLAY}`}
                        >
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-black/10 shadow-inner ring-1 ring-white/35">
                            <WhatsAppGlyph className="size-6" />
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block text-xs font-bold uppercase tracking-wide">
                              Message us on WhatsApp
                            </span>
                            <span className="mt-0.5 block font-mono text-base font-bold tabular-nums tracking-wide">
                              {WHATSAPP_PHONE_DISPLAY}
                            </span>
                            <span className="mt-0.5 block text-[0.65rem] font-medium text-white/85">
                              ප්‍රතිචාරය එවීමට tap කරන්න
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
          </motion.section>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="mt-10 flex flex-col items-center gap-2"
          >
            <p className="font-peoples-bakers-display text-[0.625rem] uppercase tracking-[0.42em] text-white/65">
              Peoples Bakers
            </p>
            <Link
              href="/admin"
              className="font-peoples-bakers-display text-[0.55rem] uppercase tracking-[0.32em] text-white/30 transition hover:text-white/55"
            >
              Admin
            </Link>
          </motion.div>
        </div>
      </motion.main>
      <ThankYouModal open={submitted} name={name} onSendAnother={reset} />
    </>
  );
}
