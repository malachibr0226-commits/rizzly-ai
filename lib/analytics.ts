/**
 * Sparkline MVP Analytics Module
 * Handles pattern recognition, achievements, streaks, and insights
 */

export type ToneKey = "confident" | "flirty" | "funny" | "chill" | "apologetic";
export type GoalKey = "restart" | "flirt" | "clarify" | "plan" | "repair";
export type CategoryKey = "dating" | "friendship" | "work" | "family" | "exes" | "other";

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
  tone: ToneKey;
  goal: GoalKey;
  userContext: string;
  category?: CategoryKey;
  toneIntensity?: number;
  gotResponse?: boolean;
  chosenReply?: string;
  replies: any[];
  bestIndex: number | null;
  analysis: any;
}

export interface Thread {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  turns: ThreadTurn[];
  summary?: string;
  category?: CategoryKey;
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
      description: "Use all 5 tones",
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
              `User (${turn.tone}/${turn.goal}): ${turn.userMessage}\n\nAssistant: ${turn.chosenReply || turn.replies[0]?.text || "No reply saved"}\n`
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
  if (!patterns.length) return "Start creating conversations to see patterns!";

  const topPattern = patterns[0];
  const successPercent = (topPattern.successRate * 100).toFixed(0);
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
}

export function calculateStats(threads: Thread[]): ConversationStats {
  const allTurns = threads.flatMap((t) => t.turns);

  const toneCount: Record<ToneKey, number> = {} as Record<ToneKey, number>;
  const goalCount: Record<GoalKey, number> = {} as Record<GoalKey, number>;
  let successCount = 0;
  let totalReplyCount = 0;

  allTurns.forEach((turn) => {
    toneCount[turn.tone] = (toneCount[turn.tone] || 0) + 1;
    goalCount[turn.goal] = (goalCount[turn.goal] || 0) + 1;
    if (turn.gotResponse) successCount += 1;
    totalReplyCount += turn.replies.length;
  });

  const mostUsedTone = Object.entries(toneCount).sort((a, b) => b[1] - a[1])[0]?.[0] as ToneKey ||
    null;
  const mostUsedGoal = Object.entries(goalCount).sort((a, b) => b[1] - a[1])[0]?.[0] as GoalKey ||
    null;

  return {
    totalConversations: threads.length,
    totalTurns: allTurns.length,
    mostUsedTone,
    mostUsedGoal,
    successRate: allTurns.length > 0 ? successCount / allTurns.length : 0,
    avgReplyCount:
      allTurns.length > 0 ? totalReplyCount / allTurns.length : 0,
  };
}
