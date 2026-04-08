import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const CANONICAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.rizzlyai.com";

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") || "";
  const isPreviewHost = host.endsWith(".vercel.app");

  if (isPreviewHost && isAuthRoute(req)) {
    const redirectUrl = new URL(req.url);
    const canonicalUrl = new URL(CANONICAL_APP_URL);

    redirectUrl.protocol = canonicalUrl.protocol;
    redirectUrl.host = canonicalUrl.host;

    return NextResponse.redirect(redirectUrl, 307);
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
