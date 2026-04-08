import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AppAuthProvider } from "@/app/components/AppAuthProvider";
import { isClerkConfigured } from "@/lib/auth";
import "./globals.css";

function normalizeUrl(candidate: string) {
  const parsed = new URL(candidate);

  if (parsed.hostname === "www.rizzlyai.com") {
    parsed.hostname = "rizzlyai.com";
  }

  return parsed;
}

function readLocalEnvValue(name: string) {
  const filePath = path.join(process.cwd(), ".env.local");
  const envFile = fs.readFileSync(filePath, "utf8");
  const match = envFile.match(new RegExp(`^${name}=(.+)$`, "m"));
  return match?.[1]?.trim() || "";
}

function resolveClerkPublishableKey() {
  const envValue = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || "";

  if (process.env.NODE_ENV === "production") {
    return envValue;
  }

  try {
    return readLocalEnvValue("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") || envValue;
  } catch {
    return envValue;
  }
}

function resolveMetadataBase() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "http://localhost:3000",
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      return normalizeUrl(candidate);
    } catch {
      continue;
    }
  }

  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "Rizzly AI",
  description: "Paste a conversation and get sharper reply suggestions.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authEnabled = isClerkConfigured();
  const publishableKey = resolveClerkPublishableKey();

  const appShell = (
    <AppAuthProvider authEnabled={authEnabled} publishableKey={publishableKey}>
      {children}
    </AppAuthProvider>
  );

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {authEnabled ? (
          <ClerkProvider
            publishableKey={publishableKey}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            afterSignOutUrl="/"
            appearance={{
              variables: {
                colorPrimary: "#ec4899",
                colorBackground: "#1a1030",
                colorInputBackground: "#2a1a40",
                colorText: "#ffffff",
                colorTextSecondary: "rgba(255,255,255,0.88)",
                colorTextOnPrimaryBackground: "#ffffff",
                colorNeutral: "#ffffff",
              },
            }}
          >
            {appShell}
          </ClerkProvider>
        ) : (
          appShell
        )}
      </body>
    </html>
  );
}
