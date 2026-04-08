"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function AuthLoadingFallback({
  mode,
}: {
  mode: "sign-in" | "sign-up";
}) {
  const [showExtendedHelp, setShowExtendedHelp] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowExtendedHelp(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  const canonicalAuthUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.rizzlyai.com";
    return `${baseUrl}/${mode}`;
  }, [mode]);

  return (
    <div className="w-full rounded-[28px] border border-white/12 bg-[#160d2b]/95 p-6 text-center shadow-[0_0_50px_rgba(236,72,153,0.16)] backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-pink-400/30 bg-pink-500/10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-300/40 border-t-pink-300" />
      </div>

      <h2 className="mt-4 text-lg font-bold text-white">Secure access is loading</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">
        Rizzly is connecting to Clerk right now. This should only take a few seconds.
      </p>

      {showExtendedHelp && (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-50">
          <p className="font-semibold">Still not seeing the form?</p>
          <p className="mt-1 text-amber-50/85">
            Refresh the page or reopen the clean auth URL below. This fallback keeps the screen from appearing frozen if the auth service is slow.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-amber-300/30 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-500/25"
            >
              Refresh
            </button>
            <Link
              href={canonicalAuthUrl}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              Open clean URL
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10"
            >
              Continue as guest
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
