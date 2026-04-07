import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rizzly AI",
  description: "Paste a conversation and get sharper reply suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
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
