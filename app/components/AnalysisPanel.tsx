"use client";

interface AnalysisPanelProps {
  analysis: {
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
  analysisVisible: boolean;
  panelClass: string;
}

const ANALYSIS_FIELDS: Array<{ key: string; label: string }> = [
  { key: "summary", label: "Summary" },
  { key: "toneUsed", label: "Tone applied" },
  { key: "strategy", label: "Strategy" },
  { key: "depthMode", label: "Thread mode" },
  { key: "userPattern", label: "Your pattern" },
  { key: "receiverPattern", label: "Receiver pattern" },
  { key: "languageStyle", label: "Language style" },
  { key: "adaptationNote", label: "Adaptation note" },
  { key: "coachNotes", label: "Coach notes" },
  { key: "timingWindow", label: "Timing window" },
  { key: "avoid", label: "Avoid" },
  { key: "vibe", label: "Current vibe" },
  { key: "strength", label: "Strength" },
  { key: "risk", label: "Risk" },
];

export function AnalysisPanel({ analysis, analysisVisible, panelClass }: AnalysisPanelProps) {
  return (
    <section
      className={`space-y-3 rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm transition-all duration-300 ${
        analysisVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <h2 className="bg-gradient-to-r from-white to-fuchsia-300 bg-clip-text text-xl font-bold text-transparent">
        What&apos;s Happening
      </h2>

      {ANALYSIS_FIELDS.map(({ key, label }) => {
        const value = analysis[key as keyof typeof analysis];
        if (!value || typeof value !== "string") return null;
        return (
          <div key={key} className={`rounded-2xl border bg-black/30 p-4 ${panelClass}`}>
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">{label}</div>
            <p>{value}</p>
          </div>
        );
      })}

      {analysis.nextMoves && analysis.nextMoves.length > 0 && (
        <div className={`rounded-2xl border bg-black/30 p-4 ${panelClass}`}>
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">Next 3 moves</div>
          <div className="space-y-2">
            {analysis.nextMoves.map((move, index) => (
              <div
                key={`${move}-${index}`}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/80"
              >
                <span className="mr-2 text-white/40">0{index + 1}</span>
                {move}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.replyBranches && analysis.replyBranches.length > 0 && (
        <div className={`rounded-2xl border bg-black/30 p-4 ${panelClass}`}>
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">Branch planner</div>
          <div className="grid gap-3 md:grid-cols-3">
            {analysis.replyBranches.map((branch, index) => (
              <div key={`${branch.scenario}-${index}`} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {branch.scenario}
                </div>
                <div className="mt-2 text-sm font-semibold text-white/85">{branch.move}</div>
                <div className="mt-2 text-xs leading-5 text-white/55">{branch.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
