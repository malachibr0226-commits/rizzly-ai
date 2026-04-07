import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local." },
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
