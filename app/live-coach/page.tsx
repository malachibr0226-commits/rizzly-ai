import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Live Coach | Rizzly AI",
  description:
    "Dedicated live texting coach for in-the-moment guidance, ready-to-send replies, and next-step prompts.",
};

export default function LiveCoachRoute() {
  redirect("/?mode=live-coach&view=live-coach");
}
