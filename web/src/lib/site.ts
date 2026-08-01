/**
 * Absolute base URL of the site, needed for canonical links, Open Graph
 * tags and the sitemap — all of which have to be fully qualified.
 *
 * Set NEXT_PUBLIC_SITE_URL once there's a real domain. Until then the
 * Vercel production domain is a working default, so nothing has to be
 * configured for the tags to point somewhere valid.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // Provided by Vercel; the stable production domain rather than the
  // per-deployment URL, which would make canonicals point at a preview.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
