"use client";

import { useEffect, useRef, useState } from "react";

import { isQuickTag, isShopLocation, type QuickTag } from "../lib/feedback-options";

export const FEEDBACK_DRAFT_KEY = "pb-feedback-draft-v1";

export type FeedbackDraft = {
  v: 1;
  rating: number | null;
  shopLocation: string;
  itemCategory: string;
  serviceType: string;
  quickTags: QuickTag[];
  name: string;
  phone: string;
  message: string;
};

function sanitizeDraft(raw: unknown): FeedbackDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<FeedbackDraft>;
  if (d.v !== 1) return null;

  const rating =
    typeof d.rating === "number" && d.rating >= 1 && d.rating <= 5 ? Math.round(d.rating) : null;
  const shopLocation =
    typeof d.shopLocation === "string" && (d.shopLocation === "" || isShopLocation(d.shopLocation))
      ? d.shopLocation
      : "";
  const itemCategory = typeof d.itemCategory === "string" ? d.itemCategory.slice(0, 40) : "";
  const serviceType = typeof d.serviceType === "string" ? d.serviceType.slice(0, 40) : "";
  const quickTags = Array.isArray(d.quickTags)
    ? d.quickTags.filter((tag): tag is QuickTag => typeof tag === "string" && isQuickTag(tag))
    : [];
  const name = typeof d.name === "string" ? d.name.slice(0, 120) : "";
  const phone = typeof d.phone === "string" ? d.phone.slice(0, 32) : "";
  const message = typeof d.message === "string" ? d.message.slice(0, 500) : "";

  return {
    v: 1,
    rating,
    shopLocation,
    itemCategory,
    serviceType,
    quickTags,
    name,
    phone,
    message,
  };
}

function isEmptyDraft(draft: FeedbackDraft): boolean {
  return (
    draft.rating === null &&
    draft.shopLocation === "" &&
    draft.itemCategory === "" &&
    draft.serviceType === "" &&
    draft.quickTags.length === 0 &&
    draft.name === "" &&
    draft.phone === "" &&
    draft.message === ""
  );
}
export function readFeedbackDraft(): FeedbackDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FEEDBACK_DRAFT_KEY);
    if (!raw) return null;
    return sanitizeDraft(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeFeedbackDraft(draft: FeedbackDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FEEDBACK_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearFeedbackDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(FEEDBACK_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

type UseFeedbackDraftArgs = {
  draft: FeedbackDraft;
  onHydrate: (draft: FeedbackDraft) => void;
  persist: boolean;
};

/** Hydrate once, then debounce-write unfinished drafts. */
export function useFeedbackDraft({ draft, onHydrate, persist }: UseFeedbackDraftArgs) {
  const [hydrated, setHydrated] = useState(false);
  const onHydrateRef = useRef(onHydrate);
  onHydrateRef.current = onHydrate;

  useEffect(() => {
    const saved = readFeedbackDraft();
    if (saved && !isEmptyDraft(saved)) onHydrateRef.current(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!persist || isEmptyDraft(draft)) {
      clearFeedbackDraft();
      return;
    }
    const id = window.setTimeout(() => writeFeedbackDraft(draft), 400);
    return () => window.clearTimeout(id);
  }, [draft, hydrated, persist]);

  return { hydrated };
}
