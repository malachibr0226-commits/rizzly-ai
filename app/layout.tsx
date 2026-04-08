import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

function normalizeUrl(candidate: string) {
  const parsed = new URL(candidate);

  if (parsed.hostname === "www.rizzlyai.com") {
    parsed.hostname = "rizzlyai.com";
  }

  return parsed;
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
  return (
    <ClerkProvider
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
      <html lang="en" className="h-full antialiased">
        <body className="min-h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
