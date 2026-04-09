import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hasAdminEmailAccess, hasProEmailAccess } from "@/lib/auth";
import { isReasonableEmail } from "@/lib/security";

export type MetricCounter = {
  total: number;
  today: number;
  dayKey: string;
  lastSeenAt: number;
};

export type AdminStoreData = {
  admins: string[];
  proEmails: string[];
  metrics: Record<string, MetricCounter>;
  updatedAt: number;
};

declare global {
  var __RIZZLY_ADMIN_STORE__: AdminStoreData | undefined;
}

const STORE_DIR = path.join(process.cwd(), ".rizzly-runtime");
const STORE_FILE = path.join(STORE_DIR, "admin-store.json");
const ALLOWED_METRICS = new Set([
  "achievement_unlocked",
  "cta_clicked",
  "error_occurred",
  "outcome_recorded",
  "reply_copied",
  "reply_favorited",
  "reply_generated",
  "reply_rated",
  "reply_sent",
  "screenshot_uploaded",
  "thread_created",
  "thread_deleted",
  "tone_changed",
  "voice_note_recorded",
]);
const runtimeStore: AdminStoreData = globalThis.__RIZZLY_ADMIN_STORE__ ?? {
  admins: [],
  proEmails: [],
  metrics: {},
  updatedAt: 0,
};

globalThis.__RIZZLY_ADMIN_STORE__ = runtimeStore;

export function normalizeAdminEmail(email: string | null | undefined) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeEmailList(emails: string[]) {
  return [
    ...new Set(
      emails
        .map((email) => normalizeAdminEmail(email))
        .filter((email) => email && isReasonableEmail(email)),
    ),
  ].slice(0, 100);
}

async function readStore(): Promise<AdminStoreData> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as AdminStoreData;
    Object.assign(runtimeStore, parsed);
    runtimeStore.admins = sanitizeEmailList(runtimeStore.admins ?? []);
    runtimeStore.proEmails = sanitizeEmailList(runtimeStore.proEmails ?? []);
    runtimeStore.metrics = runtimeStore.metrics ?? {};
    runtimeStore.updatedAt = Number(runtimeStore.updatedAt || 0);
    return runtimeStore;
  } catch {
    return runtimeStore;
  }
}

async function persistStore(store: AdminStoreData) {
  Object.assign(runtimeStore, store);

  try {
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function getAdminStoreSnapshot() {
  const store = await readStore();

  return {
    admins: sanitizeEmailList(store.admins ?? []),
    proEmails: sanitizeEmailList(store.proEmails ?? []),
    metrics: store.metrics ?? {},
    updatedAt: Number(store.updatedAt || 0),
  };
}

export async function getEffectiveAccess(email: string | null | undefined) {
  const normalized = normalizeAdminEmail(email);
  const snapshot = await getAdminStoreSnapshot();

  const isAdmin = Boolean(
    normalized && (hasAdminEmailAccess(normalized) || snapshot.admins.includes(normalized)),
  );
  const isPro = Boolean(
    normalized && (isAdmin || hasProEmailAccess(normalized) || snapshot.proEmails.includes(normalized)),
  );

  return {
    isAdmin,
    isPro,
    admins: snapshot.admins,
    proEmails: snapshot.proEmails,
    metrics: snapshot.metrics,
    updatedAt: snapshot.updatedAt,
  };
}

export async function updateAccessEmail(
  email: string,
  options: { grantAdmin?: boolean; grantPro?: boolean },
) {
  const normalized = normalizeAdminEmail(email);
  if (!normalized || !isReasonableEmail(normalized)) {
    throw new Error("Valid email required.");
  }

  const store = await readStore();
  const admins = new Set(sanitizeEmailList(store.admins ?? []));
  const proEmails = new Set(sanitizeEmailList(store.proEmails ?? []));

  if (options.grantAdmin) {
    admins.add(normalized);
  }

  if (options.grantPro || options.grantAdmin) {
    proEmails.add(normalized);
  }

  store.admins = [...admins];
  store.proEmails = [...proEmails];
  store.updatedAt = Date.now();
  await persistStore(store);

  return getAdminStoreSnapshot();
}

export async function removeAccessEmail(
  email: string,
  remove: "admin" | "pro" | "all" = "all",
) {
  const normalized = normalizeAdminEmail(email);
  if (!normalized || !isReasonableEmail(normalized)) {
    throw new Error("Valid email required.");
  }

  const store = await readStore();
  let admins = sanitizeEmailList(store.admins ?? []);
  let proEmails = sanitizeEmailList(store.proEmails ?? []);

  if (remove === "admin" || remove === "all") {
    admins = admins.filter((item) => item !== normalized);
  }

  if (remove === "pro" || remove === "all") {
    proEmails = proEmails.filter((item) => item !== normalized);
  }

  store.admins = admins;
  store.proEmails = proEmails;
  store.updatedAt = Date.now();
  await persistStore(store);

  return getAdminStoreSnapshot();
}

export async function recordAnalyticsEvent(name: string) {
  const safeName = name.trim().slice(0, 80).toLowerCase();
  if (!safeName || !ALLOWED_METRICS.has(safeName)) {
    return getAdminStoreSnapshot();
  }

  const store = await readStore();
  const dayKey = getDayKey();
  const existing = store.metrics[safeName];

  const next: MetricCounter = {
    total: Number(existing?.total || 0) + 1,
    today:
      existing?.dayKey === dayKey
        ? Number(existing?.today || 0) + 1
        : 1,
    dayKey,
    lastSeenAt: Date.now(),
  };

  store.metrics[safeName] = next;
  store.updatedAt = Date.now();
  await persistStore(store);

  return getAdminStoreSnapshot();
}
