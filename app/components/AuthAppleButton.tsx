"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { FaApple } from "react-icons/fa";

export function AuthAppleButton({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAppleAuth = async () => {
    const flow = (mode === "sign-up" ? signUp : signIn) as
      | {
          sso?: (options: {
            strategy: string;
            redirectUrl: string;
            redirectCallbackUrl: string;
          }) => Promise<{ error?: unknown } | void>;
        }
      | null
      | undefined;

    if (!flow?.sso) {
      setError("Apple sign-in is not ready in this session.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await flow.sso({
        strategy: "oauth_apple",
        redirectUrl: "/",
        redirectCallbackUrl: "/sso-callback",
      });

      if (result && typeof result === "object" && "error" in result && result.error) {
        throw new Error("Apple sign-in could not start.");
      }
    } catch (caughtError) {
      console.error("Apple auth failed:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Apple sign-in could not start. Check Clerk Apple OAuth setup.",
      );
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="auth-apple-button-wrap mb-3">
      <button
        type="button"
        onClick={() => void handleAppleAuth()}
        disabled={loading}
        className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <FaApple className="text-base" />
        <span>{loading ? "Connecting to Apple..." : "Continue with Apple"}</span>
      </button>
      {error && <p className="mt-2 text-center text-xs text-rose-200">{error}</p>}
    </div>
  );
}
