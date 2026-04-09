"use client";

export function HabitMomentumPanel({
  streakCount,
  isPro,
  totalThreads,
}: {
  streakCount: number;
  isPro: boolean;
  totalThreads: number;
}) {
  const nextMilestone = streakCount < 3 ? 3 : streakCount < 7 ? 7 : streakCount < 14 ? 14 : 30;
  const milestoneLeft = Math.max(0, nextMilestone - streakCount);

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
            Momentum loop
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">Keep the habit working for you</h2>
          <p className="mt-1 text-sm text-white/60">
            Small daily use builds sharper memory, stronger pattern reads, and quicker wins over time.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
          <div className="text-lg font-bold text-white">{streakCount}</div>
          <div className="text-[11px] text-white/55">day streak</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Next milestone</div>
          <p className="mt-2 text-sm text-white/75">
            {milestoneLeft === 0
              ? `You hit the ${nextMilestone}-day mark.`
              : `${milestoneLeft} more day${milestoneLeft === 1 ? "" : "s"} to hit ${nextMilestone}.`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Thread base</div>
          <p className="mt-2 text-sm text-white/75">{totalThreads} saved conversation{totalThreads === 1 ? "" : "s"} are now teaching the app your best moves.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Plan boost</div>
          <p className="mt-2 text-sm text-white/75">
            {isPro
              ? "Pro is active, so your higher-volume practice loop is already unlocked."
              : "Free mode is enough to build momentum now, and Pro is there when you want more daily volume."}
          </p>
        </div>
      </div>
    </section>
  );
}
