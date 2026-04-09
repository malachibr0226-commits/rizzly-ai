/**
 * Sparkline MVP Analytics Module
 * Handles pattern recognition, achievements, streaks, and insights
 */

import type { Analysis, Reply } from "@/lib/types";

export type ToneKey =
  | "confident"
  | "flirty"
  | "funny"
  | "chill"
  | "apologetic"
  | "warm"
  | "direct"
  | "playful"
  | "smooth";
export type GoalKey = "restart" | "flirt" | "clarify" | "plan" | "repair";
export type ResponseModeKey =
  | "balanced"
  | "boundary"
  | "high-value"
  | "disengage"
  | "call-out"
  | "comeback";
export type CategoryKey = "dating" | "friendship" | "work" | "family" | "exes" | "other";
export type OutcomeStatus = "warm" | "neutral" | "cold" | "no-reply";

export interface TonePattern {
  tone: ToneKey;
  goal: GoalKey;
  successRate: number;
  count: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface StreakData {
  count: number;
  lastDate: string;
}

export interface ThreadTurn {
  id: string;
  createdAt: number;
  userMessage: string;
  draftMessage?: string;
  tone: ToneKey;
  goal: GoalKey;
  responseMode?: ResponseModeKey;
  userContext: string;
  category?: CategoryKey;
  toneIntensity?: number;
  gotResponse?: boolean;
  outcomeStatus?: OutcomeStatus;
  outcomeUpdatedAt?: number;
  chosenReply?: string;
  screenshotSummary?: string;
  relationshipNotesSnapshot?: string;
  personaCalibrationSnapshot?: string;
  replies: Reply[];
  bestIndex: number | null;
  analysis: Analysis | null;
}

export interface Thread {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  turns: ThreadTurn[];
  summary?: string;
  category?: CategoryKey;
  profileName?: string;
  relationshipNotes?: string;
  personaCalibration?: string;
  screenshotSummary?: string;
  lastOutcome?: OutcomeStatus;
  privacyMode?: "local-only";
  successCount?: number;
  totalTurns?: number;
}

// Default achievements
export function getDefaultAchievements(): Achievement[] {
  return [
    {
      id: "first-reply",
      name: "First Message",
      description: "Generate your first reply",
      icon: "🎉",
      unlocked: false,
    },
    {
      id: "five-threads",
      name: "Connector",
      description: "Start 5 conversations",
      icon: "💬",
      unlocked: false,
    },
    {
      id: "ten-threads",
      name: "Social Butterfly",
      description: "Start 10 conversations",
      icon: "🦋",
      unlocked: false,
    },
    {
      id: "week-streak",
      name: "Committed",
      description: "7-day streak",
      icon: "🔥",
      unlocked: false,
    },
    {
      id: "favorite-five",
      name: "Collector",
      description: "Save 5 favorite replies",
      icon: "⭐",
      unlocked: false,
    },
    {
      id: "all-tones",
      name: "Master of Vibes",
      description: "Use 5 different tones",
      icon: "🎨",
      unlocked: false,
    },
  ];
}

// Pattern analysis
export function calculatePatterns(threads: Thread[]): TonePattern[] {
  const patterns: Record<string, TonePattern> = {};

  threads.forEach((thread) => {
    thread.turns.forEach((turn) => {
      const key = `${turn.tone}/${turn.goal}`;
      const success = turn.gotResponse ? 1 : 0;

      if (!patterns[key]) {
        patterns[key] = {
          tone: turn.tone,
          goal: turn.goal,
          successRate: 0,
          count: 0,
        };
      }

      patterns[key].count += 1;
      patterns[key].successRate =
        (patterns[key].successRate * (patterns[key].count - 1) + success) /
        patterns[key].count;
    });
  });

  return Object.values(patterns).sort((a, b) => b.successRate - a.successRate);
}

// Streak tracking
export function updateStreak(): StreakData {
  if (typeof window === "undefined") {
    return { count: 0, lastDate: new Date().toDateString() };
  }

  const saved = localStorage.getItem("sparkline-streak");
  const today = new Date().toDateString();

  if (!saved) {
    const data: StreakData = { count: 1, lastDate: today };
    localStorage.setItem("sparkline-streak", JSON.stringify(data));
    return data;
  }

  const data = JSON.parse(saved);
  if (data.lastDate === today) return data;

  const lastDate = new Date(data.lastDate);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const newData: StreakData = {
    count: daysDiff === 1 ? data.count + 1 : 1,
    lastDate: today,
  };

  localStorage.setItem("sparkline-streak", JSON.stringify(newData));
  return newData;
}

// Achievement checking
export function checkAchievements(
  threads: Thread[],
  favorites: string[],
  usedTones: Set<ToneKey>,
  streak: number
): string[] {
  const newAchievements: string[] = [];

  const totalReplies = threads.reduce((sum, t) => sum + t.turns.length, 0);
  if (totalReplies >= 1) newAchievements.push("first-reply");
  if (threads.length >= 5) newAchievements.push("five-threads");
  if (threads.length >= 10) newAchievements.push("ten-threads");
  if (favorites.length >= 5) newAchievements.push("favorite-five");
  if (streak >= 7) newAchievements.push("week-streak");
  if (usedTones.size === 5) newAchievements.push("all-tones");

  return newAchievements;
}

// Export functionality
export function exportConversation(
  thread: Thread,
  format: "json" | "txt"
): void {
  const content =
    format === "json"
      ? JSON.stringify(thread, null, 2)
      : `Conversation: ${thread.name}\nCategory: ${thread.category || "other"}\n\n${thread.turns
          .map(
            (turn) =>
              `User (${turn.tone}/${turn.goal}): ${turn.userMessage}\nOutcome: ${turn.outcomeStatus || "unknown"}\n\nAssistant: ${turn.chosenReply || turn.replies[0]?.text || "No reply saved"}\n`
          )
          .join("\n---\n\n")}`;

  const filename = `sparkline-${thread.id.slice(-8)}.${
    format === "json" ? "json" : "txt"
  }`;
  const blob = new Blob([content], {
    type: format === "json" ? "application/json" : "text/plain",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Insights generation
export function generateInsight(threads: Thread[]): string {
  const patterns = calculatePatterns(threads);
  const stats = calculateStats(threads);

  if (!patterns.length) {
    return "Start creating conversations to see patterns and momentum shifts.";
  }

  const topPattern = patterns[0];
  const successPercent = (topPattern.successRate * 100).toFixed(0);

  if (stats.outcomeBreakdown.tracked > 0) {
    const trendLabel =
      stats.momentum === "up"
        ? "Momentum is trending up"
        : stats.momentum === "down"
          ? "Momentum is slipping"
          : "Momentum is steady";

    return `🎯 ${trendLabel}. ${topPattern.tone}/${topPattern.goal} is still your strongest combo at ${successPercent}% success.`;
  }

  return `🎯 ${topPattern.tone}/${topPattern.goal} has ${successPercent}% success rate - your most effective combo!`;
}

// Stats calculation
export interface ConversationStats {
  totalConversations: number;
  totalTurns: number;
  mostUsedTone: ToneKey | null;
  mostUsedGoal: GoalKey | null;
  successRate: number;
  avgReplyCount: number;
  outcomeBreakdown: {
    warm: number;
    neutral: number;
    cold: number;
    noReply: number;
    tracked: number;
  };
  momentum: "up" | "steady" | "down";
}

export interface ThreadStrategyInsight {
  threadId: string;
  threadName: string;
  contactLabel: string;
  readinessScore: number;
  statusLabel: "green light" | "warm" | "watch it" | "cool off";
  riskLevel: "low" | "moderate" | "high";
  winningTone: ToneKey | null;
  winningGoal: GoalKey | null;
  conversationStage: "open" | "building" | "ready-to-plan" | "recovery";
  timingSuggestion: string;
  nextAction: string;
  summary: string;
}

export function calculateStats(threads: Thread[]): ConversationStats {
  const allTurns = threads.flatMap((t) => t.turns);

  const toneCount: Record<ToneKey, number> = {} as Record<ToneKey, number>;
  const goalCount: Record<GoalKey, number> = {} as Record<GoalKey, number>;
  let successCount = 0;
  let totalReplyCount = 0;
  const outcomeBreakdown = {
    warm: 0,
    neutral: 0,
    cold: 0,
    noReply: 0,
    tracked: 0,
  };

  allTurns.forEach((turn) => {
    toneCount[turn.tone] = (toneCount[turn.tone] || 0) + 1;
    goalCount[turn.goal] = (goalCount[turn.goal] || 0) + 1;
    if (turn.gotResponse) successCount += 1;
    totalReplyCount += turn.replies.length;

    if (turn.outcomeStatus) {
      outcomeBreakdown.tracked += 1;
      if (turn.outcomeStatus === "warm") outcomeBreakdown.warm += 1;
      if (turn.outcomeStatus === "neutral") outcomeBreakdown.neutral += 1;
      if (turn.outcomeStatus === "cold") outcomeBreakdown.cold += 1;
      if (turn.outcomeStatus === "no-reply") outcomeBreakdown.noReply += 1;
    }
  });

  const mostUsedTone =
    (Object.entries(toneCount).sort((a, b) => b[1] - a[1])[0]?.[0] as ToneKey) ||
    null;
  const mostUsedGoal =
    (Object.entries(goalCount).sort((a, b) => b[1] - a[1])[0]?.[0] as GoalKey) ||
    null;
  const positiveOutcomes = outcomeBreakdown.warm + outcomeBreakdown.neutral;
  const negativeOutcomes = outcomeBreakdown.cold + outcomeBreakdown.noReply;
  const momentum =
    positiveOutcomes > negativeOutcomes
      ? "up"
      : negativeOutcomes > positiveOutcomes
        ? "down"
        : "steady";

  return {
    totalConversations: threads.length,
    totalTurns: allTurns.length,
    mostUsedTone,
    mostUsedGoal,
    successRate:
      outcomeBreakdown.tracked > 0
        ? positiveOutcomes / outcomeBreakdown.tracked
        : allTurns.length > 0
          ? successCount / allTurns.length
          : 0,
    avgReplyCount:
      allTurns.length > 0 ? totalReplyCount / allTurns.length : 0,
    outcomeBreakdown,
    momentum,
  };
}

function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function buildThreadStrategyInsight(thread: Thread): ThreadStrategyInsight {
  const turns = thread.turns ?? [];
  const lastTurn = turns[turns.length - 1];
  const lastOutcome = thread.lastOutcome ?? lastTurn?.outcomeStatus;

  let positiveTurns = 0;
  let negativeTurns = 0;
  const comboStats: Record<
    string,
    {
      tone: ToneKey;
      goal: GoalKey;
      score: number;
      count: number;
    }
  > = {};

  turns.forEach((turn) => {
    if (turn.gotResponse || turn.outcomeStatus === "warm" || turn.outcomeStatus === "neutral") {
      positiveTurns += 1;
    }

    if (turn.outcomeStatus === "cold" || turn.outcomeStatus === "no-reply") {
      negativeTurns += 1;
    }

    const key = `${turn.tone}/${turn.goal}`;
    const delta =
      turn.outcomeStatus === "warm"
        ? 2
        : turn.outcomeStatus === "neutral"
          ? 1
          : turn.outcomeStatus === "cold"
            ? -1
            : turn.outcomeStatus === "no-reply"
              ? -2
              : turn.gotResponse
                ? 1
                : 0;

    if (!comboStats[key]) {
      comboStats[key] = {
        tone: turn.tone,
        goal: turn.goal,
        score: 0,
        count: 0,
      };
    }

    comboStats[key].score += delta;
    comboStats[key].count += 1;
  });

  const bestCombo = Object.values(comboStats).sort((a, b) => {
    if (b.score === a.score) {
      return b.count - a.count;
    }

    return b.score - a.score;
  })[0];

  const positiveRatio = turns.length > 0 ? positiveTurns / turns.length : 0;
  let readinessScore = 42 + positiveRatio * 30 + Math.min(turns.length, 4) * 4 - negativeTurns * 6;

  if (lastOutcome === "warm") readinessScore += 18;
  if (lastOutcome === "neutral") readinessScore += 8;
  if (lastOutcome === "cold") readinessScore -= 12;
  if (lastOutcome === "no-reply") readinessScore -= 20;

  const clampedScore = clampScore(readinessScore);

  const conversationStage: ThreadStrategyInsight["conversationStage"] =
    turns.length === 0
      ? "open"
      : lastOutcome === "warm" && positiveTurns >= 2
        ? "ready-to-plan"
        : lastOutcome === "warm" || lastOutcome === "neutral"
          ? "building"
          : lastOutcome === "cold" || lastOutcome === "no-reply"
            ? "recovery"
            : "open";

  const riskLevel: ThreadStrategyInsight["riskLevel"] =
    clampedScore >= 70 ? "low" : clampedScore >= 45 ? "moderate" : "high";

  const statusLabel: ThreadStrategyInsight["statusLabel"] =
    clampedScore >= 75
      ? "green light"
      : clampedScore >= 58
        ? "warm"
        : clampedScore >= 40
          ? "watch it"
          : "cool off";

  const timingSuggestion =
    lastOutcome === "warm"
      ? "Reply within the next 1–3 hours while the energy is still open."
      : lastOutcome === "neutral"
        ? "Later today is safer than pushing instantly. Keep it light."
        : lastOutcome === "cold"
          ? "Give it breathing room and revisit in a day or two with less pressure."
          : lastOutcome === "no-reply"
            ? "Do not double-text fast. Wait 24–48 hours and reopen with a fresh angle."
            : "Send when you can keep the tone calm, short, and easy to answer.";

  const nextAction =
    conversationStage === "ready-to-plan"
      ? "Move toward a simple plan or date instead of looping in small talk."
      : conversationStage === "building"
        ? "Keep the momentum with one easy follow-up question or callback."
        : conversationStage === "recovery"
          ? "Reset the energy. Shorter, calmer, and less outcome-focused will work better here."
          : "Open simple and specific. Do not over-explain the first move.";

  const comboLabel = bestCombo ? `${bestCombo.tone}/${bestCombo.goal}` : "still being learned";
  const contactLabel = thread.profileName?.trim() || thread.name;

  return {
    threadId: thread.id,
    threadName: thread.name,
    contactLabel,
    readinessScore: clampedScore,
    statusLabel,
    riskLevel,
    winningTone: bestCombo?.tone ?? null,
    winningGoal: bestCombo?.goal ?? null,
    conversationStage,
    timingSuggestion,
    nextAction,
    summary:
      turns.length === 0
        ? "No outcome history yet. Start clean and let the app learn this thread over time."
        : `Best signal so far: ${comboLabel}. ${positiveTurns} of ${turns.length} turns showed positive momentum.`,
  };
}

export function rankThreadsForFollowUp(threads: Thread[]): ThreadStrategyInsight[] {
  return threads
    .filter((thread) => thread.turns.length > 0)
    .map((thread) => buildThreadStrategyInsight(thread))
    .sort((a, b) => {
      if (b.readinessScore === a.readinessScore) {
        return a.contactLabel.localeCompare(b.contactLabel);
      }

      return b.readinessScore - a.readinessScore;
    });
}
