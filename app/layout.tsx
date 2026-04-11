import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AppAuthProvider } from "@/app/components/AppAuthProvider";
import { isClerkConfigured } from "@/lib/auth";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = resolveSiteUrl();
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Rizzly AI",
  applicationCategory: "CommunicationApplication",
  operatingSystem: "Web",
  description:
    "Rizzly AI helps you turn pasted chats, screenshots, and voice notes into sharper replies that actually sound like you.",
  url: siteUrl.toString(),
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

function resolveClerkPublishableKey() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || "";
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Rizzly AI — Smarter replies for real conversations",
    template: "%s | Rizzly AI",
  },
  description:
    "Rizzly AI helps you turn pasted chats, screenshots, and voice notes into sharper replies that actually sound like you.",
  applicationName: "Rizzly AI",
  keywords: [
    "AI reply generator",
    "texting assistant",
    "conversation coach",
    "dating reply app",
    "message suggestions",
  ],
  manifest: "/manifest.webmanifest",
  category: "productivity",
  authors: [{ name: "Rizzly AI" }],
  creator: "Rizzly AI",
  publisher: "Rizzly AI",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "Rizzly AI",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rizzly AI — Your AI Message Studio",
    description:
      "Craft better replies, analyze conversations, and level up your messaging with AI-powered tools.",
    url: siteUrl.toString(),
    siteName: "Rizzly AI",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rizzly AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rizzly AI — Your AI Message Studio",
    description:
      "Craft better replies, analyze conversations, and level up your messaging with AI-powered tools.",
    images: ["/twitter-image"],
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

        <a
          href="#main-content"
          className="sr-only absolute left-3 top-3 z-50 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white focus:not-sr-only"
        >
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {authEnabled ? (
          <ClerkProvider
            publishableKey={publishableKey}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            afterSignOutUrl="/"
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: "#3b82f6",
                colorBackground: "#000000",
                colorInputBackground: "#0a0a0a",
                colorText: "#ffffff",
                colorTextSecondary: "rgba(255,255,255,0.60)",
                colorTextOnPrimaryBackground: "#ffffff",
                colorNeutral: "#a0a0b8",
                borderRadius: "0.75rem",
              },
              elements: {
                // Hide redundant Clerk card header (we have our own Rizzly AI branding above)
                headerTitle: { display: "none" },
                headerSubtitle: { display: "none" },
                // Social buttons — inline styles are reliably applied by Clerk v7
                socialButtonsBlockButton: {
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "rgba(255,255,255,0.055)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  transition: "background 0.18s, border-color 0.18s",
                },
                socialButtonsBlockButtonText: {
                  color: "#ffffff",
                  fontWeight: "600",
                },
                // Divider
                dividerLine: { background: "rgba(255,255,255,0.15)" },
                dividerText: { color: "rgba(255,255,255,0.45)" },
                // Footer action (sign up / sign in link) — keep visible
                footerActionText: { color: "rgba(255,255,255,0.5)" },
                footerActionLink: { color: "#60a5fa", fontWeight: "600" },
                // Hide the "Secured by Clerk" logo row
                footer: { display: "none" },
                // Form
                formFieldLabel: { color: "rgba(255,255,255,0.85)" },
                formFieldInput: {
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "#0a0a0a",
                  color: "#ffffff",
                  transition: "border-color 0.2s",
                },
                formButtonPrimary: {
                  background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                  color: "#ffffff",
                  fontWeight: "700",
                },
                // Profile / account page
                navbar: "bg-[#0a0a0a] text-white",
                navbarButton: "text-white/90 hover:bg-white/10",
                profileSectionTitleText: "text-white",
                pageHeaderTitle: "!text-white !opacity-100",
                pageHeaderSubtitle: "!text-white !opacity-100",
                userPreviewMainIdentifier: "text-white",
                userPreviewSecondaryIdentifier: "text-white/85",
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
