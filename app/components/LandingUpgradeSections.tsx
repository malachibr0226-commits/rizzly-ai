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
    eyebrow: "Reads the energy",
    title: "Chemistry before copy",
    body:
      "Rizzly looks at warmth, pacing, questions, and subtext first so the reply feels smooth, placed, and emotionally on-beat.",
  },
  {
    eyebrow: "Keeps your voice",
    title: "Flirty when you want, grounded when you need",
    body:
      "Match playful, soft, direct, or careful energy without slipping into robotic filler or lines that feel try-hard.",
  },
  {
    eyebrow: "Moves fast",
    title: "Go from messy input to a message that lands",
    body:
      "Paste the chat, drop in a screenshot, add a voice note, or refine your own draft in a flow that stays quick and natural.",
  },
  {
    eyebrow: "Gets sharper",
    title: "Built for momentum and follow-through",
    body:
      "Saved personas, outcome tags, and thread memory help the next reply feel even better the more you use it.",
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    title: "Drop in the chat or your draft",
    body: "Paste the last few lines, upload a screenshot, transcribe a voice note, or paste the message you want improved.",
  },
  {
    step: "02",
    title: "Choose the energy",
    body: "Pick the goal, set the tone, and decide how subtle or strong you want the reply to land.",
  },
  {
    step: "03",
    title: "Send the strongest move",
    body: "Copy the best option, save what worked, and keep improving the next thread over time.",
  },
] as const;

const useCases = [
  "Dating apps and warm restarts",
  "Mixed-signal texting",
  "Plan locking and follow-ups",
  "Friendship, work, family, and ex situations",
] as const;

const socialProof = [
  "Feels natural instead of robotic",
  "Helps the chemistry stay easy",
  "Makes follow-through feel lighter",
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
    <div className="mb-8 space-y-10 max-w-7xl mx-auto">
      <section
        id="features"
        className="rounded-[32px] border border-rose-200/12 bg-[linear-gradient(135deg,rgba(37,18,52,0.92),rgba(19,17,33,0.96))] p-10 shadow-[0_22px_50px_rgba(76,29,149,0.18)] backdrop-blur-xl sm:p-14"
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Why it feels smoother
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Built for real chemistry, not stiff AI one-liners
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">
              Every step is tuned to help you reply faster, keep your tone intact, and stay warm, playful, or clear without forcing it.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              trackCtaClick("jump_to_studio", "features_section");
              onJumpToStudio();
            }}
            className="inline-flex items-center justify-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20"
          >
            {isSignedIn ? "Open your studio" : "Try guest mode"}
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="mode-card flex h-full min-w-0 flex-col rounded-3xl border border-rose-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-8 shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
            >
              <div className="mode-card-content flex flex-col h-full min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                  {card.eyebrow}
                </div>
                <div className="mt-2 text-base font-semibold text-white break-words">{card.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/60 break-words">{card.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/65">
          {socialProof.map((item) => (
            <span
              key={item}
              className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-50"
            >
              {item}
            </span>
          ))}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            No card needed to try Free
          </span>
        </div>
      </section>

      <section className="rounded-[32px] border border-fuchsia-200/10 bg-[linear-gradient(135deg,rgba(27,16,39,0.92),rgba(15,20,33,0.96))] p-8 shadow-[0_22px_50px_rgba(30,41,59,0.16)] backdrop-blur-xl sm:p-12">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
              How it works
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              A smoother path from mixed signals to a message that lands
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/55">
            {useCases.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          {workflowSteps.map((step) => (
            <div
              key={step.step}
              className="rounded-3xl border border-fuchsia-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-7 shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/80">
                Step {step.step}
              </div>
              <div className="mt-2 text-base font-semibold text-white">{step.title}</div>
              <p className="mt-2 text-sm leading-6 text-white/60">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Start faster
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Popular romantic and real-life starting points
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">
              Pick a scenario, load the chat, and let Rizzly shape the next move around the warmth, tension, or playful energy you want.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <button
              key={scenario.label}
              type="button"
              onClick={() => {
                trackCtaClick(`playbook_${scenario.goal}`, "landing_sections");
                onChooseScenario(scenario);
                onJumpToStudio();
              }}
              className="rounded-2xl border border-rose-200/10 bg-black/20 p-4 text-left transition hover:border-rose-200/20 hover:bg-rose-500/5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white">{scenario.label}</div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/65">
                  {scenario.tone}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/60">{getScenarioNote(scenario.goal)}</p>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                Load this starter
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="faq" className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(23,18,34,0.92),rgba(15,18,28,0.96))] p-8 shadow-[0_22px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-12">
        <div className="mb-4">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            FAQ
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Quick answers before you send anything
          </h2>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-7 py-5 text-white/80 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                {item.question}
              </summary>
              <p className="mt-2 text-sm leading-6 text-white/60">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
