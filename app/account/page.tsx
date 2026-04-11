"use client";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function AccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <UserProfile
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "#0a0a0a",
            colorInputBackground: "#111111",
            colorText: "#ffffff",
            colorTextSecondary: "rgba(255,255,255,0.6)",
            colorTextOnPrimaryBackground: "#ffffff",
            borderRadius: "0.75rem",
          },
          elements: {
            card: "bg-[#0a0a0a] border border-white/8 shadow-none",
            navbar: "bg-transparent border-r border-white/6",
            navbarButton: "text-white/70 hover:text-white hover:bg-white/5",
            pageScrollBox: "bg-transparent",
            page: "bg-transparent",
            profileSectionTitleText: "text-white/50 uppercase tracking-widest text-xs",
            profileSectionPrimaryButton: "bg-blue-500 hover:bg-blue-400 text-white",
            formButtonPrimary: "bg-blue-500 hover:bg-blue-400 text-white",
            headerTitle: "text-white text-lg font-semibold",
            headerSubtitle: "text-white/50",
            badge: "bg-white/10 text-white/80 border-0",
            footer: { display: "none" },
          },
        }}
      />
    </div>
  );
}
