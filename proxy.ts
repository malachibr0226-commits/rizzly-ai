import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
]);

function redirectToCanonicalHost(req: NextRequest) {
  const hostname = req.nextUrl.hostname.toLowerCase();
  const isPreviewHost = hostname.endsWith(".vercel.app");
  const isWwwHost = hostname === "www.rizzlyai.com";
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  if (process.env.NODE_ENV !== "production" || isApiRoute || (!isPreviewHost && !isWwwHost)) {
    return null;
  }

  const canonicalUrl = req.nextUrl.clone();
  canonicalUrl.protocol = "https";
  canonicalUrl.host = "rizzlyai.com";
  return NextResponse.redirect(canonicalUrl, 308);
}

const configuredProxy = clerkMiddleware(async (auth, req) => {
  const redirect = redirectToCanonicalHost(req);
  if (redirect) {
    return redirect;
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

const shouldUseClerkProxy =
  process.env.NODE_ENV === "production" && isClerkConfigured();

export default shouldUseClerkProxy
  ? configuredProxy
  : function proxy(req: NextRequest) {
      return redirectToCanonicalHost(req) ?? NextResponse.next();
    };

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
