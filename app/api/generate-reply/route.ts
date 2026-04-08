import { NextResponse } from "next/server";
import OpenAI from "openai";
import { rateLimit } from "@/lib/rate-limit";

type ToneKey = "confident" | "flirty" | "funny" | "chill" | "apologetic";
type GoalKey = "restart" | "flirt" | "clarify" | "plan" | "repair";

type ReplyWithScores = {
  text: string;
  scores: {
    confidence: number;
    engagement: number;
    responseChance: number;
  };
};

type ReplyBranch = {
  scenario: string;
  move: string;
  note: string;
};

type SparklineResponse = {
  analysis: {
    summary: string;
    vibe: string;
    strength: string;
    risk: string;
    toneUsed: string;
    strategy: string;
    depthMode: string;
    userPattern: string;
    receiverPattern: string;
    languageStyle: string;
    adaptationNote: string;
    timingWindow: string;
    avoid: string;
    coachNotes: string;
    nextMoves: string[];
    replyBranches: ReplyBranch[];
  };
  replies: ReplyWithScores[];
  bestIndex: number;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedTones = [
  "confident",
  "flirty",
  "funny",
  "chill",
  "apologetic",
] as const;

const toneMap: Record<ToneKey, string> = {
  confident: "Sound calm, grounded, direct, and self-assured.",
  flirty: "Be playful, charming, lightly teasing, and natural.",
  funny: "Use wit, light humor, and clever phrasing without trying too hard.",
  chill: "Keep it relaxed, casual, and low-pressure.",
  apologetic: "Be thoughtful, soft, and empathetic without sounding weak.",
};

const goalMap: Record<GoalKey, string> = {
  restart: "Restart momentum smoothly and bring the conversation back to life.",
  flirt: "Build attraction without sounding try-hard or scripted.",
  clarify: "Clear up tension or ambiguity without escalating things.",
  plan: "Move the conversation toward a plan or concrete next step.",
  repair: "Repair the tone after a cold, awkward, or off-track exchange.",
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["analysis", "replies", "bestIndex"],
  properties: {
    analysis: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "vibe",
        "strength",
        "risk",
        "toneUsed",
        "strategy",
        "depthMode",
        "userPattern",
        "receiverPattern",
        "languageStyle",
        "adaptationNote",
        "timingWindow",
        "avoid",
        "coachNotes",
        "nextMoves",
        "replyBranches",
      ],
      properties: {
        summary: { type: "string" },
        vibe: { type: "string" },
        strength: { type: "string" },
        risk: { type: "string" },
        toneUsed: { type: "string" },
        strategy: { type: "string" },
        depthMode: { type: "string" },
        userPattern: { type: "string" },
        receiverPattern: { type: "string" },
        languageStyle: { type: "string" },
        adaptationNote: { type: "string" },
        timingWindow: { type: "string" },
        avoid: { type: "string" },
        coachNotes: { type: "string" },
        nextMoves: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { type: "string" },
        },
        replyBranches: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["scenario", "move", "note"],
            properties: {
              scenario: { type: "string" },
              move: { type: "string" },
              note: { type: "string" },
            },
          },
        },
      },
    },
    replies: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "scores"],
        properties: {
          text: { type: "string" },
          scores: {
            type: "object",
            additionalProperties: false,
            required: ["confidence", "engagement", "responseChance"],
            properties: {
              confidence: { type: "integer", minimum: 1, maximum: 10 },
              engagement: { type: "integer", minimum: 1, maximum: 10 },
              responseChance: { type: "integer", minimum: 1, maximum: 10 },
            },
          },
        },
      },
    },
    bestIndex: { type: "integer", minimum: 0, maximum: 4 },
  },
} as const;

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeReplies(replies: ReplyWithScores[]) {
  const seen = new Set<string>();

  return replies.filter((reply) => {
    const key = normalizeText(reply.text);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseTranscript(conversation: string) {
  return conversation
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const speakerMatch = line.match(/^(you|them|her|him|me)\s*:\s*(.*)$/i);

      if (!speakerMatch) {
        return line;
      }

      const [, rawSpeaker, content] = speakerMatch;
      const speaker =
        rawSpeaker.toLowerCase() === "you" || rawSpeaker.toLowerCase() === "me"
          ? "You"
          : "Them";

      return `${speaker}: ${content.trim()}`;
    });
}

function buildStyleSignals(transcriptLines: string[]) {
  const youLines = transcriptLines
    .filter((line) => line.startsWith("You:"))
    .map((line) => line.replace(/^You:\s*/, ""));
  const themLines = transcriptLines
    .filter((line) => line.startsWith("Them:"))
    .map((line) => line.replace(/^Them:\s*/, ""));
  const joined = transcriptLines.join(" ");

  const lowercaseHeavy =
    transcriptLines.filter(
      (line) => line && line === line.toLowerCase() && /[a-z]/.test(line),
    ).length >= Math.max(2, Math.floor(transcriptLines.length / 2));
  const emojiHeavy = /[\u{1F300}-\u{1FAFF}]/u.test(joined);
  const slangHits =
    joined.match(
      /\b(lol|lmao|ngl|fr|rn|idk|wyd|imo|tbh|bet|lowkey|highkey|nah|yeah|yep|bro|wtf|omw|u|ur)\b/gi,
    ) ?? [];
  const punctuationLight =
    transcriptLines.filter((line) => /[.!?]/.test(line)).length <
    Math.max(2, Math.floor(transcriptLines.length / 3));
  const avgLength =
    transcriptLines.reduce((sum, line) => sum + line.length, 0) /
    Math.max(1, transcriptLines.length);

  const uniqueSlang = [...new Set(slangHits.map((item) => item.toLowerCase()))]
    .slice(0, 6)
    .join(", ");

  const sharedStyle = [
    lowercaseHeavy ? "mostly lowercase" : "mixed casing",
    punctuationLight ? "light punctuation" : "normal punctuation",
    emojiHeavy ? "emoji-aware" : "minimal emoji",
    avgLength < 45 ? "short messages" : "longer messages",
    uniqueSlang ? `slang: ${uniqueSlang}` : "little obvious slang",
  ].join(", ");

  const describeSide = (lines: string[], label: string) => {
    if (!lines.length) {
      return `${label} side is under-sampled.`;
    }

    const averageLength =
      lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const asksQuestions = lines.some((line) => line.includes("?"));
    const usesSofteners = lines.some((line) =>
      /\b(maybe|kinda|sort of|i think|i guess|sorry)\b/i.test(line),
    );
    const usesDirectLanguage = lines.some((line) =>
      /\b(let's|come through|be real|for sure|definitely|straight up)\b/i.test(
        line,
      ),
    );

    return [
      averageLength < 42 ? "brief replies" : "more detailed replies",
      asksQuestions ? "asks questions" : "rarely asks questions",
      usesSofteners ? "softens tone" : "more direct tone",
      usesDirectLanguage ? "clear/assertive wording" : "measured wording",
    ].join(", ");
  };

  return {
    sharedStyle,
    youStyle: describeSide(youLines, "Your"),
    themStyle: describeSide(themLines, "Their"),
    lingo: uniqueSlang || "none obvious",
  };
}

async function summarizeEarlierThread(
  openaiClient: OpenAI,
  earlierTranscript: string,
  tone: ToneKey,
  goal: GoalKey,
  userContext: string,
) {
  const response = await openaiClient.responses.create({
    model: "gpt-5.4-mini",
    instructions:
      "Summarize earlier conversation context for a texting assistant. Be compact, neutral, and specific. Focus on emotional direction, unresolved topics, promises, tension, and what should not be ignored.",
    input: [
      `Goal: ${goalMap[goal]}`,
      `Tone: ${toneMap[tone]}`,
      userContext ? `Extra user context: ${userContext}` : "",
      "",
      "Earlier conversation to compress:",
      earlierTranscript,
    ]
      .filter(Boolean)
      .join("\n"),
    max_output_tokens: 220,
    text: {
      verbosity: "low",
    },
  });

  return response.output_text.trim();
}

function scoreReplyText(text: string, tone: ToneKey) {
  const normalized = normalizeText(text);
  const wordCount = normalized ? normalized.split(" ").length : 0;

  let confidence = 5;
  let engagement = 5;
  let responseChance = 5;

  if (wordCount >= 6 && wordCount <= 18) {
    confidence += 1;
    engagement += 1;
    responseChance += 1;
  }

  if (/\?$/.test(text.trim())) {
    engagement += 2;
    responseChance += 1;
  }

  if (/\b(please|sorry|maybe|i guess|if you want)\b/i.test(text)) {
    confidence -= 1;
  }

  if (/\b(you free|what about you|what've you|what have you|how about you|how has your)\b/i.test(text)) {
    engagement += 1;
  }

  if (/\b(lol|haha|lmao|funny|wild)\b/i.test(text)) {
    engagement += 1;
  }

  if (tone === "confident" && /\b(definitely|easy|simple|good on my side)\b/i.test(text)) {
    confidence += 1;
  }

  if (tone === "flirty" && /\b(trouble|dangerous|smooth|cute|charming)\b/i.test(text)) {
    engagement += 1;
    responseChance += 1;
  }

  if (tone === "funny" && /\b(lol|haha|plot twist|arc|comeback)\b/i.test(text)) {
    engagement += 1;
  }

  if (tone === "chill" && /\b(all good|no stress|easy|no worries)\b/i.test(text)) {
    confidence += 1;
  }

  if (tone === "apologetic" && /\b(i get it|totally fair|understand)\b/i.test(text)) {
    responseChance += 1;
  }

  return {
    confidence: clampScore(confidence),
    engagement: clampScore(engagement),
    responseChance: clampScore(responseChance),
  };
}

function fallbackResponse(tone: ToneKey): SparklineResponse {
  const toneUsed = toneMap[tone];

  const replies: ReplyWithScores[] = [
    {
      text: "Been good on my side. What have you been up to lately?",
      scores: { confidence: 7, engagement: 6, responseChance: 7 },
    },
    {
      text: "I have been good, just keeping things moving. How about you?",
      scores: { confidence: 8, engagement: 8, responseChance: 9 },
    },
    {
      text: "Doing well over here. How has your week been?",
      scores: { confidence: 6, engagement: 5, responseChance: 6 },
    },
  ];

  return {
    analysis: {
      summary: "The other person reopened the conversation in a casual way.",
      vibe: "Light and open, but not deeply invested yet.",
      strength: "You have room to reply smoothly without overcommitting.",
      risk: "A flat answer could slow the conversation down.",
      toneUsed,
      strategy: "Answer cleanly, then open an easy path forward.",
      depthMode: "Direct thread mode",
      userPattern: "Your side is concise, steady, and not over-explaining.",
      receiverPattern:
        "Their side looks casual and responsive, but not deeply invested yet.",
      languageStyle: "Keep the language simple, conversational, and natural.",
      adaptationNote:
        "Mirror existing slang or lowercase style only if it already appears in the thread.",
      timingWindow: "Send when you can reply naturally and stay available for at least one follow-up.",
      avoid: "Do not over-explain, double-text, or force a plan immediately.",
      coachNotes: "Use the safest reply if the thread feels fragile, or the strongest one if they already reopened with warmth.",
      nextMoves: [
        "Send the reply that matches your actual energy, not just the highest score.",
        "If they answer warmly, ask one easy follow-up instead of switching topics too fast.",
        "If they stay short, keep the pace light and avoid pushing for certainty.",
      ],
      replyBranches: [
        {
          scenario: "They reply fast and warm",
          move: "Lean in with one playful or specific follow-up.",
          note: "That is the moment to build momentum, not to play overly cool.",
        },
        {
          scenario: "They reply short but positive",
          move: "Keep it simple and mirror their pace with one clean question.",
          note: "Do not jump to heavy flirting or a plan too early.",
        },
        {
          scenario: "They stay cold or vague",
          move: "Pause after one more low-pressure reply and let them re-engage.",
          note: "Protect your position instead of chasing clarity in the same moment.",
        },
      ],
    },
    replies,
    bestIndex: 1,
  };
}

function clampScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 5;
  }

  return Math.max(1, Math.min(10, Math.round(value)));
}

function sanitizeModelPayload(
  payload: Partial<SparklineResponse> | null | undefined,
  tone: ToneKey,
  replyCount = 3,
): SparklineResponse {
  const fallback = fallbackResponse(tone);
  const incomingReplies = Array.isArray(payload?.replies) ? payload.replies : [];
  const replies = dedupeReplies(
    incomingReplies.slice(0, replyCount).map((reply) => {
      const text =
        typeof reply?.text === "string" && reply.text.trim().length > 0
          ? reply.text.trim()
          : "Keep it simple and ask an easy follow-up.";

      const heuristicScores = scoreReplyText(text, tone);

      return {
        text,
        scores: {
          confidence: clampScore(
            typeof reply?.scores?.confidence === "number"
              ? Math.round((reply.scores.confidence + heuristicScores.confidence) / 2)
              : heuristicScores.confidence,
          ),
          engagement: clampScore(
            typeof reply?.scores?.engagement === "number"
              ? Math.round((reply.scores.engagement + heuristicScores.engagement) / 2)
              : heuristicScores.engagement,
          ),
          responseChance: clampScore(
            typeof reply?.scores?.responseChance === "number"
              ? Math.round(
                  (reply.scores.responseChance + heuristicScores.responseChance) / 2,
                )
              : heuristicScores.responseChance,
          ),
        },
      };
    }),
  ).slice(0, replyCount);

  while (replies.length < Math.min(replyCount, 3)) {
    replies.push(fallback.replies[replies.length % fallback.replies.length]);
  }

  const bestIndex =
    typeof payload?.bestIndex === "number" &&
    payload.bestIndex >= 0 &&
    payload.bestIndex < replies.length
      ? Math.round(payload.bestIndex)
      : replies.reduce((best, current, index, items) => {
          return current.scores.responseChance >
            items[best].scores.responseChance
            ? index
            : best;
        }, 0);

  return {
    analysis: {
      summary:
        typeof payload?.analysis?.summary === "string"
          ? payload.analysis.summary
          : fallback.analysis.summary,
      vibe:
        typeof payload?.analysis?.vibe === "string"
          ? payload.analysis.vibe
          : fallback.analysis.vibe,
      strength:
        typeof payload?.analysis?.strength === "string"
          ? payload.analysis.strength
          : fallback.analysis.strength,
      risk:
        typeof payload?.analysis?.risk === "string"
          ? payload.analysis.risk
          : fallback.analysis.risk,
      toneUsed:
        typeof payload?.analysis?.toneUsed === "string"
          ? payload.analysis.toneUsed
          : toneMap[tone],
      strategy:
        typeof payload?.analysis?.strategy === "string"
          ? payload.analysis.strategy
          : fallback.analysis.strategy,
      depthMode:
        typeof payload?.analysis?.depthMode === "string"
          ? payload.analysis.depthMode
          : fallback.analysis.depthMode,
      userPattern:
        typeof payload?.analysis?.userPattern === "string"
          ? payload.analysis.userPattern
          : fallback.analysis.userPattern,
      receiverPattern:
        typeof payload?.analysis?.receiverPattern === "string"
          ? payload.analysis.receiverPattern
          : fallback.analysis.receiverPattern,
      languageStyle:
        typeof payload?.analysis?.languageStyle === "string"
          ? payload.analysis.languageStyle
          : fallback.analysis.languageStyle,
      adaptationNote:
        typeof payload?.analysis?.adaptationNote === "string"
          ? payload.analysis.adaptationNote
          : fallback.analysis.adaptationNote,
      timingWindow:
        typeof payload?.analysis?.timingWindow === "string"
          ? payload.analysis.timingWindow
          : fallback.analysis.timingWindow,
      avoid:
        typeof payload?.analysis?.avoid === "string"
          ? payload.analysis.avoid
          : fallback.analysis.avoid,
      coachNotes:
        typeof payload?.analysis?.coachNotes === "string"
          ? payload.analysis.coachNotes
          : fallback.analysis.coachNotes,
      nextMoves:
        Array.isArray(payload?.analysis?.nextMoves) &&
        payload.analysis.nextMoves.length >= 3
          ? payload.analysis.nextMoves
              .slice(0, 3)
              .map((item) =>
                typeof item === "string" && item.trim()
                  ? item.trim()
                  : "Keep the next move simple and measured.",
              )
          : fallback.analysis.nextMoves,
      replyBranches:
        Array.isArray(payload?.analysis?.replyBranches) &&
        payload.analysis.replyBranches.length >= 3
          ? payload.analysis.replyBranches.slice(0, 3).map((branch) => ({
              scenario:
                typeof branch?.scenario === "string" && branch.scenario.trim()
                  ? branch.scenario.trim()
                  : "If they respond",
              move:
                typeof branch?.move === "string" && branch.move.trim()
                  ? branch.move.trim()
                  : "Keep the next move calm and natural.",
              note:
                typeof branch?.note === "string" && branch.note.trim()
                  ? branch.note.trim()
                  : "Stay measured and do not overreact.",
            }))
          : fallback.analysis.replyBranches,
    },
    replies,
    bestIndex,
  };
}

function extractThreadPatterns(threadSummary: string): string {
  if (!threadSummary) return "";

  // Parse summary to extract tone/goal combos and their outcomes
  const turns = threadSummary.split(" · ");
  const toneGoalMap: Record<string, { count: number; wasSent: boolean }> = {};

  turns.forEach((turn) => {
    const toneGoalMatch = turn.match(/\[(.*?)\/(.*?)\]/);
    if (toneGoalMatch) {
      const [, tone, goal] = toneGoalMatch;
      const key = `${tone}/${goal}`;
      const wasSent = turn.includes("sent:");

      toneGoalMap[key] = {
        count: (toneGoalMap[key]?.count || 0) + 1,
        wasSent: wasSent || toneGoalMap[key]?.wasSent || false,
      };
    }
  });

  const effectiveTones = Object.entries(toneGoalMap)
    .filter(([, data]) => data.wasSent)
    .map(([key]) => key);

  if (effectiveTones.length === 0) {
    return "";
  }

  return `\nEffective tone/goal combos in this thread: ${effectiveTones.join(", ")}. Consider favoring these patterns in your new replies.`;
}

export async function POST(req: Request) {
  const { limited, remaining } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  try {
    const body = await req.json();
    const conversation =
      typeof body.conversation === "string" ? body.conversation.trim() : "";
    const rawTone = typeof body.tone === "string" ? body.tone : "confident";
    const rawGoal = typeof body.goal === "string" ? body.goal : "restart";
    const userContext =
      typeof body.userContext === "string" ? body.userContext.trim() : "";
    const threadSummary =
      typeof body.threadSummary === "string" ? body.threadSummary.trim() : "";
    const relationshipNotes =
      typeof body.relationshipNotes === "string"
        ? body.relationshipNotes.trim()
        : "";
    const personaCalibration =
      typeof body.personaCalibration === "string"
        ? body.personaCalibration.trim()
        : "";
    const screenshotSummary =
      typeof body.screenshotSummary === "string"
        ? body.screenshotSummary.trim()
        : "";
    const profileName =
      typeof body.profileName === "string" ? body.profileName.trim() : "";
    const recentOutcome =
      typeof body.recentOutcome === "string" ? body.recentOutcome.trim() : "";
    const memoryPrimer =
      typeof body.memoryPrimer === "string" ? body.memoryPrimer.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "other";
    const toneIntensity =
      typeof body.toneIntensity === "number" ? Math.max(1, Math.min(10, body.toneIntensity)) : 5;
    const bulkCount =
      typeof body.bulkCount === "number" ? Math.max(1, Math.min(5, body.bulkCount)) : 3;
    const tone: ToneKey = (
      allowedTones.includes(rawTone as ToneKey) ? rawTone : "confident"
    ) as ToneKey;
    const goal: GoalKey = (
      ["restart", "flirt", "clarify", "plan", "repair"].includes(rawGoal)
        ? rawGoal
        : "restart"
    ) as GoalKey;

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation is required." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local." },
        { status: 500 },
      );
    }

    const transcriptLines = parseTranscript(conversation);
    const isDeepConversation =
      transcriptLines.length > 16 || conversation.length > 2200;
    const recentTranscript = isDeepConversation
      ? transcriptLines.slice(-12).join("\n")
      : transcriptLines.join("\n");
    const earlierTranscript = isDeepConversation
      ? transcriptLines.slice(0, -12).join("\n")
      : "";

    const earlierSummary =
      isDeepConversation && earlierTranscript
        ? await summarizeEarlierThread(
            openai,
            earlierTranscript,
            tone,
            goal,
            userContext,
          )
        : "";
    const styleSignals = buildStyleSignals(transcriptLines);
    const threadPatterns = threadSummary ? extractThreadPatterns(threadSummary) : "";

    const replyCount = Math.max(1, Math.min(5, bulkCount));

    const prompt = [
      "Analyze the conversation and help the user send the next message.",
      `Return exactly ${replyCount} replies with noticeably different phrasing and energy.`,
      `Tone target: ${tone}. ${toneMap[tone]}`,
      `Tone intensity: ${toneIntensity}/10 (${toneIntensity <= 3 ? "very subtle" : toneIntensity <= 6 ? "moderate" : "strong"}).`,
      `Goal target: ${goal}. ${goalMap[goal]}`,
      category !== "other" ? `Relationship category: ${category}. Tailor formality and playfulness to this context.` : "",
      "Be concise, natural, and respectful.",
      "Do not encourage manipulation, harassment, guilt-tripping, or pressure.",
      "Keep each reply to 1 or 2 sentences max.",
      "Prefer messages that move the conversation forward without sounding forced.",
      "Make your analysis cautious, not overly certain.",
      "Reply option 1 should feel safest, option 2 strongest, option 3 most playful within the selected tone.",
      `Thread mode: ${isDeepConversation ? "deep thread mode" : "direct thread mode"}.`,
      "Infer lightweight behavior patterns for both sides: pacing, directness, warmth, question-asking, and emotional style.",
      "Infer the shared language style: casing, punctuation, slang, abbreviations, emojis, and message length.",
      "Adapt reply wording to the existing thread style when natural. Mirror slang or lingo only if it already appears in the conversation or user context.",
      "Do not invent heavy slang, forced AAVE, or exaggerated internet talk if the thread does not support it.",
      `Observed style signals: ${styleSignals.sharedStyle}.`,
      `Your side pattern: ${styleSignals.youStyle}.`,
      `Receiver side pattern: ${styleSignals.themStyle}.`,
      `Detected lingo: ${styleSignals.lingo}.`,
      profileName ? `Contact or thread label: ${profileName}.` : "",
      userContext ? `Extra user context: ${userContext}` : "",
      relationshipNotes
        ? `Relationship memory: ${relationshipNotes}`
        : "",
      personaCalibration
        ? `User voice calibration: ${personaCalibration}`
        : "",
      screenshotSummary
        ? `Screenshot extraction summary: ${screenshotSummary}`
        : "",
      recentOutcome
        ? `Most recent outcome in this thread: ${recentOutcome}. Use it to decide how hard to push or how much to back off.`
        : "",
      threadSummary ? `\nPrior conversation patterns (what has worked):\n${threadSummary}${threadPatterns}\n\nLeverage these working patterns: notice which tones and goals succeeded, mirror the language and pacing of sent replies that got responses, and adapt to the relationship dynamic that emerged. Avoid repeating mistakes from this thread.` : "",
      memoryPrimer ? `Saved product memory and successful reply signals:\n${memoryPrimer}` : "",
      earlierSummary ? `Earlier thread summary:\n${earlierSummary}` : "",
      "",
      "Recent transcript:",
      recentTranscript,
      "",
      "In the analysis, include:",
      "- the best timing window for sending",
      "- one thing to avoid doing next",
      "- short coach notes about how hard to push",
      "- exactly 3 next moves after the send",
      "- exactly 3 reply branches for warm, mixed, and cold outcomes",
    ].join("\n");

    try {
      const response = (await Promise.race([
        openai.responses.create({
          model: "gpt-5.4-mini",
          instructions:
            "You are Rizzly AI, a calm texting strategist. Read the tone carefully, make modest inferences, and optimize for natural replies that a real person would actually send. Favor emotional intelligence, specificity, and variety. Avoid generic filler, therapy-speak, and robotic phrasing.",
          input: prompt,
          max_output_tokens: 900,
          text: {
            verbosity: "low",
            format: {
              type: "json_schema",
              name: "sparkline_reply_analysis",
              strict: true,
              schema: responseSchema,
            },
          },
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("OpenAI request timed out.")), 18_000);
        }),
      ])) as { output_text: string };

      const parsed = JSON.parse(response.output_text) as SparklineResponse;
      const safePayload = sanitizeModelPayload(parsed, tone, replyCount);

      return NextResponse.json(safePayload, {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      });
    } catch (modelError) {
      console.error("OpenAI degraded mode:", modelError);
      const fallbackPayload = sanitizeModelPayload(
        fallbackResponse(tone),
        tone,
        replyCount,
      );

      return NextResponse.json(
        {
          ...fallbackPayload,
          degraded: true,
          warning:
            "Rizzly switched to stability mode because the AI service was slow. The replies are still safe to use, but keep them simple.",
        },
        {
          headers: {
            "X-RateLimit-Remaining": String(remaining),
            "X-Rizzly-Mode": "fallback",
          },
        },
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to generate replies. Check your API key and try again." },
      { status: 500 },
    );
  }
}
