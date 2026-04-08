/**
 * Auth infrastructure — powered by Clerk.
 *
 * Client-side: use Clerk's useUser() / useAuth() hooks directly.
 * Server-side (API routes): use getServerAuth() below.
 */

import { auth, currentUser } from "@clerk/nextjs/server";

const clerkEnvIsConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

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
