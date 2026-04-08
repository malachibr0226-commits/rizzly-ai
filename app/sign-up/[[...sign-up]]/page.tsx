import Link from "next/link";
import {
  ClerkDegraded,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignUp,
} from "@clerk/nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthLoadingFallback } from "@/app/components/AuthLoadingFallback";
import { AUTH_DISABLED_REASON, isClerkConfigured } from "@/lib/auth";

const CANONICAL_APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://rizzlyai.com"
).replace("https://www.rizzlyai.com", "https://rizzlyai.com");

async function redirectToCanonicalSignUp() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";

  if (host.endsWith(".vercel.app")) {
    redirect(new URL("/sign-up", CANONICAL_APP_URL).toString());
  }
}

export default async function SignUpPage() {
  await redirectToCanonicalSignUp();

  if (!isClerkConfigured()) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0612] px-4">
        <div className="relative z-10 mx-auto w-full max-w-[460px] rounded-[28px] border border-amber-400/20 bg-[#160d2b]/95 p-6 text-center shadow-[0_0_32px_rgba(236,72,153,0.10)] backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Local auth
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">Sign up is unavailable here</h1>
          <p className="mt-3 text-sm text-white/80">
            {AUTH_DISABLED_REASON || "Clerk is unavailable in this environment."}
          </p>
          <p className="mt-2 text-sm text-white/60">
            Use guest mode on localhost, or switch to Clerk development keys to test account creation.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0612] px-4">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/20 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 translate-x-1/2 translate-y-1/2 rounded-full bg-purple-600/20 blur-[80px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-col items-center">
        <div className="mb-5 w-full text-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            New account
          </div>
          <span className="mt-3 block bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Rizzly AI
          </span>
          <p className="mt-2 text-sm text-white/72">Create your account</p>
        </div>

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
              variables: {
                colorPrimary: "#ec4899",
                colorBackground: "#160d2b",
                colorInputBackground: "#1e1140",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "rgba(255,255,255,0.88)",
                colorTextOnPrimaryBackground: "#ffffff",
                colorNeutral: "#ffffff",
                borderRadius: "14px",
              },
              elements: {
                rootBox: "w-full flex justify-center",
                cardBox: "w-full",
                card: "w-full border border-pink-500/40 bg-[#160d2b] shadow-[0_0_50px_rgba(236,72,153,0.25)]",
                headerTitle: { color: "#ffffff", fontWeight: "700" },
                headerSubtitle: { color: "rgba(255,255,255,0.88)" },
                socialButtonsBlockButton:
                  "border-white/20 bg-white/10 hover:bg-white/20 transition-colors",
                socialButtonsBlockButtonText: {
                  color: "#ffffff",
                  fontWeight: "600",
                },
                socialButtonsProviderIcon__apple: { color: "#ffffff" },
                socialButtonsProviderIcon__discord: { color: "#5865F2" },
                socialButtonsProviderIcon__google: { color: "#4285F4" },
                dividerLine: "bg-white/10",
                dividerText: { color: "rgba(255,255,255,0.72)" },
                formFieldLabel: {
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: "500",
                },
                formFieldInput:
                  "border-white/20 text-white placeholder:text-white/45 focus:border-pink-400",
                formFieldInputShowPasswordButton: { color: "#ffffff" },
                footerActionText: { color: "rgba(255,255,255,0.78)" },
                footerActionLink: "text-pink-400 hover:text-pink-300 font-semibold",
                formButtonPrimary:
                  "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg",
              },
            }}
          />
        </ClerkLoaded>

        <p className="mt-3 text-center text-xs text-white/45">
          Save your threads and pick up where you left off.
        </p>
      </div>
    </div>
  );
}
