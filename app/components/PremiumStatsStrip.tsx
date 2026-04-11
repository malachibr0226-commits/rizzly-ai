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
    {
      label: "Threads saved",
      value: threadsCount,
      tone: "border-sky-400/15 bg-sky-500/[0.08]",
    },
    {
      label: "Personas ready",
      value: savedPersonasCount,
      tone: "border-violet-400/15 bg-violet-500/[0.08]",
    },
    {
      label: "Favorites kept",
      value: favoriteCount,
      tone: "border-emerald-400/15 bg-emerald-500/[0.08]",
    },
    {
      label: "Plan",
      value: planTier === "pro" ? "Pro" : planTier === "plus" ? "Plus" : "Free",
      tone: "border-rose-400/15 bg-rose-500/[0.08]",
    },
  ];

  return (
    <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
        >
          <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/20">
            {item.label}
          </div>
          <div className="mt-2 text-lg font-bold text-white/80">{item.value}</div>
        </div>
      ))}
    </section>
  );
}
