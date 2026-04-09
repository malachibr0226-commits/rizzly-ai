"use client";

export function SmartRecommendationBar({
  suggestion,
  topTone,
  topGoal,
}: {
  suggestion: string;
  topTone: string | null;
  topGoal: string | null;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Smart recommendation
          </div>
          <p className="mt-2 text-sm text-white/75">{suggestion}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-white/65">
          {topTone && (
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 capitalize text-cyan-100">
              Top tone: {topTone}
            </span>
          )}
          {topGoal && (
            <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1.5 capitalize text-fuchsia-100">
              Top goal: {topGoal}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
