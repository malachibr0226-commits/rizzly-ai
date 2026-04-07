/**
 * Sparkline Reply Cards Component
 * Renders reply cards with rating and favorite interactions
 */

"use client";

import React from "react";

export interface Reply {
  id: string;
  text: string;
  template?: string;
  image?: string; // Optional image URL or base64
}

interface ReplyCardsProps {
  replies: Reply[];
  selectedIndex: number | null;
  onSelectReply: (index: number) => void;
  favorites: string[];
  replyRatings: Record<string, number>;
  onRateReply: (replyId: string, rating: number) => void;
  onToggleFavorite: (replyId: string) => void;
}

export function ReplyCards({
  replies,
  selectedIndex,
  onSelectReply,
  favorites,
  replyRatings,
  onRateReply,
  onToggleFavorite,
}: ReplyCardsProps) {
  if (replies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No replies yet. Try generating some!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replies.map((reply, index) => {
        const isSelected = selectedIndex === index;
        const rating = replyRatings[reply.id];
        const isFavorite = favorites.includes(reply.id);

        return (
          <div
            key={reply.id}
            className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
              isSelected
                ? "border-violet-200 bg-violet-100 bg-opacity-10 shadow-[0_2px_8px_rgba(126,151,163,0.10)]"
                : "border-white border-opacity-12 hover:border-white hover:border-opacity-24 hover:bg-white/4 hover:scale-101"
            }`}
            onClick={() => onSelectReply(index)}
          >
            {/* Reply image (if present) */}
            {reply.image && (
              <div className="mb-3">
                <img
                  src={reply.image}
                  alt="Reply attachment"
                  className="max-h-40 rounded-lg border border-white/10 shadow-sm object-contain mx-auto"
                />
              </div>
            )}
            {/* Reply text */}
            <p className="text-white text-sm leading-relaxed mb-3">
              {reply.text}
            </p>

            {/* Interaction buttons */}
            <div className="flex gap-2 items-center justify-between">
              <div className="flex gap-2">
                {/* Thumbs up/down */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRateReply(reply.id, 1);
                  }}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    rating === 1
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-white bg-opacity-8 text-gray-300 hover:bg-opacity-16"
                  }`}
                  title="This helped!"
                >
                  👍
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRateReply(reply.id, -1);
                  }}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    rating === -1
                      ? "bg-rose-200 text-rose-900"
                      : "bg-white bg-opacity-8 text-gray-300 hover:bg-opacity-16"
                  }`}
                  title="Didn't help"
                >
                  👎
                </button>
              </div>

              {/* Favorite star */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(reply.id);
                }}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  isFavorite
                    ? "bg-amber-100 text-amber-900"
                    : "bg-white bg-opacity-8 text-gray-300 hover:bg-opacity-16"
                }`}
                title="Save this reply"
              >
                {isFavorite ? "⭐ Saved" : "☆ Save"}
              </button>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="mt-3 pt-3 border-t border-violet-100 border-opacity-30 text-xs text-violet-200">
                ✓ Selected
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
