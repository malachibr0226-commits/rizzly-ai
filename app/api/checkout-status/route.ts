import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerAuth } from "@/lib/auth";
import { writeCloudSnapshot } from "@/lib/cloud-store";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const { limited, remaining } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
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

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing checkout session id." },
      { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified =
      session.payment_status === "paid" || session.status === "complete";

    if (verified) {
      const userId = await getServerAuth();

      if (userId) {
        await writeCloudSnapshot(userId, { planTier: "pro" });
      }
    }

    return NextResponse.json(
      {
        verified,
        planTier: verified ? "pro" : "free",
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email ?? null,
        mode: session.mode,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch (error) {
    console.error("Checkout verification error:", error);
    return NextResponse.json(
      { error: "Unable to verify checkout right now." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }
}
