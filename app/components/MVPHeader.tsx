/**
 * Rizzly MVP Header Component
 * Displays streak counter, achievement badges, auth, and navigation
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
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
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const [authLinks, setAuthLinks] = useState({
    signIn: "/sign-in",
    signUp: "/sign-up",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isNonCanonicalHost = window.location.hostname.endsWith(".vercel.app");

    if (isNonCanonicalHost) {
      setAuthLinks({
        signIn: "https://rizzlyai.com/sign-in",
        signUp: "https://rizzlyai.com/sign-up",
      });
    }
  }, []);

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
            <div className="streak-glow inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-rose-200/20 to-pink-100/10 border border-rose-200/30 backdrop-blur-md hover:from-rose-200/30 hover:to-pink-100/18 transition-all duration-300">
              <span className="text-xl pulse-soft">🔥</span>
              <span className="text-sm font-bold bg-gradient-to-r from-rose-100 to-pink-100 bg-clip-text text-transparent">
                {streak.count}-day streak
              </span>
            </div>
          )}
        </div>

        {/* Achievement badges + Stats button */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {unlockedCount > 0 && (
            <div className="badge-float inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-200/20 to-yellow-100/10 border border-amber-200/30 backdrop-blur-md hover:from-amber-200/30 hover:to-yellow-100/18 transition-all duration-300">
              <span className="text-xl pulse-soft">🏆</span>
              <span className="text-sm font-bold bg-gradient-to-r from-amber-100 to-yellow-100 bg-clip-text text-transparent">
                {unlockedCount} badge{unlockedCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Dashboard toggle - Enhanced with glow */}
          <button
            onClick={onToggleDashboard}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ease-spring transform hover:scale-102 active:scale-98 ${
              showDashboard
                ? "bg-gradient-to-r from-violet-200 to-slate-300 text-white shadow-[0_0_12px_rgba(126,151,163,0.18)]"
                : "bg-gradient-to-r from-violet-100/20 to-slate-200/20 text-violet-100 border border-violet-100/30 hover:from-violet-100/30 hover:to-slate-200/30 hover:shadow-[0_2px_8px_rgba(126,151,163,0.10)]"
            }`}
            title="View stats and analytics"
          >
            📊 Stats
          </button>

          {/* Auth */}
          {!isSignedIn ? (
            <>
              <Link
                href={authLinks.signUp}
                className="relative z-40 cursor-pointer pointer-events-auto rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
              >
                Sign Up
              </Link>
              <Link
                href={authLinks.signIn}
                className="relative z-40 cursor-pointer pointer-events-auto rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(236,72,153,0.3)] transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <div className="max-w-full rounded-full border border-emerald-400/20 bg-emerald-500/8 px-3 py-2 text-xs font-semibold text-emerald-200">
                Signed in{user?.firstName ? ` as ${user.firstName}` : ""}
              </div>
              <SignOutButton>
                <button className="px-4 py-2.5 rounded-full text-sm font-semibold border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10">
                  Sign Out
                </button>
              </SignOutButton>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-pink-500/40",
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
