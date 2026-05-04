/** Peoples Bakers feedback → Google Apps Script Web App (doPost) */
export const FEEDBACK_SCRIPT_POST_URL =
  "https://script.google.com/macros/s/AKfycbySYmgNkMDQ38UL3NPTTwdsQuNXnSU-050v_GnyeZrgU9k5L1ayoKCDH99D_B1C8n_B/exec";

/** Emoji aligned with the 1–5 star UI (posted as `ratingEmoji` for the sheet). */
export function ratingEmojiForStars(stars: number): string {
  if (stars <= 1) return "😠";
  if (stars === 2) return "🙁";
  if (stars === 3) return "😐";
  if (stars === 4) return "🙂";
  return "😍";
}
