import { isWebUrl } from "../../lib/url.ts"

import type { Curation, Project, SyncedProject } from "./types.ts"

export interface Showcase {
  featured: Project[]
  practice: Project[]
}

/**
 * Synced facts + hand-written curation + captured screenshots → the two sections on the page. Offline sites are left
 * out: a card that opens an error page is worse than no card.
 */
export function buildShowcase(
  synced: readonly SyncedProject[],
  curation: Curation,
  shots: Readonly<Record<string, string>>
): Showcase {
  const practice = new Set(curation.practice)
  const rank = new Map(curation.order.map((repo, i) => [repo, i]))

  const projects = synced
    // Defence in depth: the sync only writes web URLs, but nothing else may reach an href either way
    .filter((p) => p.online && isWebUrl(p.url))
    .map((p): Project => ({
      ...p,
      sourceUrl: isWebUrl(p.sourceUrl) ? p.sourceUrl : null,
      ...curation.overrides[p.repo],
      shot: shots[p.repo] ?? null,
    }))
    // Curated order first; anything new the sync found follows, newest push first
    .sort(
      (a, b) =>
        (rank.get(a.repo) ?? Infinity) - (rank.get(b.repo) ?? Infinity) ||
        b.pushedAt.localeCompare(a.pushedAt)
    )

  return {
    featured: projects.filter((p) => !practice.has(p.repo)),
    practice: projects.filter((p) => practice.has(p.repo)),
  }
}
