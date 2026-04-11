"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CANONICAL_APP_URL = "https://rizzlyai.com";

export function AuthLoadingFallback({
  mode,
  status = "loading",
}: {
  mode: "sign-in" | "sign-up";
  status?: "loading" | "failed";
}) {
  const [showSlowHint, setShowSlowHint] = useState(false);
  const isFailed = status === "failed";
  const label = isFailed
    ? mode === "sign-in"
      ? "We couldn't load sign in."
      : "We couldn't load sign up."
    : showSlowHint
      ? "Still connecting..."
      : mode === "sign-in"
        ? "Loading sign in..."
        : "Loading sign up...";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hostname = window.location.hostname.toLowerCase();
    const isPreviewHost = hostname.endsWith(".vercel.app");
    const isWwwHost = hostname === "www.rizzlyai.com";

    if (isPreviewHost || isWwwHost) {
      const target = new URL(`${CANONICAL_APP_URL}/${mode}`);
      target.search = window.location.search;
      window.location.replace(target.toString());
      return;
    }

    if (isFailed) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowHint(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [isFailed, mode]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
      <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/25">
        {isFailed ? "Connection issue" : "Loading"}
      </div>
      <div className={`mx-auto mt-4 h-5 w-5 rounded-full border-2 ${isFailed ? "border-red-400/25 border-t-red-300" : "animate-spin border-white/10 border-t-white/50"}`} />
      <p className="mt-4 text-sm font-medium text-white/60">{label}</p>
      <p className="mt-1 text-xs text-white/25">
        {isFailed
          ? "This is usually caused by a domain or network issue. Please try again on rizzlyai.com."
          : showSlowHint
            ? "This is taking longer than expected."
            : "This should only take a second."}
      </p>
      {isFailed && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
          >
            Back home
          </Link>
        </div>
      )}
    </div>
  );
}
