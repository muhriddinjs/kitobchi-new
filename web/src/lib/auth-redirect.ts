/**
 * Where to send someone once they've signed in.
 *
 * Only same-site paths are accepted. Without that check a link like
 * `/login?next=https://evil.example` would turn our own login page into a
 * redirector to someone else's site — and it would look trustworthy,
 * because the domain the user sees before clicking is ours.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  // Must be a path, and not "//host" — the browser reads that as a
  // protocol-relative URL to another origin.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

/** Link to the login page that comes back to `next` afterwards. */
export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
