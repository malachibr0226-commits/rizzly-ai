import type { OutcomeStatus, Thread } from "@/lib/analytics";

export type UsageAction = "generate" | "screenshot" | "voice";

export type SavedPersona = {
  id: string;
  name: string;
  profileName: string;
  voice: string;
  notes: string;
  createdAt: number;
  lastUsedAt: number;
};

export type UsageSnapshot = {
  dayKey: string;
  resetLabel: string;
  limits: Record<UsageAction, number>;
  used: Record<UsageAction, number>;
  remaining: Record<UsageAction, number>;
};

type StoredUsageState = {
  dayKey: string;
  used: Record<UsageAction, number>;
};

const PERSONAS_KEY = "rizzly-saved-personas-v1";
const USAGE_KEY = "rizzly-usage-budget-v1";

const DEFAULT_LIMITS: Record<UsageAction, number> = {
  generate: 25,
  screenshot: 10,
  voice: 8,
};

function truncate(text: string, maxLength: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getResetLabel() {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);

  return tomorrow.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function buildSnapshot(used: Record<UsageAction, number>, dayKey = getDayKey()): UsageSnapshot {
  return {
    dayKey,
    resetLabel: getResetLabel(),
    limits: DEFAULT_LIMITS,
    used,
    remaining: {
      generate: Math.max(0, DEFAULT_LIMITS.generate - used.generate),
      screenshot: Math.max(0, DEFAULT_LIMITS.screenshot - used.screenshot),
      voice: Math.max(0, DEFAULT_LIMITS.voice - used.voice),
    },
  };
}

function readUsageState(): StoredUsageState {
  const today = getDayKey();

  if (typeof window === "undefined") {
    return {
      dayKey: today,
      used: { generate: 0, screenshot: 0, voice: 0 },
    };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(USAGE_KEY) || "null") as
      | StoredUsageState
      | null;

    if (!parsed || parsed.dayKey !== today) {
      const resetState: StoredUsageState = {
        dayKey: today,
        used: { generate: 0, screenshot: 0, voice: 0 },
      };
      window.localStorage.setItem(USAGE_KEY, JSON.stringify(resetState));
      return resetState;
    }

    return {
      dayKey: today,
      used: {
        generate: Number(parsed.used?.generate || 0),
        screenshot: Number(parsed.used?.screenshot || 0),
        voice: Number(parsed.used?.voice || 0),
      },
    };
  } catch {
    return {
      dayKey: today,
      used: { generate: 0, screenshot: 0, voice: 0 },
    };
  }
}

function writeUsageState(state: StoredUsageState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function getUsageSnapshot(): UsageSnapshot {
  const state = readUsageState();
  return buildSnapshot(state.used, state.dayKey);
}

export function consumeUsageAction(action: UsageAction): {
  allowed: boolean;
  snapshot: UsageSnapshot;
  message?: string;
} {
  const state = readUsageState();
  const currentUsed = state.used[action] || 0;
  const limit = DEFAULT_LIMITS[action];

  if (currentUsed >= limit) {
    return {
      allowed: false,
      snapshot: buildSnapshot(state.used, state.dayKey),
      message: `Daily ${action} limit reached for the free public mode. It resets at ${getResetLabel()}.`,
    };
  }

  const nextState: StoredUsageState = {
    ...state,
    used: {
      ...state.used,
      [action]: currentUsed + 1,
    },
  };

  writeUsageState(nextState);

  return {
    allowed: true,
    snapshot: buildSnapshot(nextState.used, nextState.dayKey),
  };
}

export function readSavedPersonas(): SavedPersona[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(PERSONAS_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as SavedPersona[]) : [];
  } catch {
    return [];
  }
}

function writeSavedPersonas(personas: SavedPersona[]) {
  if (typeof window === "undefined") {
    return personas;
  }

  try {
    window.localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
  } catch {
    // ignore quota errors
  }

  return personas;
}

export function savePersonaDraft(input: {
  profileName: string;
  voice: string;
  notes: string;
}): SavedPersona[] {
  const name = input.profileName.trim() || `Persona ${new Date().toLocaleDateString()}`;
  const personas = readSavedPersonas();
  const now = Date.now();

  const updated: SavedPersona[] = [
    {
      id: `persona-${now}`,
      name,
      profileName: input.profileName.trim(),
      voice: input.voice.trim(),
      notes: input.notes.trim(),
      createdAt: now,
      lastUsedAt: now,
    },
    ...personas.filter(
      (persona) =>
        persona.name.toLowerCase() !== name.toLowerCase() &&
        persona.profileName.toLowerCase() !== input.profileName.trim().toLowerCase(),
    ),
  ].slice(0, 4);

  return writeSavedPersonas(updated);
}

export function touchPersona(personaId: string): SavedPersona[] {
  const personas = readSavedPersonas().map((persona) =>
    persona.id === personaId
      ? {
          ...persona,
          lastUsedAt: Date.now(),
        }
      : persona,
  );

  return writeSavedPersonas(personas.sort((a, b) => b.lastUsedAt - a.lastUsedAt));
}

export function getOutcomeCoach(outcome?: OutcomeStatus | null) {
  switch (outcome) {
    case "warm":
      return {
        title: "Momentum is on your side",
        detail: "Stay light and specific. Your next move should deepen the vibe, not overplay it.",
        nextStep: "Ask one easy follow-up or turn it into a plan while the energy is still warm.",
        accent: "border-emerald-400/25 bg-emerald-500/10 text-emerald-50",
      };
    case "neutral":
      return {
        title: "Keep it easy",
        detail: "They are still there, but the energy is mixed. Match their pace and avoid forcing intensity.",
        nextStep: "Use a low-pressure question or a simple callback to something they already engaged with.",
        accent: "border-cyan-400/25 bg-cyan-500/10 text-cyan-50",
      };
    case "cold":
      return {
        title: "Pull back and reset",
        detail: "The thread needs less pressure and more breathing room before the next move.",
        nextStep: "Wait, then send something shorter, calmer, and less outcome-focused.",
        accent: "border-amber-400/25 bg-amber-500/10 text-amber-50",
      };
    case "no-reply":
      return {
        title: "Do not chase the silence",
        detail: "Treat this like a timing problem first, not a persuasion problem.",
        nextStep: "Give space, then reopen with a fresh angle instead of double-texting the same energy.",
        accent: "border-rose-400/25 bg-rose-500/10 text-rose-50",
      };
    default:
      return {
        title: "Track the real outcome",
        detail: "Each marked result trains the thread memory and makes future suggestions more context-aware.",
        nextStep: "After they answer, tag the result here so the next replies adapt faster.",
        accent: "border-white/10 bg-white/5 text-white/85",
      };
  }
}

export function buildMemoryPrimer(
  threads: Thread[],
  currentThreadId: string | null,
  favorites: string[],
  replyRatings: Record<string, number>,
): string {
  const currentThread = threads.find((thread) => thread.id === currentThreadId);
  const successfulTurns = threads
    .flatMap((thread) =>
      thread.turns
        .filter((turn) => turn.outcomeStatus === "warm" || turn.outcomeStatus === "neutral")
        .map((turn) => ({
          tone: turn.tone,
          goal: turn.goal,
          chosenReply: turn.chosenReply || turn.replies[turn.bestIndex ?? 0]?.text || "",
        })),
    )
    .filter((turn) => turn.chosenReply)
    .slice(-4);

  const positivelyRatedReplies = Object.entries(replyRatings)
    .filter(([, rating]) => rating > 0)
    .map(([text]) => text);

  const onBrandReplies = [...new Set([...favorites, ...positivelyRatedReplies])]
    .filter(Boolean)
    .slice(0, 3);

  const parts: string[] = [];

  if (currentThread?.profileName) {
    parts.push(`Active contact label: ${currentThread.profileName}.`);
  }

  if (successfulTurns.length > 0) {
    parts.push(
      [
        "Recent wins to stay aligned with:",
        ...successfulTurns.map(
          (turn) =>
            `- ${turn.tone}/${turn.goal}: ${truncate(turn.chosenReply, 120)}`,
        ),
      ].join("\n"),
    );
  }

  if (onBrandReplies.length > 0) {
    parts.push(
      [
        "Saved on-brand reply signals:",
        ...onBrandReplies.map((reply) => `- ${truncate(reply, 110)}`),
      ].join("\n"),
    );
  }

  return parts.join("\n\n").trim();
}
