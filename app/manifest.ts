import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  const siteUrl = resolveSiteUrl({ preferLocalhost: true }).toString().replace(/\/$/, "");

  return {
    name: "Rizzly AI",
    short_name: "Rizzly",
    description: "Smarter replies for real conversations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06070a",
    theme_color: "#1a0f2e",
    categories: ["productivity", "social", "utilities"],
    id: siteUrl,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-dark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
