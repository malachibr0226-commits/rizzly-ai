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
    <div className="mb-8 space-y-16 max-w-7xl mx-auto">
      <section
        id="features"
        className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-10 sm:p-14"
      >
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/25">
              Why it works
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Built for real conversations
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/35 md:text-base">
              Each step is tuned to help you reply faster and keep your tone intact.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              trackCtaClick("jump_to_studio", "features_section");
              onJumpToStudio();
            }}
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            {isSignedIn ? "Open workspace" : "Try free"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="mode-card flex h-full min-w-0 flex-col rounded-2xl border border-white/[0.05] bg-white/[0.02] p-7"
            >
              <div className="mode-card-content flex flex-col h-full min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/25">
                  {card.eyebrow}
                </div>
                <div className="mt-3 text-sm font-semibold text-white/80">{card.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/30">{card.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-white/25">
          {socialProof.map((item) => (
            <span key={item}>{item}</span>
          ))}
          <span className="text-white/15">·</span>
          <span>No card needed to try Free</span>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/25">
              How it works
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              From context to a message you can send
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5 text-[11px] text-white/25">
            {useCases.map((item, i) => (
              <span key={item}>
                {item}{i < useCases.length - 1 && <span className="ml-2.5 text-white/10">·</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          {workflowSteps.map((step) => (
            <div
              key={step.step}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-7"
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/20">
                Step {step.step}
              </div>
              <div className="mt-3 text-sm font-semibold text-white/80">{step.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-white/30">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="my-8 h-px bg-white/[0.06]" />

        <div className="mb-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/25">
            Quick start
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Common starting points
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/35 md:text-base">
            Pick a scenario, load the chat, and let Rizzly shape the next move.
          </p>
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
              className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 text-left transition hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white/80">{scenario.label}</div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                  {scenario.tone}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/30">{getScenarioNote(scenario.goal)}</p>
              <div className="mt-4 text-[10px] font-medium uppercase tracking-[0.25em] text-blue-400/60">
                Load this starter →
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="faq" className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12">
        <div className="mb-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/25">
            FAQ
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Quick answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-6 py-5"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-white/70">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-white/30">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
