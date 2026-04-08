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
    description: "Try the core texting tools and see what style works best.",
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
      "Daily free usage budget",
    ],
  },
  {
    tier: "pro",
    name: "Rizzly Pro",
    priceLabel: "$19/mo",
    description: "For power users who want more replies, cloud sync, and smarter thread tracking.",
    ctaLabel: "Unlock Pro",
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
