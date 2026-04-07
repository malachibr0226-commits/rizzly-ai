/**
 * Auth infrastructure scaffold.
 *
 * Currently runs in "local-only" mode — identity lives in localStorage.
 * To upgrade to real auth:
 *   1. `npm install next-auth`
 *   2. Create app/api/auth/[...nextauth]/route.ts
 *   3. Add NEXTAUTH_SECRET + provider env vars
 *   4. Replace localUser() with the session from NextAuth
 */

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: number;
}

const LOCAL_USER_KEY = "rizzly-user-v1";

/** Get or create a local-only anonymous user. */
export function getLocalUser(): User {
  if (typeof window === "undefined") {
    return { id: "anon", name: null, email: null, image: null, createdAt: 0 };
  }

  try {
    const stored = localStorage.getItem(LOCAL_USER_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch {
    // ignore
  }

  const user: User = {
    id: `local-${crypto.randomUUID()}`,
    name: null,
    email: null,
    image: null,
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } catch {
    // quota exceeded
  }

  return user;
}

/** Check if a real auth session exists (placeholder for NextAuth). */
export function isAuthenticated(): boolean {
  // Replace with: const session = await getServerSession(authOptions);
  // return !!session;
  return false;
}

/** Guard an API route — returns 401 if unauthenticated. */
export function requireAuth(_req: Request): { user: User | null; error: Response | null } {
  // In local-only mode, always allow
  // Replace with NextAuth session check for production
  return { user: null, error: null };
}
