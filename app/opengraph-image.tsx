import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "Rizzly AI — Clear replies, better timing";

export default function OpenGraphImage() {
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
            "radial-gradient(circle at top, rgba(148,163,184,0.10) 0%, transparent 30%), linear-gradient(160deg, #0c1118 0%, #111827 55%, #0d141d 100%)",
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
              background: "#94a3b8",
            }}
          />
          Rizzly AI
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05 }}>
            Clear replies, in your voice.
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.78)", lineHeight: 1.4 }}>
            Built for personal and everyday conversations with support for pasted chats, screenshots, and voice notes.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "rgba(255,255,255,0.82)" }}>
          <div>Stay clear</div>
          <div>•</div>
          <div>Follow through</div>
        </div>
      </div>
    ),
    size,
  );
}
