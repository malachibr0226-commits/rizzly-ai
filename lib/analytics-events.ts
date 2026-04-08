/**
 * Lightweight event tracking layer.
 * Logs to console in dev. Wire to PostHog / Mixpanel / Amplitude
 * by replacing `dispatch` with the provider's `track()` call.
 */

type EventProperties = Record<string, string | number | boolean | null>;

const EVENT_QUEUE_KEY = "rizzly-events-v1";
const MAX_QUEUE = 200;

let provider: ((name: string, props: EventProperties) => void) | null = null;

/** Plug in an external analytics provider (PostHog, Mixpanel, etc.) */
export function setAnalyticsProvider(
  track: (name: string, props: EventProperties) => void,
) {
  provider = track;

  // Flush any queued events
  const queued = loadQueue();
  if (queued.length > 0) {
    queued.forEach((e) => provider?.(e.name, e.props));
    clearQueue();
  }
}

function loadQueue(): Array<{ name: string; props: EventProperties }> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(EVENT_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function clearQueue() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EVENT_QUEUE_KEY);
  } catch {
    // ignore
  }
}

function enqueue(name: string, props: EventProperties) {
  if (typeof window === "undefined") return;
  try {
    const queue = loadQueue();
    queue.push({ name, props });
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // quota exceeded — silently drop
  }
}

function dispatch(name: string, props: EventProperties = {}) {
  const enriched: EventProperties = {
    ...props,
    timestamp: Date.now(),
    url: typeof window !== "undefined" ? window.location.pathname : "/",
  };

  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${name}`, enriched);
  }

  if (provider) {
    provider(name, enriched);
  } else {
    enqueue(name, enriched);
  }
}

// ── Event helpers ───────────────────────────────────────────────

export function trackGenerate(tone: string, goal: string, category: string, replyCount: number) {
  dispatch("reply_generated", { tone, goal, category, replyCount });
}

export function trackCopy(replyIndex: number) {
  dispatch("reply_copied", { replyIndex });
}

export function trackSend(replyIndex: number) {
  dispatch("reply_sent", { replyIndex });
}

export function trackRate(replyText: string, rating: number) {
  dispatch("reply_rated", { rating, textLength: replyText.length });
}

export function trackFavorite(action: "add" | "remove") {
  dispatch("reply_favorited", { action });
}

export function trackOutcome(outcome: string) {
  dispatch("outcome_recorded", { outcome });
}

export function trackToneChange(from: string, to: string) {
  dispatch("tone_changed", { from, to });
}

export function trackScreenshotUpload(lineCount: number) {
  dispatch("screenshot_uploaded", { lineCount });
}

export function trackThreadCreated() {
  dispatch("thread_created", {});
}

export function trackThreadDeleted() {
  dispatch("thread_deleted", {});
}

export function trackAchievementUnlocked(achievementId: string) {
  dispatch("achievement_unlocked", { achievementId });
}

export function trackVoiceNote(durationEstimate: number) {
  dispatch("voice_note_recorded", { durationEstimate });
}

export function trackError(context: string, message: string) {
  dispatch("error_occurred", { context, message: message.slice(0, 200) });
}
