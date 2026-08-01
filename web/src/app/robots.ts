import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Signed-in areas hold one person's messages, listings and settings —
// nothing a crawler should be following, and nothing that would render for
// it anyway since the token lives in the browser.
const PRIVATE_PATHS = [
  "/admin",
  "/messages",
  "/my-listings",
  "/settings",
  "/favorites",
  "/listings/new",
  "/login",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
