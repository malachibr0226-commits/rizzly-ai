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
import {
  resolveCanonicalAppUrl,
  shouldUseCanonicalAuthForHost,
} from "@/lib/site-url";

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
    shouldUseCanonicalAuthForHost(window.location.hostname);
  const authLinks = isNonCanonicalHost
    ? {
        signIn: resolveCanonicalAppUrl("/sign-in").toString(),
        signUp: resolveCanonicalAppUrl("/sign-up").toString(),
      }
    : {
        signIn: "/sign-in",
        signUp: "/sign-up",
      };
  const featuresHref = isNonCanonicalHost
    ? resolveCanonicalAppUrl("/#features").toString()
    : "#features";
  const faqHref = isNonCanonicalHost
    ? resolveCanonicalAppUrl("/#faq").toString()
    : "#faq";
  const upgradeHref = isNonCanonicalHost
    ? resolveCanonicalAppUrl("/#upgrade").toString()
    : "#upgrade";

  return (
    <div className="relative z-30 mb-2 pb-4 pt-2">
      {/* Glass backdrop bar */}
      <div className="absolute inset-0 -mx-4 rounded-2xl bg-black/20 backdrop-blur-md md:-mx-8" style={{ zIndex: -1 }} />
      <div className="flex flex-col gap-3 px-1 md:flex-row md:items-center md:justify-between">

        {/* Left: streak + milestones */}
        <div className="flex flex-wrap items-center gap-2">
          {streak.count > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/20 bg-orange-500/10 px-3.5 py-1.5 text-white">
              <span className="text-base">🔥</span>
              <span className="text-sm font-bold text-orange-100">
                {streak.count}-day streak
              </span>
            </div>
          )}
          {unlockedCount > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-3.5 py-1.5 text-white">
              <span className="text-base">🏆</span>
              <span className="text-sm font-bold text-amber-100">
                {unlockedCount} milestone{unlockedCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Right: Navigation + Auth */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Link
            href={featuresHref}
            className="nav-link rounded-full px-4 py-2 text-sm font-medium text-white/55 transition hover:text-white/90"
          >
            Features
          </Link>

          <Link
            href={faqHref}
            className="nav-link rounded-full px-4 py-2 text-sm font-medium text-white/55 transition hover:text-white/90"
          >
            FAQ
          </Link>

          <button
            onClick={onToggleDashboard}
            className={`nav-link whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              showDashboard
                ? "border-blue-400/40 bg-blue-500/20 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.2)]"
                : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
            }`}
            title="View stats and analytics"
          >
            📊 Stats
          </button>

          <Link
            href={upgradeHref}
            className="nav-link relative z-40 cursor-pointer pointer-events-auto rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-2 text-sm font-bold text-blue-200 transition hover:border-blue-400/50 hover:bg-blue-500/25 hover:text-blue-100 hover:shadow-[0_0_16px_rgba(59,130,246,0.25)]"
          >
            Plans
          </Link>

          {/* Auth */}
          {!authEnabled ? (
            <div className="max-w-full rounded-full border border-amber-400/20 bg-amber-500/8 px-3 py-2 text-xs font-semibold text-amber-200">
              Guest mode
            </div>
          ) : !isSignedIn ? (
            <>
              <Link
                href={authLinks.signUp}
                className="nav-link relative z-40 cursor-pointer pointer-events-auto rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/65 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                Sign up
              </Link>
              <Link
                href={authLinks.signIn}
                className="relative z-40 cursor-pointer pointer-events-auto rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-white/92 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              <div className="max-w-full rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                {userFirstName ? `Hi, ${userFirstName}` : "Signed in"}
              </div>
              <SignOutButton>
                <button className="px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white">
                  Sign out
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
