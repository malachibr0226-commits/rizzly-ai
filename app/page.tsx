"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppAuth } from "@/app/components/AppAuthProvider";
import { useMVPFeatures } from "@/app/hooks/useMVPFeatures";
import { Dashboard } from "@/app/components/Dashboard";
import { MVPHeader } from "@/app/components/MVPHeader";
import { ThreadList } from "@/app/components/ThreadList";
import { AnalysisPanel } from "@/app/components/AnalysisPanel";
import { RelationshipIntelPanel } from "@/app/components/RelationshipIntelPanel";
import { GrowthPanel } from "@/app/components/GrowthPanel";
import { ChatPreview } from "@/app/components/ChatPreview";
import {
  trackGenerate,
  trackCopy,
  trackSend,
  trackRate,
  trackFavorite,
  trackOutcome,
  trackToneChange,
  trackScreenshotUpload,
  trackThreadCreated,
  trackThreadDeleted,
  trackVoiceNote,
  trackError,
} from "@/lib/analytics-events";
import { buildThreadStrategyInsight } from "@/lib/analytics";
import type {
  ToneKey,
  GoalKey,
  OutcomeStatus,
  Thread,
  ThreadTurn,
} from "@/lib/analytics";
import {
  buildMemoryPrimer,
  consumeUsageAction,
  getOutcomeCoach,
  getUsageSnapshot,
  readSavedPersonas,
  savePersonaDraft,
  setStoredPlanTier,
  touchPersona,
  type SavedPersona,
  type UsageAction,
  type UsageSnapshot,
} from "@/lib/product-features";

type Reply = {
  text: string;
  scores: {
    confidence: number;
    engagement: number;
    responseChance: number;
  };
  rating?: number; // -1 (👎), 0 (unrated), 1 (👍)
  isFavorite?: boolean;
  image?: string; // Optional image URL or base64
};

type Analysis = {
  summary?: string;
  vibe?: string;
  strength?: string;
  risk?: string;
  toneUsed?: string;
  strategy?: string;
  depthMode?: string;
  userPattern?: string;
  receiverPattern?: string;
  languageStyle?: string;
  adaptationNote?: string;
  timingWindow?: string;
  avoid?: string;
  coachNotes?: string;
  nextMoves?: string[];
  replyBranches?: Array<{
    scenario: string;
    move: string;
    note: string;
  }>;
};

type ScreenshotParseResult = {
  transcriptLines: string[];
  suggestedProfileName: string;
  relationshipNotes: string;
  summary: string;
  suggestedGoal: GoalKey;
  personaHint: string;
};

type GenerateReplyResponse = {
  replies?: Reply[];
  bestIndex?: number | null;
  analysis?: Analysis | null;
  warning?: string;
  degraded?: boolean;
  error?: string;
};

type DictationTarget = "conversation" | "context";

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type BrowserSpeechRecognitionErrorEvent = {
  error: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

const DRAFT_KEY = "rizzly-draft-v1";
const THREADS_KEY = "rizzly-threads-v2";
const CURRENT_THREAD_KEY = "rizzly-current-thread-v1";

const DEFAULT_DRAFT = {
  conversation: "",
  tone: "confident" as ToneKey,
  goal: "restart" as GoalKey,
  userContext: "",
  profileName: "",
  relationshipNotes: "",
  personaCalibration: "",
  screenshotSummary: "",
};

const DEFAULT_USAGE_SNAPSHOT: UsageSnapshot = {
  planTier: "free",
  dayKey: "",
  resetLabel: "--",
  limits: {
    generate: 25,
    screenshot: 10,
    voice: 8,
  },
  used: {
    generate: 0,
    screenshot: 0,
    voice: 0,
  },
  remaining: {
    generate: 25,
    screenshot: 10,
    voice: 8,
  },
};

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 20_000,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function loadDraft() {
  if (typeof window === "undefined") {
    return DEFAULT_DRAFT;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "null");

    return {
      conversation:
        typeof parsed?.conversation === "string"
          ? parsed.conversation
          : DEFAULT_DRAFT.conversation,
      tone:
        typeof parsed?.tone === "string"
          ? (parsed.tone as ToneKey)
          : DEFAULT_DRAFT.tone,
      goal:
        typeof parsed?.goal === "string"
          ? (parsed.goal as GoalKey)
          : DEFAULT_DRAFT.goal,
      userContext:
        typeof parsed?.userContext === "string"
          ? parsed.userContext
          : DEFAULT_DRAFT.userContext,
      profileName:
        typeof parsed?.profileName === "string"
          ? parsed.profileName
          : DEFAULT_DRAFT.profileName,
      relationshipNotes:
        typeof parsed?.relationshipNotes === "string"
          ? parsed.relationshipNotes
          : DEFAULT_DRAFT.relationshipNotes,
      personaCalibration:
        typeof parsed?.personaCalibration === "string"
          ? parsed.personaCalibration
          : DEFAULT_DRAFT.personaCalibration,
      screenshotSummary:
        typeof parsed?.screenshotSummary === "string"
          ? parsed.screenshotSummary
          : DEFAULT_DRAFT.screenshotSummary,
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

function loadThreads() {
  if (typeof window === "undefined") {
    return [] as Thread[];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(THREADS_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as Thread[]) : [];
  } catch {
    return [] as Thread[];
  }
}

function loadCurrentThreadId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(CURRENT_THREAD_KEY);
  } catch {
    return null;
  }
}

function mergeThreads(localThreads: Thread[], remoteThreads: Thread[]) {
  const merged = new Map<string, Thread>();

  [...remoteThreads, ...localThreads].forEach((thread) => {
    const existing = merged.get(thread.id);

    if (!existing || thread.updatedAt > existing.updatedAt) {
      merged.set(thread.id, thread);
    }
  });

  return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

function mergeSavedPersonas(localPersonas: SavedPersona[], remotePersonas: SavedPersona[]) {
  const merged = new Map<string, SavedPersona>();

  [...remotePersonas, ...localPersonas].forEach((persona) => {
    const existing = merged.get(persona.id);

    if (!existing || persona.lastUsedAt > existing.lastUsedAt) {
      merged.set(persona.id, persona);
    }
  });

  return Array.from(merged.values())
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, 8);
}

function generateThreadSummary(turns: ThreadTurn[]): string {
  if (!turns.length) return "";

  const recentTurns = turns.slice(-3);
  const summaryParts = recentTurns.map((turn) => {
    const analysis = turn.analysis;
    const chosenReply = turn.chosenReply;

    const outcome = chosenReply
      ? `sent: "${chosenReply.substring(0, 50)}${chosenReply.length > 50 ? "..." : ""}"`
      : `tried ${turn.replies.length} replies`;
    const responseTag = turn.outcomeStatus ? ` [${turn.outcomeStatus}]` : "";

    const vibe = analysis?.vibe ? ` (${analysis.vibe})` : "";

    return `[${turn.tone}/${turn.goal}]${vibe}${responseTag} → ${outcome}`;
  });

  return summaryParts.join(" · ");
}

function detectVoiceSupport() {
  if (typeof window === "undefined") {
    return false;
  }

  const recognitionCtor = (
    window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionCtor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    }
  ).SpeechRecognition ??
    (
      window as Window & {
        webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
      }
    ).webkitSpeechRecognition;

  return Boolean(recognitionCtor);
}

function ToneIcon({
  tone,
  className,
}: {
  tone: ToneKey;
  className?: string;
}) {
  const base = `h-5 w-5 ${className ?? ""}`;

  switch (tone) {
    case "confident":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="M12 3L14.2 8.4L20 10.2L14.2 12L12 21L9.8 12L4 10.2L9.8 8.4L12 3Z"
            fill="currentColor"
          />
          <path
            d="M12 6.5L13.4 9.9L16.8 11.1L13.4 12.3L12 17.2L10.6 12.3L7.2 11.1L10.6 9.9L12 6.5Z"
            fill="white"
            fillOpacity="0.25"
          />
        </svg>
      );
    case "flirty":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="M12 20.5C7.4 17.6 4 14.5 4 9.9C4 7.2 6 5.2 8.6 5.2C10.3 5.2 11.4 6 12 7.1C12.6 6 13.7 5.2 15.4 5.2C18 5.2 20 7.2 20 9.9C20 14.5 16.6 17.6 12 20.5Z"
            fill="currentColor"
          />
          <circle cx="9" cy="9" r="1" fill="white" fillOpacity="0.35" />
        </svg>
      );
    case "funny":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="currentColor" />
          <path
            d="M9 10.2C9.6 10.2 10 9.8 10 9.2C10 8.6 9.6 8.2 9 8.2C8.4 8.2 8 8.6 8 9.2C8 9.8 8.4 10.2 9 10.2Z"
            fill="#111318"
          />
          <path
            d="M15 10.2C15.6 10.2 16 9.8 16 9.2C16 8.6 15.6 8.2 15 8.2C14.4 8.2 14 8.6 14 9.2C14 9.8 14.4 10.2 15 10.2Z"
            fill="#111318"
          />
          <path
            d="M8.4 13.2C9.2 15.4 11.2 16.5 12.9 16.5C14.8 16.5 16.3 15.4 17 13.2"
            stroke="#111318"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "chill":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="M14.9 4.2C11 4.2 7.8 7.4 7.8 11.3C7.8 15.2 11 18.4 14.9 18.4C16.8 18.4 18.2 17.9 19.4 16.9C18.4 19.5 15.8 21.3 12.9 21.3C9 21.3 5.8 18.1 5.8 14.2C5.8 10.8 8.2 7.9 11.4 7.2C12.4 5.4 13.5 4.2 14.9 4.2Z"
            fill="currentColor"
          />
          <circle cx="16.8" cy="8" r="1.2" fill="white" fillOpacity="0.35" />
        </svg>
      );
    case "apologetic":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="M12 5C13 7.1 14.9 9 17 10C14.9 11 13 12.9 12 15C11 12.9 9.1 11 7 10C9.1 9 11 7.1 12 5Z"
            fill="currentColor"
          />
          <path
            d="M6.6 12.2C7.2 13.5 8.3 14.6 9.6 15.2C8.3 15.8 7.2 16.9 6.6 18.2C6 16.9 4.9 15.8 3.6 15.2C4.9 14.6 6 13.5 6.6 12.2Z"
            fill="currentColor"
            fillOpacity="0.75"
          />
          <path
            d="M17.4 12.2C18 13.5 19.1 14.6 20.4 15.2C19.1 15.8 18 16.9 17.4 18.2C16.8 16.9 15.7 15.8 14.4 15.2C15.7 14.6 16.8 13.5 17.4 12.2Z"
            fill="currentColor"
            fillOpacity="0.75"
          />
        </svg>
      );
  }
}

const tones: Array<{
  value: ToneKey;
  label: string;
  desc: string;
  chip: string;
  glow: string;
  button: string;
  buttonShadow: string;
  ring: string;
  bubble: string;
  panel: string;
  ambient: string;
  meter: string;
}> = [
  {
    value: "confident",
    label: "Confident",
    desc: "Clean, direct, strong",
    chip:
      "from-cyan-500/25 via-sky-400/20 to-blue-500/25 border-cyan-300/40 text-cyan-100",
    glow: "shadow-[0_0_28px_rgba(34,211,238,0.24)]",
    button: "from-cyan-500 via-sky-500 to-blue-600",
    buttonShadow: "shadow-[0_12px_40px_rgba(14,165,233,0.35)]",
    ring: "focus:border-cyan-400/40 focus:ring-cyan-500/20",
    bubble: "bg-cyan-400",
    panel: "border-cyan-400/35 bg-[linear-gradient(180deg,rgba(6,182,212,0.16),rgba(6,182,212,0.04))] shadow-[0_0_30px_rgba(34,211,238,0.2)]",
    ambient: "bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.18),transparent_42%)]",
    meter: "from-cyan-400 via-sky-400 to-blue-500",
  },
  {
    value: "flirty",
    label: "Flirty",
    desc: "Playful, teasing, magnetic",
    chip:
      "from-fuchsia-500/25 via-pink-400/20 to-rose-500/25 border-fuchsia-300/40 text-pink-100",
    glow: "shadow-[0_0_28px_rgba(236,72,153,0.26)]",
    button: "from-fuchsia-500 via-pink-500 to-rose-500",
    buttonShadow: "shadow-[0_12px_40px_rgba(236,72,153,0.35)]",
    ring: "focus:border-fuchsia-400/40 focus:ring-fuchsia-500/20",
    bubble: "bg-fuchsia-400",
    panel: "border-fuchsia-400/35 bg-[linear-gradient(180deg,rgba(217,70,239,0.16),rgba(217,70,239,0.04))] shadow-[0_0_30px_rgba(217,70,239,0.2)]",
    ambient: "bg-[radial-gradient(circle_at_50%_35%,rgba(236,72,153,0.18),transparent_42%)]",
    meter: "from-fuchsia-400 via-pink-400 to-rose-500",
  },
  {
    value: "funny",
    label: "Funny",
    desc: "Witty, clever, entertaining",
    chip:
      "from-amber-500/25 via-yellow-400/20 to-orange-500/25 border-amber-300/40 text-amber-50",
    glow: "shadow-[0_0_28px_rgba(245,158,11,0.24)]",
    button: "from-amber-400 via-yellow-400 to-orange-500",
    buttonShadow: "shadow-[0_12px_40px_rgba(245,158,11,0.35)]",
    ring: "focus:border-amber-400/40 focus:ring-amber-500/20",
    bubble: "bg-amber-400",
    panel: "border-amber-400/35 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(245,158,11,0.04))] shadow-[0_0_30px_rgba(245,158,11,0.18)]",
    ambient: "bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.18),transparent_42%)]",
    meter: "from-amber-300 via-yellow-400 to-orange-500",
  },
  {
    value: "chill",
    label: "Chill",
    desc: "Low-pressure, effortless",
    chip:
      "from-violet-500/25 via-indigo-400/20 to-blue-500/20 border-violet-300/40 text-violet-100",
    glow: "shadow-[0_0_28px_rgba(139,92,246,0.24)]",
    button: "from-violet-500 via-indigo-500 to-blue-500",
    buttonShadow: "shadow-[0_12px_40px_rgba(99,102,241,0.35)]",
    ring: "focus:border-violet-400/40 focus:ring-violet-500/20",
    bubble: "bg-violet-400",
    panel: "border-violet-400/35 bg-[linear-gradient(180deg,rgba(139,92,246,0.16),rgba(139,92,246,0.04))] shadow-[0_0_30px_rgba(139,92,246,0.18)]",
    ambient: "bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,0.18),transparent_42%)]",
    meter: "from-violet-300 via-indigo-400 to-blue-500",
  },
  {
    value: "apologetic",
    label: "Gentle",
    desc: "Soft, thoughtful, empathetic",
    chip:
      "from-slate-300/18 via-zinc-200/10 to-neutral-400/18 border-white/20 text-white/85",
    glow: "shadow-[0_0_24px_rgba(255,255,255,0.12)]",
    button: "from-slate-300 via-zinc-300 to-neutral-400",
    buttonShadow: "shadow-[0_12px_40px_rgba(212,212,216,0.22)]",
    ring: "focus:border-white/30 focus:ring-white/10",
    bubble: "bg-zinc-300",
    panel: "border-white/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] shadow-[0_0_30px_rgba(255,255,255,0.08)]",
    ambient: "bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_42%)]",
    meter: "from-zinc-200 via-slate-300 to-neutral-400",
  },
];

const goals: Array<{
  value: GoalKey;
  label: string;
}> = [
  { value: "restart", label: "Restart" },
  { value: "flirt", label: "Flirt" },
  { value: "clarify", label: "Clarify" },
  { value: "plan", label: "Plan" },
  { value: "repair", label: "Repair" },
];

const quickStartScenarios: Array<{
  label: string;
  tone: ToneKey;
  goal: GoalKey;
  conversation: string;
}> = [
  {
    label: "Restart after silence",
    tone: "chill",
    goal: "restart",
    conversation:
      "Them: hey sorry ive been off my phone lately\nYou: all good haha\nThem: hows your week been",
  },
  {
    label: "Turn it flirty",
    tone: "flirty",
    goal: "flirt",
    conversation:
      "Them: you always disappear when it gets interesting\nYou: maybe i like keeping you curious\nThem: is that so",
  },
  {
    label: "Lock in a plan",
    tone: "confident",
    goal: "plan",
    conversation:
      "Them: we should do something this week\nYou: im down\nThem: what did you have in mind",
  },
];

function ToneDropdown({
  value,
  onChange,
}: {
  value: ToneKey;
  onChange: (value: ToneKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selected = tones.find((tone) => tone.value === value) ?? tones[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const updateMenuDirection = () => {
    if (!wrapperRef.current || !menuRef.current) {
      return;
    }

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - wrapperRect.bottom;
    const spaceAbove = wrapperRect.top;

    setOpenUpward(spaceBelow < menuHeight + 24 && spaceAbove > spaceBelow);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) {
            updateMenuDirection();
          }

          setOpen((prev) => !prev);
        }}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left outline-none transition hover:border-white/20 focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-500/20"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br text-lg font-semibold ${selected.chip} ${selected.glow}`}
            >
              <span className="absolute inset-[3px] rounded-[14px] bg-white/6" />
              <ToneIcon
                tone={selected.value}
                className="relative drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]"
              />
            </div>

            <div className="min-w-0">
              <div className="mb-0.5 text-sm text-white/45">Tone Mode</div>
              <div className="truncate font-semibold text-white">
                {selected.label}
              </div>
              <div className="truncate text-xs text-white/45">
                {selected.desc}
              </div>
            </div>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform duration-200 ${
              open ? (openUpward ? "" : "rotate-180") : openUpward ? "rotate-180" : ""
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6.25L8 10L12 6.25"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </button>

      <div
        ref={menuRef}
        className={`absolute left-0 right-0 z-50 transition-all duration-300 ease-out ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        } ${
          openUpward
            ? open
              ? "bottom-[calc(100%+12px)] translate-y-0 scale-100"
              : "bottom-[calc(100%+12px)] translate-y-2 scale-[0.98]"
            : open
              ? "top-[calc(100%+12px)] translate-y-0 scale-100"
              : "top-[calc(100%+12px)] -translate-y-2 scale-[0.98]"
        }`}
        style={{ transformOrigin: openUpward ? "bottom center" : "top center" }}
      >
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,18,24,0.98),rgba(10,12,17,0.96))] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                Pick the vibe
              </div>
              <div className="mt-1 text-sm font-medium text-white/75">
                Match the energy before you send
              </div>
            </div>
            <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-200 text-center min-w-[44px]">
              Modes
            </div>
          </div>

          <div className="grid max-h-[min(360px,calc(100vh-120px))] gap-2 overflow-y-auto pr-1">
            {tones.map((tone: (typeof tones)[number]) => {
              const isActive = tone.value === value;

              return (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => {
                    onChange(tone.value);
                    setOpen(false);
                  }}
                  className={`group rounded-2xl border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-fuchsia-400/30 bg-[linear-gradient(135deg,rgba(217,70,239,0.12),rgba(34,211,238,0.08))] shadow-[0_0_30px_rgba(217,70,239,0.08)]"
                      : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br text-lg font-semibold ${tone.chip} ${tone.glow}`}
                    >
                      <span className="absolute inset-[3px] rounded-[14px] bg-white/6" />
                      <ToneIcon
                        tone={tone.value}
                        className="relative drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {tone.label}
                        </span>
                        {isActive && (
                          <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-fuchsia-200">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 text-sm text-white/45">
                        {tone.desc}
                      </div>
                    </div>

                    <div
                      className={`text-sm transition ${
                        isActive
                          ? "text-fuchsia-200"
                          : "text-white/20 group-hover:text-white/40"
                      }`}
                    >
                      {"->"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isSignedIn, authEnabled } = useAppAuth();

  // Photo reply modal state (must be inside the component)
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalImage, setPhotoModalImage] = useState<string | null>(null);
  const [photoModalText, setPhotoModalText] = useState("");
  const [photoModalLoading, setPhotoModalLoading] = useState(false);
  const [screenshotParsing, setScreenshotParsing] = useState(false);
  const [conversation, setConversation] = useState(DEFAULT_DRAFT.conversation);
  const [tone, setTone] = useState<ToneKey>(DEFAULT_DRAFT.tone);
  const [goal, setGoal] = useState<GoalKey>(DEFAULT_DRAFT.goal);
  const [userContext, setUserContext] = useState(DEFAULT_DRAFT.userContext);
  const [profileName, setProfileName] = useState(DEFAULT_DRAFT.profileName);
  const [relationshipNotes, setRelationshipNotes] = useState(
    DEFAULT_DRAFT.relationshipNotes,
  );
  const [personaCalibration, setPersonaCalibration] = useState(
    DEFAULT_DRAFT.personaCalibration,
  );
  const [screenshotSummary, setScreenshotSummary] = useState(
    DEFAULT_DRAFT.screenshotSummary,
  );
  const [replies, setReplies] = useState<Reply[]>([]);
  const [bestIndex, setBestIndex] = useState<number | null>(null);
  const [sentReplyIndex, setSentReplyIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [visibleReplyCount, setVisibleReplyCount] = useState(0);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [showThreadForm, setShowThreadForm] = useState(false);
  const [threadName, setThreadName] = useState("");
  const [dictationTarget, setDictationTarget] =
    useState<DictationTarget | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcribingVoiceNote, setTranscribingVoiceNote] = useState(false);
  const [voiceNoteSpeaker, setVoiceNoteSpeaker] = useState<"You" | "Them">(
    "Them",
  );
  const [savedPersonas, setSavedPersonas] = useState<SavedPersona[]>([]);
  const [usageSnapshot, setUsageSnapshot] = useState<UsageSnapshot>(
    DEFAULT_USAGE_SNAPSHOT,
  );
  const [cloudSyncState, setCloudSyncState] = useState<
    "idle" | "syncing" | "synced" | "error"
  >("idle");
  const [cloudSyncMessage, setCloudSyncMessage] = useState(
    "Sign in to sync threads and personas across devices.",
  );

  // MVP Features - using custom hook
  const mvpFeatures = useMVPFeatures(threads);

  // Keep a stable ref to handleGenerate for event-driven auto-regen
  const handleGenerateRef = useRef<() => void>(() => {});
  
  const selectedTone = tones.find((item) => item.value === tone) ?? tones[0];
  const bestReply = bestIndex !== null ? replies[bestIndex] : null;
  const currentThread = threads.find((t) => t.id === currentThreadId);
  const currentThreadInsight = useMemo(
    () => (currentThread ? buildThreadStrategyInsight(currentThread) : null),
    [currentThread],
  );
  const isDeepConversation =
    conversation.split("\n").filter((line: string) => line.trim()).length > 16 ||
    conversation.length > 2200;
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const cloudRestoreAttemptedRef = useRef(false);
  const checkoutHandledRef = useRef(false);

  const interestLabel = useMemo(() => {
    if (!replies.length || bestIndex === null) return null;

    const score = replies[bestIndex]?.scores.responseChance ?? 0;

    if (score >= 8) return { text: "High interest", color: "text-green-300" };
    if (score >= 6) return { text: "Still warm", color: "text-yellow-300" };
    return { text: "Needs recovery", color: "text-red-300" };
  }, [replies, bestIndex]);

  const heatMeterWidth = useMemo(() => {
    if (!replies.length || bestIndex === null) return 0;
    return (replies[bestIndex]?.scores.responseChance ?? 0) * 10;
  }, [replies, bestIndex]);

  const liveStatus = useMemo(() => {
    if (loading) {
      return {
        label: "Analyzing",
        detail: "Reading tone and shaping options",
        dot: "bg-amber-400",
      };
    }

    if (error) {
      return {
        label: "Recovery",
        detail: "Waiting for a clean generation pass",
        dot: "bg-red-400",
      };
    }

    if (bestReply) {
      return {
        label: "Ready",
        detail: "Best reply is staged and copyable",
        dot: "bg-emerald-400",
      };
    }

    return {
      label: "Idle",
      detail: "Waiting for a conversation to score",
      dot: "bg-white/60",
    };
  }, [bestReply, error, loading]);

  const pulseMetrics = useMemo(() => {
    const confidence = bestReply?.scores.confidence ?? 0;
    const responseChance = bestReply?.scores.responseChance ?? 0;

    return {
      toneLabel: selectedTone.label,
      confidenceLabel: confidence ? `${confidence}/10` : "--",
      energyLabel: responseChance ? `${responseChance * 10}%` : "--",
    };
  }, [bestReply, selectedTone.label]);

  const fakeChatPreview = useMemo(() => {
    return conversation
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .slice(-4);
  }, [conversation]);

  const memoryPrimer = useMemo(
    () =>
      buildMemoryPrimer(
        threads,
        currentThreadId,
        mvpFeatures.favorites,
        mvpFeatures.replyRatings,
      ),
    [threads, currentThreadId, mvpFeatures.favorites, mvpFeatures.replyRatings],
  );

  const outcomeCoach = useMemo(
    () => getOutcomeCoach(currentThread?.lastOutcome),
    [currentThread?.lastOutcome],
  );
  const isPro = usageSnapshot.planTier === "pro";

  const consumeProductAction = (action: UsageAction) => {
    const result = consumeUsageAction(action);
    setUsageSnapshot(result.snapshot);

    if (!result.allowed) {
      setError(result.message || "Daily limit reached.");
      return false;
    }

    return true;
  };

  const applyQuickStart = (scenario: (typeof quickStartScenarios)[number]) => {
    if (tone !== scenario.tone) {
      trackToneChange(tone, scenario.tone);
    }

    setConversation(scenario.conversation);
    setTone(scenario.tone);
    setGoal(scenario.goal);
    setReplies([]);
    setBestIndex(null);
    setAnalysis(null);
    setSentReplyIndex(null);
    setError(null);
    setSystemNotice(`Loaded ${scenario.label.toLowerCase()} starter.`);
  };

  const saveCurrentPersona = () => {
    if (
      !profileName.trim() &&
      !personaCalibration.trim() &&
      !relationshipNotes.trim()
    ) {
      setError("Add a label or some memory notes before saving a persona.");
      return;
    }

    const updated = savePersonaDraft({
      profileName,
      voice: personaCalibration,
      notes: relationshipNotes,
    });

    setSavedPersonas(updated);
    setError(null);
    setSystemNotice("Persona saved locally for one-tap reuse.");
  };

  const applySavedPersona = (persona: SavedPersona) => {
    setProfileName(persona.profileName || persona.name);
    setPersonaCalibration(persona.voice);
    setRelationshipNotes(persona.notes);
    setSavedPersonas(touchPersona(persona.id));
    setSystemNotice(`Loaded ${persona.name} into your memory fields.`);
  };

  const syncCloudHistory = async () => {
    if (!isSignedIn) {
      setCloudSyncState("error");
      setCloudSyncMessage("Sign in to unlock cloud sync across devices.");
      setSystemNotice("Sign in to sync threads across devices.");
      return;
    }

    setCloudSyncState("syncing");
    setCloudSyncMessage("Syncing your threads and saved personas...");

    try {
      const pullRes = await fetchWithTimeout(
        "/api/cloud-sync",
        {
          method: "GET",
        },
        12_000,
      );

      const pullData = (await pullRes.json()) as {
        threads?: Thread[];
        personas?: SavedPersona[];
        planTier?: "free" | "pro";
        error?: string;
      };

      if (!pullRes.ok) {
        throw new Error(pullData.error || "Failed to load cloud history.");
      }

      const mergedThreads = mergeThreads(
        threads,
        Array.isArray(pullData.threads) ? pullData.threads : [],
      );
      const mergedPersonas = mergeSavedPersonas(
        savedPersonas,
        Array.isArray(pullData.personas) ? pullData.personas : [],
      );

      setThreads(mergedThreads);
      setSavedPersonas(mergedPersonas);

      if (pullData.planTier === "pro") {
        setUsageSnapshot(setStoredPlanTier("pro"));
      }

      const pushRes = await fetchWithTimeout(
        "/api/cloud-sync",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threads: mergedThreads,
            personas: mergedPersonas,
          }),
        },
        15_000,
      );

      const pushData = (await pushRes.json()) as {
        error?: string;
        threadCount?: number;
        personaCount?: number;
        storageMode?: string;
        planTier?: "free" | "pro";
      };

      if (!pushRes.ok) {
        throw new Error(pushData.error || "Failed to save cloud history.");
      }

      if (pushData.planTier === "pro") {
        setUsageSnapshot(setStoredPlanTier("pro"));
      }

      setCloudSyncState("synced");
      setCloudSyncMessage(
        `Synced ${pushData.threadCount ?? mergedThreads.length} threads and ${pushData.personaCount ?? mergedPersonas.length} personas (${pushData.storageMode ?? "ready"}).`,
      );
    } catch (caughtError) {
      setCloudSyncState("error");
      setCloudSyncMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Cloud sync failed.",
      );
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      cloudRestoreAttemptedRef.current = false;
      return;
    }

    if (cloudRestoreAttemptedRef.current) {
      return;
    }

    cloudRestoreAttemptedRef.current = true;

    let isCancelled = false;

    void (async () => {
      try {
        const res = await fetchWithTimeout(
          "/api/cloud-sync",
          {
            method: "GET",
          },
          10_000,
        );

        const data = (await res.json()) as {
          threads?: Thread[];
          personas?: SavedPersona[];
          planTier?: "free" | "pro";
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load cloud history.");
        }

        if (isCancelled) {
          return;
        }

        const remoteThreads = Array.isArray(data.threads) ? data.threads : [];
        const remotePersonas = Array.isArray(data.personas) ? data.personas : [];

        setThreads((current) => mergeThreads(current, remoteThreads));
        setSavedPersonas((current) => mergeSavedPersonas(current, remotePersonas));

        if (data.planTier === "pro") {
          setUsageSnapshot(setStoredPlanTier("pro"));
        }

        setCloudSyncState(remoteThreads.length || remotePersonas.length ? "synced" : "idle");
        setCloudSyncMessage(
          remoteThreads.length || remotePersonas.length
            ? `Loaded ${remoteThreads.length} cloud thread${remoteThreads.length === 1 ? "" : "s"} for this account.`
            : "Cloud sync is ready for this account.",
        );
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setCloudSyncState("error");
        setCloudSyncMessage(
          caughtError instanceof Error
            ? caughtError.message
            : "Cloud sync is unavailable right now.",
        );
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (typeof window === "undefined" || checkoutHandledRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");

    if (!checkoutState) {
      return;
    }

    checkoutHandledRef.current = true;

    const clearCheckoutState = () => {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}` || "/");
    };

    if (checkoutState === "cancelled") {
      setSystemNotice("Checkout cancelled. You can stay on Free and upgrade any time.");
      clearCheckoutState();
      return;
    }

    let cancelled = false;
    const sessionId = params.get("session_id");

    void (async () => {
      try {
        if (checkoutState === "success" && sessionId) {
          const res = await fetchWithTimeout(
            `/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`,
            {
              method: "GET",
            },
            12_000,
          );

          const data = (await res.json()) as {
            verified?: boolean;
            planTier?: "free" | "pro";
            error?: string;
          };

          if (!res.ok) {
            throw new Error(data.error || "Unable to verify your upgrade yet.");
          }

          if (cancelled) {
            return;
          }

          if (data.verified) {
            setUsageSnapshot(setStoredPlanTier("pro"));
            setCloudSyncState("synced");
            setCloudSyncMessage(
              isSignedIn
                ? "Rizzly Pro is active for this account."
                : "Rizzly Pro is active on this device.",
            );
            setSystemNotice("You're upgraded to Rizzly Pro. Higher limits and Pro tools are now live.");
          } else {
            setSystemNotice("Checkout completed. Your plan update is still being confirmed.");
          }
        } else if (checkoutState === "success") {
          setUsageSnapshot(setStoredPlanTier("pro"));
          setSystemNotice("You're upgraded to Rizzly Pro. Higher limits and Pro tools are now live.");
        }
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setUsageSnapshot(setStoredPlanTier("pro"));
        setSystemNotice(
          caughtError instanceof Error
            ? `${caughtError.message} Pro tools have been unlocked on this device.`
            : "You're upgraded to Rizzly Pro. Higher limits are now live.",
        );
      } finally {
        clearCheckoutState();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const billingState = params.get("billing");

    if (billingState === "portal") {
      setSystemNotice("Billing settings updated. Your Rizzly Pro access is still active.");
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}` || "/");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        conversation,
        tone,
        goal,
        userContext,
        profileName,
        relationshipNotes,
        personaCalibration,
        screenshotSummary,
      }),
    );
  }, [
    conversation,
    goal,
    tone,
    userContext,
    profileName,
    relationshipNotes,
    personaCalibration,
    screenshotSummary,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const data = JSON.stringify(threads);
      // Warn and prune if approaching 4MB (localStorage limit is ~5MB)
      if (data.length > 4_000_000 && threads.length > 5) {
        const pruned = threads.slice(0, Math.max(5, Math.floor(threads.length * 0.75)));
        window.localStorage.setItem(THREADS_KEY, JSON.stringify(pruned));
        console.warn(`[Rizzly] Pruned threads from ${threads.length} to ${pruned.length} to stay under localStorage quota.`);
      } else {
        window.localStorage.setItem(THREADS_KEY, data);
      }
    } catch (e) {
      console.error("[Rizzly] Failed to save threads to localStorage:", e);
    }
  }, [threads]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentThreadId) {
      return;
    }

    window.localStorage.setItem(CURRENT_THREAD_KEY, currentThreadId);
  }, [currentThreadId]);

  useEffect(() => {
    if (!currentThreadId) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              profileName: profileName.trim(),
              relationshipNotes: relationshipNotes.trim(),
              personaCalibration: personaCalibration.trim(),
              screenshotSummary: screenshotSummary.trim(),
              category: mvpFeatures.category,
              privacyMode: "local-only",
            }
          : thread,
      ),
    );
  }, [
    currentThreadId,
    profileName,
    relationshipNotes,
    personaCalibration,
    screenshotSummary,
    mvpFeatures.category,
  ]);

  useEffect(() => {
    const draft = loadDraft();

    queueMicrotask(() => {
      setConversation(draft.conversation);
      setTone(draft.tone);
      setGoal(draft.goal);
      setUserContext(draft.userContext);
      setProfileName(draft.profileName);
      setRelationshipNotes(draft.relationshipNotes);
      setPersonaCalibration(draft.personaCalibration);
      setScreenshotSummary(draft.screenshotSummary);
      setThreads(loadThreads());
      setCurrentThreadId(loadCurrentThreadId());
      setVoiceSupported(detectVoiceSupport());
      setSavedPersonas(readSavedPersonas());
      setUsageSnapshot(getUsageSnapshot());
    });
  }, []);

  // Keyboard shortcuts (1-5 for tones, Ctrl+Enter to generate, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-5 for tone selection
      if (e.key >= "1" && e.key <= "5") {
        const toneArray: ToneKey[] = ["confident", "flirty", "funny", "chill", "apologetic"];
        const index = parseInt(e.key) - 1;
        if (index < toneArray.length) {
          setTone(toneArray[index]);
          e.preventDefault();
        }
      }

      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerateRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!replies.length) {
      return;
    }

    const timers = replies.map((_: Reply, index: number) =>
      window.setTimeout(() => {
        setVisibleReplyCount((current: number) => Math.max(current, index + 1));
      }, 90 * (index + 1)),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [replies]);

  useEffect(() => {
    if (!analysis) {
      setAnalysisVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setAnalysisVisible(true);
    }, 140);

    return () => {
      window.clearTimeout(timer);
    };
  }, [analysis]);

  useEffect(() => {
    if (bestIndex === null || !replies[bestIndex]) {
      setPreviewVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setPreviewVisible(true);
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [bestIndex, replies]);

  const appendTextToTarget = (target: DictationTarget, text: string) => {
    const cleaned = text.trim();

    if (!cleaned) {
      return;
    }

    if (target === "conversation") {
      setConversation((current: string) =>
        current.trim() ? `${current.trim()}\n${cleaned}` : cleaned,
      );
      return;
    }

    setUserContext((current: string) =>
      current.trim() ? `${current.trim()} ${cleaned}` : cleaned,
    );
  };

  const startDictation = (target: DictationTarget) => {
    if (typeof window === "undefined") {
      return;
    }

    const recognitionCtor = (
      window as Window & {
        SpeechRecognition?: BrowserSpeechRecognitionCtor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
      }
    ).SpeechRecognition ??
      (
        window as Window & {
          webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
        }
      ).webkitSpeechRecognition;

    if (!recognitionCtor) {
      setError("Voice dictation is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setDictationTarget(null);
      return;
    }

    const recognition = new recognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result: ArrayLike<{ transcript: string }>) => result[0]?.transcript ?? "")
        .join(" ");

      appendTextToTarget(target, transcript);
    };
    recognition.onerror = (event) => {
      setError(`Voice dictation failed: ${event.error}.`);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setDictationTarget(null);
    };

    recognitionRef.current = recognition;
    setError(null);
    setDictationTarget(target);
    recognition.start();
  };

  const promptSignIn = (message: string) => {
    setError(message);
    if (typeof window !== "undefined") {
      const isNonCanonicalHost = window.location.hostname.endsWith(".vercel.app");

      window.location.href = isNonCanonicalHost
        ? "https://rizzlyai.com/sign-in"
        : "/sign-in";
    }
  };

  const handleVoiceNoteUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isSignedIn) {
      promptSignIn("Sign in to transcribe voice notes.");
      event.target.value = "";
      return;
    }

    if (!consumeProductAction("voice")) {
      event.target.value = "";
      return;
    }

    setTranscribingVoiceNote(true);
    setError(null);
    setSystemNotice(null);
    trackVoiceNote(Math.max(1, Math.round(file.size / 16_000)));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("speaker", voiceNoteSpeaker);

      const res = await fetchWithTimeout(
        "/api/transcribe-voice-note",
        {
          method: "POST",
          body: formData,
        },
        25_000,
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to transcribe voice note.");
      }

      setConversation((current: string) =>
        current.trim()
          ? `${current.trim()}\n${data.conversationLine}`
          : data.conversationLine,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.name === "AbortError"
            ? "Voice-note transcription timed out. Try a shorter file or retry."
            : caughtError.message
          : "Failed to transcribe voice note.",
      );
    } finally {
      setTranscribingVoiceNote(false);
      event.target.value = "";
    }
  };

  const handleScreenshotUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isSignedIn) {
      promptSignIn("Sign in to import screenshots.");
      event.target.value = "";
      return;
    }

    if (!consumeProductAction("screenshot")) {
      event.target.value = "";
      return;
    }

    setScreenshotParsing(true);
    setError(null);
    setSystemNotice(null);

    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const result = loadEvent.target?.result;

          if (typeof result === "string") {
            resolve(result);
            return;
          }

          reject(new Error("Failed to read screenshot."));
        };
        reader.onerror = () => reject(new Error("Failed to read screenshot."));
        reader.readAsDataURL(file);
      });

      const res = await fetchWithTimeout(
        "/api/parse-screenshot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageDataUrl }),
        },
        25_000,
      );

      const data = (await res.json()) as ScreenshotParseResult & { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse screenshot.");
      }

      if (Array.isArray(data.transcriptLines) && data.transcriptLines.length > 0) {
        setConversation(data.transcriptLines.join("\n"));
        trackScreenshotUpload(data.transcriptLines.length);
      }

      if (data.suggestedGoal) {
        setGoal(data.suggestedGoal);
      }

      if (data.suggestedProfileName && !profileName.trim()) {
        setProfileName(data.suggestedProfileName);
      }

      if (data.relationshipNotes) {
        setRelationshipNotes((current: string) =>
          current.trim()
            ? `${current.trim()}\n${data.relationshipNotes}`
            : data.relationshipNotes,
        );
      }

      if (data.personaHint) {
        setPersonaCalibration((current: string) =>
          current.trim() ? current : data.personaHint,
        );
      }

      setScreenshotSummary(data.summary || "Screenshot imported and parsed.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.name === "AbortError"
            ? "Screenshot parsing timed out. Try a clearer crop or retry."
            : caughtError.message
          : "Failed to parse screenshot.",
      );
    } finally {
      setScreenshotParsing(false);
      event.target.value = "";
    }
  };

  const updateThreadOutcome = (outcome: OutcomeStatus) => {
    if (!currentThreadId) {
      return;
    }
    trackOutcome(outcome);
    setSystemNotice(getOutcomeCoach(outcome).nextStep);

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== currentThreadId || thread.turns.length === 0) {
          return thread;
        }

        const turns = [...thread.turns];
        const lastTurn = turns[turns.length - 1];
        turns[turns.length - 1] = {
          ...lastTurn,
          outcomeStatus: outcome,
          outcomeUpdatedAt: Date.now(),
          gotResponse: outcome === "warm" || outcome === "neutral",
        };

        return {
          ...thread,
          turns,
          lastOutcome: outcome,
          updatedAt: Date.now(),
          summary: generateThreadSummary(turns),
          successCount: turns.filter((item) => item.gotResponse).length,
          totalTurns: turns.length,
        };
      }),
    );
  };

  const createThread = (name: string) => {
    trackThreadCreated();
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      name: name.trim() || "Untitled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turns: [],
      summary: "",
      category: mvpFeatures.category,
      profileName: profileName.trim(),
      relationshipNotes: relationshipNotes.trim(),
      personaCalibration: personaCalibration.trim(),
      screenshotSummary: screenshotSummary.trim(),
      privacyMode: "local-only",
    };

    setThreads((prev) => [newThread, ...prev]);
    setCurrentThreadId(newThread.id);
    setConversation("");
    setTone("confident");
    setGoal("restart");
    setUserContext("");
    setProfileName("");
    setRelationshipNotes("");
    setPersonaCalibration("");
    setScreenshotSummary("");
    setReplies([]);
    setBestIndex(null);
    setAnalysis(null);
    setSentReplyIndex(null);
    setShowThreadForm(false);
    setThreadName("");
    setError(null);
    setSystemNotice(null);
  };

  const loadThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    setCurrentThreadId(threadId);
    mvpFeatures.setCategory(thread.category || "other");
    const lastTurn = thread.turns[thread.turns.length - 1];

    if (lastTurn) {
      setConversation(lastTurn.userMessage);
      setTone(lastTurn.tone);
      setGoal(lastTurn.goal);
      setUserContext(lastTurn.userContext);
      setProfileName(thread.profileName || "");
      setRelationshipNotes(
        lastTurn.relationshipNotesSnapshot || thread.relationshipNotes || "",
      );
      setPersonaCalibration(
        lastTurn.personaCalibrationSnapshot || thread.personaCalibration || "",
      );
      setScreenshotSummary(
        lastTurn.screenshotSummary || thread.screenshotSummary || "",
      );
      setAnalysis(lastTurn.analysis);
      setReplies(lastTurn.replies);
      setBestIndex(lastTurn.bestIndex);
      setVisibleReplyCount(lastTurn.replies.length);
      setAnalysisVisible(Boolean(lastTurn.analysis));
      setPreviewVisible(Boolean(lastTurn.bestIndex !== null && lastTurn.replies.length));
    } else {
      setConversation("");
      setTone("confident");
      setGoal("restart");
      setUserContext("");
      setProfileName(thread.profileName || "");
      setRelationshipNotes(thread.relationshipNotes || "");
      setPersonaCalibration(thread.personaCalibration || "");
      setScreenshotSummary(thread.screenshotSummary || "");
      setReplies([]);
      setBestIndex(null);
      setAnalysis(null);
    }

    setSentReplyIndex(null);
    setError(null);
    setSystemNotice(null);
  };

  const appendTurn = (turn: ThreadTurn) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === currentThreadId) {
          const updatedTurns = [...thread.turns, turn];
          const summary = generateThreadSummary(updatedTurns);
          const successCount = updatedTurns.filter((item) => item.gotResponse).length;

          return {
            ...thread,
            turns: updatedTurns,
            updatedAt: Date.now(),
            summary,
            successCount,
            totalTurns: updatedTurns.length,
          };
        }

        return thread;
      }),
    );
  };

  const handleGenerate = async () => {
    if (!conversation.trim()) return;

    if (!consumeProductAction("generate")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSystemNotice(
      !isSignedIn
        ? authEnabled
          ? "Guest mode is active. Core replies are ready now — sign in later for saved history and media tools."
          : "Local guest mode is active. Core reply features still work while auth is unavailable here."
        : null,
    );
    setVisibleReplyCount(0);
    setAnalysisVisible(false);
    setPreviewVisible(false);
    setSentReplyIndex(null);

    try {
      const threadSummary = currentThread?.summary || "";

      const res = await fetchWithTimeout(
        "/api/generate-reply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation,
            tone,
            goal,
            userContext,
            profileName,
            relationshipNotes,
            personaCalibration,
            screenshotSummary,
            recentOutcome: currentThread?.lastOutcome || "",
            threadSummary,
            memoryPrimer,
            category: mvpFeatures.category,
            toneIntensity: mvpFeatures.toneIntensity,
            bulkCount: mvpFeatures.bulkCount,
          }),
        },
        25_000,
      );

      const data = (await res.json()) as GenerateReplyResponse;

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate replies.");
      }

      setReplies(data.replies || []);
      setBestIndex(data.bestIndex ?? null);
      setAnalysis(data.analysis || null);
      if (data.warning) {
        setSystemNotice(data.warning);
      }
      mvpFeatures.trackToneUsage(tone);
      trackGenerate(tone, goal, mvpFeatures.category, mvpFeatures.bulkCount);

      // Create new thread if none is selected
      if (!currentThreadId) {
        const newThread: Thread = {
          id: `thread-${Date.now()}`,
          name: `Chat on ${new Date().toLocaleDateString()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          turns: [],
          summary: "",
          category: mvpFeatures.category,
          profileName: profileName.trim(),
          relationshipNotes: relationshipNotes.trim(),
          personaCalibration: personaCalibration.trim(),
          screenshotSummary: screenshotSummary.trim(),
          privacyMode: "local-only",
        };

        setThreads((prev) => [newThread, ...prev]);
        setCurrentThreadId(newThread.id);

        // Append turn to new thread
        const turn: ThreadTurn = {
          id: `turn-${Date.now()}`,
          createdAt: Date.now(),
          userMessage: conversation,
          tone,
          goal,
          userContext,
          category: mvpFeatures.category,
          toneIntensity: mvpFeatures.toneIntensity,
          screenshotSummary,
          relationshipNotesSnapshot: relationshipNotes,
          personaCalibrationSnapshot: personaCalibration,
          analysis: data.analysis || null,
          replies: data.replies || [],
          bestIndex: data.bestIndex ?? null,
        };

        setThreads((prev) =>
          prev.map((thread) => {
            if (thread.id === newThread.id) {
              const updatedTurns = [...thread.turns, turn];
              const summary = generateThreadSummary(updatedTurns);

              return {
                ...thread,
                turns: updatedTurns,
                updatedAt: Date.now(),
                summary,
                successCount: updatedTurns.filter((item) => item.gotResponse).length,
                totalTurns: updatedTurns.length,
              };
            }

            return thread;
          }),
        );
      } else {
        // Append turn to existing thread
        const turn: ThreadTurn = {
          id: `turn-${Date.now()}`,
          createdAt: Date.now(),
          userMessage: conversation,
          tone,
          goal,
          userContext,
          category: mvpFeatures.category,
          toneIntensity: mvpFeatures.toneIntensity,
          screenshotSummary,
          relationshipNotesSnapshot: relationshipNotes,
          personaCalibrationSnapshot: personaCalibration,
          analysis: data.analysis || null,
          replies: data.replies || [],
          bestIndex: data.bestIndex ?? null,
        };

        appendTurn(turn);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.name === "AbortError"
            ? "Reply generation timed out. Rizzly kept your context, so you can retry safely."
            : caughtError.message
          : "Failed to generate replies.";

      setReplies([]);
      setBestIndex(null);
      setAnalysis(null);
      setError(message);
      trackError("generate", message);
    } finally {
      setLoading(false);
    }
  };

  // Keep ref current for event-driven calls
  handleGenerateRef.current = handleGenerate;

  // Listen for auto-regen events from tone-change buttons
  useEffect(() => {
    const handler = () => { handleGenerateRef.current(); };
    window.addEventListener("auto-regen", handler);
    return () => window.removeEventListener("auto-regen", handler);
  }, []);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      trackCopy(index);
      setTimeout(() => setCopiedIndex(null), 1400);
    } catch (caughtError) {
      console.error("Copy failed:", caughtError);
    }
  };

  const markReplySent = (index: number, reply: Reply) => {
    setSentReplyIndex(index);
    trackSend(index);

    if (currentThreadId) {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== currentThreadId) {
            return thread;
          }

          const turns = [...thread.turns];
          const lastTurn = turns.at(-1);
          const shouldPatchLastTurn =
            lastTurn &&
            lastTurn.userMessage === conversation &&
            lastTurn.tone === tone &&
            lastTurn.goal === goal &&
            !lastTurn.chosenReply;

          if (shouldPatchLastTurn && lastTurn) {
            turns[turns.length - 1] = {
              ...lastTurn,
              chosenReply: reply.text,
              screenshotSummary,
              relationshipNotesSnapshot: relationshipNotes,
              personaCalibrationSnapshot: personaCalibration,
            };
          } else {
            turns.push({
              id: `turn-${Date.now()}`,
              createdAt: Date.now(),
              userMessage: conversation,
              tone,
              goal,
              userContext,
              category: mvpFeatures.category,
              toneIntensity: mvpFeatures.toneIntensity,
              screenshotSummary,
              relationshipNotesSnapshot: relationshipNotes,
              personaCalibrationSnapshot: personaCalibration,
              analysis,
              replies,
              bestIndex,
              chosenReply: reply.text,
            });
          }

          return {
            ...thread,
            turns,
            updatedAt: Date.now(),
            summary: generateThreadSummary(turns),
            successCount: turns.filter((item) => item.gotResponse).length,
            totalTurns: turns.length,
          };
        }),
      );
    }

    setConversation("");
    setReplies([]);
    setBestIndex(null);
    setAnalysis(null);
    setVisibleReplyCount(0);
    setAnalysisVisible(false);
    setPreviewVisible(false);
    setSystemNotice("Reply saved. When they answer, tag the outcome so Rizzly can adapt the next move.");
  };

  const deleteThread = (threadId: string) => {
    trackThreadDeleted();
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (currentThreadId === threadId) {
      setCurrentThreadId(null);
      setConversation("");
      setReplies([]);
      setBestIndex(null);
      setAnalysis(null);
      setSentReplyIndex(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#1a0f2e] text-white">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(30px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes subtle-sway {
          0%, 100% { transform: translateX(0px) rotate(0deg); }
          50% { transform: translateX(1px) rotate(0.5deg); }
        }
        @keyframes shine {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .float-1 { animation: float 8s ease-in-out infinite; }
        .float-2 { animation: float 10s ease-in-out infinite 1s; }
        .float-3 { animation: float 9s ease-in-out infinite 2s; }
        .drift { animation: drift 12s ease-in-out infinite; }
        .glow-pulse { animation: glow-pulse 4s ease-in-out infinite; }
        .subtle-sway { animation: subtle-sway 3s ease-in-out infinite; }
        .shine { animation: shine 3s ease-in-out infinite; }
        @keyframes smooth-scale {
          from { transform: scale(0.98); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.25)) drop-shadow(0 0 12px rgba(236, 72, 153, 0.12)); }
          50% { filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.4)) drop-shadow(0 0 18px rgba(236, 72, 153, 0.2)); }
        }
        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-2px); opacity: 1; }
        }
        .logo-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .typing-dot { animation: typing-bounce 1.4s ease-in-out infinite; }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(217,70,239,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.06),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.04),transparent_60%)]" />
      <div className="pointer-events-none absolute top-10 left-10 h-96 w-96 rounded-full bg-gradient-to-br from-rose-500/12 to-pink-600/6 blur-3xl float-1" style={{ filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute top-1/3 right-20 h-80 w-80 rounded-full bg-gradient-to-br from-fuchsia-500/10 to-violet-600/6 blur-3xl float-2" style={{ filter: "blur(70px)" }} />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-violet-500/8 to-purple-600/4 blur-3xl float-3 drift" style={{ filter: "blur(75px)" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-pink-500/5 to-rose-600/3 blur-3xl float-1" style={{ filter: "blur(85px)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] [background-image:linear-gradient(rgba(236,72,153,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.4)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-rose-500/3 via-pink-500/1 to-transparent" />
      <div className="pointer-events-none absolute -top-1/2 -right-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-bl from-fuchsia-400/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-1/4 -left-1/2 h-1/2 w-1/2 rounded-full bg-gradient-to-tr from-violet-400/4 to-transparent blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-8 flex items-center justify-center gap-4 md:mb-10 md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-rose-500/12 blur-lg" style={{ animationDuration: "4s" }} />
              <div className="relative rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-black/80 to-black/60 p-2 shadow-[0_8px_24px_rgba(236,72,153,0.15)] backdrop-blur-md">
                <svg width="64" height="64" viewBox="0 0 64 64" className="logo-glow" fill="none">
                  <rect x="10" y="14" width="24" height="22" rx="5" ry="5" stroke="#d946a6" strokeWidth="2.5" fill="none" />
                  <polygon points="18,36 14,42 22,36" fill="#d946a6" />
                  <rect x="28" y="22" width="26" height="22" rx="5" ry="5" stroke="#06b6d4" strokeWidth="2.5" fill="none" />
                  <polygon points="46,44 50,50 42,44" fill="#06b6d4" />
                  <circle cx="16" cy="25" r="1.8" fill="#d946a6" opacity="0.9" className="typing-dot" style={{ animationDelay: "0s" }} />
                  <circle cx="22" cy="25" r="1.8" fill="#d946a6" opacity="0.9" className="typing-dot" style={{ animationDelay: "0.2s" }} />
                  <circle cx="28" cy="25" r="1.8" fill="#d946a6" opacity="0.9" className="typing-dot" style={{ animationDelay: "0.4s" }} />
                  <circle cx="35" cy="33" r="1.8" fill="#06b6d4" opacity="0.9" className="typing-dot" style={{ animationDelay: "0s" }} />
                  <circle cx="41" cy="33" r="1.8" fill="#06b6d4" opacity="0.9" className="typing-dot" style={{ animationDelay: "0.2s" }} />
                  <circle cx="47" cy="33" r="1.8" fill="#06b6d4" opacity="0.9" className="typing-dot" style={{ animationDelay: "0.4s" }} />
                </svg>
              </div>
            </div>

            <div>
              <div className="bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-300 bg-clip-text text-xs font-bold uppercase tracking-[0.3em] text-transparent opacity-80">
                Rizzly
              </div>
              <div className="shine mt-1 bg-gradient-to-r from-white via-rose-100 to-cyan-200 bg-clip-text text-lg font-black text-transparent md:text-xl" style={{ animationDuration: "4s" }}>
                Reply smarter
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-gradient-to-r from-emerald-500/8 to-emerald-500/3 px-3.5 py-2 text-xs font-medium text-emerald-300 backdrop-blur-md" style={{ opacity: 0.7 }}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
        </header>

        <MVPHeader
          streak={mvpFeatures.streak}
          achievements={mvpFeatures.achievements}
          showDashboard={mvpFeatures.showDashboard}
          onToggleDashboard={mvpFeatures.toggleDashboard}
        />

        {isPro && (
          <div className="mb-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
            <div className="font-semibold">Rizzly Pro is active</div>
            <p className="mt-1 text-emerald-100/85">
              Higher reply limits, synced memory, and Pro workflow tools are now unlocked.
            </p>
          </div>
        )}

        {mvpFeatures.showDashboard && (
          <Dashboard
            threads={threads}
            achievements={mvpFeatures.achievements}
            topPatterns={mvpFeatures.getTopPatterns(3)}
            stats={mvpFeatures.getStats(threads)}
            suggestion={mvpFeatures.getSuggestion()}
            onExport={mvpFeatures.exportData}
            onClose={mvpFeatures.toggleDashboard}
          />
        )}

        <section className="mb-10 grid gap-6 xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] 2xl:items-end">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex rounded-full border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-transparent px-3.5 py-2 text-xs font-semibold tracking-[0.5px] text-cyan-200 backdrop-blur-sm" style={{ textShadow: "0 0 12px rgba(6, 182, 212, 0.2)" }}>
              Smart context-aware replies
            </div>

            <h1 className="mb-4 text-4xl font-black leading-tight tracking-[-0.02em] md:text-5xl xl:text-6xl" style={{ textShadow: "0 8px 32px rgba(236, 72, 153, 0.15)" }}>
              <span className="block bg-gradient-to-r from-white via-white to-cyan-100 bg-clip-text text-transparent">
                Better replies.
              </span>
              <span className="block bg-gradient-to-r from-rose-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                Better outcomes.
              </span>
            </h1>

            <p className="max-w-2xl text-base font-[450] leading-relaxed tracking-[0.3px] text-white/60 md:text-lg" style={{ letterSpacing: "0.3px" }}>
              Rizzly reads the vibe, scores your interest level, and crafts replies that feel <span className="font-semibold text-white/90">genuinely you</span>. Built for real texting, not templates.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => document.getElementById("message-studio")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(236,72,153,0.24)] transition hover:scale-[1.01]"
              >
                Try it free
              </button>

              <a
                href={isSignedIn ? "#message-studio" : "/sign-up"}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
              >
                {isSignedIn ? "Open your thread" : "Create account"}
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/58">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">⚡ Replies in seconds</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">💬 Guest mode live</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">🔒 No card required</div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-white/12 bg-gradient-to-br from-purple-950/38 via-slate-900/32 to-gray-900/26 p-4 shadow-[0_10px_28px_rgba(190,103,154,0.1)] backdrop-blur-xl sm:p-5 md:min-h-[250px] md:p-7">
            <div className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.025] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
                <div className="rounded-2xl px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">Status</div>
                  <div className="mt-2 text-[1.35rem] font-bold leading-none text-white/95">{liveStatus.label}</div>
                </div>
                <div className="inline-flex min-h-[50px] w-full max-w-full items-center gap-2 rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-2 text-sm leading-snug text-white/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:max-w-[250px] xl:max-w-[270px]">
                  <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${liveStatus.dot}`} />
                  <span>{liveStatus.detail}</span>
                </div>
              </div>

              <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

              <div className="mt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/38">
                  Live Read
                </div>

                <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                  <div className="col-span-2 flex min-h-[96px] min-w-0 flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] md:px-4 md:py-5">
                    <div className="flex flex-1 items-center justify-center px-2 text-center bg-gradient-to-r from-rose-200 via-blue-200 to-slate-200 bg-clip-text text-[clamp(0.9rem,1.15vw,1.08rem)] font-extrabold leading-tight tracking-[-0.03em] text-transparent drop-shadow-sm">
                      <span className="max-w-full whitespace-nowrap">{pulseMetrics.toneLabel}</span>
                    </div>
                    <div className="mt-2 flex min-h-[1.5rem] items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em] leading-relaxed text-white/46 sm:text-[10px]">Tone</div>
                  </div>
                  <div className="flex min-h-[112px] min-w-0 flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] md:px-4 md:py-5">
                    <div className="flex min-h-[2.75rem] items-center justify-center bg-gradient-to-r from-emerald-200 to-green-100 bg-clip-text text-[clamp(1rem,1.6vw,1.45rem)] font-bold leading-tight text-transparent drop-shadow-sm">
                      {pulseMetrics.confidenceLabel}
                    </div>
                    <div className="mt-2 flex min-h-[1.75rem] items-center justify-center text-[9px] font-semibold uppercase tracking-[0.12em] leading-relaxed text-white/46 sm:text-[10px]">Confidence</div>
                  </div>
                  <div className="flex min-h-[112px] min-w-0 flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] md:px-4 md:py-5">
                    <div className="flex min-h-[2.75rem] items-center justify-center bg-gradient-to-r from-yellow-200 via-amber-100 to-white bg-clip-text text-[clamp(1rem,1.6vw,1.45rem)] font-bold leading-tight text-transparent drop-shadow-sm">
                      {pulseMetrics.energyLabel}
                    </div>
                    <div className="mt-2 flex min-h-[1.75rem] items-center justify-center text-[9px] font-semibold uppercase tracking-[0.12em] leading-relaxed text-white/46 sm:text-[10px]">Interest</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {currentThread && (
              <div className="rounded-lg border border-white/10 bg-white/4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.15em] text-white/40">
                      Active Thread
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">
                      {currentThread.name}
                    </div>
                    {currentThread.profileName && (
                      <div className="mt-1 text-xs text-white/50">
                        Memory linked to {currentThread.profileName}
                      </div>
                    )}
                    {currentThread.turns.length > 0 && (
                      <div className="mt-1 text-xs text-white/40">
                        {currentThread.turns.length} turn{currentThread.turns.length !== 1 ? "s" : ""} - {new Date(currentThread.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentThreadId(null);
                      setConversation("");
                      setProfileName("");
                      setRelationshipNotes("");
                      setPersonaCalibration("");
                      setScreenshotSummary("");
                      setReplies([]);
                      setBestIndex(null);
                      setAnalysis(null);
                      setSentReplyIndex(null);
                    }}
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
                  >
                    New
                  </button>
                </div>
              </div>
            )}

            <section id="message-studio" className="overflow-visible rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm before:hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold tracking-[0.3px] text-white" style={{ textShadow: "0 2px 8px rgba(255, 255, 255, 0.08)" }}>
                    Message Studio
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Paste the last few messages, choose a vibe, and get a stronger next reply fast.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60">
                  {conversation.length} <span className="text-white/40">chars</span>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 rounded-[24px] border border-white/10 bg-black/20 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Quick start
                      </div>
                      <div className="mt-1 text-sm text-white/75">
                        Tap a scenario, tweak the chat, then get a reply draft fast.
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                      30 sec setup
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickStartScenarios.map((scenario) => (
                      <button
                        key={scenario.label}
                        type="button"
                        onClick={() => applyQuickStart(scenario)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10"
                      >
                        {scenario.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={conversation}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setConversation(event.target.value)}
                  placeholder={`Them: hey sorry ive been busy\nYou: no worries\nThem: how have you been`}
                  className={`h-40 w-full resize-none rounded-[24px] border border-white/10 bg-black/40 px-4 py-4 text-white outline-none transition-all duration-400 placeholder:text-white/30 focus:border-white/30 focus:bg-black/50 focus:ring-2 md:h-48 ${selectedTone.ring}`}
                />

                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2 text-[11px] text-white/55">
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">1. Paste your chat</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">2. Pick the vibe</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">3. Copy the best reply</div>
                  </div>

                  <p className="text-[11px] text-white/45">
                    Best results: paste 3-8 recent lines from both sides so the tone read stays accurate.
                  </p>

                  <ToneDropdown value={tone} onChange={(newTone: ToneKey) => { trackToneChange(tone, newTone); setTone(newTone); }} />

                  <input
                    ref={screenshotInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleScreenshotUpload}
                  />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isSignedIn) {
                          promptSignIn("Sign in to import screenshots.");
                          return;
                        }
                        screenshotInputRef.current?.click();
                      }}
                      disabled={screenshotParsing}
                      className="flex min-h-[56px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/78 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {screenshotParsing ? "Reading Screenshot..." : "Import Screenshot"}
                    </button>

                  <input
                    id="reply-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      setPhotoModalLoading(true);
                      const reader = new FileReader();
                      reader.onload = (loadEvent) => {
                        setPhotoModalImage(loadEvent.target?.result as string);
                        setPhotoModalText("");
                        setPhotoModalOpen(true);
                        setPhotoModalLoading(false);
                      };
                      reader.readAsDataURL(file);
                      event.target.value = "";
                    }}
                  />

                    <button
                      type="button"
                      onClick={() => document.getElementById("reply-image-upload")?.click()}
                      className="flex min-h-[56px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/78 transition hover:border-white/20 hover:bg-white/10"
                    >
                      Add Photo Reply
                    </button>

                    <button
                      onClick={() => void handleGenerate()}
                      disabled={loading || !conversation.trim()}
                      className={`flex min-h-[56px] items-center justify-center rounded-2xl bg-gradient-to-r px-6 py-3 text-center text-sm font-bold text-white transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 ${selectedTone.button}`}
                    >
                      <span className="whitespace-nowrap">{loading ? "Analyzing..." : "Get Replies"}</span>
                    </button>
                  </div>

                  {!isSignedIn && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/8 px-4 py-3 text-sm text-cyan-100">
                      Start in guest mode now. Sign in later for saved history, screenshots, voice notes, and cloud sync.
                    </div>
                  )}

                  {usageSnapshot.remaining.generate <= 5 && (
                    <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-50">
                      You’re close to today’s free limit. Pro unlocks more reply runs and synced memory.
                    </div>
                  )}
                </div>

                {photoModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#181926] p-6 shadow-2xl">
                      <button
                        className="absolute top-3 right-3 text-xl text-white/60 hover:text-white"
                        onClick={() => {
                          setPhotoModalOpen(false);
                          setPhotoModalImage(null);
                          setPhotoModalText("");
                        }}
                        aria-label="Close photo reply modal"
                      >
                        x
                      </button>

                      <div className="mb-4 text-sm font-semibold text-white">Photo Reply</div>

                      {photoModalImage && (
                        <Image
                          src={photoModalImage}
                          alt="Preview"
                          width={320}
                          height={192}
                          unoptimized
                          className="mx-auto mb-3 max-h-48 rounded-lg border border-white/10 object-contain shadow"
                        />
                      )}

                      <textarea
                        className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 transition-all focus:border-white/20 focus:bg-white/10 focus:ring-2"
                        placeholder="Add a message (optional)"
                        value={photoModalText}
                        onChange={(event) => setPhotoModalText(event.target.value)}
                        rows={3}
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                          onClick={() => {
                            setPhotoModalOpen(false);
                            setPhotoModalImage(null);
                            setPhotoModalText("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="rounded-lg border border-white/10 bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow hover:from-blue-600 hover:to-cyan-600"
                          disabled={photoModalLoading || !photoModalImage}
                          onClick={() => {
                            if (!photoModalImage) return;

                            setReplies((prev) => [
                              ...prev,
                              {
                                text: photoModalText || "[Photo reply]",
                                scores: { confidence: 1, engagement: 1, responseChance: 1 },
                                image: photoModalImage,
                                rating: 0,
                                isFavorite: false,
                              },
                            ]);
                            setBestIndex((current) => current ?? 0);
                            setPhotoModalOpen(false);
                            setPhotoModalImage(null);
                            setPhotoModalText("");
                          }}
                        >
                          Send
                        </button>
                      </div>

                      {photoModalLoading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                          <div className="text-sm text-white/80">Loading...</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">What&apos;s your goal?</span>
                    <span className="text-[10px] text-white/40">optional</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {goals.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setGoal(item.value)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold transition-all duration-[350ms] transform hover:scale-110 active:scale-95 ${
                          goal === item.value
                            ? `bg-gradient-to-r text-white ${selectedTone.button} border-white/20 shadow-[0_6px_20px_rgba(236,72,153,0.25)]`
                            : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/15 hover:text-white/90"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Category</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(["dating", "friendship", "work", "family", "exes", "other"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => mvpFeatures.setCategory(cat)}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-bold capitalize transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                            mvpFeatures.category === cat
                              ? `bg-gradient-to-r text-white ${selectedTone.button} border-white/20`
                              : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white/80"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Intensity</span>
                      <span className="text-[10px] text-white/40">{mvpFeatures.toneIntensity}/10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={mvpFeatures.toneIntensity}
                      onChange={(e) => mvpFeatures.setToneIntensity(Number(e.target.value))}
                      className="w-full accent-fuchsia-500"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-white/30">
                      <span>Subtle</span>
                      <span>Strong</span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Replies</span>
                      <span className="text-[10px] text-white/40">how many</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => mvpFeatures.setBulkCount(n)}
                          className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition-all duration-300 ${
                            mvpFeatures.bulkCount === n
                              ? `bg-gradient-to-r text-white ${selectedTone.button} border-white/20`
                              : "border-white/15 bg-white/5 text-white/60 hover:border-white/30"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Who are they?</span>
                    <span className="text-[10px] text-white/40">optional context</span>
                  </div>
                  <textarea
                    value={userContext}
                    onChange={(event) => setUserContext(event.target.value)}
                    placeholder="e.g. they're standoffish but warm when they open up"
                    className={`h-20 w-full resize-none rounded-lg border border-white/10 bg-white/3 px-4 py-3 text-sm text-white outline-none transition-all duration-400 placeholder:text-white/30 focus:border-white/20 focus:bg-white/5 focus:ring-2 ${selectedTone.ring}`}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                        Relationship Memory
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        Save context, calibrate your voice, and keep this thread adaptive over time.
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-400/15 bg-emerald-500/8 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-200/80">
                      Local Only
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Contact Label
                      </div>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        placeholder="e.g. Maya, ex, hinge match"
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/20 focus:bg-black/40 focus:ring-2"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Your Voice Calibration
                      </div>
                      <textarea
                        value={personaCalibration}
                        onChange={(event) => setPersonaCalibration(event.target.value)}
                        placeholder="e.g. I text direct, lowercase, a little playful, and never too eager"
                        rows={4}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/20 focus:bg-black/40 focus:ring-2"
                      />
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[1.25fr_0.95fr]">
                    <label className="block">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Relationship Notes
                      </div>
                      <textarea
                        value={relationshipNotes}
                        onChange={(event) => setRelationshipNotes(event.target.value)}
                        placeholder="Save what matters: history, red flags, pacing, what worked, what backfired"
                        rows={5}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/20 focus:bg-black/40 focus:ring-2"
                      />
                    </label>

                    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Screenshot Intelligence
                      </div>
                      <p className="text-sm leading-6 text-white/62">
                        {screenshotSummary || "Import a screenshot and Rizzly will extract the transcript, suggest the right goal, and store context for this thread."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                          Saved Personas
                        </div>
                        <div className="mt-1 text-sm text-white/55">
                          Reuse your best texting voice with one tap.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={saveCurrentPersona}
                        className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20"
                      >
                        Save current setup
                      </button>
                    </div>

                    {savedPersonas.length > 0 ? (
                      <div className="space-y-2">
                        {savedPersonas.slice(0, 3).map((persona) => (
                          <button
                            key={persona.id}
                            type="button"
                            onClick={() => applySavedPersona(persona)}
                            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-white">
                                  {persona.name}
                                </div>
                                <div className="mt-1 line-clamp-2 text-xs text-white/45">
                                  {persona.voice || persona.notes || "Saved thread memory"}
                                </div>
                              </div>
                              <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">
                                Apply
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-white/50">
                        Save a persona after you dial in your tone, notes, and relationship memory.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      Public Mode Guardrails
                    </div>
                    <p className="mt-1 text-sm text-white/55">
                      Daily usage budgets, timeout protection, and fallback mode keep the product stable for public traffic.
                    </p>

                    <div className="mt-3 grid gap-2">
                      {([
                        { key: "generate", label: "Reply runs" },
                        { key: "screenshot", label: "Screenshot reads" },
                        { key: "voice", label: "Voice notes" },
                      ] as const).map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm"
                        >
                          <span className="text-white/70">{item.label}</span>
                          <span className="font-semibold text-white">
                            {usageSnapshot.remaining[item.key]}/{usageSnapshot.limits[item.key]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/8 px-3 py-2 text-xs leading-5 text-emerald-100/85">
                      Resets daily at {usageSnapshot.resetLabel}. Stability mode keeps the app responsive if upstream AI gets slow.
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-white/10 bg-white/3 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Faster input</div>
                      <div className="mt-1 text-sm text-white/60">Voice dictation and transcribed voice notes.</div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium text-white/50">
                      {voiceSupported ? "Ready" : "Upload"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startDictation("conversation")}
                      disabled={!voiceSupported}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        dictationTarget === "conversation"
                          ? `bg-gradient-to-r text-white ${selectedTone.button} border-white/15`
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      } disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      {dictationTarget === "conversation" ? "Stop convo dictation" : "Dictate convo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startDictation("context")}
                      disabled={!voiceSupported}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        dictationTarget === "context"
                          ? `bg-gradient-to-r text-white ${selectedTone.button} border-white/15`
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      } disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      {dictationTarget === "context" ? "Stop context dictation" : "Dictate context"}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                      {(["Them", "You"] as const).map((speaker) => (
                        <button
                          key={speaker}
                          type="button"
                          onClick={() => setVoiceNoteSpeaker(speaker)}
                          className={`rounded-full px-3 py-1.5 text-xs transition ${
                            voiceNoteSpeaker === speaker ? `bg-gradient-to-r text-white ${selectedTone.button}` : "text-white/55"
                          }`}
                        >
                          {speaker === "Them" ? "Their voice note" : "Your voice note"}
                        </button>
                      ))}
                    </div>

                    <input
                      ref={voiceInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleVoiceNoteUpload}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (!isSignedIn) {
                          promptSignIn("Sign in to transcribe voice notes.");
                          return;
                        }
                        voiceInputRef.current?.click();
                      }}
                      disabled={transcribingVoiceNote}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {transcribingVoiceNote ? "Transcribing voice note..." : "Upload voice note"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">Screenshot import</div>
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">Tone calibrated</div>
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">Outcome loop</div>
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">Local memory only</div>
                  {isDeepConversation && (
                    <div className={`rounded-full border px-3 py-1.5 text-xs text-white ${selectedTone.panel}`}>
                      Deep thread mode
                    </div>
                  )}
                </div>

                {loading && (
                  <div className="mt-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Generating</div>
                        <div className="mt-1 text-sm font-medium text-white/80">Reading tone, scoring options, shaping replies.</div>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedTone.bubble} animate-[pulse_1s_ease-in-out_infinite]`} />
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedTone.bubble} animate-[pulse_1s_ease-in-out_180ms_infinite]`} />
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedTone.bubble} animate-[pulse_1s_ease-in-out_360ms_infinite]`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-white/8"><div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${selectedTone.button} opacity-80 animate-[pulse_1.8s_ease-in-out_infinite]`} /></div>
                      <div className="h-2 rounded-full bg-white/8"><div className={`h-full w-1/2 rounded-full bg-gradient-to-r ${selectedTone.button} opacity-70 animate-[pulse_1.8s_ease-in-out_150ms_infinite]`} /></div>
                      <div className="h-2 rounded-full bg-white/8"><div className={`h-full w-3/4 rounded-full bg-gradient-to-r ${selectedTone.button} opacity-60 animate-[pulse_1.8s_ease-in-out_300ms_infinite]`} /></div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    <span className="flex-1">{error}</span>
                    <button
                      type="button"
                      onClick={() => { setError(null); void handleGenerate(); }}
                      className="shrink-0 rounded-xl border border-red-400/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/30"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {systemNotice && !error && (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                    {systemNotice}
                  </div>
                )}
              </div>
            </section>

            {interestLabel && (
              <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Interest Level</h2>
                  <span className={`text-sm font-semibold ${interestLabel.color}`}>{interestLabel.text}</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r shadow-[0_0_25px_rgba(255,255,255,0.18)] transition-all duration-700 ${selectedTone.meter}`}
                    style={{ width: `${heatMeterWidth}%` }}
                  >
                    <div className="h-full w-full animate-[pulse_2.4s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] opacity-60" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/40">Estimated response likelihood based on the best reply.</p>
              </section>
            )}

            {currentThread && currentThread.turns.length > 0 && (
              <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">Outcome Loop</h2>
                    <p className="mt-1 text-xs text-white/45">
                      Mark how they responded so future replies get sharper for this thread.
                    </p>
                  </div>
                  {currentThread.lastOutcome && (
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                      {currentThread.lastOutcome.replace("-", " ")}
                    </div>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  {[
                    { value: "warm", label: "Warm", accent: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" },
                    { value: "neutral", label: "Neutral", accent: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100" },
                    { value: "cold", label: "Cold", accent: "border-amber-400/30 bg-amber-500/10 text-amber-100" },
                    { value: "no-reply", label: "No Reply", accent: "border-rose-400/30 bg-rose-500/10 text-rose-100" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => updateThreadOutcome(item.value as OutcomeStatus)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition hover:scale-[1.01] ${currentThread.lastOutcome === item.value ? item.accent : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className={`mt-3 rounded-xl border px-4 py-3 ${outcomeCoach.accent}`}>
                  <div className="text-sm font-semibold">{outcomeCoach.title}</div>
                  <p className="mt-1 text-sm opacity-90">{outcomeCoach.detail}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] opacity-75">
                    Next move: {outcomeCoach.nextStep}
                  </p>
                </div>
              </section>
            )}

            {currentThreadInsight && currentThread && currentThread.turns.length > 0 && (
              <RelationshipIntelPanel insight={currentThreadInsight} />
            )}

            <GrowthPanel
              isSignedIn={Boolean(isSignedIn)}
              usageSnapshot={usageSnapshot}
              cloudSyncState={cloudSyncState}
              cloudSyncMessage={cloudSyncMessage}
              onSyncNow={() => {
                void syncCloudHistory();
              }}
            />

            {analysis && (
              <AnalysisPanel analysis={analysis} analysisVisible={analysisVisible} panelClass={selectedTone.panel} />
            )}

            <ThreadList
              threads={threads}
              currentThreadId={currentThreadId}
              onLoadThread={loadThread}
              onDeleteThread={deleteThread}
              showThreadForm={showThreadForm}
              onShowThreadForm={setShowThreadForm}
              threadName={threadName}
              onThreadNameChange={setThreadName}
              onCreateThread={createThread}
            />
          </div>

          <div className="space-y-6">
            <ChatPreview
              chatLines={fakeChatPreview}
              bestReplyText={bestIndex !== null && replies[bestIndex] ? replies[bestIndex].text : null}
              previewVisible={previewVisible}
              bubbleClass={selectedTone.bubble}
            />

            {replies.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-2xl font-bold text-transparent">Your Replies</h2>
                  <div className="text-xs font-medium text-white/40">Pick your vibe</div>
                </div>

                {replies.map((reply, index) => (
                  <div
                    key={`${reply.text}-${index}`}
                    className={`rounded-[30px] border p-5 transition ${bestIndex === index ? selectedTone.panel : "border-white/10 bg-white/[0.05] backdrop-blur-xl hover:border-white/15 hover:bg-white/[0.07]"} ${visibleReplyCount > index ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0"}`}
                    style={{ transitionDuration: "420ms", transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                  >
                    {bestIndex === index && (
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-white">
                        Best Reply
                      </div>
                    )}

                    {reply.image && (
                      <Image
                        src={reply.image}
                        alt="Reply attachment"
                        width={420}
                        height={208}
                        unoptimized
                        className="mb-4 max-h-52 rounded-2xl border border-white/10 object-contain shadow"
                      />
                    )}

                    <p className="mb-4 text-base leading-8 md:text-lg">{reply.text}</p>

                    <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
                      <div className={`rounded-2xl border p-3 text-center ${selectedTone.panel}`}>
                        <div className="text-lg font-bold">{reply.scores.confidence}/10</div>
                        <div className="mt-1 text-white/45">Confidence</div>
                      </div>
                      <div className={`rounded-2xl border p-3 text-center ${selectedTone.panel}`}>
                        <div className="text-lg font-bold">{reply.scores.engagement}/10</div>
                        <div className="mt-1 text-white/45">Engagement</div>
                      </div>
                      <div className={`rounded-2xl border p-3 text-center ${selectedTone.panel}`}>
                        <div className="text-lg font-bold">{reply.scores.responseChance}/10</div>
                        <div className="mt-1 text-white/45">Reply Rate</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sentReplyIndex !== index ? (
                        <button
                          onClick={() => markReplySent(index, reply)}
                          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-[350ms] transform hover:scale-105 active:scale-95 hover:shadow-[0_6px_18px_rgba(5,150,105,0.4)]"
                        >
                          Mark as Sent
                        </button>
                      ) : (
                        <div className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-center text-sm font-semibold text-emerald-300">
                          Sent and Saved
                        </div>
                      )}

                      <button
                        onClick={() => void copyToClipboard(reply.text, index)}
                        className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-[350ms] transform hover:scale-110 active:scale-[0.97] ${copiedIndex === index ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-[0_8px_24px_rgba(34,197,94,0.5)]" : "bg-white text-black hover:shadow-[0_8px_24px_rgba(255,255,255,0.3)]"}`}
                      >
                        {copiedIndex === index ? "Copied" : "Copy"}
                      </button>

                      <button
                        onClick={() => { mvpFeatures.rateReply(reply.text, 1); trackRate(reply.text, 1); }}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300 transform hover:scale-110 active:scale-95 ${mvpFeatures.replyRatings[reply.text] === 1 ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)]" : "border border-green-400/30 bg-green-500/10 text-green-100 hover:border-green-400/50 hover:bg-green-500/20"}`}
                        title="This helped"
                      >
                        👍
                      </button>

                      <button
                        onClick={() => { mvpFeatures.rateReply(reply.text, -1); trackRate(reply.text, -1); }}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition-all duration-[350ms] transform hover:scale-110 active:scale-[0.95] ${mvpFeatures.replyRatings[reply.text] === -1 ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-[0_6px_18px_rgba(239,68,68,0.5)]" : "border border-red-400/30 bg-red-500/10 text-red-100 hover:border-red-400/50 hover:bg-red-500/20"}`}
                        title="Did not help"
                      >
                        👎
                      </button>

                      <button
                        onClick={() => { const wasFav = mvpFeatures.favorites.includes(reply.text); mvpFeatures.toggleFavorite(reply.text); trackFavorite(wasFav ? 'remove' : 'add'); }}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition-all duration-[350ms] transform hover:scale-110 active:scale-[0.95] ${mvpFeatures.favorites.includes(reply.text) ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-[0_6px_18px_rgba(234,179,8,0.5)]" : "border border-yellow-400/30 bg-yellow-500/10 text-yellow-100 hover:border-yellow-400/50 hover:bg-yellow-500/20"}`}
                        title="Save this reply"
                      >
                        {mvpFeatures.favorites.includes(reply.text) ? "⭐" : "☆"}
                      </button>

                      <button
                        onClick={() => { setTone("flirty"); setTimeout(() => { const event = new Event("auto-regen"); window.dispatchEvent(event); }, 50); }}
                        className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/15 px-4 py-2 text-sm font-bold text-fuchsia-100 transition-all duration-[350ms] transform hover:scale-105 active:scale-95 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/25"
                      >
                        Make Flirty
                      </button>
                      <button
                        onClick={() => { setTone("confident"); setTimeout(() => { const event = new Event("auto-regen"); window.dispatchEvent(event); }, 50); }}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 transition-all duration-[350ms] transform hover:scale-105 active:scale-95 hover:border-cyan-400/50 hover:bg-cyan-500/25"
                      >
                        Make Bolder
                      </button>
                      <button
                        onClick={() => { setTone("funny"); setTimeout(() => { const event = new Event("auto-regen"); window.dispatchEvent(event); }, 50); }}
                        className="rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-100 transition-all duration-[350ms] transform hover:scale-105 active:scale-95 hover:border-amber-400/50 hover:bg-amber-500/25"
                      >
                        Make Funny
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
