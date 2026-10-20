"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#8e248d] px-6 text-center text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#fcee21]">Peoples Bakers</p>
      <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-white/80">
        The page could not finish loading. You can try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-2xl bg-[#fcee21] px-6 py-2.5 text-sm font-bold text-[#2d0830]"
      >
        Try again
      </button>
    </main>
  );
}
