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

        <button
          type="button"
          onClick={onSyncNow}
          className="mt-4 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
        >
          {isSignedIn ? "Sync my history now" : "Sign in to unlock cloud sync"}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Billing-Ready Plans</h2>
            <p className="mt-1 text-xs text-white/45">
              Free is live now. Pro is ready for a Stripe payment link.
            </p>
          </div>
          <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100">
            monetization
          </span>
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
                  <div className="text-sm font-semibold text-white">{plan.name}</div>
                  <div className="mt-1 text-xs text-white/60">{plan.description}</div>
                </div>
                <div className="text-sm font-bold text-white">{plan.priceLabel}</div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-white/75">
                {plan.highlights.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <a
          href={upgradeUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {proPlan.ctaLabel}
        </a>
      </div>
    </section>
  );
}
