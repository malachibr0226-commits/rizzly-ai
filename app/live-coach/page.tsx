import type { Metadata } from "next";
import { HomePage } from "../page";

export const metadata: Metadata = {
  title: "Live Coach | Rizzly AI",
  description:
    "Dedicated live texting coach for in-the-moment guidance, ready-to-send replies, and next-step prompts.",
};

export default function LiveCoachRoute() {
  return <HomePage initialStudioMode="live-coach" standaloneLiveCoach />;
}
