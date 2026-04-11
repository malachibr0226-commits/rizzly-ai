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
    eyebrow: "Reads the context",
    title: "Understands tone before drafting",
    body:
      "Rizzly looks at pacing, questions, and intent first so the reply feels like a natural continuation of the conversation.",
  },
  {
    eyebrow: "Keeps your voice",
    title: "Natural, clear, and still you",
    body:
      "Shape playful, direct, thoughtful, or careful replies without robotic filler or overdone wording.",
  },
  {
    eyebrow: "Moves quickly",
    title: "Turn rough input into a sendable message",
    body:
      "Paste a chat, drop a screenshot, add a voice note, or refine your own draft in one focused workspace.",
  },
  {
    eyebrow: "Improves over time",
    title: "Built for follow-through",
    body:
      "Saved preferences, outcome tags, and thread memory help the next suggestion get more useful the more you use it.",
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    title: "Add the conversation or draft",
    body: "Paste the latest messages, upload a screenshot, transcribe a voice note, or start from your own draft.",
  },
  {
    step: "02",
    title: "Choose the direction",
    body: "Pick the goal, adjust the tone, and decide how direct or light you want the message to feel.",
  },
  {
    step: "03",
    title: "Send the best version",
    body: "Use the strongest option, save what worked, and make the next conversation easier to manage.",
  },
] as const;

const useCases = [
  "Personal chats and check-ins",
  "Mixed signals and follow-ups",
  "Plans, scheduling, and reconnects",
  "Work, family, and everyday conversations",
] as const;

const socialProof = [
  "Sounds more natural",
  "Cuts the overthinking",
  "Keeps follow-through simple",
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
        className="rounded-[32px] border border-slate-300/12 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94))] p-10 shadow-[0_18px_36px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-14"
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300/15 bg-slate-800/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              Why it feels smoother
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Built for real conversations, not AI-sounding filler
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">
              Each step is tuned to help you reply faster, keep your tone intact, and stay clear without forcing the wording.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              trackCtaClick("jump_to_studio", "features_section");
              onJumpToStudio();
            }}
            className="inline-flex items-center justify-center rounded-full border border-slate-200/20 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            {isSignedIn ? "Open your workspace" : "Try guest mode"}
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="mode-card flex h-full min-w-0 flex-col rounded-3xl border border-slate-300/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
            >
              <div className="mode-card-content flex flex-col h-full min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
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
              className="rounded-full border border-slate-300/12 bg-slate-800/70 px-3 py-1.5 text-slate-100"
            >
              {item}
            </span>
          ))}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            No card needed to try Free
          </span>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-300/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.9))] p-8 shadow-[0_18px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-12">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300/15 bg-slate-800/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              How it works
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              A simple path from context to a message you can send
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
              className="rounded-3xl border border-slate-300/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-7 shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
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
            <div className="inline-flex rounded-full border border-slate-300/15 bg-slate-800/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              Start faster
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Common starting points for everyday conversations
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">
              Pick a scenario, load the chat, and let Rizzly shape the next move around the tone and level of clarity you want.
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
              className="rounded-2xl border border-slate-300/10 bg-black/20 p-4 text-left transition hover:border-slate-200/20 hover:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white">{scenario.label}</div>
                <span className="rounded-full border border-slate-300/12 bg-slate-800/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200/85">
                  {scenario.tone}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/60">{getScenarioNote(scenario.goal)}</p>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                Load this starter
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="faq" className="rounded-[32px] border border-slate-300/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.9))] p-8 shadow-[0_18px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-12">
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
              className="rounded-3xl border border-slate-300/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-7 py-5 text-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
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
