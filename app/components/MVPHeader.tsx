/**
 * Rizzly MVP Header Component
 * Displays streak counter, achievement badges, auth, and navigation
 */

"use client";

import React from "react";
import Link from "next/link";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useAppAuth } from "@/app/components/AppAuthProvider";
import type { Achievement, StreakData } from "@/lib/analytics";

interface MVPHeaderProps {
  streak: StreakData;
  achievements: Achievement[];
  showDashboard: boolean;
  onToggleDashboard: () => void;
}

export function MVPHeader({
  streak,
  achievements,
  showDashboard,
  onToggleDashboard,
}: MVPHeaderProps) {
  const { authEnabled, isSignedIn, userFirstName } = useAppAuth();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const isNonCanonicalHost =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".vercel.app");
  const authLinks = isNonCanonicalHost
    ? {
        signIn: "https://rizzlyai.com/sign-in",
        signUp: "https://rizzlyai.com/sign-up",
      }
    : {
        signIn: "/sign-in",
        signUp: "/sign-up",
      };
  const featuresHref = isNonCanonicalHost
    ? "https://rizzlyai.com/#features"
    : "#features";
  const faqHref = isNonCanonicalHost
    ? "https://rizzlyai.com/#faq"
    : "#faq";
  const upgradeHref = isNonCanonicalHost
    ? "https://rizzlyai.com/#upgrade"
    : "#upgrade";

  return (
    <div className="relative z-30 pb-6 pt-4">
      <style>{`
        @keyframes streak-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(190, 103, 154, 0.18)); }
          50% { filter: drop-shadow(0 0 12px rgba(190, 103, 154, 0.28)); }
        }
        @keyframes badge-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        :root {
          --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .streak-glow { animation: streak-glow 4s ease-in-out infinite; }
        .badge-float { animation: badge-float 5s ease-in-out infinite; }
        .pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }
      `}</style>
      
      <div className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        {/* Streak counter - Romantic glow effect */}
        <div className="flex flex-wrap items-center gap-2">
          {streak.count > 0 && (
            <div className="streak-glow inline-flex items-center gap-1.5 rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 backdrop-blur-md transition-all duration-300">
              <span className="text-xl pulse-soft">🔥</span>
              <span className="bg-gradient-to-r from-rose-100 to-pink-100 bg-clip-text text-sm font-bold text-transparent">
                {streak.count}-day spark
              </span>
            </div>
          )}
        </div>

        {/* Achievement badges + Stats button */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {unlockedCount > 0 && (
            <div className="badge-float inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-2 backdrop-blur-md transition-all duration-300">
              <span className="text-xl pulse-soft">🏆</span>
              <span className="bg-gradient-to-r from-amber-100 to-yellow-100 bg-clip-text text-sm font-bold text-transparent">
                {unlockedCount} win{unlockedCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <Link
            href={featuresHref}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10"
          >
            Features
          </Link>

          <Link
            href={faqHref}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10"
          >
            FAQ
          </Link>

          {/* Dashboard toggle - Enhanced with glow */}
          <button
            onClick={onToggleDashboard}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-spring ${
              showDashboard
                ? "border border-slate-300/20 bg-slate-700 text-white shadow-[0_8px_18px_rgba(15,23,42,0.16)]"
                : "border border-slate-300/15 bg-slate-800/60 text-slate-100 hover:border-slate-200/20 hover:bg-slate-700/70"
            }`}
            title="View stats and analytics"
          >
            📊 Stats
          </button>

          <Link
            href={upgradeHref}
            className="relative z-40 cursor-pointer pointer-events-auto rounded-full border border-rose-300/25 bg-gradient-to-r from-rose-500/12 to-fuchsia-500/10 px-4 py-2.5 text-sm font-semibold text-rose-50 transition hover:border-rose-200/35 hover:bg-rose-500/18"
          >
            Upgrade
          </Link>

          {/* Auth */}
          {!authEnabled ? (
            <div className="max-w-full rounded-full border border-amber-400/20 bg-amber-500/8 px-3 py-2 text-xs font-semibold text-amber-100">
              Guest mode
            </div>
          ) : !isSignedIn ? (
            <>
              <Link
                href={authLinks.signUp}
                className="relative z-40 cursor-pointer pointer-events-auto rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
              >
                Create account
              </Link>
              <Link
                href={authLinks.signIn}
                className="relative z-40 cursor-pointer pointer-events-auto rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,63,94,0.26)] transition-all duration-200 hover:shadow-[0_14px_26px_rgba(217,70,239,0.26)]"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <div className="max-w-full rounded-full border border-emerald-400/20 bg-emerald-500/8 px-3 py-2 text-xs font-semibold text-emerald-200">
                Signed in{userFirstName ? ` as ${userFirstName}` : ""}
              </div>
              <SignOutButton>
                <button className="px-4 py-2.5 rounded-full text-sm font-semibold border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10">
                  Sign Out
                </button>
              </SignOutButton>
              <UserButton
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: "#ec4899",
                    colorBackground: "#180a2c",
                    colorInputBackground: "rgba(255,255,255,0.06)",
                    colorText: "#ffffff",
                    colorTextSecondary: "rgba(255,255,255,0.96)",
                    colorTextOnPrimaryBackground: "#ffffff",
                    colorNeutral: "#ffffff",
                  },
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-pink-500/40",
                    userButtonPopoverCard: "bg-[#180a2c]/95 text-white border border-fuchsia-400/20",
                    userButtonPopoverActionButton: "text-white hover:bg-white/10",
                    userButtonPopoverActionButtonText: "text-white",
                    userButtonPopoverActionButtonIcon: "text-white/80",
                    userPreviewMainIdentifier: "text-white",
                    userPreviewSecondaryIdentifier: "text-white/80",
                    card: "bg-[#180a2c] text-white",
                    navbar: "bg-[#180a2c]/95 text-white",
                    navbarButton: "text-white/85 hover:bg-white/10",
                    pageScrollBox: "bg-[#180a2c] text-white [&_*]:!text-white",
                    profileSectionTitleText: "text-white",
                    pageHeaderTitle: "!text-white !opacity-100",
                    pageHeaderSubtitle: "!text-white/90 !opacity-100",
                    formFieldLabel: "text-white/90",
                    formFieldInput: "text-white bg-white/5",
                    badge: "text-white bg-white/10",
                    accordionTriggerButton: "text-white",
                    accordionContent: "text-white/85",
                  },
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
