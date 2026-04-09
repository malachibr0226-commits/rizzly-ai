const CANONICAL_PRODUCTION_URL = "https://rizzlyai.com";

export function normalizeSiteUrl(candidate: string) {
  const parsed = new URL(candidate);

  if (parsed.hostname === "www.rizzlyai.com") {
    parsed.hostname = "rizzlyai.com";
  }

  return parsed;
}

export function resolveSiteUrl(options?: { preferLocalhost?: boolean }) {
  const fallback =
    options?.preferLocalhost && process.env.NODE_ENV !== "production"
      ? "http://localhost:3000"
      : CANONICAL_PRODUCTION_URL;

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    fallback,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      return normalizeSiteUrl(candidate);
    } catch {
      continue;
    }
  }

  return new URL(fallback);
}
