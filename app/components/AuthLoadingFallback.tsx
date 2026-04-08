"use client";

import { useEffect, useState } from "react";

const CANONICAL_APP_URL = "https://rizzlyai.com";

export function AuthLoadingFallback({
  mode,
}: {
  mode: "sign-in" | "sign-up";
  status?: "loading" | "failed";
}) {
  const [label, setLabel] = useState(
    mode === "sign-in" ? "Loading sign in..." : "Loading sign up...",
  );

  useEffect(() => {
    setLabel(mode === "sign-in" ? "Loading sign in..." : "Loading sign up...");

    if (typeof window === "undefined") {
      return;
    }

    const isPreviewHost = window.location.hostname.endsWith(".vercel.app");

    if (isPreviewHost) {
      window.location.replace(`${CANONICAL_APP_URL}/${mode}`);
      return;
    }

    const timer = window.setTimeout(() => {
      setLabel("One moment...");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [mode]);

  return (
    <div className="w-full rounded-[24px] border border-white/10 bg-[#160d2b]/95 p-6 text-center shadow-[0_0_32px_rgba(236,72,153,0.10)] backdrop-blur-xl">
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-pink-300/30 border-t-pink-300" />
      <p className="mt-4 text-sm font-medium text-white/80">{label}</p>
    </div>
  );
}
