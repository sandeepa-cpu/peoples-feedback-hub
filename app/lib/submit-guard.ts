/** Leading-edge window so a double tap cannot start two inserts. */
export const SUBMIT_DEBOUNCE_MS = 750;

/** After a successful insert, block another submit for this long. */
export const SUBMIT_COOLDOWN_MS = 45_000;

const COOLDOWN_KEY = "pb-feedback-cooldown-until";

export function getCooldownRemainingMs(now = Date.now()): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(COOLDOWN_KEY);
    if (!raw) return 0;
    const until = Number(raw);
    if (!Number.isFinite(until)) return 0;
    return Math.max(0, until - now);
  } catch {
    return 0;
  }
}

export function startSubmitCooldown(now = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOLDOWN_KEY, String(now + SUBMIT_COOLDOWN_MS));
  } catch {
    /* private mode / quota — in-flight disable still applies */
  }
}
