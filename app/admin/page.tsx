import Link from "next/link";

import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Feedbacks · Admin | Peoples Bakers",
  description: "View Peoples Bakers customer feedback from Supabase.",
};

type FeedbackRow = {
  id: string;
  created_at: string;
  rating: number;
  message: string | null;
};

export default async function AdminFeedbacksPage() {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("id, created_at, rating, message")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as FeedbackRow[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-[#e8dfd4] px-4 py-10 pb-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-peoples-bakers-display text-2xl font-semibold tracking-wide text-[#3d2f24]">
              Peoples Bakers
            </p>
            <h1 className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              Feedback admin
            </h1>
            {error ? (
              <p className="mt-3 max-w-xl text-sm text-red-600" role="alert">
                Could not load feedbacks: {error.message}. Check RLS policies and the{" "}
                <code className="rounded bg-red-50 px-1">feedbacks</code> table.
              </p>
            ) : null}
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-stone-50"
          >
            ← Feedback form
          </Link>
        </header>

        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_24px_60px_-28px_rgba(61,47,36,0.22)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm text-stone-800">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  <th className="px-5 py-4">Submitted</th>
                  <th className="w-24 px-5 py-4">Rating</th>
                  <th className="px-5 py-4">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {error ? (
                  <tr>
                    <td className="px-5 py-16 text-center text-red-600" colSpan={3}>
                      Fix the error above and refresh this page.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-16 text-center text-stone-500" colSpan={3}>
                      No rows yet. Submit the feedback form to see entries here.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-amber-50/60 odd:bg-stone-50/30"
                    >
                      <td className="whitespace-nowrap px-5 py-4 tabular-nums text-stone-600">
                        {new Date(row.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-amber-100/90 px-2.5 text-sm font-bold text-amber-950 tabular-nums">
                          {row.rating}
                        </span>
                      </td>
                      <td className="max-w-xl px-5 py-4 break-words whitespace-pre-wrap leading-relaxed text-stone-700">
                        {row.message?.trim() ? row.message : "—"}
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
