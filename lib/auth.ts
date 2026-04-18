/**
 * Auth infrastructure — powered by Clerk.
 *
 * Client-side: use Clerk's useUser() / useAuth() hooks directly.
 * Server-side (API routes): use getServerAuth() below.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { CANONICAL_PRODUCTION_URL } from "@/lib/site-url";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
const clerkEnvIsConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && clerkPublishableKey,
);
export const CLERK_PROXY_PATH = "/__clerk";
const BUILT_IN_ADMIN_EMAILS: string[] = [];
const BUILT_IN_PRO_EMAILS: string[] = [];
export const AUTH_DISABLED_REASON = !clerkEnvIsConfigured
  ? "Clerk environment variables are missing."
  : null;

function normalizeEmail(email: string | null | undefined) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getConfiguredAdminEmails() {
  const configured = (process.env.RIZZLY_ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  return [...new Set([...BUILT_IN_ADMIN_EMAILS, ...configured])];
}

function getConfiguredProEmails() {
  const configured = (process.env.RIZZLY_PRO_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  return [...new Set([...BUILT_IN_PRO_EMAILS, ...configured])];
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: number;
}

export function isClerkConfigured() {
  return clerkEnvIsConfigured;
}

export function resolveClerkProxyUrl() {
  if (!clerkEnvIsConfigured) {
    return undefined;
  }

  const rawProxyPath =
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim() || CLERK_PROXY_PATH;

  if (/^https?:\/\//i.test(rawProxyPath)) {
    return rawProxyPath;
  }

  const normalizedPath = rawProxyPath.startsWith("/")
    ? rawProxyPath
    : `/${rawProxyPath.replace(/^\/+/, "")}`;
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? CANONICAL_PRODUCTION_URL
      : "http://localhost:3000";

  // Force Clerk through a stable same-origin proxy so sign-in does not depend
  // on the currently broken `clerk.rizzlyai.com` DNS or preview domains.
  return new URL(normalizedPath, baseUrl).toString();
}

export function hasAdminEmailAccess(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  return Boolean(normalized && getConfiguredAdminEmails().includes(normalized));
}

export function hasProEmailAccess(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  return Boolean(normalized && getConfiguredProEmails().includes(normalized));
}

/** Get the authenticated user's ID from an API route (server-side). */
export async function getServerAuth(): Promise<string | null> {
  if (!isClerkConfigured()) {
    return null;
  }

  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

/** Get full user profile from an API route (server-side). */
export async function getServerUser(): Promise<User | null> {
  if (!isClerkConfigured()) {
    return null;
  }

  try {
    const user = await currentUser();
    if (!user) return null;

    return {
      id: user.id,
      name: user.firstName
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
        : null,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      image: user.imageUrl ?? null,
      createdAt: user.createdAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

/** Check if the request is authenticated (server-side). */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getServerAuth();
  return !!userId;
}

/** Require auth or return a 401-ready userId. Returns null if unauthenticated. */
export async function requireAuth(): Promise<string | null> {
  return await getServerAuth();
}
