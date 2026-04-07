/**
 * Sparkline MVP Features Hook
 * Centralized state management and handlers for all MVP features
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Thread,
  ThreadTurn,
  Achievement,
  ToneKey,
  GoalKey,
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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastDate: "" });
  const [showDashboard, setShowDashboard] = useState(false);
  const [usedTones, setUsedTones] = useState<Set<ToneKey>>(new Set());

  // Initialize from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("sparkline-favorites");
    const savedRatings = localStorage.getItem("sparkline-ratings");
    const savedAchievements = localStorage.getItem("sparkline-achievements");
    const savedTones = localStorage.getItem("sparkline-tones");

    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRatings) setReplyRatings(JSON.parse(savedRatings));
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    } else {
      setAchievements(getDefaultAchievements());
    }
    if (savedTones) setUsedTones(new Set(JSON.parse(savedTones)));

    const newStreak = updateStreak();
    setStreak(newStreak);
  }, []);

  // Persist favorites
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem("sparkline-favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  // Persist ratings
  useEffect(() => {
    if (Object.keys(replyRatings).length > 0) {
      localStorage.setItem("sparkline-ratings", JSON.stringify(replyRatings));
    }
  }, [replyRatings]);

  // Persist achievements
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem(
        "sparkline-achievements",
        JSON.stringify(achievements)
      );
    }
  }, [achievements]);

  // Persist tones
  useEffect(() => {
    if (usedTones.size > 0) {
      localStorage.setItem(
        "sparkline-tones",
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
    setAchievements((prev) =>
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
