import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Thread } from "@/lib/analytics";
import type { SavedPersona } from "@/lib/product-features";
import type { PlanTier } from "@/lib/pricing";

export interface CloudSnapshot {
  threads: Thread[];
  personas: SavedPersona[];
  updatedAt: number;
  planTier: PlanTier;
  storageMode: "persistent" | "runtime";
}

type CloudStoreFile = Record<string, Omit<CloudSnapshot, "storageMode">>;

declare global {
  var __RIZZLY_CLOUD_STORE__: CloudStoreFile | undefined;
}

const STORE_DIR = path.join(process.cwd(), ".rizzly-runtime");
const STORE_FILE = path.join(STORE_DIR, "cloud-store.json");
const runtimeStore: CloudStoreFile = globalThis.__RIZZLY_CLOUD_STORE__ ?? {};

globalThis.__RIZZLY_CLOUD_STORE__ = runtimeStore;

function trimText(value: string | undefined, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizePersonas(personas: SavedPersona[]): SavedPersona[] {
  return personas
    .filter((persona) => persona && typeof persona.id === "string")
    .map((persona) => ({
      ...persona,
      name: trimText(persona.name, 80),
      profileName: trimText(persona.profileName, 80),
      voice: trimText(persona.voice, 280),
      notes: trimText(persona.notes, 400),
      createdAt: Number(persona.createdAt || Date.now()),
      lastUsedAt: Number(persona.lastUsedAt || Date.now()),
    }))
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, 8);
}

function sanitizeThreads(threads: Thread[]): Thread[] {
  return threads
    .filter((thread) => thread && typeof thread.id === "string")
    .map((thread) => ({
      ...thread,
      name: trimText(thread.name, 120) || "Untitled",
      summary: trimText(thread.summary, 320),
      profileName: trimText(thread.profileName, 80),
      relationshipNotes: trimText(thread.relationshipNotes, 500),
      personaCalibration: trimText(thread.personaCalibration, 400),
      screenshotSummary: trimText(thread.screenshotSummary, 320),
      turns: Array.isArray(thread.turns)
        ? thread.turns.slice(-10).map((turn) => ({
            ...turn,
            userMessage: trimText(turn.userMessage, 1800),
            draftMessage: trimText(turn.draftMessage, 400),
            userContext: trimText(turn.userContext, 600),
            chosenReply: trimText(turn.chosenReply, 400),
            responseMode: turn.responseMode ?? "balanced",
            screenshotSummary: trimText(turn.screenshotSummary, 240),
            relationshipNotesSnapshot: trimText(turn.relationshipNotesSnapshot, 280),
            personaCalibrationSnapshot: trimText(turn.personaCalibrationSnapshot, 280),
            replies: Array.isArray(turn.replies)
              ? turn.replies.slice(0, 5).map((reply) => ({
                  ...reply,
                  text: trimText(reply.text, 400),
                  image: typeof reply.image === "string" ? reply.image : undefined,
                }))
              : [],
            analysis: turn.analysis
              ? {
                  ...turn.analysis,
                  summary: trimText(turn.analysis.summary, 240),
                  vibe: trimText(turn.analysis.vibe, 140),
                  strength: trimText(turn.analysis.strength, 180),
                  risk: trimText(turn.analysis.risk, 180),
                  toneUsed: trimText(turn.analysis.toneUsed, 180),
                  strategy: trimText(turn.analysis.strategy, 220),
                  depthMode: trimText(turn.analysis.depthMode, 120),
                  userPattern: trimText(turn.analysis.userPattern, 180),
                  receiverPattern: trimText(turn.analysis.receiverPattern, 180),
                  languageStyle: trimText(turn.analysis.languageStyle, 180),
                  adaptationNote: trimText(turn.analysis.adaptationNote, 180),
                  timingWindow: trimText(turn.analysis.timingWindow, 180),
                  avoid: trimText(turn.analysis.avoid, 180),
                  coachNotes: trimText(turn.analysis.coachNotes, 180),
                  liveNow: trimText(turn.analysis.liveNow, 180),
                  deliveryTip: trimText(turn.analysis.deliveryTip, 180),
                  nextIfTheyEngage: trimText(turn.analysis.nextIfTheyEngage, 180),
                  dynamicReading: trimText(turn.analysis.dynamicReading, 180),
                  nonReactiveResponse: trimText(turn.analysis.nonReactiveResponse, 180),
                  whenNotToReply: trimText(turn.analysis.whenNotToReply, 180),
                  behaviorFlags: Array.isArray(turn.analysis.behaviorFlags)
                    ? turn.analysis.behaviorFlags.slice(0, 4).map((item) => trimText(item, 60))
                    : [],
                  nextMoves: Array.isArray(turn.analysis.nextMoves)
                    ? turn.analysis.nextMoves.slice(0, 3).map((item) => trimText(item, 120))
                    : [],
                  replyBranches: Array.isArray(turn.analysis.replyBranches)
                    ? turn.analysis.replyBranches.slice(0, 3).map((branch) => ({
                        scenario: trimText(branch.scenario, 80),
                        move: trimText(branch.move, 120),
                        note: trimText(branch.note, 140),
                      }))
                    : [],
                  liveScenarios: Array.isArray(turn.analysis.liveScenarios)
                    ? turn.analysis.liveScenarios.slice(0, 3).map((item) => ({
                        ifTheySay: trimText(item.ifTheySay, 90),
                        youSay: trimText(item.youSay, 160),
                        why: trimText(item.why, 140),
                      }))
                    : [],
                }
              : null,
          }))
        : [],
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 18);
}

async function readStore(): Promise<CloudStoreFile> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as CloudStoreFile;
    Object.assign(runtimeStore, parsed);
    return runtimeStore;
  } catch {
    return runtimeStore;
  }
}

async function persistStore(store: CloudStoreFile) {
  Object.assign(runtimeStore, store);

  try {
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function readCloudSnapshot(userId: string): Promise<CloudSnapshot> {
  const store = await readStore();
  const snapshot = store[userId];

  if (!snapshot) {
    return {
      threads: [],
      personas: [],
      updatedAt: 0,
      planTier: "free",
      storageMode: "runtime",
    };
  }

  return {
    threads: sanitizeThreads(snapshot.threads ?? []),
    personas: sanitizePersonas(snapshot.personas ?? []),
    updatedAt: Number(snapshot.updatedAt || 0),
    planTier: snapshot.planTier ?? "free",
    storageMode: "persistent",
  };
}

export async function writeCloudSnapshot(
  userId: string,
  input: {
    threads?: Thread[];
    personas?: SavedPersona[];
    planTier?: PlanTier;
  },
): Promise<CloudSnapshot> {
  const store = await readStore();
  const existing = store[userId];

  const nextSnapshot: Omit<CloudSnapshot, "storageMode"> = {
    threads: sanitizeThreads(input.threads ?? existing?.threads ?? []),
    personas: sanitizePersonas(input.personas ?? existing?.personas ?? []),
    updatedAt: Date.now(),
    planTier: input.planTier ?? existing?.planTier ?? "free",
  };

  store[userId] = nextSnapshot;
  const persisted = await persistStore(store);

  return {
    ...nextSnapshot,
    storageMode: persisted ? "persistent" : "runtime",
  };
}
