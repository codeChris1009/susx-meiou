/**
 * Shared by the sync script (Node, writes `projects.json`) and the site (reads it at build time), so both sides
 * agree on one shape. Plain types only: Node runs the script by stripping types, which needs erasable syntax.
 */

export type Host = "cloudflare" | "github-pages" | "vercel" | "other"

/** One repository with a live front end, as the sync script found it on GitHub and on the web */
export interface SyncedProject {
  /** GitHub repository name, the stable key across syncs */
  repo: string
  /** The site a visitor opens */
  url: string
  host: Host
  /** Repository link, only for public repositories: a private one would show visitors a 404 */
  sourceUrl: string | null
  language: string | null
  /** The site's own <title>, else the repository name */
  title: string
  /** The site's meta description, else the repository description, else empty */
  description: string
  /** Last push to the repository, ISO 8601 */
  pushedAt: string
  /** The site answered 2xx on the last sync */
  online: boolean
}

export interface SyncFile {
  /** When the project list last changed (not when the job last ran), so an unchanged week makes no commit */
  syncedAt: string
  projects: SyncedProject[]
}

export interface ProjectOverride {
  /** Shorter display name than the site's <title> */
  title?: string
  description?: string
}

/** Hand-written choices layered over what the sync finds */
export interface Curation {
  /** Early exercises, shown in the smaller "練習" section */
  practice: readonly string[]
  /** Main-section order; repositories not named here follow, newest push first */
  order: readonly string[]
  overrides: Readonly<Record<string, ProjectOverride>>
}

/** A card on the page: synced facts with the curation applied */
export interface Project extends SyncedProject {
  /** Fingerprinted screenshot URL, null until `pnpm shots` has captured one */
  shot: string | null
}
