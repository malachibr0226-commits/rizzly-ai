import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const screenshotSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "transcriptLines",
    "suggestedProfileName",
    "relationshipNotes",
    "summary",
    "suggestedGoal",
    "personaHint",
  ],
  properties: {
    transcriptLines: {
      type: "array",
      minItems: 1,
      maxItems: 24,
      items: { type: "string" },
    },
    suggestedProfileName: { type: "string" },
    relationshipNotes: { type: "string" },
    summary: { type: "string" },
    suggestedGoal: {
      type: "string",
      enum: ["restart", "flirt", "clarify", "plan", "repair"],
    },
    personaHint: { type: "string" },
  },
} as const;

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to parse screenshots." },
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
        { error: "Missing OPENAI_API_KEY in .env.local." },
        { status: 500 },
      );
    }

    const body: { imageDataUrl?: string } = await req.json();
    const imageDataUrl =
      typeof body.imageDataUrl === "string" ? body.imageDataUrl.trim() : "";

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: "Screenshot image is required." },
        { status: 400 },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      instructions:
        "You extract texting screenshots for a reply assistant. Read visible message bubbles carefully, infer speaker roles conservatively, and do not invent missing lines. Prefer 'Them:' and 'You:' prefixes. Return only structured JSON.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Parse this messaging screenshot into transcript lines. Also return a short summary, relationship notes that matter for reply strategy, a suggested goal, and a persona hint describing the user's likely natural texting style from the screenshot.",
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "auto",
            },
          ],
        },
      ],
      max_output_tokens: 700,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "screenshot_parse",
          strict: true,
          schema: screenshotSchema,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as {
      transcriptLines?: string[];
      suggestedProfileName?: string;
      relationshipNotes?: string;
      summary?: string;
      suggestedGoal?: string;
      personaHint?: string;
    };

    const transcriptLines = Array.isArray(parsed.transcriptLines)
      ? parsed.transcriptLines
          .map((line) => (typeof line === "string" ? line.trim() : ""))
          .filter(Boolean)
          .slice(0, 24)
      : [];

    return NextResponse.json({
      transcriptLines,
      suggestedProfileName:
        typeof parsed.suggestedProfileName === "string"
          ? parsed.suggestedProfileName.trim()
          : "",
      relationshipNotes:
        typeof parsed.relationshipNotes === "string"
          ? parsed.relationshipNotes.trim()
          : "",
      summary:
        typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      suggestedGoal:
        typeof parsed.suggestedGoal === "string"
          ? parsed.suggestedGoal.trim()
          : "restart",
      personaHint:
        typeof parsed.personaHint === "string"
          ? parsed.personaHint.trim()
          : "",
    });
  } catch (error) {
    console.error("Screenshot parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse screenshot." },
      { status: 500 },
    );
  }
}