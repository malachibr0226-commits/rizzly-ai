import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isClerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

const canonicalAppUrl = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://rizzlyai.com"
).replace("https://www.rizzlyai.com", "https://rizzlyai.com");

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
]);

function redirectToCanonicalIfNeeded(req: NextRequest) {
  const isPreviewHost = req.nextUrl.hostname.endsWith(".vercel.app");
  const isWrongWwwHost = req.nextUrl.hostname === "www.rizzlyai.com";

  if (
    !canonicalAppUrl ||
    !["GET", "HEAD"].includes(req.method) ||
    (!isPreviewHost && !isWrongWwwHost) ||
    req.nextUrl.pathname.startsWith("/api")
  ) {
    return null;
  }

  try {
    const destination = new URL(
      `${req.nextUrl.pathname}${req.nextUrl.search}`,
      canonicalAppUrl.endsWith("/") ? canonicalAppUrl : `${canonicalAppUrl}/`,
    );

    if (destination.host !== req.nextUrl.host) {
      return NextResponse.redirect(destination, 307);
    }
  } catch {
    return null;
  }

  return null;
}

const configuredProxy = clerkMiddleware(async (auth, req) => {
  const redirect = redirectToCanonicalIfNeeded(req);
  if (redirect) {
    return redirect;
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export default isClerkConfigured
  ? configuredProxy
  : function proxy(req: NextRequest) {
      return redirectToCanonicalIfNeeded(req) ?? NextResponse.next();
    };

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
