import Link from "next/link";

// Supabase env: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (see lib/supabase.js)
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard | Peoples Bakers",
  description: "Peoples Bakers customer feedback — Supabase.",
};

export default async function AdminDashboardPage() {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("id, created_at, rating, message")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  let avgRating =
    rows.length === 0
      ? null
      : rows.reduce((sum, row) => sum + (typeof row.rating === "number" ? row.rating : 0), 0) /
        rows.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-white to-[#eef0eb] px-4 py-8 pb-16 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-6 border-b border-stone-200/90 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-peoples-bakers-display text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-wide text-[#3d2f24]">
              Peoples Bakers
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Live feedback from the <span className="font-medium">feedbacks</span> table (Supabase).
            </p>
            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                <span className="font-semibold">Could not load data.</span> {error.message} — check RLS
                and column names (<code className="rounded bg-red-100/80 px-1">rating</code>,{" "}
                <code className="rounded bg-red-100/80 px-1">message</code>).
              </p>
            ) : null}
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#5c4033] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]"
          >
            ← Open feedback form
          </Link>
        </header>

        {!error && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-stone-200/90 bg-white/90 px-6 py-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Total submissions
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-stone-900">{rows.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200/90 bg-white/90 px-6 py-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Average rating
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-amber-900">
                {avgRating === null ? "—" : avgRating.toFixed(1)}{" "}
                {avgRating !== null ? (
                  <span className="text-lg font-semibold text-stone-600">/ 5</span>
                ) : null}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 px-6 py-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/80">
                Status
              </p>
              <p className="mt-2 text-sm font-medium text-emerald-900">Connected — data loaded from Supabase</p>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_20px_50px_-24px_rgba(45,42,37,0.18)]">
          <div className="border-b border-stone-100 bg-stone-50/80 px-6 py-4">
            <h2 className="text-sm font-semibold text-stone-800">Feedback log</h2>
            <p className="text-xs text-stone-500">Newest entries first · ID stored in Supabase</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/95">
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Submitted
                  </th>
                  <th scope="col" className="w-28 px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Rating
                  </th>
                  <th scope="col" className="min-w-[12rem] px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {error ? (
                  <tr>
                    <td className="px-6 py-14 text-center text-stone-500" colSpan={3}>
                      Fix the configuration error, then reload.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-14 text-center text-stone-500" colSpan={3}>
                      No feedback yet. Entries from your public form will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-amber-50/40 [&:nth-child(even)]:bg-stone-50/40"
                    >
                      <td className="whitespace-nowrap px-6 py-4 align-top tabular-nums text-stone-600">
                        {new Date(row.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-gradient-to-b from-amber-50 to-amber-100 px-3 text-base font-bold text-amber-950 shadow-sm ring-1 ring-amber-200/70 tabular-nums">
                          {row.rating}
                        </span>
                      </td>
                      <td className="max-w-2xl px-6 py-4 align-top break-words whitespace-pre-wrap text-stone-800 leading-relaxed">
                        {row.message && String(row.message).trim() !== "" ? (
                          row.message
                        ) : (
                          <span className="italic text-stone-400">No message</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
