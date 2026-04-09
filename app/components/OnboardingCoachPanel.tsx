"use client";

import type { GoalKey, ToneKey } from "@/lib/analytics";

type PresetCard = {
  label: string;
  tone: ToneKey;
  goal: GoalKey;
  note: string;
};

const presetCards: PresetCard[] = [
  {
    label: "Playful restart",
    tone: "flirty",
    goal: "restart",
    note: "Best when the thread is warm but a little quiet.",
  },
  {
    label: "Direct plan",
    tone: "confident",
    goal: "plan",
    note: "Use when the vibe is good and you want to lock something in.",
  },
  {
    label: "Soft reset",
    tone: "apologetic",
    goal: "repair",
    note: "Good for mixed energy, awkward moments, or a colder reply.",
  },
] as const;

export function OnboardingCoachPanel({
  conversationReady,
  hasReplies,
  hasSavedPersona,
  isSignedIn,
  isPro,
  onJumpToStudio,
  onApplyPreset,
  onSavePersona,
}: {
  conversationReady: boolean;
  hasReplies: boolean;
  hasSavedPersona: boolean;
  isSignedIn: boolean;
  isPro: boolean;
  onJumpToStudio: () => void;
  onApplyPreset: (preset: PresetCard) => void;
  onSavePersona: () => void;
}) {
  const steps = [
    {
      label: "Paste a chat or draft",
      detail: "Drop in recent lines, import a screenshot, or paste the message you want improved.",
      complete: conversationReady,
    },
    {
      label: "Generate your first set",
      detail: "Let Rizzly give you multiple reply directions fast.",
      complete: hasReplies,
    },
    {
      label: "Save your voice",
      detail: "Store a persona so future suggestions sound more like you.",
      complete: hasSavedPersona,
    },
    {
      label: "Sync across devices",
      detail: "Sign in to keep your threads and personas available everywhere.",
      complete: isSignedIn,
    },
  ];

  const completedCount = steps.filter((step) => step.complete).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const nextMessage = !conversationReady
    ? "Paste 3 to 8 lines from the chat to get the cleanest read."
    : !hasReplies
      ? "You’re one step away — generate a few reply options now."
      : !hasSavedPersona
        ? "Save your current setup so future replies start closer to your natural tone."
        : !isSignedIn
          ? "Sign in when you want your threads and personas synced across devices."
          : !isPro
            ? "You’re set up well — Pro is the next unlock if you want more volume and speed."
            : "You’re fully dialed in. Keep using outcomes and saved personas to sharpen the next move.";

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Guided onboarding
          </div>
          <h2 className="mt-2 text-lg font-bold text-white md:text-xl">
            Get to a stronger reply in under a minute
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/60">{nextMessage}</p>
        </div>

        <div className="min-w-[120px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
          <div className="text-lg font-bold text-white">{progress}%</div>
          <div className="text-[11px] text-white/55">setup complete</div>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`rounded-xl border px-3 py-3 ${
              step.complete
                ? "border-emerald-400/25 bg-emerald-500/10"
                : "border-white/10 bg-black/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{step.complete ? "✅" : "•"}</span>
              <div className="text-sm font-semibold text-white">{step.label}</div>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/60">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-sm font-semibold text-white">Smart starter modes</div>
          <p className="mt-1 text-xs text-white/55">
            Pick a direction and Rizzly will tune the studio for that move.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {presetCards.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-white/20 hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-white">{preset.label}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100/80">
                  {preset.tone} · {preset.goal}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/55">{preset.note}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-sm font-semibold text-white">Best next move</div>
          <p className="mt-1 text-xs text-white/55">
            {isPro
              ? "Your Pro tools are live. Keep building reusable memory and outcome data."
              : "Free mode is great for testing. Upgrade later if you want more daily runs and synced memory."}
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={onJumpToStudio}
              className="rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Jump to the studio
            </button>
            <button
              type="button"
              onClick={onSavePersona}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              Save current setup
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
