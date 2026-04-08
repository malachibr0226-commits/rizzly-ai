import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { readCloudSnapshot, writeCloudSnapshot } from "@/lib/cloud-store";
import type { Thread } from "@/lib/analytics";
import type { SavedPersona } from "@/lib/product-features";

export async function GET(req: Request) {
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to access cloud sync." },
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
    const snapshot = await readCloudSnapshot(userId);

    return NextResponse.json(snapshot, {
      headers: {
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    console.error("Cloud sync load error:", error);
    return NextResponse.json(
      { error: "Failed to load cloud history." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to sync cloud history." },
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
    const body = (await req.json()) as {
      threads?: unknown[];
      personas?: unknown[];
    };

    const snapshot = await writeCloudSnapshot(userId, {
      threads: Array.isArray(body.threads) ? (body.threads as Thread[]) : [],
      personas: Array.isArray(body.personas)
        ? (body.personas as SavedPersona[])
        : [],
    });

    return NextResponse.json(
      {
        ok: true,
        updatedAt: snapshot.updatedAt,
        threadCount: snapshot.threads.length,
        personaCount: snapshot.personas.length,
        storageMode: snapshot.storageMode,
        planTier: snapshot.planTier,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch (error) {
    console.error("Cloud sync save error:", error);
    return NextResponse.json(
      { error: "Failed to save cloud history." },
      { status: 500 },
    );
  }
}
