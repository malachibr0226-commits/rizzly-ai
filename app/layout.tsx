import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.rizzlyai.com");

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
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
