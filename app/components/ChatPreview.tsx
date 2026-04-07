"use client";

interface ChatPreviewProps {
  chatLines: string[];
  bestReplyText: string | null;
  previewVisible: boolean;
  bubbleClass: string;
}

export function ChatPreview({ chatLines, bestReplyText, previewVisible, bubbleClass }: ChatPreviewProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">How it&apos;ll look</h2>
        <div className="text-xs font-medium text-white/40">iMessage preview</div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#0b0c10] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-white/10 px-4 py-1 text-sm text-white/60">Today</div>
        </div>

        <div className="space-y-3">
          {chatLines.length > 0 ? (
            chatLines.map((line: string, index: number) => {
              const isYou = line.toLowerCase().startsWith("you:");
              const content = line
                .replace(/^them:\s*/i, "")
                .replace(/^her:\s*/i, "")
                .replace(/^you:\s*/i, "");

              return (
                <div key={`${line}-${index}`} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                      isYou ? "bg-[#0A84FF] text-white" : "bg-[#2c2c2e] text-white"
                    }`}
                  >
                    {content}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-white/35">Paste a conversation to preview it here.</div>
          )}

          {bestReplyText && (
            <div className="flex justify-end pt-2">
              <div
                className={`max-w-[80%] rounded-[22px] px-4 py-3 text-sm font-medium leading-6 text-black shadow-[0_0_20px_rgba(52,199,89,0.35)] transition-all duration-500 ${
                  previewVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.97] opacity-0"
                } ${bubbleClass}`}
              >
                {bestReplyText}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
