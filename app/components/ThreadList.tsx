"use client";

import type { Thread } from "@/lib/analytics";

interface ThreadListProps {
  threads: Thread[];
  currentThreadId: string | null;
  onLoadThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  showThreadForm: boolean;
  onShowThreadForm: (show: boolean) => void;
  threadName: string;
  onThreadNameChange: (name: string) => void;
  onCreateThread: (name: string) => void;
}

export function ThreadList({
  threads,
  currentThreadId,
  onLoadThread,
  onDeleteThread,
  showThreadForm,
  onShowThreadForm,
  threadName,
  onThreadNameChange,
  onCreateThread,
}: ThreadListProps) {
  if (threads.length === 0) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Your Conversations</h3>
          <p className="mt-1 text-xs text-white/50">Pick up where you left off.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/50">
          {threads.length}
        </div>
      </div>

      <div className="space-y-3">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`group relative w-full rounded-2xl border p-4 text-left transition ${
              currentThreadId === thread.id
                ? "border-fuchsia-400/30 bg-fuchsia-500/10 shadow-[0_0_24px_rgba(217,70,239,0.10)]"
                : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
          >
            <button
              type="button"
              onClick={() => onLoadThread(thread.id)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-white">{thread.name}</div>
                    <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                      {thread.turns.length} turns
                    </span>
                    {thread.lastOutcome && (
                      <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/45">
                        {thread.lastOutcome.replace("-", " ")}
                      </span>
                    )}
                  </div>
                  {thread.profileName && (
                    <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/35">
                      {thread.profileName}
                    </div>
                  )}
                  {thread.summary && (
                    <div className="mt-2 line-clamp-2 text-xs text-white/40">{thread.summary}</div>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
                    <span>Updated {new Date(thread.updatedAt).toLocaleString()}</span>
                    {typeof thread.successCount === "number" && typeof thread.totalTurns === "number" && thread.totalTurns > 0 && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-100">
                        {Math.round((thread.successCount / thread.totalTurns) * 100)}% positive
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">Open</div>
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteThread(thread.id);
              }}
              className="absolute right-2 top-2 hidden rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/20 group-hover:block"
              title="Delete thread"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {!showThreadForm && (
        <button
          type="button"
          onClick={() => onShowThreadForm(true)}
          className="mt-4 w-full rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-sm text-white/50 transition hover:border-white/40 hover:text-white/70"
        >
          + Start new thread
        </button>
      )}

      {showThreadForm && (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Thread name"
            value={threadName}
            onChange={(event) => onThreadNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCreateThread(threadName);
            }}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-500/20"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCreateThread(threadName)}
              className="flex-1 rounded-lg border border-fuchsia-400/30 bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                onShowThreadForm(false);
                onThreadNameChange("");
              }}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
