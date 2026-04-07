
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMVPFeatures } from "@/app/hooks/useMVPFeatures";
import { ReplyCards } from "@/app/components/ReplyCards";
import { Dashboard } from "@/app/components/Dashboard";
import { MVPHeader } from "@/app/components/MVPHeader";
import type {
  ToneKey,
  GoalKey,
  CategoryKey,
  Achievement,
  Thread,
  ThreadTurn,
  TonePattern,
} from "@/lib/analytics";

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
};

type SessionEntry = Thread;

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

function loadDraft() {
  if (typeof window === "undefined") {
    return {
      conversation: "",
      tone: "confident" as ToneKey,
      goal: "restart" as GoalKey,
      userContext: "",
    };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "null");

    return {
      conversation:
        typeof parsed?.conversation === "string" ? parsed.conversation : "",
      tone:
        typeof parsed?.tone === "string"
          ? (parsed.tone as ToneKey)
          : ("confident" as ToneKey),
      goal:
        typeof parsed?.goal === "string"
          ? (parsed.goal as GoalKey)
          : ("restart" as GoalKey),
      userContext:
        typeof parsed?.userContext === "string" ? parsed.userContext : "",
    };
  } catch {
    return {
      conversation: "",
      tone: "confident" as ToneKey,
      goal: "restart" as GoalKey,
      userContext: "",
    };
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

function generateThreadSummary(turns: ThreadTurn[]): string {
  if (!turns.length) return "";

  const recentTurns = turns.slice(-3);
  const summaryParts = recentTurns.map((turn) => {
    const analysis = turn.analysis;
    const chosenReply = turn.chosenReply;

    const outcome = chosenReply
      ? `sent: "${chosenReply.substring(0, 50)}${chosenReply.length > 50 ? "..." : ""}"`
      : `tried ${turn.replies.length} replies`;

    const vibe = analysis?.vibe ? ` (${analysis.vibe})` : "";

    return `[${turn.tone}/${turn.goal}]${vibe} → ${outcome}`;
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
    label: "Apologetic",
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
            className={`shrink-0 text-white/60 transition-transform duration-200 ${
              open ? (openUpward ? "" : "rotate-180") : openUpward ? "rotate-180" : ""
            }`}
          >
            v
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
    // Photo reply modal state (must be inside the component)
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [photoModalImage, setPhotoModalImage] = useState<string | null>(null);
    const [photoModalText, setPhotoModalText] = useState("");
    const [photoModalLoading, setPhotoModalLoading] = useState(false);
  const [conversation, setConversation] = useState(() => loadDraft().conversation);
  const [tone, setTone] = useState<ToneKey>(() => loadDraft().tone);
  const [goal, setGoal] = useState<GoalKey>(() => loadDraft().goal);
  const [userContext, setUserContext] = useState(() => loadDraft().userContext);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [bestIndex, setBestIndex] = useState<number | null>(null);
  const [sentReplyIndex, setSentReplyIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleReplyCount, setVisibleReplyCount] = useState(0);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(() => loadCurrentThreadId());
  const [showThreadForm, setShowThreadForm] = useState(false);
  const [threadName, setThreadName] = useState("");
  const [dictationTarget, setDictationTarget] =
    useState<DictationTarget | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcribingVoiceNote, setTranscribingVoiceNote] = useState(false);
  const [voiceNoteSpeaker, setVoiceNoteSpeaker] = useState<"You" | "Them">(
    "Them",
  );
  
  
  // MVP Features - using custom hook
  const mvpFeatures = useMVPFeatures(threads);
  
  const selectedTone = tones.find((item) => item.value === tone) ?? tones[0];
  const bestReply = bestIndex !== null ? replies[bestIndex] : null;
  const currentThread = threads.find((t) => t.id === currentThreadId);
  const isDeepConversation =
    conversation.split("\n").filter((line: string) => line.trim()).length > 16 ||
    conversation.length > 2200;
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ conversation, tone, goal, userContext }),
    );
  }, [conversation, goal, tone, userContext]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentThreadId) {
      return;
    }

    window.localStorage.setItem(CURRENT_THREAD_KEY, currentThreadId);
  }, [currentThreadId]);

  useEffect(() => {
    setVoiceSupported(detectVoiceSupport());
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
        if (conversation.trim()) {
          // Trigger generate
          const event = new Event("generate-replies");
          window.dispatchEvent(event);
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [conversation, tone]);

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

  const handleVoiceNoteUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setTranscribingVoiceNote(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("speaker", voiceNoteSpeaker);

      const res = await fetch("/api/transcribe-voice-note", {
        method: "POST",
        body: formData,
      });

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
          ? caughtError.message
          : "Failed to transcribe voice note.",
      );
    } finally {
      setTranscribingVoiceNote(false);
      event.target.value = "";
    }
  };

  const createThread = (name: string) => {
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      name: name.trim() || "Untitled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turns: [],
      summary: "",
    };

    setThreads((prev) => [newThread, ...prev]);
    setCurrentThreadId(newThread.id);
    setConversation("");
    setTone("confident");
    setGoal("restart");
    setUserContext("");
    setReplies([]);
    setBestIndex(null);
    setAnalysis(null);
    setSentReplyIndex(null);
    setShowThreadForm(false);
    setThreadName("");
    setError(null);
  };

  const loadThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    setCurrentThreadId(threadId);
    const lastTurn = thread.turns[thread.turns.length - 1];

    if (lastTurn) {
      setConversation(lastTurn.userMessage);
      setTone(lastTurn.tone);
      setGoal(lastTurn.goal);
      setUserContext(lastTurn.userContext);
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
      setReplies([]);
      setBestIndex(null);
      setAnalysis(null);
    }

    setSentReplyIndex(null);
    setError(null);
  };

  const appendTurn = (turn: ThreadTurn, priorSummary?: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === currentThreadId) {
          const updatedTurns = [...thread.turns, turn];
          const summary = generateThreadSummary(updatedTurns);

          return {
            ...thread,
            turns: updatedTurns,
            updatedAt: Date.now(),
            summary,
          };
        }

        return thread;
      }),
    );
  };

  const loadSession = (session: SessionEntry) => {
    loadThread(session.id);
  };

  const handleGenerate = async () => {
    if (!conversation.trim()) return;

    setLoading(true);
    setError(null);
    setVisibleReplyCount(0);
    setAnalysisVisible(false);
    setPreviewVisible(false);
    setSentReplyIndex(null);

    try {
      const threadSummary = currentThread?.summary || "";

      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation,
          tone,
          goal,
          userContext,
          threadSummary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate replies.");
      }

      setReplies(data.replies || []);
      setBestIndex(data.bestIndex ?? null);
      setAnalysis(data.analysis || null);

      // Create new thread if none is selected
      if (!currentThreadId) {
        const newThread: Thread = {
          id: `thread-${Date.now()}`,
          name: `Chat on ${new Date().toLocaleDateString()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          turns: [],
          summary: "",
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
          analysis: data.analysis || null,
          replies: data.replies || [],
          bestIndex: data.bestIndex ?? null,
        };

        appendTurn(turn);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to generate replies.";

      setReplies([]);
      setBestIndex(null);
      setAnalysis(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1400);
    } catch (caughtError) {
      console.error("Copy failed:", caughtError);
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
      `}</style>
      
      {/* Base gradient layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(217,70,239,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.06),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.04),transparent_60%)]" />
      
      {/* Animated floating orbs - romantic */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-rose-500/12 to-pink-600/6 rounded-full blur-3xl float-1" style={{ filter: 'blur(80px)' }} />
      <div className="absolute top-1/3 right-20 w-80 h-80 bg-gradient-to-br from-fuchsia-500/10 to-violet-600/6 rounded-full blur-3xl float-2" style={{ filter: 'blur(70px)' }} />
      <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-violet-500/8 to-purple-600/4 rounded-full blur-3xl float-3 drift" style={{ filter: 'blur(75px)' }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-rose-600/3 rounded-full blur-3xl float-1" style={{ filter: 'blur(85px)' }} />
      
      {/* Warm grid pattern */}
      <div className="absolute inset-0 opacity-[0.015] [background-image:linear-gradient(rgba(236,72,153,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.4)_1px,transparent_1px)] [background-size:40px_40px]" />
      
      {/* Subtle top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-rose-500/3 via-pink-500/1 to-transparent" />
      
      {/* Accent glow edges */}
      <div className="pointer-events-none absolute -top-1/2 -right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-fuchsia-400/5 to-transparent rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-1/4 -left-1/2 w-1/2 h-1/2 bg-gradient-to-tr from-violet-400/4 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-8">
      <style>{`
        /* Global smooth animations */
        @keyframes smooth-scale {
          from { transform: scale(0.98); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes button-ripple {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes hover-lift {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-2px); }
        }
        @keyframes glow-expand {
          0% { box-shadow: 0 0 0 0 currentColor; }
          100% { box-shadow: 0 0 0 8px rgba(0, 0, 0, 0); }
        }
        @keyframes spin-subtle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        /* Easing curves for smooth feel */
        :root {
          --ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
          --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        /* Button smooth transitions */
        button, a, input, textarea, select {
          transition: all 0.3s var(--ease-smooth);
        }
        
        /* Smooth hover scale for interactive elements */
        button:hover:not(:disabled), 
        .interactive:hover {
          transform: translateY(-1px);
        }
        
        button:active:not(:disabled) {
          transform: scale(0.98) translateY(0px);
          transition: all 0.15s var(--ease-bounce);
        }
        
        /* Input focus smoothness */
        input:focus, textarea:focus, select:focus {
          transition: all 0.4s var(--ease-smooth);
        }
        
        /* Smooth page animations */
        .fade-in {
          animation: smooth-scale 0.5s var(--ease-smooth) forwards;
        }
        
        /* Global smooth properties */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Pulse animations for stats */
        @keyframes pulse-glow {
                0%, 100% { filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.25)) drop-shadow(0 0 12px rgba(236, 72, 153, 0.12)); }
                50% { filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.4)) drop-shadow(0 0 18px rgba(236, 72, 153, 0.2)); }
              }
              @keyframes sparkline-draw {
                0% { stroke-dashoffset: 100; opacity: 0; }
                100% { stroke-dashoffset: 0; opacity: 1; }
              }
              @keyframes dot-pulse {
                0%, 100% { r: 1.8; opacity: 0.6; }
                50% { r: 2.6; opacity: 1; }
              }
              @keyframes spark-glow {
                0%, 100% { filter: drop-shadow(0 0 3px rgba(6, 182, 212, 0.3)); }
                50% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.7)); }
              }
              .logo-glow { animation: pulse-glow 3s ease-in-out infinite; }
              .sparkline-line { animation: sparkline-draw 2s ease-out forwards; stroke-dasharray: 100; }
              .data-dot { animation: dot-pulse 2s ease-in-out infinite; }
              .spark-accent { animation: spark-glow 2s ease-in-out infinite; }
              
              /* Rizzly brand animations - dopamine hit on every interaction */
              @keyframes rizz-bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.12); }
              }
              @keyframes sparkle-pulse {
                0%, 100% { r: 3px; opacity: 0.75; filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.3)); }
                50% { r: 4.2px; opacity: 1; filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.7)); }
              }
              @keyframes sparkle-pop {
                0% { transform: scale(0.6) rotate(0deg) translateY(0); opacity: 1; }
                100% { transform: scale(1.4) rotate(180deg) translateY(-3px); opacity: 0.3; }
              }
              .rizz-center { animation: rizz-bounce 2.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
              .sparkle-ray { animation: sparkle-pulse 1.6s ease-in-out infinite; }
              .sparkle-ray-1 { animation-delay: 0s; }
              .sparkle-ray-2 { animation-delay: 0.1s; }
              .sparkle-ray-3 { animation-delay: 0.2s; }
              .sparkle-ray-4 { animation-delay: 0.3s; }
              .sparkle-ray-diag { animation-delay: 0.4s; }
              
              /* Typing indicator animation */
              @keyframes typing-bounce {
                0%, 100% { transform: translateY(0); opacity: 0.4; }
                50% { transform: translateY(-2px); opacity: 1; }
              }
              .typing-dot { animation: typing-bounce 1.4s ease-in-out infinite; }
            `}</style>
            <header className="flex items-center justify-center gap-4 mb-8 md:mb-10 md:justify-between">
            <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-rose-500/12 rounded-2xl blur-lg animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="relative rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-black/80 to-black/60 p-2 backdrop-blur-md shadow-[0_8px_24px_rgba(236,72,153,0.15)]">
                <svg width="64" height="64" viewBox="0 0 64 64" className="logo-glow" fill="none">
                  <defs>
                    <filter id="subtleGlow">
                      <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Primary rounded square bubble - magenta */}
                  <rect x="10" y="14" width="24" height="22" rx="5" ry="5" stroke="#d946a6" strokeWidth="2.5" fill="none" />
                  
                  {/* Bubble pointer - magenta */}
                  <polygon points="18,36 14,42 22,36" fill="#d946a6" />
                  
                  {/* Secondary rounded square bubble - cyan (overlapping) */}
                  <rect x="28" y="22" width="26" height="22" rx="5" ry="5" stroke="#06b6d4" strokeWidth="2.5" fill="none" />
                  
                  {/* Bubble pointer - cyan */}
                  <polygon points="46,44 50,50 42,44" fill="#06b6d4" />
                  
                  {/* Typing indicator dots in primary magenta bubble */}
                  <circle cx="16" cy="25" r="1.8" fill="#d946a6" opacity="0.9" className="typing-dot" style={{ animationDelay: '0s' }} />
                  <circle cx="22" cy="25" r="1.8" fill="#d946a6" opacity="0.9" className="typing-dot" style={{ animationDelay: '0.2s' }} />
                  <circle cx="28" cy="25" r="1.8" fill="#d946a6" opacity="0.9" className="typing-dot" style={{ animationDelay: '0.4s' }} />
                  
                  {/* Typing indicator dots in secondary cyan bubble */}
                  <circle cx="35" cy="33" r="1.8" fill="#06b6d4" opacity="0.9" className="typing-dot" style={{ animationDelay: '0s' }} />
                  <circle cx="41" cy="33" r="1.8" fill="#06b6d4" opacity="0.9" className="typing-dot" style={{ animationDelay: '0.2s' }} />
                  <circle cx="47" cy="33" r="1.8" fill="#06b6d4" opacity="0.9" className="typing-dot" style={{ animationDelay: '0.4s' }} />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.3em] bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent font-bold opacity-80">
                Rizzly
              </div>
              <div className="mt-1 text-lg font-black md:text-xl bg-gradient-to-r from-white via-rose-100 to-cyan-200 bg-clip-text text-transparent shine" style={{ animationDuration: '4s' }}>
                Reply smarter
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-gradient-to-r from-emerald-500/8 to-emerald-500/3 px-3.5 py-2 text-xs text-emerald-300 backdrop-blur-md font-medium hover:border-emerald-400/30 hover:from-emerald-500/12 transition-all duration-300" style={{ opacity: 0.7 }}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
        </header>

        {/* MVP Header with streak and achievements */}
        <MVPHeader
          streak={mvpFeatures.streak}
          achievements={mvpFeatures.achievements}
          showDashboard={mvpFeatures.showDashboard}
          onToggleDashboard={mvpFeatures.toggleDashboard}
        />

        {/* Dashboard Modal */}
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

        <section className="mb-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-end">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex rounded-full border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-transparent px-3.5 py-2 text-xs font-semibold text-cyan-200 backdrop-blur-sm tracking-[0.5px]" style={{ textShadow: '0 0 12px rgba(6, 182, 212, 0.2)' }}>
              ✨ Smart context-aware replies
            </div>

            <h1 className="mb-4 text-4xl font-black leading-tight tracking-[-0.02em] md:text-5xl xl:text-6xl" style={{ textShadow: '0 8px 32px rgba(236, 72, 153, 0.15)' }}>
              <span className="block bg-gradient-to-r from-white via-white to-cyan-100 bg-clip-text text-transparent">
                Better replies.
              </span>
              <span className="block bg-gradient-to-r from-rose-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                Better outcomes.
              </span>
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-white/60 md:text-lg font-[450] tracking-[0.3px]" style={{ letterSpacing: '0.3px' }}>
              Rizzly reads the vibe, scores your interest level, and crafts replies that feel <span className="text-white/90 font-semibold">genuinely you</span>. Built for real texting, not templates.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/35">
                  Status
                </div>
                <div className="mt-1 text-sm font-medium text-white">
                  {liveStatus.label}
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${liveStatus.dot}`}
                />
                {liveStatus.detail}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/4 p-3">
                <div className="text-lg font-semibold text-white">
                  {pulseMetrics.toneLabel}
                </div>
                <div className="mt-2 text-xs text-white/40">
                  Tone
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/4 p-3">
                <div className="text-lg font-semibold text-white">
                  {pulseMetrics.confidenceLabel}
                </div>
                <div className="mt-2 text-xs text-white/40">
                  Confidence
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/4 p-3">
                <div className="text-lg font-semibold text-white">
                  {pulseMetrics.energyLabel}
                </div>
                <div className="mt-2 text-xs text-white/40">
                  Interest
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
                      {currentThread!.name}
                    </div>
                    {currentThread!.turns.length > 0 && (
                      <div className="mt-1 text-xs text-white/40">
                        {currentThread!.turns.length} turn{currentThread!.turns.length !== 1 ? "s" : ""} — {new Date(currentThread!.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentThreadId(null);
                      setConversation("");
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

            <section className="overflow-visible rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm before:hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white tracking-[0.3px]" style={{ textShadow: '0 2px 8px rgba(255, 255, 255, 0.08)' }}>
                    💬 Paste the conversation
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Copy the last few messages, pick a vibe, get smarter replies in seconds
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60">
                  {conversation.length} <span className="text-white/40">chars</span>
                </div>
              </div>

              <div className="p-5">
                <textarea
                  value={conversation}
                  onChange={(event) => setConversation(event.target.value)}
                  placeholder={`Them: hey sorry ive been busy
You: no worries
Them: how have you been`}
                  className={`h-40 w-full resize-none rounded-[24px] border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:ring-2 md:h-48 focus:border-white/30 focus:bg-black/50 transition-all duration-400 ease-smooth ${selectedTone.ring}`}
                />


                <div className="mt-4 grid items-start gap-3 sm:grid-cols-[1fr_auto]">
                  <ToneDropdown value={tone} onChange={setTone} />

                  {/* Image upload for reply */}
                  <input
                    id="reply-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPhotoModalLoading(true);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setPhotoModalImage(event.target?.result as string);
                        setPhotoModalText("");
                        setPhotoModalOpen(true);
                        setPhotoModalLoading(false);
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('reply-image-upload')?.click()}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:border-white/20"
                  >
                    📷 Add Photo Reply
                  </button>

                  {/* Photo reply modal */}
                  {photoModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="bg-[#181926] rounded-2xl shadow-2xl p-6 w-full max-w-xs relative border border-white/10">
                        <button
                          className="absolute top-3 right-3 text-white/60 hover:text-white text-xl"
                          onClick={() => {
                            setPhotoModalOpen(false);
                            setPhotoModalImage(null);
                            setPhotoModalText("");
                          }}
                          aria-label="Close photo reply modal"
                        >
                          ×
                        </button>
                        <div className="mb-4">
                          <div className="text-sm font-semibold text-white mb-2">Photo Reply</div>
                          {photoModalImage && (
                            <img
                              src={photoModalImage}
                              alt="Preview"
                              className="max-h-48 rounded-lg border border-white/10 shadow object-contain mx-auto mb-3"
                            />
                          )}
                          <textarea
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:border-white/20 focus:bg-white/10 transition-all mb-2"
                            placeholder="Add a message (optional)"
                            value={photoModalText}
                            onChange={e => setPhotoModalText(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="rounded-lg px-4 py-2 text-sm bg-white/10 text-white hover:bg-white/20 border border-white/10"
                            onClick={() => {
                              setPhotoModalOpen(false);
                              setPhotoModalImage(null);
                              setPhotoModalText("");
                            }}
                          >Cancel</button>
                          <button
                            className="rounded-lg px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow hover:from-blue-600 hover:to-cyan-600 border border-white/10"
                            disabled={photoModalLoading || !photoModalImage}
                            onClick={() => {
                              setReplies(prev => [
                                ...prev,
                                {
                                  text: photoModalText || "[Photo reply]",
                                  scores: { confidence: 1, engagement: 1, responseChance: 1 },
                                  image: photoModalImage!,
                                  rating: 0,
                                  isFavorite: false,
                                },
                              ]);
                              setPhotoModalOpen(false);
                              setPhotoModalImage(null);
                              setPhotoModalText("");
                            }}
                          >Send</button>
                        </div>
                        {photoModalLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                            <div className="text-white/80 text-sm">Loading...</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`rounded-full bg-gradient-to-r px-8 py-3 font-bold text-white transition-all duration-[400ms] ease-spring transform hover:scale-110 active:scale-[0.96] hover:shadow-[0_12px_32px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed ${selectedTone.button}`}
                  >
                    {loading ? "✨ Analyzing..." : "🚀 Generate Replies"}
                  </button>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">What's your goal?</span>
                    <span className="text-[10px] text-white/40">(optional)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {goals.map((item: (typeof goals)[number]) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setGoal(item.value)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold transition-all duration-[350ms] ease-spring transform hover:scale-110 active:scale-95 ${
                          goal === item.value
                            ? `bg-gradient-to-r text-white ${selectedTone.button} border-white/20 shadow-[0_6px_20px_rgba(236,72,153,0.25)]`
                            : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white/90 hover:bg-white/15"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Who are they?</span>
                    <span className="text-[10px] text-white/40">(optional context)</span>
                  </div>
                  <textarea
                    value={userContext}
                    onChange={(event) => setUserContext(event.target.value)}
                    placeholder="e.g., 'they're standoffish but warm when they open up' or 'first date energy'"
                    className={`h-20 w-full resize-none rounded-lg border border-white/10 bg-white/3 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:border-white/20 focus:bg-white/5 transition-all duration-400 ease-smooth ${selectedTone.ring}`}
                  />
                </div>

                <div className="mt-4 rounded-lg border border-white/10 bg-white/3 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        🎤 Faster input
                      </div>
                      <div className="mt-1 text-sm text-white/60">
                        Voice dictation + transcribe voice notes
                      </div>
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
                      {dictationTarget === "conversation"
                        ? "Stop convo dictation"
                        : "Dictate convo"}
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
                      {dictationTarget === "context"
                        ? "Stop context dictation"
                        : "Dictate context"}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                      {(["Them", "You"] as const).map((speaker: "Them" | "You") => (
                        <button
                          key={speaker}
                          type="button"
                          onClick={() => setVoiceNoteSpeaker(speaker)}
                          className={`rounded-full px-3 py-1.5 text-xs transition ${
                            voiceNoteSpeaker === speaker
                              ? `bg-gradient-to-r text-white ${selectedTone.button}`
                              : "text-white/55"
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
                      onClick={() => voiceInputRef.current?.click()}
                      disabled={transcribingVoiceNote}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {transcribingVoiceNote
                        ? "Transcribing voice note..."
                        : "Upload voice note"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">
                    Screenshot ready
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">
                    Tone calibrated
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/55">
                    Viral-friendly output
                  </div>
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
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                          Generating
                        </div>
                        <div className="mt-1 text-sm font-medium text-white/80">
                          Reading tone, scoring options, shaping replies
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedTone.bubble} animate-[pulse_1s_ease-in-out_infinite]`} />
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedTone.bubble} animate-[pulse_1s_ease-in-out_180ms_infinite]`} />
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedTone.bubble} animate-[pulse_1s_ease-in-out_360ms_infinite]`} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-white/8">
                        <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${selectedTone.button} animate-[pulse_1.8s_ease-in-out_infinite] opacity-80`} />
                      </div>
                      <div className="h-2 rounded-full bg-white/8">
                        <div className={`h-full w-1/2 rounded-full bg-gradient-to-r ${selectedTone.button} animate-[pulse_1.8s_ease-in-out_150ms_infinite] opacity-70`} />
                      </div>
                      <div className="h-2 rounded-full bg-white/8">
                        <div className={`h-full w-3/4 rounded-full bg-gradient-to-r ${selectedTone.button} animate-[pulse_1.8s_ease-in-out_300ms_infinite] opacity-60`} />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}
              </div>
            </section>

            {interestLabel && (
              <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">🔥 Interest Level</h2>
                  <span className={`font-semibold text-sm ${interestLabel!.color}`}>
                    {interestLabel!.text}
                  </span>
                </div>

                <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r shadow-[0_0_25px_rgba(255,255,255,0.18)] transition-all duration-700 ${selectedTone.meter}`}
                    style={{ width: `${heatMeterWidth}%` }}
                  >
                    <div className="h-full w-full animate-[pulse_2.4s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] opacity-60" />
                  </div>
                </div>

                <p className="mt-3 text-xs text-white/40">
                  Estimated response likelihood based on best reply
                </p>
              </section>
            )}

            {analysis && (
              <section
                className={`space-y-3 rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm transition-all duration-300 ${
                  analysisVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-fuchsia-300 bg-clip-text text-transparent">📊 What's Happening</h2>

                {analysis!.summary && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Summary
                    </div>
                    <p>{analysis!.summary}</p>
                  </div>
                )}

                {analysis!.toneUsed && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Tone applied
                    </div>
                    <p>{analysis!.toneUsed}</p>
                  </div>
                )}

                {analysis!.depthMode && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Thread mode
                    </div>
                    <p>{analysis!.depthMode}</p>
                  </div>
                )}

                {analysis!.strategy && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Strategy
                    </div>
                    <p>{analysis!.strategy}</p>
                  </div>
                )}

                {analysis!.userPattern && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Your pattern
                    </div>
                    <p>{analysis!.userPattern}</p>
                  </div>
                )}

                {analysis!.receiverPattern && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Receiver pattern
                    </div>
                    <p>{analysis!.receiverPattern}</p>
                  </div>
                )}

                {analysis!.languageStyle && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Language style
                    </div>
                    <p>{analysis!.languageStyle}</p>
                  </div>
                )}

                {analysis!.adaptationNote && (
                  <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      Adaptation note
                    </div>
                    <p>{analysis!.adaptationNote}</p>
                  </div>
                )}

                <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                    Current vibe
                  </div>
                  <p>{analysis!.vibe}</p>
                </div>

                <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                    Strength
                  </div>
                  <p>{analysis!.strength}</p>
                </div>

                <div className={`rounded-2xl border bg-black/30 p-4 ${selectedTone.panel}`}>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                    Risk
                  </div>
                  <p>{analysis!.risk}</p>
                </div>
              </section>
            )}

            {threads.length > 0 && (
              <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      📚 Your Conversations
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Pick up where you left off
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/50">
                    {threads.length}
                  </div>
                </div>

                <div className="space-y-3">
                  {threads.map((thread: Thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => loadThread(thread.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        currentThreadId === thread.id
                          ? "border-fuchsia-400/30 bg-fuchsia-500/10"
                          : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-white">
                              {thread.name}
                            </div>
                            <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                              {thread.turns.length} turns
                            </span>
                          </div>
                          {thread.summary && (
                            <div className="mt-2 text-xs text-white/40 line-clamp-2">
                              {thread.summary}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-white/35">
                            Updated {new Date(thread.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="shrink-0 text-lg">{"→"}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {!showThreadForm && (
                  <button
                    type="button"
                    onClick={() => setShowThreadForm(true)}
                    className="mt-4 w-full rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-sm text-white/50 transition hover:border-white/40 hover:text-white/70"
                  >
                    + Start new thread
                  </button>
                )}

                {showThreadForm && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Thread name (e.g., 'First dates with Alex')"
                      value={threadName}
                      onChange={(e) => setThreadName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          createThread(threadName);
                        }
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-500/20"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => createThread(threadName)}
                        className="flex-1 rounded-lg border border-fuchsia-400/30 bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowThreadForm(false);
                          setThreadName("");
                        }}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">💬 How it'll look</h2>
                <div className="text-xs font-medium text-white/40">
                  iMessage preview
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#0b0c10] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="mb-4 flex items-center justify-center">
                  <div className="rounded-full bg-white/10 px-4 py-1 text-sm text-white/60">
                    Today
                  </div>
                </div>

                <div className="space-y-3">
                  {fakeChatPreview.length > 0 ? (
                    fakeChatPreview.map((line: string, index: number) => {
                      const isYou = line.toLowerCase().startsWith("you:");
                      const content = line
                        .replace(/^them:\s*/i, "")
                        .replace(/^her:\s*/i, "")
                        .replace(/^you:\s*/i, "");

                      return (
                        <div
                          key={`${line}-${index}`}
                          className={`flex ${isYou ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                              isYou
                                ? "bg-[#0A84FF] text-white"
                                : "bg-[#2c2c2e] text-white"
                            }`}
                          >
                            {content}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-white/35">
                      Paste a conversation to preview it here.
                    </div>
                  )}

                  {bestIndex !== null && replies[bestIndex!] && (
                    <div className="flex justify-end pt-2">
                      <div
                        className={`max-w-[80%] rounded-[22px] px-4 py-3 text-sm font-medium leading-6 text-black shadow-[0_0_20px_rgba(52,199,89,0.35)] transition-all duration-500 ${
                          previewVisible
                            ? "translate-y-0 scale-100 opacity-100"
                            : "translate-y-3 scale-[0.97] opacity-0"
                        } ${selectedTone.bubble}`}
                      >
                        {replies[bestIndex!].text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {replies.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">✨ Your Replies</h2>
                  <div className="text-xs font-medium text-white/40">
                    Pick your vibe
                  </div>
                </div>

                {replies.map((reply: Reply, index: number) => (
                  <div
                    key={`${reply.text}-${index}`}
                    className={`rounded-[30px] border p-5 transition ${
                      bestIndex === index
                        ? selectedTone.panel
                        : "border-white/10 bg-white/[0.05] backdrop-blur-xl hover:border-white/15 hover:bg-white/[0.07]"
                    } ${
                      visibleReplyCount > index
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-4 scale-[0.985] opacity-0"
                    }`}
                    style={{
                      transitionDuration: "420ms",
                      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {bestIndex === index && (
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-white">
                        Best Reply
                      </div>
                    )}

                    <p className="mb-4 text-base leading-8 md:text-lg">
                      {reply.text}
                    </p>

                    <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
                      <div className={`rounded-2xl border p-3 text-center ${selectedTone.panel}`}>
                        <div className="text-lg font-bold">
                          {reply.scores.confidence}/10
                        </div>
                        <div className="mt-1 text-white/45">Confidence</div>
                      </div>

                      <div className={`rounded-2xl border p-3 text-center ${selectedTone.panel}`}>
                        <div className="text-lg font-bold">
                          {reply.scores.engagement}/10
                        </div>
                        <div className="mt-1 text-white/45">Engagement</div>
                      </div>

                      <div className={`rounded-2xl border p-3 text-center ${selectedTone.panel}`}>
                        <div className="text-lg font-bold">
                          {reply.scores.responseChance}/10
                        </div>
                        <div className="mt-1 text-white/45">Reply Rate</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sentReplyIndex !== index && (
                        <button
                          onClick={() => {
                            setSentReplyIndex(index);
                            // Append turn with chosen reply
                            if (currentThreadId) {
                              const turn: ThreadTurn = {
                                id: `turn-${Date.now()}`,
                                createdAt: Date.now(),
                                userMessage: conversation,
                                tone,
                                goal,
                                userContext,
                                analysis,
                                replies,
                                bestIndex,
                                chosenReply: reply.text,
                              };

                              appendTurn(turn);
                            }

                            // Reset for next turn
                            setConversation("");
                            setReplies([]);
                            setBestIndex(null);
                            setAnalysis(null);
                            setVisibleReplyCount(0);
                            setAnalysisVisible(false);
                            setPreviewVisible(false);
                          }}
                          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-[350ms] ease-spring transform hover:scale-105 active:scale-95 hover:shadow-[0_6px_18px_rgba(5,150,105,0.4)] disabled:opacity-50 disabled:hover:scale-100"
                        >
                          ✓ Mark as Sent
                        </button>
                      )}

                      {sentReplyIndex === index && (
                        <div className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 text-center">
                          ✓ Sent & Saved
                        </div>
                      )}

                      <button
                        onClick={() => copyToClipboard(reply.text, index)}
                        className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-[350ms] ease-spring transform hover:scale-110 active:scale-[0.97] ${
                          copiedIndex === index
                            ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-[0_8px_24px_rgba(34,197,94,0.5)]"
                            : "bg-white text-black hover:shadow-[0_8px_24px_rgba(255,255,255,0.3)]"
                        }`}
                      >
                        {copiedIndex === index ? "✓ Copied!" : "Copy"}
                      </button>

                      {/* MVP Features: Rate Reply */}
                      <button
                        onClick={() => mvpFeatures.rateReply(reply.text, 1)}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                          mvpFeatures.replyRatings[reply.text] === 1
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)]"
                            : "border border-green-400/30 bg-green-500/10 text-green-100 hover:border-green-400/50 hover:bg-green-500/20"
                        }`}
                        title="This helped!"
                      >
                        👍
                      </button>

                      <button
                        onClick={() => mvpFeatures.rateReply(reply.text, -1)}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition-all duration-[350ms] ease-spring transform hover:scale-120 active:scale-[0.95] ${
                          mvpFeatures.replyRatings[reply.text] === -1
                            ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-[0_6px_18px_rgba(239,68,68,0.5)]"
                            : "border border-red-400/30 bg-red-500/10 text-red-100 hover:border-red-400/50 hover:bg-red-500/20 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
                        }`}
                        title="Didn't help"
                      >
                        👎
                      </button>

                      {/* MVP Features: Favorite Reply */}
                      <button
                        onClick={() => mvpFeatures.toggleFavorite(reply.text)}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition-all duration-[350ms] ease-spring transform hover:scale-120 active:scale-[0.95] ${
                          mvpFeatures.favorites.includes(reply.text)
                            ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-[0_6px_18px_rgba(234,179,8,0.5)]"
                            : "border border-yellow-400/30 bg-yellow-500/10 text-yellow-100 hover:border-yellow-400/50 hover:bg-yellow-500/20 hover:shadow-[0_4px_12px_rgba(234,179,8,0.3)]"
                        }`}
                        title="Save this reply"
                      >
                        {mvpFeatures.favorites.includes(reply.text) ? "⭐" : "☆"}
                      </button>

                      <button
                        onClick={() => setTone("flirty")}
                        className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/15 px-4 py-2 text-sm font-bold text-fuchsia-100 transition-all duration-[350ms] ease-spring transform hover:scale-105 active:scale-95 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/25 hover:shadow-[0_6px_18px_rgba(232,121,249,0.4)]"
                      >
                        Make Flirty
                      </button>

                      <button
                        onClick={() => setTone("confident")}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 transition-all duration-[350ms] ease-spring transform hover:scale-105 active:scale-95 hover:border-cyan-400/50 hover:bg-cyan-500/25 hover:shadow-[0_6px_18px_rgba(34,211,238,0.4)]"
                      >
                        Make Bolder
                      </button>

                      <button
                        onClick={() => setTone("funny")}
                        className="rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-100 transition-all duration-[350ms] ease-spring transform hover:scale-105 active:scale-95 hover:border-amber-400/50 hover:bg-amber-500/25 hover:shadow-[0_6px_18px_rgba(245,158,11,0.4)]"
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
