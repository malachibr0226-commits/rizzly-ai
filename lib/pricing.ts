import type { UsageAction } from "@/lib/product-features";

export type PlanTier = "free" | "pro";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceLabel: string;
  description: string;
  ctaLabel: string;
  limits: Record<UsageAction, number>;
  highlights: string[];
}

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    tier: "free",
    name: "Rizzly Free",
    priceLabel: "$0",
    description: "Perfect for trying Rizzly on real chats with no card required.",
    ctaLabel: "Current plan",
    limits: {
      generate: 25,
      screenshot: 10,
      voice: 8,
    },
    highlights: [
      "25 reply runs each day",
      "Screenshot and voice imports",
      "Local thread memory",
      "No-cost starter access",
    ],
  },
  {
    tier: "pro",
    name: "Rizzly Pro",
    priceLabel: "$19/mo",
    description: "For daily texters who want more volume, synced history, and deeper thread intel.",
    ctaLabel: "Unlock Pro",
    limits: {
      generate: 200,
      screenshot: 60,
      voice: 50,
    },
    highlights: [
      "200 reply runs per day",
      "Cloud history across devices",
      "Advanced thread intelligence",
      "Faster, lower-friction workflow",
    ],
  },
];

export function getUpgradeUrl() {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim() ||
    "mailto:hi@rizzlyai.com?subject=Rizzly%20Pro"
  );
}

export function getPlanDefinition(tier: PlanTier = "free") {
  return PLAN_CATALOG.find((plan) => plan.tier === tier) ?? PLAN_CATALOG[0];
}
