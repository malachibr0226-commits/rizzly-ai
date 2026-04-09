import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { ensureTrustedOrigin } from "@/lib/security";

type CheckoutTier = "plus" | "pro";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function getFallbackUpgradeUrl(tier: CheckoutTier) {
  if (tier === "plus") {
    return (
      process.env.NEXT_PUBLIC_STRIPE_PLUS_PAYMENT_LINK?.trim() ||
      "mailto:hi@rizzlyai.com?subject=Rizzly%20Plus"
    );
  }

  return (
    process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim() ||
    "mailto:hi@rizzlyai.com?subject=Rizzly%20Pro"
  );
}

function getStripePriceId(tier: CheckoutTier) {
  if (tier === "plus") {
    return process.env.STRIPE_PLUS_PRICE_ID?.trim() || "";
  }

  return process.env.STRIPE_PRO_PRICE_ID?.trim() || process.env.STRIPE_PRICE_ID?.trim() || "";
}

export async function POST(req: Request) {
  const blockedOrigin = ensureTrustedOrigin(req);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const { limited, remaining } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  let requestedTier: CheckoutTier = "pro";

  try {
    const body = (await req.json()) as { tier?: unknown };
    if (body.tier === "plus" || body.tier === "pro") {
      requestedTier = body.tier;
    }
  } catch {
    // allow empty body and default to Pro
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const stripePriceId = getStripePriceId(requestedTier);
  const checkoutMode =
    process.env.STRIPE_CHECKOUT_MODE?.trim() === "payment"
      ? "payment"
      : "subscription";
  const fallbackUrl = getFallbackUpgradeUrl(requestedTier);

  if (!stripeSecretKey || !stripePriceId) {
    return NextResponse.json(
      {
        url: fallbackUrl,
        fallback: true,
        provider: fallbackUrl.startsWith("https://buy.stripe.com")
          ? "stripe-payment-link"
          : "contact",
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const user = await getServerUser();
    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      allow_promotion_codes: true,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/?checkout=success&tier=${requestedTier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled&tier=${requestedTier}`,
      client_reference_id: user?.id ?? undefined,
      customer_email: user?.email ?? undefined,
      metadata: user?.id
        ? {
            clerkUserId: user.id,
            source: `rizzly-web-upgrade-${requestedTier}`,
            planTier: requestedTier,
          }
        : {
            source: `rizzly-web-upgrade-${requestedTier}`,
            planTier: requestedTier,
          },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json(
      { url: session.url, provider: "stripe-checkout" },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch (error) {
    console.error("Checkout session error:", error);

    if (fallbackUrl) {
      return NextResponse.json(
        {
          url: fallbackUrl,
          fallback: true,
          provider: fallbackUrl.startsWith("https://buy.stripe.com")
            ? "stripe-payment-link"
            : "contact",
        },
        {
          headers: {
            "X-RateLimit-Remaining": String(remaining),
          },
        },
      );
    }

    return NextResponse.json(
      { error: "Unable to start checkout right now." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }
}
