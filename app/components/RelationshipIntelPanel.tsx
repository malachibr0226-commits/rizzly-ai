"use client";

import type { ThreadStrategyInsight } from "@/lib/analytics";

const stageStyles: Record<ThreadStrategyInsight["conversationStage"], string> = {
  open: "border-white/15 bg-white/5 text-white/80",
  building: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
  "ready-to-plan": "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  recovery: "border-amber-400/25 bg-amber-500/10 text-amber-100",
};

const riskStyles: Record<ThreadStrategyInsight["riskLevel"], string> = {
  low: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  moderate: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  high: "border-rose-400/25 bg-rose-500/10 text-rose-100",
};

export function RelationshipIntelPanel({
  insight,
}: {
  insight: ThreadStrategyInsight;
}) {
  const winningCombo =
    insight.winningTone && insight.winningGoal
      ? `${insight.winningTone} + ${insight.winningGoal}`
      : "Still learning this thread";

  return (
    <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Advanced Thread Intel</h2>
          <p className="mt-1 text-xs text-white/45">
            Local timing, risk, and conversion guidance for this conversation.
          </p>
        </div>
        <div className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold text-fuchsia-100">
          {insight.readinessScore}% ready
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            Conversation stage
          </div>
          <div
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${stageStyles[insight.conversationStage]}`}
          >
            {insight.statusLabel}
          </div>
          <p className="mt-3 text-sm text-white/75">{insight.summary}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            Timing intelligence
          </div>
          <p className="mt-2 text-sm text-white/85">{insight.timingSuggestion}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            Risk detector
          </div>
          <div
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${riskStyles[insight.riskLevel]}`}
          >
            {insight.riskLevel} risk
          </div>
          <p className="mt-3 text-sm text-white/75">{insight.nextAction}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            Best conversion angle
          </div>
          <p className="mt-2 text-sm font-semibold capitalize text-white/90">
            {winningCombo}
          </p>
          <p className="mt-2 text-sm capitalize text-white/75">
            Stage: {insight.conversationStage.replace(/-/g, " ")}
          </p>
        </div>
      </div>
    </section>
  );
}
