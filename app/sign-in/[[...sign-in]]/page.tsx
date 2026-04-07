import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0612] px-4">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/20 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 translate-x-1/2 translate-y-1/2 rounded-full bg-purple-600/20 blur-[80px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding */}
        <div className="mb-6 text-center">
          <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Rizzly AI
          </span>
          <p className="mt-1 text-sm text-white/50">Welcome back — sign in to continue</p>
        </div>

        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#ec4899",
              colorBackground: "#160d2b",
              colorInputBackground: "#1e1140",
              colorText: "#f0e6ff",
              colorTextSecondary: "rgba(240,230,255,0.6)",
              colorInputText: "#ffffff",
              borderRadius: "14px",
            },
            elements: {
              rootBox: "w-full",
              card: "w-full border border-pink-500/40 shadow-[0_0_50px_rgba(236,72,153,0.25)] bg-[#160d2b]",
              headerTitle: "text-white font-bold",
              headerSubtitle: "text-white/60",
              socialButtonsBlockButton: "border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors",
              socialButtonsBlockButtonText: "text-white font-medium",
              socialButtonsProviderIcon: "brightness-0 invert",
              dividerLine: "bg-white/10",
              dividerText: "text-white/40",
              formFieldLabel: "text-white/80 font-medium",
              formFieldInput: "border-white/20 text-white placeholder:text-white/30 focus:border-pink-400",
              footerActionLink: "text-pink-400 hover:text-pink-300 font-semibold",
              formButtonPrimary: "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}
