/**
 * Peoples Bakers → Google Apps Script Web App (doPost).
 * Deployment: Web App Version 2 — update when you redeploy.
 *
 * POST fields (`application/x-www-form-urlencoded`): use `e.parameter` keys that match
 * how your script maps into the sheet (align row 1 headers / `appendRow` order there).
 *
 * Keys sent from the app:
 *   name         — customer name
 *   rating       — star rating "1" … "5"
 *   message      — feedback / comment text (same meaning as the form "Message" field)
 *   timestamp    — ISO-8601 UTC when submitted
 *   ratingEmoji  — reaction emoji for the rating (😠 … 😍); omit in the script if unused
 */
export const FEEDBACK_SCRIPT_POST_URL =
  "https://script.google.com/macros/s/AKfycbySYmgNkMDQ38UL3NPTTwdsQuNXnSU-O5Ov_GnyeZrgU9k5L1ayoKCDH99DOiKOGaPviQ/exec";

/** Emoji aligned with the 1–5 star UI (posted as `ratingEmoji`). */
export function ratingEmojiForStars(stars: number): string {
  if (stars <= 1) return "😠";
  if (stars === 2) return "🙁";
  if (stars === 3) return "😐";
  if (stars === 4) return "🙂";
  return "😍";
}
