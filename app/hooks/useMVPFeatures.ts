/**
 * Rizzly MVP Features Hook
 * Centralized state management and handlers for all MVP features
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Thread,
  Achievement,
  ToneKey,
  CategoryKey,
  TonePattern,
  ConversationStats,
} from "@/lib/analytics";
import {
  getDefaultAchievements,
  calculatePatterns,
  updateStreak,
  checkAchievements,
  exportConversation,
  generateInsight,
  calculateStats,
  type StreakData,
} from "@/lib/analytics";

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

export interface MVPFeaturesState {
  // Feature states
  category: CategoryKey;
  toneIntensity: number;
  bulkCount: number;
  favorites: string[];
  replyRatings: Record<string, number>;
  achievements: Achievement[];
  streak: StreakData;
  showDashboard: boolean;
  usedTones: Set<ToneKey>;

  // Handlers
  setCategory: (cat: CategoryKey) => void;
  setToneIntensity: (intensity: number) => void;
  setBulkCount: (count: number) => void;
  rateReply: (replyId: string, rating: number) => void;
  toggleFavorite: (replyId: string) => void;
  updateAchievement: (achievementId: string) => void;
  toggleDashboard: () => void;
  trackToneUsage: (tone: ToneKey) => void;

  // Data retrieval
  getTopPatterns: (limit?: number) => TonePattern[];
  getSuggestion: () => string;
  getStats: (threads: Thread[]) => ConversationStats;
  exportData: (thread: Thread, format: "json" | "txt") => void;

  // Derived
  isAchievementUnlocked: (id: string) => boolean;
  getAchievementCount: () => number;
}

export function useMVPFeatures(threads: Thread[]): MVPFeaturesState {
  // Feature states
  const [category, setCategory] = useState<CategoryKey>("other");
  const [toneIntensity, setToneIntensity] = useState(5);
  const [bulkCount, setBulkCount] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [replyRatings, setReplyRatings] = useState<Record<string, number>>({});
  const [achievementState, setAchievementState] = useState<Achievement[]>(
    getDefaultAchievements()
  );
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastDate: "" });
  const [showDashboard, setShowDashboard] = useState(false);
  const [usedTones, setUsedTones] = useState<Set<ToneKey>>(new Set());

  useEffect(() => {
    queueMicrotask(() => {
      setCategory(readStoredJson<CategoryKey>("rizzly-category", "other"));
      setToneIntensity(readStoredJson<number>("rizzly-intensity", 5));
      setBulkCount(readStoredJson<number>("rizzly-bulk-count", 1));
      setFavorites(readStoredJson<string[]>("rizzly-favorites", []));
      setReplyRatings(
        readStoredJson<Record<string, number>>("rizzly-ratings", {})
      );
      setAchievementState(
        readStoredJson<Achievement[]>(
          "rizzly-achievements",
          getDefaultAchievements()
        )
      );
      setUsedTones(new Set(readStoredJson<ToneKey[]>("rizzly-tones", [])));
      setStreak(updateStreak());
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("rizzly-category", JSON.stringify(category));
  }, [category]);

  useEffect(() => {
    localStorage.setItem("rizzly-intensity", JSON.stringify(toneIntensity));
  }, [toneIntensity]);

  useEffect(() => {
    localStorage.setItem("rizzly-bulk-count", JSON.stringify(bulkCount));
  }, [bulkCount]);

  // Persist favorites
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem("rizzly-favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  // Persist ratings
  useEffect(() => {
    if (Object.keys(replyRatings).length > 0) {
      localStorage.setItem("rizzly-ratings", JSON.stringify(replyRatings));
    }
  }, [replyRatings]);

  const achievements = useMemo(() => {
    if (achievementState.length === 0) {
      return [];
    }

    const earnedIds = new Set(
      checkAchievements(threads, favorites, usedTones, streak.count)
    );

    return achievementState.map((achievement) => {
      if (!achievement.unlocked && earnedIds.has(achievement.id)) {
        return {
          ...achievement,
          unlocked: true,
          unlockedAt:
            achievement.unlockedAt ?? Date.parse(streak.lastDate || "1970-01-01"),
        };
      }

      return achievement;
    });
  }, [
    achievementState,
    threads,
    favorites,
    usedTones,
    streak.count,
    streak.lastDate,
  ]);

  // Persist achievements
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem(
        "rizzly-achievements",
        JSON.stringify(achievements)
      );
    }
  }, [achievements]);

  // Persist tones
  useEffect(() => {
    if (usedTones.size > 0) {
      localStorage.setItem(
        "rizzly-tones",
        JSON.stringify(Array.from(usedTones))
      );
    }
  }, [usedTones]);

  // Handler: Rate reply
  const rateReply = useCallback((replyId: string, rating: number) => {
    setReplyRatings((prev) => ({
      ...prev,
      [replyId]: rating,
    }));
  }, []);

  // Handler: Toggle favorite
  const toggleFavorite = useCallback((replyId: string) => {
    setFavorites((prev) =>
      prev.includes(replyId)
        ? prev.filter((id) => id !== replyId)
        : [...prev, replyId]
    );
  }, []);

  // Handler: Update achievement
  const updateAchievement = useCallback((achievementId: string) => {
    setAchievementState((prev) =>
      prev.map((ach) =>
        ach.id === achievementId
          ? { ...ach, unlocked: true, unlockedAt: Date.now() }
          : ach
      )
    );
  }, []);

  // Handler: Toggle dashboard
  const toggleDashboard = useCallback(() => {
    setShowDashboard((prev) => !prev);
  }, []);

  // Handler: Track tone usage
  const trackToneUsage = useCallback((tone: ToneKey) => {
    setUsedTones((prev) => {
      const newSet = new Set(prev);
      newSet.add(tone);
      return newSet;
    });
  }, []);

  // Data retrieval: Get top patterns
  const getTopPatterns = useCallback(
    (limit: number = 5): TonePattern[] => {
      return calculatePatterns(threads).slice(0, limit);
    },
    [threads]
  );

  // Data retrieval: Get suggestion
  const getSuggestion = useCallback((): string => {
    return generateInsight(threads);
  }, [threads]);

  // Data retrieval: Get stats
  const getStats = useCallback(
    (threadList: Thread[]): ConversationStats => {
      return calculateStats(threadList);
    },
    []
  );

  // Data retrieval: Export
  const exportData = useCallback((thread: Thread, format: "json" | "txt") => {
    exportConversation(thread, format);
  }, []);

  // Derived: Check if achievement unlocked
  const isAchievementUnlocked = useCallback(
    (id: string): boolean => {
      return achievements.find((a) => a.id === id)?.unlocked ?? false;
    },
    [achievements]
  );

  // Derived: Get achievement count
  const getAchievementCount = useCallback((): number => {
    return achievements.filter((a) => a.unlocked).length;
  }, [achievements]);

  return {
    category,
    toneIntensity,
    bulkCount,
    favorites,
    replyRatings,
    achievements,
    streak,
    showDashboard,
    usedTones,

    setCategory,
    setToneIntensity,
    setBulkCount,
    rateReply,
    toggleFavorite,
    updateAchievement,
    toggleDashboard,
    trackToneUsage,

    getTopPatterns,
    getSuggestion,
    getStats,
    exportData,

    isAchievementUnlocked,
    getAchievementCount,
  };
}
