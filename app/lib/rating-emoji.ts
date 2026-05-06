/** Emoji aligned with the 1–5 star rating UI. */
export function ratingEmojiForStars(stars: number): string {
  if (stars <= 1) return "😠";
  if (stars === 2) return "🙁";
  if (stars === 3) return "😐";
  if (stars === 4) return "🙂";
  return "😍";
}
