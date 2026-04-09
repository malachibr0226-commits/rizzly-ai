import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "Rizzly AI — Smarter replies for real conversations";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at top left, rgba(236,72,153,0.28), transparent 30%), radial-gradient(circle at bottom right, rgba(34,211,238,0.22), transparent 28%), linear-gradient(135deg, #12091f 0%, #1a0f2e 55%, #0b1119 100%)",
          color: "white",
          fontFamily: "Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 28,
            opacity: 0.9,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "linear-gradient(135deg, #ec4899, #22d3ee)",
            }}
          />
          Rizzly AI
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05 }}>
            Better replies. Better outcomes.
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>
            Built for real texting with support for pasted chats, screenshots, and voice notes.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "rgba(255,255,255,0.82)" }}>
          <div>Reply smarter</div>
          <div>•</div>
          <div>Move faster</div>
        </div>
      </div>
    ),
    size,
  );
}
