import Link from "next/link";
import {
  ClerkDegraded,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignUp,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AuthAppleButton } from "@/app/components/AuthAppleButton";
import { AuthLoadingFallback } from "@/app/components/AuthLoadingFallback";
import { AUTH_DISABLED_REASON, isClerkConfigured } from "@/lib/auth";

export default async function SignUpPage() {

  if (!isClerkConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1333] via-[#2d1a47] to-[#0a0612] px-4">
        <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-pink-400/30 bg-[#1a1333]/95 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
            Local Auth
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-white drop-shadow-lg">Sign up unavailable</h1>
          <p className="mt-4 text-base text-white/90">
            {AUTH_DISABLED_REASON || "Clerk is unavailable in this environment."}
          </p>
          <p className="mt-2 text-sm text-white/60">
            Use guest mode on localhost, or switch to Clerk development keys to test account creation.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 px-6 py-2.5 text-base font-semibold text-white shadow-md hover:scale-105 transition-transform"
          >
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-shell min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1333] via-[#2d1a47] to-[#0a0612] px-4 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-16 left-1/4 h-80 w-80 rounded-full bg-pink-600/18 blur-[100px]" />
        <div className="absolute top-1/2 -right-16 h-64 w-64 rounded-full bg-purple-700/20 blur-[80px]" />
        <div className="absolute bottom-12 left-1/3 h-56 w-56 rounded-full bg-fuchsia-500/14 blur-[70px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center select-none">
          <span
            className="text-5xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(90deg, #f472b6 0%, #e879f9 50%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "block",
              lineHeight: "1.15",
              paddingBottom: "0.18em",
            }}
          >
            Rizzly AI
          </span>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Smarter conversations
          </p>
        </div>
        <div className="auth-card-shell rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(17,10,38,0.96),rgba(22,12,40,0.94))] p-4 sm:p-5 shadow-[0_26px_70px_rgba(11,6,24,0.42)] backdrop-blur-xl">
          <AuthAppleButton mode="sign-up" />
          <ClerkLoading>
            <AuthLoadingFallback mode="sign-up" />
          </ClerkLoading>
          <ClerkFailed>
            <AuthLoadingFallback mode="sign-up" status="failed" />
          </ClerkFailed>
          <ClerkDegraded>
            <AuthLoadingFallback mode="sign-up" status="failed" />
          </ClerkDegraded>
          <ClerkLoaded>
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/"
              forceRedirectUrl="/"
              oauthFlow="redirect"
              appearance={{
                baseTheme: dark,
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
                elements: {
                  rootBox: "mx-auto w-full",
                  cardBox: "mx-auto flex w-full justify-center",
                  card: "mx-auto w-full max-w-none bg-transparent shadow-none border-0",
                },
              }}
            />
          </ClerkLoaded>
        </div>
      </div>
    </div>
  );
}
