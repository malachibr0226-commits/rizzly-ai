import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerAuth } from "@/lib/auth";
import { writeCloudSnapshot } from "@/lib/cloud-store";
import { rateLimit } from "@/lib/rate-limit";

const STRIPE_SESSION_ID_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9_]+$/;

export async function GET(req: Request) {
  const { limited, remaining, retryAfterMs } = rateLimit(req, { max: 10, windowMs: 60_000 });
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0", "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured for checkout verification." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id")?.trim();

  if (!sessionId || sessionId.length > 200 || !STRIPE_SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json(
      { error: "Invalid checkout session id." },
      { status: 400, headers: { "X-RateLimit-Remaining": String(remaining), "Cache-Control": "no-store" } },
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified =
      session.payment_status === "paid" || session.status === "complete";
    const verifiedTier = session.metadata?.planTier === "plus" ? "plus" : "pro";

    if (verified) {
      const userId = await getServerAuth();

      if (userId) {
        await writeCloudSnapshot(userId, { planTier: verifiedTier });
      }
    }

    return NextResponse.json(
      {
        verified,
        planTier: verified ? verifiedTier : "free",
        status: session.status,
        paymentStatus: session.payment_status,
        mode: session.mode,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Checkout verification error:", error);
    return NextResponse.json(
      { error: "Unable to verify checkout right now." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining), "Cache-Control": "no-store" } },
    );
  }
}
