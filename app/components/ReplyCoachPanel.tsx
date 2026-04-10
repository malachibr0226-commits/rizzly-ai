"use client";

import type { GoalKey, ResponseModeKey, ToneKey } from "@/lib/analytics";

type AnalysisLike = {
  timingWindow?: string;
  avoid?: string;
  coachNotes?: string;
  liveNow?: string;
  deliveryTip?: string;
  nextIfTheyEngage?: string;
  dynamicReading?: string;
  nonReactiveResponse?: string;
  whenNotToReply?: string;
  behaviorFlags?: string[];
  nextMoves?: string[];
  liveScenarios?: Array<{
    ifTheySay: string;
    youSay: string;
    why: string;
  }>;
};

export function ReplyCoachPanel({
  analysis,
  toneLabel,
  goalLabel,
  isPro,
  onApplyPreset,
  onUnlockPro,
}: {
  analysis: AnalysisLike | null;
  toneLabel: string;
  goalLabel: string;
  isPro: boolean;
  onApplyPreset: (preset: { label: string; tone: ToneKey; goal: GoalKey; responseMode?: ResponseModeKey }) => void;
  onUnlockPro: () => void;
}) {
  if (!analysis) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(217,70,239,0.10),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100">
            Live coach
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">In-the-moment guidance before you send</h2>
          <p className="mt-1 text-sm text-white/60">
            Current direction: <span className="font-semibold text-white/85">{toneLabel}</span> · <span className="font-semibold text-white/85">{goalLabel}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">Coach in your ear</div>
        <p className="mt-2 text-sm text-white/85">
          {analysis.liveNow || analysis.coachNotes || "Keep it simple, grounded, and easy to answer."}
        </p>
        <p className="mt-2 text-xs text-white/70">
          <span className="font-semibold text-white/85">Delivery:</span>{" "}
          {analysis.deliveryTip || analysis.nonReactiveResponse || "Say less, stay relaxed, and do not force extra energy."}
        </p>
        {analysis.nextIfTheyEngage && (
          <p className="mt-2 text-xs text-white/70">
            <span className="font-semibold text-white/85">If they lean in:</span>{" "}
            {analysis.nextIfTheyEngage}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Likely dynamic</div>
          <p className="mt-2 text-sm text-white/75">{analysis.dynamicReading || analysis.coachNotes || "No major manipulation signal is obvious here, so keep the response calm and direct."}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Best timing</div>
          <p className="mt-2 text-sm text-white/75">{analysis.timingWindow || "Send when you can stay present for one follow-up."}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Non-reactive move</div>
          <p className="mt-2 text-sm text-white/75">{analysis.nonReactiveResponse || "Keep it brief, grounded, and avoid reacting to pressure or bait."}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">When to pause</div>
          <p className="mt-2 text-sm text-white/75">{analysis.whenNotToReply || analysis.avoid || "Pause if the exchange turns pushy, vague on purpose, or clearly disrespectful."}</p>
        </div>
      </div>

      {analysis.behaviorFlags && analysis.behaviorFlags.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Dynamic signals</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.behaviorFlags.map((flag) => (
              <span
                key={flag}
                className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-50"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.nextMoves && analysis.nextMoves.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Next moves</div>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {analysis.nextMoves.slice(0, 3).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.liveScenarios && analysis.liveScenarios.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">If they say X, send Y</div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {analysis.liveScenarios.slice(0, 3).map((item, index) => (
              <div key={`${item.ifTheySay}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/75">If they say</div>
                <p className="mt-1 text-sm text-white/80">{item.ifTheySay}</p>
                <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/75">You say</div>
                <p className="mt-1 text-sm font-semibold text-white">{item.youSay}</p>
                <p className="mt-2 text-[11px] leading-5 text-white/55">{item.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
        Coach rule: one grounded move at a time. Say less, stay present, and let the other person show you where the energy actually is.
      </div>

      {!isPro && (
        <div className="mt-4 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-50">
          Specific quick presets are a Pro chat enhancer. Free still includes core replies and balanced guidance.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            isPro
              ? onApplyPreset({ label: "boundary pass", tone: "chill", goal: "clarify", responseMode: "boundary" })
              : onUnlockPro()
          }
          className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
        >
          {isPro ? "Set boundary" : "Set boundary · Pro"}
        </button>
        <button
          type="button"
          onClick={() =>
            isPro
              ? onApplyPreset({ label: "high-value pass", tone: "confident", goal: "restart", responseMode: "high-value" })
              : onUnlockPro()
          }
          className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20"
        >
          {isPro ? "High-value" : "High-value · Pro"}
        </button>
        <button
          type="button"
          onClick={() =>
            isPro
              ? onApplyPreset({ label: "light call-out", tone: "confident", goal: "clarify", responseMode: "call-out" })
              : onUnlockPro()
          }
          className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20"
        >
          {isPro ? "Call out lightly" : "Call out lightly · Pro"}
        </button>
        <button
          type="button"
          onClick={() =>
            isPro
              ? onApplyPreset({ label: "calm comeback", tone: "confident", goal: "clarify", responseMode: "comeback" })
              : onUnlockPro()
          }
          className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
        >
          {isPro ? "Calm comeback" : "Calm comeback · Pro"}
        </button>
        <button
          type="button"
          onClick={() =>
            isPro
              ? onApplyPreset({ label: "disengage cleanly", tone: "chill", goal: "repair", responseMode: "disengage" })
              : onUnlockPro()
          }
          className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10"
        >
          {isPro ? "Disengage" : "Disengage · Pro"}
        </button>
      </div>
    </section>
  );
}
