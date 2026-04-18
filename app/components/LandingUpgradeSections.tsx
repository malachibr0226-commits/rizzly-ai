"use client";

import { trackCtaClick } from "@/lib/analytics-events";
import type { GoalKey, ToneKey } from "@/lib/analytics";

type QuickStartScenario = {
  label: string;
  tone: ToneKey;
  goal: GoalKey;
  conversation: string;
};

const featureCards = [
  {
    eyebrow: "Context-aware",
    title: "Understands tone before drafting",
    body:
      "Rizzly reads pacing, questions, and intent first so the reply feels like a natural continuation — not a template.",
    icon: "🧠",
    accent: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  {
    eyebrow: "Your voice",
    title: "Natural, clear, and still you",
    body:
      "Shape playful, direct, thoughtful, or careful replies without robotic filler or overdone wording.",
    icon: "✦",
    accent: "from-fuchsia-500/20 to-pink-500/10",
    border: "border-fuchsia-500/20",
    dot: "bg-fuchsia-400",
  },
  {
    eyebrow: "Fast workflow",
    title: "Rough input to a sendable message",
    body:
      "Paste a chat, drop a screenshot, add a voice note, or refine your own draft in one focused workspace.",
    icon: "⚡",
    accent: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  {
    eyebrow: "Gets smarter",
    title: "Built for follow-through",
    body:
      "Saved preferences, outcome tags, and thread memory make the next suggestion more useful every session.",
    icon: "📈",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    color: "from-blue-500 to-indigo-500",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
    title: "Add the conversation or draft",
    body: "Paste the latest messages, upload a screenshot, transcribe a voice note, or start from your own draft.",
  },
  {
    step: "02",
    color: "from-fuchsia-500 to-pink-500",
    glow: "shadow-[0_0_20px_rgba(217,70,239,0.3)]",
    title: "Choose the direction",
    body: "Pick the goal, adjust the tone, and decide how direct or light you want the message to feel.",
  },
  {
    step: "03",
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    title: "Send the best version",
    body: "Use the strongest option, save what worked, and make the next conversation easier to manage.",
  },
] as const;

const useCases = [
  "Personal chats",
  "Follow-ups",
  "Plans & scheduling",
  "Reconnects",
] as const;

const socialProof = [
  { label: "Sounds more natural", icon: "✓" },
  { label: "Cuts the overthinking", icon: "✓" },
  { label: "Keeps follow-through simple", icon: "✓" },
] as const;

const faqItems = [
  {
    question: "Can I use it before creating an account?",
    answer:
      "Yes. Guest mode lets you try the studio immediately. Sign in when you want saved history, cloud sync, and Pro tools.",
  },
  {
    question: "What makes Rizzly better than generic AI chat prompts?",
    answer:
      "It is tuned for real texting: matching tone, keeping replies short, and focusing on momentum instead of generic long-form advice.",
  },
  {
    question: "Can it handle screenshots and voice notes too?",
    answer:
      "Yes. You can import screenshots for transcript extraction and transcribe voice notes when you want to move faster.",
  },
  {
    question: "What does Pro unlock?",
    answer:
      "More daily reply volume, deeper thread intel, synced history across devices, and a smoother overall workflow.",
  },
] as const;

function getScenarioNote(goal: GoalKey) {
  switch (goal) {
    case "restart":
      return "Re-open a thread without sounding too eager.";
    case "flirt":
      return "Turn the energy playful without forcing it.";
    case "plan":
      return "Move from banter into a real plan cleanly.";
    case "clarify":
      return "Clear up mixed signals with less friction.";
    case "repair":
      return "Reset the tone after an awkward or cold exchange.";
    default:
      return "Get a strong next move for the current vibe.";
  }
}

function getScenarioAccent(goal: GoalKey) {
  switch (goal) {
    case "restart": return { border: "border-sky-400/25", bg: "bg-sky-500/[0.06]", tag: "bg-sky-500/10 text-sky-200 border-sky-400/20", arrow: "text-sky-400" };
    case "flirt":   return { border: "border-fuchsia-400/25", bg: "bg-fuchsia-500/[0.06]", tag: "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/20", arrow: "text-fuchsia-400" };
    case "plan":    return { border: "border-emerald-400/25", bg: "bg-emerald-500/[0.06]", tag: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20", arrow: "text-emerald-400" };
    default:        return { border: "border-white/10", bg: "bg-white/[0.03]", tag: "bg-white/5 text-white/60 border-white/10", arrow: "text-white/40" };
  }
}

export function LandingUpgradeSections({
  isSignedIn,
  scenarios,
  onChooseScenario,
  onJumpToStudio,
}: {
  isSignedIn: boolean;
  scenarios: QuickStartScenario[];
  onChooseScenario: (scenario: QuickStartScenario) => void;
  onJumpToStudio: () => void;
}) {
  return (
    <div className="mb-8 space-y-14 max-w-7xl mx-auto">

      {/* ── Features ─────────────────────────────────────────────── */}
      <section
        id="features"
        className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-10 sm:p-14"
      >
        {/* subtle corner glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Why it works
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Built for real conversations
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
              Each step is tuned to help you reply faster and keep your tone intact.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              trackCtaClick("jump_to_studio", "features_section");
              onJumpToStudio();
            }}
            className="cta-glow-btn inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/90 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
          >
            {isSignedIn ? "Open workspace" : "Try free →"}
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className={`feature-card flex h-full min-w-0 flex-col rounded-2xl border ${card.border} bg-gradient-to-br ${card.accent} p-6`}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl">
                {card.icon}
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${card.dot}`} />
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  {card.eyebrow}
                </div>
              </div>
              <div className="mt-2.5 text-sm font-bold text-white/90 leading-snug">{card.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-6">
          {socialProof.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[12px] text-white/45">
              <span className="text-emerald-400 font-bold">{item.icon}</span>
              {item.label}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-white/25">No card needed to try Free</span>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-8 sm:p-12">
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-fuchsia-700/10 blur-3xl" />

        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-fuchsia-300">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              How it works
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
              From context to a message you can send
            </h2>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {useCases.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/50">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-10 grid gap-4 lg:grid-cols-3">
          {workflowSteps.map((step) => (
            <div
              key={step.step}
              className="feature-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7"
            >
              <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} ${step.glow} text-sm font-black text-white`}>
                {step.step}
              </div>
              <div className="text-sm font-bold text-white/90 leading-snug">{step.title}</div>
              <p className="mt-2.5 text-sm leading-relaxed text-white/50">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="my-8 h-px bg-white/[0.07]" />

        <div className="mb-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Quick start
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Common starting points
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
            Pick a scenario, load the chat, and let Rizzly shape the next move.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const accent = getScenarioAccent(scenario.goal);
            return (
              <button
                key={scenario.label}
                type="button"
                onClick={() => {
                  trackCtaClick(`playbook_${scenario.goal}`, "landing_sections");
                  onChooseScenario(scenario);
                  onJumpToStudio();
                }}
                className={`scenario-card rounded-2xl border ${accent.border} ${accent.bg} p-5 text-left transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-white/90">{scenario.label}</div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${accent.tag}`}>
                    {scenario.tone}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/50">{getScenarioNote(scenario.goal)}</p>
                <div className={`mt-4 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent.arrow}`}>
                  Load starter
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-8 sm:p-12">
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-600/8 blur-3xl" />

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            FAQ
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Quick answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-5 transition-all open:border-white/[0.12] open:bg-white/[0.05]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white/80 group-open:text-white">
                <span>{item.question}</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition group-open:rotate-45 group-open:border-white/20 group-open:text-white/70">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-white/55 border-t border-white/[0.06] pt-4">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
