import type { Metadata } from "next";
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
