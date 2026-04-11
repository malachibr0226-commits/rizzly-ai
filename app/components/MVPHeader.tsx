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
      <div className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
        {/* Streak counter */}
        <div className="flex flex-wrap items-center gap-2">
          {streak.count > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold">
                {streak.count}-day streak
              </span>
            </div>
          )}
        </div>

        {/* Navigation + Auth */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {unlockedCount > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-semibold">
                {unlockedCount} milestone{unlockedCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <Link
            href={featuresHref}
            className="nav-link rounded-full border border-white/8 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white/90"
          >
            Features
          </Link>

          <Link
            href={faqHref}
            className="nav-link rounded-full border border-white/8 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white/90"
          >
            FAQ
          </Link>

          <button
            onClick={onToggleDashboard}
            className={`nav-link whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-150 ${
              showDashboard
                ? "border border-blue-500/30 bg-blue-500/15 text-white"
                : "border border-white/8 text-white/60 hover:border-white/20 hover:text-white/90"
            }`}
            title="View stats and analytics"
          >
            📊 Stats
          </button>

          <Link
            href={upgradeHref}
            className="nav-link relative z-40 cursor-pointer pointer-events-auto rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-400"
          >
            Plans
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
                className="nav-link relative z-40 cursor-pointer pointer-events-auto rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
              >
                Create account
              </Link>
              <Link
                href={authLinks.signIn}
                className="relative z-40 cursor-pointer pointer-events-auto rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-colors duration-150 hover:bg-white/90"
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
                <button className="px-4 py-2.5 rounded-full text-sm font-semibold border border-white/10 text-white/70 transition hover:border-white/25 hover:text-white">
                  Sign Out
                </button>
              </SignOutButton>
              <UserButton
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: "#3b82f6",
                    colorBackground: "#000000",
                    colorInputBackground: "rgba(255,255,255,0.06)",
                    colorText: "#ffffff",
                    colorTextSecondary: "rgba(255,255,255,0.96)",
                    colorTextOnPrimaryBackground: "#ffffff",
                    colorNeutral: "#ffffff",
                  },
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-blue-500/30",
                    userButtonPopoverCard: "bg-[#0a0a0a] text-white border border-white/10",
                    userButtonPopoverActionButton: "text-white hover:bg-white/10",
                    userButtonPopoverActionButtonText: "text-white",
                    userButtonPopoverActionButtonIcon: "text-white/80",
                    userPreviewMainIdentifier: "text-white",
                    userPreviewSecondaryIdentifier: "text-white/80",
                    card: "bg-[#0a0a0a] text-white",
                    navbar: "bg-[#0a0a0a] text-white",
                    navbarButton: "text-white/85 hover:bg-white/10",
                    pageScrollBox: "bg-[#0a0a0a] text-white [&_*]:!text-white",
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
