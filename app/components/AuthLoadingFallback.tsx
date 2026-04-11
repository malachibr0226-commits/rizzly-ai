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
    <div className="w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
      <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/25">
        Loading
      </div>
      <div className="mx-auto mt-4 h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
      <p className="mt-4 text-sm font-medium text-white/60">{label}</p>
      <p className="mt-1 text-xs text-white/25">This should only take a second.</p>
    </div>
  );
}
