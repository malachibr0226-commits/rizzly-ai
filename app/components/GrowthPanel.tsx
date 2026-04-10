"use client";

import { useState } from "react";
import { trackCtaClick } from "@/lib/analytics-events";
import { PLAN_CATALOG, getPlanDefinition, getUpgradeUrl } from "@/lib/pricing";
import type { PlanTier } from "@/lib/pricing";
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
  const freePlan = getPlanDefinition("free");
  const plusPlan = getPlanDefinition("plus");
  const proPlan = getPlanDefinition("pro");
  const currentPlan = usageSnapshot.planTier;
  const visibleStatus = isSignedIn ? cloudSyncState : "idle";
  const visibleMessage = isSignedIn
    ? cloudSyncMessage
    : "Sign in to sync threads and personas across devices.";
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [pendingTier, setPendingTier] = useState<Exclude<PlanTier, "free"> | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const isPlus = currentPlan === "plus";
  const isPro = currentPlan === "pro";

  const nearingLimit = currentPlan === "free" && usageSnapshot.remaining.generate <= 5;
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

  const handleUpgrade = async (tier: Exclude<PlanTier, "free">) => {
    trackCtaClick(`start_checkout_${tier}`, "growth_panel");
    setUpgradeError(null);
    setPendingTier(tier);
    setUpgradeLoading(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });
      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade flow error:", error);

      const upgradeUrl = getUpgradeUrl(tier);

      if (upgradeUrl) {
        window.open(upgradeUrl, "_blank", "noopener,noreferrer");
      } else {
        setUpgradeError("Checkout is not ready yet. Please try again shortly.");
      }
    } finally {
      setPendingTier(null);
      setUpgradeLoading(false);
    }
  };

  const handleManageBilling = async () => {
    trackCtaClick("manage_billing", "growth_panel");
    setBillingError(null);
    setBillingLoading(true);

    try {
      const response = await fetch("/api/create-customer-portal", {
        method: "POST",
      });
      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to open billing settings.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Billing portal error:", error);
      setBillingError(
        error instanceof Error
          ? error.message
          : "Unable to open billing settings right now.",
      );
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <section
      id="upgrade"
      className="mx-auto grid max-w-7xl gap-6 scroll-mt-24 xl:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.15fr)]"
    >
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.82),rgba(10,14,22,0.94))] p-8 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl md:p-10">
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

        <div className="mt-6 grid gap-4 text-base text-white/80 sm:grid-cols-3">
          <div className="flex min-h-[112px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-6 text-center">
            <div className="text-xl font-bold leading-none text-white">{usageSnapshot.remaining.generate}</div>
            <div className="mt-2 text-[10px] leading-tight text-white/65 sm:text-[11px]">
              <span className="block">reply runs</span>
              <span className="block">left</span>
            </div>
          </div>
          <div className="flex min-h-[112px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-6 text-center">
            <div className="text-xl font-bold leading-none text-white">{usageSnapshot.remaining.screenshot}</div>
            <div className="mt-2 text-[10px] leading-tight text-white/65 sm:text-[11px]">
              <span className="block">screenshots</span>
              <span className="block">left</span>
            </div>
          </div>
          <div className="flex min-h-[112px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-6 text-center">
            <div className="text-xl font-bold leading-none text-white">{usageSnapshot.remaining.voice}</div>
            <div className="mt-2 text-[10px] leading-tight text-white/65 sm:text-[11px]">
              <span className="block">voice notes</span>
              <span className="block">left</span>
            </div>
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

      <div className="rounded-[28px] border border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(26,17,43,0.88),rgba(12,17,27,0.96))] p-8 shadow-[0_18px_44px_rgba(76,29,149,0.18)] backdrop-blur-xl md:p-10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isPro
                ? "Rizzly Pro is active"
                : isPlus
                  ? "Rizzly Plus is active"
                  : "Unlock more replies, tone variety, and momentum"}
            </h2>
            <p className="mt-1 text-xs text-white/50">
              {isPro
                ? "Your full advanced chat enhancers, higher limits, and deeper thread intel are unlocked."
                : isPlus
                  ? "Extra tone modes, saved voice setup, and more daily volume are live."
                  : "Stay on Free, or switch on extra tones, more volume, and smoother cross-device use."}
            </p>
          </div>
          <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100">
            {isPro ? "pro active" : isPlus ? "plus active" : "upgrade ready"}
          </span>
        </div>

        {nearingLimit && (
          <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
            You’re getting close to today’s free reply limit. Pro keeps the flow going.
          </div>
        )}

        <div className="mb-6 grid gap-4 text-base text-white/90 sm:grid-cols-3">
          <div className="flex min-h-[108px] flex-col items-center justify-center rounded-2xl border border-fuchsia-400/12 bg-white/[0.04] px-7 py-6 text-center">
            <div className="text-lg font-bold leading-none text-white">{replyBoost}x</div>
            <div className="mt-2 text-[10px] leading-tight text-white/65 sm:text-[11px]">
              <span className="block">reply</span>
              <span className="block">runs</span>
            </div>
          </div>
          <div className="flex min-h-[108px] flex-col items-center justify-center rounded-2xl border border-fuchsia-400/12 bg-white/[0.04] px-7 py-6 text-center">
            <div className="text-lg font-bold leading-none text-white">{screenshotBoost}x</div>
            <div className="mt-2 text-[10px] leading-tight text-white/65 sm:text-[11px]">
              <span className="block">screenshots</span>
              <span className="block">boost</span>
            </div>
          </div>
          <div className="flex min-h-[108px] flex-col items-center justify-center rounded-2xl border border-fuchsia-400/12 bg-white/[0.04] px-7 py-6 text-center">
            <div className="text-lg font-bold leading-none text-white">{voiceBoost}x</div>
            <div className="mt-2 text-[10px] leading-tight text-white/65 sm:text-[11px]">
              <span className="block">voice</span>
              <span className="block">notes</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {PLAN_CATALOG.map((plan) => {
            const isCurrent = currentPlan === plan.tier;

            return (
              <div
                key={plan.tier}
                className={`rounded-[24px] border bg-[linear-gradient(180deg,rgba(17,24,39,0.78),rgba(10,14,22,0.92))] p-5 shadow-[0_14px_36px_rgba(15,23,42,0.18)] sm:p-6 ${
                  isCurrent
                    ? "border-cyan-400/25"
                    : plan.tier === "pro"
                      ? "border-fuchsia-400/18"
                      : plan.tier === "plus"
                        ? "border-sky-400/18"
                        : "border-white/10"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-white">{plan.name}</div>
                      {isCurrent && (
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                          Current
                        </span>
                      )}
                      {plan.tier === "plus" && !isCurrent && (
                        <span className="rounded-full border border-sky-300/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                          Best value
                        </span>
                      )}
                      {plan.tier === "pro" && !isCurrent && (
                        <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100">
                          Most power
                        </span>
                      )}
                    </div>
                    <div className="mt-2 max-w-2xl text-sm leading-6 text-white/68">{plan.description}</div>
                  </div>
                  <div
                    className={`shrink-0 rounded-2xl border px-4 py-3 text-left lg:min-w-[122px] lg:text-right ${
                      plan.tier === "pro"
                        ? "border-fuchsia-400/20 bg-fuchsia-500/10"
                        : plan.tier === "plus"
                          ? "border-sky-400/20 bg-sky-500/10"
                          : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="whitespace-nowrap text-lg font-bold text-white">{plan.priceLabel}</div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                      {plan.tier === "free" ? "starter" : "monthly"}
                    </div>
                  </div>
                </div>
                <ul className="mt-4 grid gap-2 text-xs text-white/78 sm:grid-cols-2">
                  {plan.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                    >
                      <span className="mt-0.5 text-emerald-300">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
          Best for users who want a clear path: Free to try, Plus for extra tone variety, and Pro for the full enhancer stack.
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {[plusPlan, proPlan].map((plan) => {
            const isCurrent = currentPlan === plan.tier;
            const isDowngradeFromPro = currentPlan === "pro" && plan.tier === "plus";
            const isDisabled = upgradeLoading || isCurrent || isDowngradeFromPro;
            const planSummary =
              plan.tier === "plus"
                ? "More tones and daily volume"
                : "Full stack and highest limits";

            return (
              <button
                key={plan.tier}
                type="button"
                onClick={() => void handleUpgrade(plan.tier as Exclude<PlanTier, "free">)}
                disabled={isDisabled}
                className={`inline-flex w-full items-stretch rounded-2xl px-4 py-3.5 text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  plan.tier === "pro"
                    ? "bg-gradient-to-r from-fuchsia-500/90 to-cyan-500/90 shadow-[0_12px_28px_rgba(217,70,239,0.22)]"
                    : "border border-sky-400/25 bg-sky-500/10"
                }`}
              >
                <span className="flex w-full items-center justify-between gap-3 text-left">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {isCurrent
                        ? `${plan.name} active`
                        : pendingTier === plan.tier
                          ? "Opening secure checkout..."
                          : plan.ctaLabel}
                    </span>
                    <span className="mt-1 block text-[11px] text-white/70">
                      {isCurrent ? "You already have access." : planSummary}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      plan.tier === "pro"
                        ? "border-white/20 bg-white/10"
                        : "border-sky-300/25 bg-sky-400/10"
                    }`}
                  >
                    {isCurrent ? "Active" : pendingTier === plan.tier ? "Loading" : plan.priceLabel}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-white/45">
          {isPro
            ? "Thanks for upgrading — your highest limits and full premium tools are already live."
            : isPlus
              ? "Plus is active now — jump to Pro any time if you want the full advanced response stack."
              : "Secure checkout opens instantly when Stripe is configured."}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] text-white/55">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Secure Stripe checkout</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Cancel anytime</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Upgrade in minutes</span>
        </div>
        {isPro && (
          <button
            type="button"
            onClick={() => void handleManageBilling()}
            disabled={billingLoading || !isSignedIn}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {billingLoading
              ? "Opening billing settings..."
              : isSignedIn
                ? "Manage subscription"
                : "Sign in to manage billing"}
          </button>
        )}
        {upgradeError && (
          <p className="mt-2 text-center text-[11px] text-rose-200">{upgradeError}</p>
        )}
        {billingError && (
          <p className="mt-2 text-center text-[11px] text-rose-200">{billingError}</p>
        )}
      </div>
    </section>
  );
}
