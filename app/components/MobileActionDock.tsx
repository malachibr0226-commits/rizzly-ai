"use client";

import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics-events";

export function MobileActionDock({
  onJumpToStudio,
  onToggleDashboard,
}: {
  onJumpToStudio: () => void;
  onToggleDashboard: () => void;
}) {
  const isNonCanonicalHost =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".vercel.app");
  const upgradeHref = isNonCanonicalHost
    ? "https://rizzlyai.com/#upgrade"
    : "#upgrade";

  return (
    <div
      className="fixed inset-x-0 bottom-3 z-40 px-3 sm:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#120a20]/90 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => {
            trackCtaClick("mobile_studio", "mobile_dock");
            onJumpToStudio();
          }}
          className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/85"
          aria-label="Jump to message studio"
        >
          ⚡ Studio
        </button>

        <button
          type="button"
          onClick={() => {
            trackCtaClick("mobile_stats", "mobile_dock");
            onToggleDashboard();
          }}
          className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/85"
          aria-label="Open stats dashboard"
        >
          📊 Stats
        </button>

        <Link
          href={upgradeHref}
          onClick={() => trackCtaClick("mobile_upgrade", "mobile_dock")}
          className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 px-3 py-2 text-center text-xs font-semibold text-white"
          aria-label="Open upgrade section"
        >
          ✨ Go Pro
        </Link>
      </div>
    </div>
  );
}
