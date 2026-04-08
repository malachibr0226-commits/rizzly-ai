"use client";

import { useEffect, useState } from "react";

const CANONICAL_APP_URL = "https://rizzlyai.com";

export function AuthLoadingFallback({
  mode,
}: {
  mode: "sign-in" | "sign-up";
  status?: "loading" | "failed";
}) {
  const [showSlowHint, setShowSlowHint] = useState(false);
  const label = showSlowHint
    ? "One moment..."
    : mode === "sign-in"
      ? "Loading sign in..."
      : "Loading sign up...";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isPreviewHost = window.location.hostname.endsWith(".vercel.app");

    if (isPreviewHost) {
      window.location.replace(`${CANONICAL_APP_URL}/${mode}`);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowHint(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [mode]);

  return (
    <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.12),rgba(22,13,43,0.96)_55%)] p-6 text-center shadow-[0_0_32px_rgba(236,72,153,0.10)] backdrop-blur-xl">
      <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
        Secure access
      </div>
      <div className="mx-auto mt-4 h-6 w-6 animate-spin rounded-full border-2 border-pink-300/30 border-t-pink-300" />
      <p className="mt-4 text-sm font-semibold text-white/85">{label}</p>
      <p className="mt-1 text-xs text-white/50">This should only take a second.</p>
    </div>
  );
}
