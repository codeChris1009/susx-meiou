/**
 * Pure rules for turning what GitHub knows about a repository into one live site URL. No I/O here, so every rule is
 * unit-tested (discover.test.ts) and the sync script only does fetching.
 */
import type { Host } from "../src/features/projects/types.ts"

export type CandidateSource = "homepage" | "deployment" | "pages"

export interface Candidate {
  source: CandidateSource
  url: string
}

// Homepage is what the author chose to advertise; a custom deployment beats the Pages fallback
const PRIORITY: Record<CandidateSource, number> = {
  homepage: 0,
  deployment: 1,
  pages: 2,
}

export function hostOf(url: string): Host {
  const { hostname } = new URL(url)
  if (hostname.endsWith(".workers.dev") || hostname.endsWith(".pages.dev")) {
    return "cloudflare"
  }
  if (hostname.endsWith(".github.io")) return "github-pages"
  if (hostname.endsWith(".vercel.app")) return "vercel"
  return "other"
}

/** Backends deploy too (`*-api.workers.dev`, `/api/v1/health`); those are not something a visitor opens */
export function isApiUrl(url: string): boolean {
  const { hostname, pathname } = new URL(url)
  const subdomain = hostname.split(".")[0] ?? ""
  return /(^|-)api$/.test(subdomain) || /^\/api(\/|$)/.test(pathname)
}

/**
 * The site's entry point. A project Pages site lives under its first path segment (`user.github.io/repo/`); every
 * other host serves the site at its origin, so a deployment that reported a deep link (`/leaders`) maps to `/`.
 */
export function normalizeSiteUrl(url: string): string {
  const parsed = new URL(url)
  if (hostOf(url) === "github-pages") {
    const first = parsed.pathname.split("/").find(Boolean)
    return `${parsed.origin}/${first ? `${first}/` : ""}`
  }
  return `${parsed.origin}/`
}

export function pickSiteUrl(candidates: readonly Candidate[]): string | null {
  const usable = candidates
    .filter((c) => /^https?:\/\//.test(c.url) && !isApiUrl(c.url))
    .sort((a, b) => PRIORITY[a.source] - PRIORITY[b.source])
  const first = usable[0]
  return first ? normalizeSiteUrl(first.url) : null
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
}

export function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
      }
      if (code.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
      }
      return NAMED_ENTITIES[code.toLowerCase()] ?? whole
    }
  )
}

export interface SiteMeta {
  title: string | null
  description: string | null
}

/** Enough HTML reading for a <title> and a meta description; attribute order and quoting vary by framework */
export function parseSiteMeta(html: string): SiteMeta {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]
  const metaTag = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((m) => m[0])
    .find((tag) => /\bname\s*=\s*["']description["']/i.test(tag))
  const description = metaTag
    ? /\bcontent\s*=\s*(["'])([\s\S]*?)\1/i.exec(metaTag)?.[2]
    : undefined
  const clean = (s: string | undefined) => {
    const text = s ? decodeEntities(s).replace(/\s+/g, " ").trim() : ""
    return text || null
  }
  return { title: clean(title), description: clean(description) }
}
