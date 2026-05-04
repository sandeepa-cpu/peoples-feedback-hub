import type { Metadata } from "next";
import QRCode from "qrcode";

import { PrintCardButton } from "./print-card-button";

export const metadata: Metadata = {
  title: "Feedback QR Card | Peoples Bakers",
  description:
    "Printable QR card for Peoples Bakers customer feedback—scan, rate, redeem.",
};

function resolveFeedbackUrl(): string {
  const direct = process.env.NEXT_PUBLIC_FEEDBACK_URL?.trim();
  if (direct) return direct.replace(/\/?$/, "/");

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return new URL("/", site.replace(/\/?$/, "")).href;

  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}/`;

  return "http://localhost:3000/";
}

export default async function QrDisplayPage() {
  const feedbackUrl = resolveFeedbackUrl();

  const qrSvg = await QRCode.toString(feedbackUrl, {
    type: "svg",
    width: 280,
    margin: 2,
    color: { dark: "#3d2f24", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-stone-200 via-stone-100 to-[#e8dfd4] px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] print:bg-white print:p-0">
      <div className="mx-auto mb-8 flex flex-col items-center gap-3 print:hidden">
        <PrintCardButton />
        <p className="max-w-sm text-center text-xs leading-relaxed text-stone-600">
          Set{" "}
          <code className="rounded bg-stone-200/80 px-1 py-0.5 font-mono text-[0.65rem]">
            NEXT_PUBLIC_SITE_URL
          </code>{" "}
          or{" "}
          <code className="rounded bg-stone-200/80 px-1 py-0.5 font-mono text-[0.65rem]">
            NEXT_PUBLIC_FEEDBACK_URL
          </code>{" "}
          so the QR opens your live feedback page.
        </p>
      </div>

      <article className="mx-auto max-w-[22rem] break-inside-avoid rounded-[1.35rem] border border-stone-300/90 bg-[#fffefb] px-8 pb-10 pt-9 shadow-[0_22px_50px_-20px_rgba(62,47,38,0.28)] print:mx-0 print:max-w-none print:rounded-none print:border-2 print:border-stone-800 print:shadow-none">
        <header className="flex flex-col items-center text-center">
          <div
            className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-2xl border-[3px] border-dashed border-stone-400/80 bg-stone-50 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-stone-400"
            aria-label="Logo placeholder"
          >
            Logo
          </div>

          <h1 className="font-peoples-bakers-display mt-7 text-[clamp(1.65rem,6vw,2.125rem)] font-bold leading-[1.15] tracking-tight text-[#3d2f24]">
            Scan &amp; Win a{" "}
            <span className="text-amber-800">Free Pastry!</span>
          </h1>

          <p className="mt-2 font-peoples-bakers-display text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Peoples Bakers
          </p>
        </header>

        <div className="mt-8 flex justify-center rounded-2xl border border-stone-200 bg-white p-4 shadow-inner shadow-stone-200/80">
          <div
            className="[&_svg]:h-auto [&_svg]:max-h-[280px] [&_svg]:w-full [&_svg]:max-w-[280px]"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            aria-hidden
          />
        </div>

        <div className="sr-only">
          <span>Feedback link encoded in QR code:</span> {feedbackUrl}
        </div>

        <section className="mt-9 border-t border-stone-200/90 pt-8">
          <h2 className="text-center text-[0.7rem] font-bold uppercase tracking-[0.2em] text-stone-500">
            How it works
          </h2>
          <ol className="mt-5 space-y-4 text-left text-[0.9375rem] leading-snug text-stone-800">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-900 ring-1 ring-amber-200/80">
                1
              </span>
              <span className="pt-1">
                <strong className="text-stone-900">Scan</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-900 ring-1 ring-amber-200/80">
                2
              </span>
              <span className="pt-1">
                <strong className="text-stone-900">Rate</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-900 ring-1 ring-amber-200/80">
                3
              </span>
              <span className="pt-1">
                <strong className="text-stone-900">Show this</strong> to the
                counter.
              </span>
            </li>
          </ol>
        </section>

        <p className="mt-10 text-center font-peoples-bakers-display text-xs italic text-stone-400">
          Thank you for supporting local bakehouse flavor.
        </p>
      </article>
    </div>
  );
}
