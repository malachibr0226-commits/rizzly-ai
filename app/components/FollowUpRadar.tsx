"use client";

import type { ThreadStrategyInsight } from "@/lib/analytics";

export function FollowUpRadar({
  items,
  isPro,
  onOpenThread,
  onUnlockPro,
}: {
  items: ThreadStrategyInsight[];
  isPro: boolean;
  onOpenThread: (threadId: string) => void;
  onUnlockPro: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  if (!isPro) {
    const topItem = items[0];

    return (
      <section className="rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Follow-up radar · Pro
            </div>
            <h2 className="mt-2 text-lg font-bold text-white">Rank your best next threads</h2>
            <p className="mt-1 text-sm text-white/60">
              Pro unlocks revisit scoring, timing guidance, and next-step suggestions across your saved chats.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
          <div className="font-semibold text-white">Preview opportunity</div>
          <p className="mt-2">
            <span className="text-white/90">{topItem.contactLabel}</span> looks {topItem.readinessScore}% ready for a re-open.
          </p>
          <p className="mt-1 text-xs text-white/55">Upgrade to see the full ranked list and recommended next move.</p>
        </div>

        <button
          type="button"
          onClick={onUnlockPro}
          className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-500/20"
        >
          Unlock Pro radar
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
            Follow-up radar
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">Best threads to revisit next</h2>
          <p className="mt-1 text-sm text-white/60">
            Rizzly ranks your strongest next opportunities so you can move with better timing.
          </p>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
        Tip: open the highest-scoring thread first when you want the fastest likely win.
      </div>

      <div className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <button
            key={item.threadId}
            type="button"
            onClick={() => onOpenThread(item.threadId)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20 hover:bg-white/5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-white">{item.contactLabel}</div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/55">
                    {item.statusLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/65">{item.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/55">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    {item.readinessScore}% ready
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 capitalize">
                    {item.conversationStage.replace(/-/g, " ")}
                  </span>
                  {item.winningTone && item.winningGoal && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 capitalize text-emerald-100">
                      {item.winningTone} + {item.winningGoal}
                    </span>
                  )}
                </div>
              </div>

              <div className="max-w-xs rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                <div className="font-semibold text-white/90">Next move</div>
                <div className="mt-1">{item.nextAction}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
