import { NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/admin-store";
import { rateLimit } from "@/lib/rate-limit";
import { ensureTrustedOrigin } from "@/lib/security";

export async function POST(req: Request) {
  const blockedOrigin = ensureTrustedOrigin(req);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const { limited, remaining, retryAfterMs } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0", "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  try {
    const body = (await req.json()) as { name?: string };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Event name is required." },
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    await recordAnalyticsEvent(body.name);

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to record analytics event." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }
}
