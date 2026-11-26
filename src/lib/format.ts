/** Display helpers shared across the page */

/** 7 → "07": counts and numbers in the catalogue's two-digit style */
export const pad = (n: number) => String(n).padStart(2, "0")

/** The address as a visitor would type it: no scheme, no trailing slash */
export const displayUrl = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "")

/** 2026.11.26: the date a repository last moved, in the catalogue's dotted style */
export const displayDate = (iso: string) =>
  iso.slice(0, 10).replaceAll("-", ".")
