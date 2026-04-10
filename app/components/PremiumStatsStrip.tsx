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
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-[22px] border px-4 py-3 backdrop-blur-sm shadow-[0_10px_24px_rgba(15,23,42,0.10)] ${item.tone}`}
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
