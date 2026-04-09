import type { UsageAction } from "@/lib/product-features";

export type PlanTier = "free" | "plus" | "pro";

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
      "Balanced mode + draft cleanup",
      "Up to 3 reply options per run",
      "Local thread memory",
    ],
  },
  {
    tier: "plus",
    name: "Rizzly Plus",
    priceLabel: "$9.99/mo",
    description: "Unlock more volume, saved voice presets, exclusive response modes, and premium tone options.",
    ctaLabel: "Unlock Plus",
    limits: {
      generate: 80,
      screenshot: 25,
      voice: 20,
    },
    highlights: [
      "80 reply runs per day",
      "Cloud sync + saved personas",
      "Unlocks Warm, Direct, and Playful tone modes",
      "Access to 'Boundary' and 'Comeback' response modes",
      "Save and reuse up to 5 custom personas",
      "Premium reply suggestions and tone analysis",
      "More daily flexibility without the full Pro jump",
    ],
  },
  {
    tier: "pro",
    name: "Rizzly Pro",
    priceLabel: "$19/mo",
    description: "For daily texters who want full control, specific chat enhancers, and synced history.",
    ctaLabel: "Unlock Pro",
    limits: {
      generate: 200,
      screenshot: 60,
      voice: 50,
    },
    highlights: [
      "200 reply runs per day",
      "Advanced response modes + quick presets",
      "5-reply burst, follow-up radar, and all premium tones",
      "Cloud history across devices",
    ],
  },
];

export function getUpgradeUrl(tier: Exclude<PlanTier, "free"> = "pro") {
  const plusUrl = process.env.NEXT_PUBLIC_STRIPE_PLUS_PAYMENT_LINK?.trim();
  const proUrl =
    process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim();

  if (tier === "plus") {
    return plusUrl || "mailto:hi@rizzlyai.com?subject=Rizzly%20Plus";
  }

  return proUrl || "mailto:hi@rizzlyai.com?subject=Rizzly%20Pro";
}

export function getPlanDefinition(tier: PlanTier = "free") {
  return PLAN_CATALOG.find((plan) => plan.tier === tier) ?? PLAN_CATALOG[0];
}
