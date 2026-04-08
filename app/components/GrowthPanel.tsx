"use client";

import { PLAN_CATALOG, getUpgradeUrl } from "@/lib/pricing";
import type { UsageSnapshot } from "@/lib/product-features";

type CloudSyncState = "idle" | "syncing" | "synced" | "error";

const statusStyles: Record<CloudSyncState, string> = {
  idle: "border-white/10 bg-white/5 text-white/75",
  syncing: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
  synced: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-400/25 bg-rose-500/10 text-rose-100",
};

export function GrowthPanel({
  isSignedIn,
  usageSnapshot,
  cloudSyncState,
  cloudSyncMessage,
  onSyncNow,
}: {
  isSignedIn: boolean;
  usageSnapshot: UsageSnapshot;
  cloudSyncState: CloudSyncState;
  cloudSyncMessage: string;
  onSyncNow: () => void;
}) {
  const upgradeUrl = getUpgradeUrl();
  const freePlan = PLAN_CATALOG[0];
  const proPlan = PLAN_CATALOG[1];
  const visibleStatus = isSignedIn ? cloudSyncState : "idle";
  const visibleMessage = isSignedIn
    ? cloudSyncMessage
    : "Sign in to sync threads and personas across devices.";

  const nearingLimit = usageSnapshot.remaining.generate <= 5;
  const replyBoost = Math.max(
    1,
    Math.round(proPlan.limits.generate / Math.max(freePlan.limits.generate, 1)),
  );
  const screenshotBoost = Math.max(
    1,
    Math.round(proPlan.limits.screenshot / Math.max(freePlan.limits.screenshot, 1)),
  );
  const voiceBoost = Math.max(
    1,
    Math.round(proPlan.limits.voice / Math.max(freePlan.limits.voice, 1)),
  );

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Cloud Sync</h2>
            <p className="mt-1 text-xs text-white/45">
              Save threads and personas across devices.
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusStyles[visibleStatus]}`}
          >
            {visibleStatus}
          </span>
        </div>

        <p className="text-sm text-white/80">{visibleMessage}</p>

        {!isSignedIn && (
          <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-50">
            Sign in once to keep your best threads and personas synced across devices.
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/75">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
            <div className="text-lg font-bold text-white">{usageSnapshot.remaining.generate}</div>
            <div className="mt-1">reply runs left</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
            <div className="text-lg font-bold text-white">{usageSnapshot.remaining.screenshot}</div>
            <div className="mt-1">screenshots left</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
            <div className="text-lg font-bold text-white">{usageSnapshot.remaining.voice}</div>
            <div className="mt-1">voice notes left</div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-white/45">
          Usage resets daily at {usageSnapshot.resetLabel}.
        </div>

        <button
          type="button"
          onClick={onSyncNow}
          className="mt-4 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
        >
          {isSignedIn ? "Sync my history now" : "Sign in to unlock cloud sync"}
        </button>
      </div>

      <div className="rounded-xl border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(168,85,247,0.10),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Upgrade when the free plan starts feeling tight</h2>
            <p className="mt-1 text-xs text-white/50">
              Keep using Free, or switch on more daily volume, synced memory, and deeper thread intel.
            </p>
          </div>
          <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100">
            pro ready
          </span>
        </div>

        {nearingLimit && (
          <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
            You’re getting close to today’s free reply limit. Pro keeps the flow going.
          </div>
        )}

        <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-white/80">
          <div className="rounded-xl border border-fuchsia-400/20 bg-black/20 p-3 text-center">
            <div className="text-base font-bold text-white">{replyBoost}x</div>
            <div className="mt-1 text-white/60">reply runs</div>
          </div>
          <div className="rounded-xl border border-fuchsia-400/20 bg-black/20 p-3 text-center">
            <div className="text-base font-bold text-white">{screenshotBoost}x</div>
            <div className="mt-1 text-white/60">screenshots</div>
          </div>
          <div className="rounded-xl border border-fuchsia-400/20 bg-black/20 p-3 text-center">
            <div className="text-base font-bold text-white">{voiceBoost}x</div>
            <div className="mt-1 text-white/60">voice notes</div>
          </div>
        </div>

        <div className="space-y-3">
          {[freePlan, proPlan].map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-xl border p-3 ${
                plan.tier === "pro"
                  ? "border-fuchsia-400/25 bg-fuchsia-500/10"
                  : "border-white/10 bg-black/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">{plan.name}</div>
                    {plan.tier === "pro" && (
                      <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100">
                        Most popular
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-white/60">{plan.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{plan.priceLabel}</div>
                  <div className="text-[10px] text-white/45">{plan.tier === "pro" ? "monthly" : "starter"}</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-white/75">
                {plan.highlights.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              {plan.tier === "pro" && (
                <div className="mt-3 rounded-lg border border-fuchsia-400/20 bg-black/20 px-3 py-2 text-[11px] text-fuchsia-50">
                  Everything in Free, plus synced memory, higher limits, and stronger thread reads.
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
          Best for users who want more daily runs, faster reuse, and less friction across devices.
        </div>

        <a
          href={upgradeUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {proPlan.ctaLabel}
        </a>
        <p className="mt-2 text-center text-[11px] text-white/45">
          Upgrade only when you want more reply volume, sync, and advanced thread intel.
        </p>
      </div>
    </section>
  );
}
