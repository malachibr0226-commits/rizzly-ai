import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function hasConfiguredValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

function getHealthPayload() {
  const canonicalUrl = resolveSiteUrl().origin;
  const checks = {
    siteUrl: Boolean(canonicalUrl),
    openai: hasConfiguredValue("OPENAI_API_KEY"),
    clerk: isClerkConfigured(),
    stripe: hasConfiguredValue("STRIPE_SECRET_KEY"),
  };

  const status = checks.siteUrl && checks.openai ? "ok" : "degraded";

  return {
    status,
    app: "rizzly-ai",
    timestamp: new Date().toISOString(),
    canonicalUrl,
    checks,
  };
}

export async function GET() {
  const payload = getHealthPayload();

  return NextResponse.json(payload, {
    status: payload.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function HEAD() {
  const payload = getHealthPayload();

  return new Response(null, {
    status: payload.status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
