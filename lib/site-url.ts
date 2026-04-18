export const CANONICAL_PRODUCTION_URL = "https://rizzlyai.com";
export const CANONICAL_PRODUCTION_HOST = new URL(CANONICAL_PRODUCTION_URL).hostname;

export function normalizeSiteUrl(candidate: string) {
  const parsed = new URL(candidate);

  if (parsed.hostname === "www.rizzlyai.com") {
    parsed.hostname = CANONICAL_PRODUCTION_HOST;
  }

  return parsed;
}

export function resolveCanonicalAppUrl(pathname = "/") {
  return new URL(pathname, CANONICAL_PRODUCTION_URL);
}

export function getClerkPublishableKey() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
}

export function isLocalClerkOverrideEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_LOCAL_CLERK === "true";
}

export function shouldUseCanonicalAuthOrigin({
  hostname,
  publishableKey,
  localClerkOverride = false,
}: {
  hostname: string | null | undefined;
  publishableKey?: string | null;
  localClerkOverride?: boolean;
}) {
  const normalizedHost = hostname?.trim().toLowerCase() ?? "";

  if (!normalizedHost || normalizedHost === CANONICAL_PRODUCTION_HOST) {
    return false;
  }

  if (
    normalizedHost === "www.rizzlyai.com" ||
    normalizedHost.endsWith(".vercel.app")
  ) {
    return true;
  }

  const normalizedKey = publishableKey?.trim() ?? "";
  return normalizedKey.startsWith("pk_live_") && !localClerkOverride;
}

export function shouldUseCanonicalAuthForHost(hostname: string | null | undefined) {
  return shouldUseCanonicalAuthOrigin({
    hostname,
    publishableKey: getClerkPublishableKey(),
    localClerkOverride: isLocalClerkOverrideEnabled(),
  });
}

export function resolveAuthNavigationTarget(
  pathname: string,
  hostname: string | null | undefined,
) {
  return shouldUseCanonicalAuthForHost(hostname)
    ? resolveCanonicalAppUrl(pathname).toString()
    : pathname;
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
