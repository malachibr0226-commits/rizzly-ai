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
    <section className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/20">
            Recommendation
          </div>
          <p className="mt-2 text-sm text-white/45">{suggestion}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] text-white/30">
          {topTone && (
            <span className="capitalize">
              Tone: {topTone}
            </span>
          )}
          {topGoal && (
            <span className="capitalize">
              Goal: {topGoal}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
