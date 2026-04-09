"use client";

import type { PlanTier } from "@/lib/pricing";

export function PremiumStatsStrip({
  threadsCount,
  savedPersonasCount,
  favoriteCount,
  planTier,
}: {
  threadsCount: number;
  savedPersonasCount: number;
  favoriteCount: number;
  planTier: PlanTier;
}) {
  const items = [
    { label: "Threads saved", value: threadsCount },
    { label: "Personas ready", value: savedPersonasCount },
    { label: "Favorites kept", value: favoriteCount },
    { label: "Plan", value: planTier === "pro" ? "Pro" : planTier === "plus" ? "Plus" : "Free" },
  ];

  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-3 backdrop-blur-sm"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {item.label}
          </div>
          <div className="mt-2 text-xl font-bold text-white">{item.value}</div>
        </div>
      ))}
    </section>
  );
}
