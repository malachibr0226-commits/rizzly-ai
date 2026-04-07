import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0a1a] via-[#1a1030] to-[#0f0a1a]">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#1a1030] border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.15)]",
          },
        }}
      />
    </div>
  );
}
