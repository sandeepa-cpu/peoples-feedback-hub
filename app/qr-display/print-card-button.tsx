"use client";

export function PrintCardButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-linear-to-r from-[#5c4033] to-[#7c4a32] px-6 py-3 text-sm font-semibold text-[#fffefb] shadow-[0_10px_28px_-12px_rgba(62,47,38,0.45)] ring-1 ring-stone-900/15 transition hover:brightness-[1.06] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900 touch-manipulation"
    >
      Print card
    </button>
  );
}
