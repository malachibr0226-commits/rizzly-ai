/**
 * Sparkline Dashboard Component
 * Displays analytics, achievements, and export functionality
 */

"use client";

import React from "react";
import type {
  Achievement,
  TonePattern,
  Thread,
  ConversationStats,
} from "@/lib/analytics";

interface DashboardProps {
  threads: Thread[];
  achievements: Achievement[];
  topPatterns: TonePattern[];
  stats: ConversationStats;
  suggestion: string;
  onExport: (thread: Thread, format: "json" | "txt") => void;
  onClose: () => void;
}

export function Dashboard({
  threads,
  achievements,
  topPatterns,
  stats,
  suggestion,
  onExport,
  onClose,
}: DashboardProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes stat-number {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .dashboard-modal { animation: slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .stat-number { animation: stat-number 2.5s ease-in-out infinite; }
      `}</style>
      
      <div className="dashboard-modal bg-gradient-to-br from-purple-950/40 via-slate-900/35 to-gray-900/30 rounded-2xl border border-white/20 backdrop-blur-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_12px_36px_rgba(190,103,154,0.13)]">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-900/70 to-slate-900/60 backdrop-blur-md p-5 border-b border-white/15 flex justify-between items-center">
          <h2 className="text-2xl font-black bg-gradient-to-r from-rose-200 to-blue-200 bg-clip-text text-transparent">
            📊 Your Stats
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 transition-all duration-300 ease-spring transform hover:scale-110 active:scale-100 text-2xl font-light"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/6 backdrop-blur-md rounded-xl p-5 border border-white/12 hover:border-white/18 transition-all duration-200 transform hover:scale-102">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
                Conversations
              </p>
              <p className="text-4xl font-black stat-number bg-gradient-to-r from-blue-200 to-slate-200 bg-clip-text text-transparent">
                {stats.totalConversations}
              </p>
            </div>
            <div className="bg-white/6 backdrop-blur-md rounded-xl p-5 border border-white/12 hover:border-white/18 transition-all duration-200 transform hover:scale-102">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
                Success Rate
              </p>
              <p className="text-4xl font-black stat-number bg-gradient-to-r from-emerald-200 to-green-100 bg-clip-text text-transparent">
                {(stats.successRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-white/6 backdrop-blur-md rounded-xl p-5 border border-white/12 hover:border-white/18 transition-all duration-200 transform hover:scale-102">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
                Tracked Outcomes
              </p>
              <p className="text-4xl font-black stat-number bg-gradient-to-r from-cyan-200 to-sky-100 bg-clip-text text-transparent">
                {stats.outcomeBreakdown.tracked}
              </p>
            </div>
            <div className="bg-white/6 backdrop-blur-md rounded-xl p-5 border border-white/12 hover:border-white/18 transition-all duration-200 transform hover:scale-102">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">
                Momentum
              </p>
              <p className="text-2xl font-black stat-number bg-gradient-to-r from-rose-200 to-amber-100 bg-clip-text text-transparent capitalize">
                {stats.momentum}
              </p>
            </div>
          </div>

          {/* Insight suggestion */}
          <div className="bg-gradient-to-r from-rose-200/15 via-rose-100/10 to-slate-200/10 rounded-xl p-4 border border-rose-200/20 backdrop-blur-sm">
            <p className="text-sm font-medium text-white/90 leading-relaxed">{suggestion}</p>
          </div>

          {stats.outcomeBreakdown.tracked > 0 && (
            <div className="rounded-xl border border-white/12 bg-white/6 p-4 backdrop-blur-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-white">
                📈 Outcome Mix
              </h3>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                  Warm {stats.outcomeBreakdown.warm}
                </span>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                  Neutral {stats.outcomeBreakdown.neutral}
                </span>
                <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-amber-100">
                  Cold {stats.outcomeBreakdown.cold}
                </span>
                <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-rose-100">
                  No reply {stats.outcomeBreakdown.noReply}
                </span>
              </div>
            </div>
          )}

          {/* Top patterns */}
          {topPatterns.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-widest">
                🎯 Best Patterns
              </h3>
              <div className="space-y-2">
                {topPatterns.slice(0, 3).map((pattern, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white/8 backdrop-blur-md rounded-lg p-3 border border-white/12 hover:border-white/20 transition-all duration-200 group"
                  >
                    <span className="text-sm font-medium bg-gradient-to-r from-violet-200 to-pink-100 bg-clip-text text-transparent group-hover:from-violet-100 group-hover:to-pink-50 transition-all">
                      {pattern.tone} + {pattern.goal}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className="bg-gradient-to-r from-violet-200 via-pink-100 to-blue-100 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pattern.successRate * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white/70 w-10 text-right">
                        {(pattern.successRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-widest">
              🏆 Achievements ({unlockedCount}/{achievements.length})
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`rounded-xl p-4 text-center border transition-all duration-200 transform hover:scale-104 cursor-pointer backdrop-blur-sm ${
                    ach.unlocked
                      ? "bg-gradient-to-br from-amber-200/25 to-yellow-100/15 border-amber-200/30 hover:from-amber-100/30 hover:to-yellow-100/20 shadow-[0_0_12px_rgba(168,148,89,0.10)]"
                      : "bg-white/6 border-white/10 hover:bg-white/10"
                  }`}
                  title={ach.description}
                >
                  <p className="text-2xl mb-2 transform transition-transform group-hover:scale-110">
                    {ach.icon}
                  </p>
                  <p className={`text-xs font-bold ${ach.unlocked ? "text-amber-200" : "text-white/50"}`}>
                    {ach.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Export section */}
          {threads.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-widest">
                📥 Export Conversations
              </h3>
              <div className="space-y-2">
                {threads.slice(-3).map((thread) => (
                  <div
                    key={thread.id}
                    className="flex items-center justify-between bg-white/8 backdrop-blur-md rounded-lg p-4 border border-white/12 hover:border-white/20 transition-all duration-300 hover:bg-white/12"
                  >
                    <div className="text-sm">
                      <p className="text-white font-bold">{thread.name}</p>
                      <p className="text-xs text-white/50 mt-1">
                        {thread.turns.length} turn{thread.turns.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onExport(thread, "json")}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-200/15 text-blue-200 border border-blue-200/25 hover:bg-blue-200/25 hover:border-blue-200/40 transition-all duration-[350ms] ease-spring transform hover:scale-105 active:scale-97 hover:shadow-[0_4px_12px_rgba(126,151,163,0.10)]"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => onExport(thread, "txt")}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-200/15 text-emerald-100 border border-emerald-100/25 hover:bg-emerald-100/25 hover:border-emerald-100/40 transition-all duration-[350ms] ease-spring transform hover:scale-105 active:scale-97 hover:shadow-[0_4px_12px_rgba(126,151,163,0.10)]"
                      >
                        TXT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
