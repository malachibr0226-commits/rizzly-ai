import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function POST(req: Request) {
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
      { error: "Stripe billing is not configured yet." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  try {
    const user = await getServerUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Sign in with the account you upgraded to manage billing." },
        { status: 401, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customerId = customers.data[0]?.id;

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "No Stripe billing profile was found for this email yet. Try the account used at checkout.",
        },
        { status: 404, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getBaseUrl()}/?billing=portal`,
    });

    return NextResponse.json(
      { url: session.url, provider: "stripe-billing-portal" },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch (error) {
    console.error("Customer portal error:", error);
    return NextResponse.json(
      { error: "Unable to open billing settings right now." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }
}
