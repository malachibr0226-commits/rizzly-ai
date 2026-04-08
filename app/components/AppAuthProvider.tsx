"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const publicClerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
const localClerkOverride = process.env.NEXT_PUBLIC_ENABLE_LOCAL_CLERK === "true";
const clientCanUseClerk = Boolean(publicClerkKey) &&
  (!publicClerkKey.startsWith("pk_live_") || localClerkOverride);

export type AppAuthState = {
  authEnabled: boolean;
  isSignedIn: boolean;
  userId: string | null;
  userFirstName: string | null;
};

const defaultAuthState: AppAuthState = {
  authEnabled: clientCanUseClerk,
  isSignedIn: false,
  userId: null,
  userFirstName: null,
};

const AppAuthContext = createContext<AppAuthState>(defaultAuthState);

export function useAppAuth() {
  return useContext(AppAuthContext);
}

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const value = useMemo<AppAuthState>(
    () => ({
      authEnabled: true,
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      userFirstName: user?.firstName ?? null,
    }),
    [isSignedIn, userId, user?.firstName],
  );

  return (
    <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
  );
}

export function AppAuthProvider({
  authEnabled,
  publishableKey,
  children,
}: {
  authEnabled: boolean;
  publishableKey?: string;
  children: React.ReactNode;
}) {
  const resolvedPublishableKey = (publishableKey || publicClerkKey).trim();
  const resolvedAuthEnabled = authEnabled || Boolean(resolvedPublishableKey) || clientCanUseClerk;

  if (!resolvedAuthEnabled) {
    return (
      <AppAuthContext.Provider value={defaultAuthState}>
        {children}
      </AppAuthContext.Provider>
    );
  }

  return <ClerkAuthBridge>{children}</ClerkAuthBridge>;
}
