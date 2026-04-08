"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ClerkLoaded, ClerkLoading, SignIn, useAuth } from "@clerk/nextjs";
import { AuthLoadingFallback } from "@/app/components/AuthLoadingFallback";

export default function SignInPage() {
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.location.replace("/?guest=1&auth=stalled");
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0612] px-4">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/20 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 translate-x-1/2 translate-y-1/2 rounded-full bg-purple-600/20 blur-[80px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-col items-center">
        {/* Branding */}
        <div className="mb-4 w-full text-center">
          <span className="block bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Rizzly AI
          </span>
          <p className="mt-2 text-sm text-white/85">Welcome back — sign in to continue</p>
        </div>

        <ClerkLoading>
          <AuthLoadingFallback mode="sign-in" />
        </ClerkLoading>

        <ClerkLoaded>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
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

        <div className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white/70">
          If auth hangs, you can still <Link href="/?guest=1&auth=stalled" className="font-semibold text-pink-300 hover:text-pink-200">continue in guest mode</Link> and use the core reply generator. You&apos;ll be redirected automatically in a few seconds if the auth form never loads.
        </div>
      </div>
    </div>
  );
}
