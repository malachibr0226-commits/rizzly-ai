import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { ensureTrustedOrigin, validateAudioUpload } from "@/lib/security";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const blockedOrigin = ensureTrustedOrigin(req);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to transcribe voice notes." },
      { status: 401 },
    );
  }

  const { limited, remaining } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Voice transcription is unavailable right now." },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const speaker = formData.get("speaker");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 },
      );
    }

    const audioValidationError = validateAudioUpload(file);
    if (audioValidationError) {
      return NextResponse.json(
        { error: audioValidationError },
        { status: 400 },
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      language: "en",
      prompt:
        "Transcribe this voice note accurately. Keep punctuation natural. Preserve slang and texting tone.",
    });

    const speakerLabel =
      typeof speaker === "string" && speaker.toLowerCase() === "you"
        ? "You"
        : "Them";

    return NextResponse.json({
      text: transcription.text.trim(),
      conversationLine: `${speakerLabel}: ${transcription.text.trim()}`,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe voice note." },
      { status: 500 },
    );
  }
}
