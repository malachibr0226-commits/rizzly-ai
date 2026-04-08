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
    description: "Best for trying the app and building early momentum.",
    ctaLabel: "Current plan",
    limits: {
      generate: 25,
      screenshot: 10,
      voice: 8,
    },
    highlights: [
      "AI reply generation",
      "Screenshot and voice tools",
      "Local thread memory",
    ],
  },
  {
    tier: "pro",
    name: "Rizzly Pro",
    priceLabel: "$19/mo",
    description: "Built for serious users who want cloud sync and higher limits.",
    ctaLabel: "Upgrade to Pro",
    limits: {
      generate: 200,
      screenshot: 60,
      voice: 50,
    },
    highlights: [
      "Cloud history across devices",
      "Priority reply analysis",
      "Advanced thread intelligence",
      "Higher daily limits",
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
