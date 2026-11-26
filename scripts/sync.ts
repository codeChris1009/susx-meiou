/**
 * Rebuilds src/data/projects.json from GitHub: every repository the token's owner has, minus forks, archives and the
 * SYNC_EXCLUDE list, that has a live front end (homepage, a successful deployment, or GitHub Pages).
 *
 *   GH_TOKEN=$(gh auth token) pnpm sync          # locally, with your gh login; SYNC_EXCLUDE from .env.local
 *   GH_TOKEN=${{ secrets.SYNC_TOKEN }} ...       # in CI (.github/workflows/sync.yml)
 *
 * The file is rewritten only when the project list changed, so a quiet week makes no commit and no deploy.
 */
import { readFile, writeFile } from "node:fs/promises"
import { styleText } from "node:util"

import type { SyncFile, SyncedProject } from "../src/features/projects/types.ts"
import {
  type Candidate,
  hostOf,
  parseSiteMeta,
  pickSiteUrl,
} from "./discover.ts"

const OUTPUT = new URL("../src/data/projects.json", import.meta.url)
const API = "https://api.github.com"
const CONCURRENCY = 8
const SITE_TIMEOUT_MS = 15_000

interface Repo {
  name: string
  private: boolean
  fork: boolean
  archived: boolean
  html_url: string
  homepage: string | null
  description: string | null
  language: string | null
  pushed_at: string
  owner: { login: string }
}

interface Deployment {
  id: number
}

interface DeploymentStatus {
  state: string
  environment_url?: string
}

// No GITHUB_TOKEN fallback: in Actions it sees only this repository, and the sync would quietly drop every private one
const token = process.env.GH_TOKEN
if (!token) {
  console.error("Set GH_TOKEN, e.g. GH_TOKEN=$(gh auth token) pnpm sync")
  process.exit(1)
}

async function github<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} on ${path}: ${await res.text()}`)
  }
  return (await res.json()) as T
}

async function ownedRepos(): Promise<Repo[]> {
  const repos: Repo[] = []
  for (let page = 1; ; page++) {
    const batch = await github<Repo[]>(
      `/user/repos?affiliation=owner&per_page=100&page=${page}`
    )
    if (!batch?.length) return repos
    repos.push(...batch)
  }
}

async function candidatesFor(repo: Repo): Promise<Candidate[]> {
  const path = `/repos/${repo.owner.login}/${repo.name}`
  const candidates: Candidate[] = []
  if (repo.homepage) candidates.push({ source: "homepage", url: repo.homepage })

  const pages = await github<{ html_url?: string }>(`${path}/pages`)
  if (pages?.html_url) candidates.push({ source: "pages", url: pages.html_url })

  // Newest first; the latest status of each deployment says whether it is live
  const deployments =
    (await github<Deployment[]>(`${path}/deployments?per_page=20`)) ?? []
  for (const { id } of deployments) {
    const [latest] =
      (await github<DeploymentStatus[]>(
        `${path}/deployments/${id}/statuses?per_page=1`
      )) ?? []
    if (latest?.state === "success" && latest.environment_url) {
      candidates.push({ source: "deployment", url: latest.environment_url })
    }
  }
  return candidates
}

async function readSite(url: string) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(SITE_TIMEOUT_MS),
    })
    return { online: res.ok, ...parseSiteMeta(res.ok ? await res.text() : "") }
  } catch {
    return { online: false, title: null, description: null }
  }
}

async function toProject(repo: Repo): Promise<SyncedProject | null> {
  const url = pickSiteUrl(await candidatesFor(repo))
  if (!url) return null
  const site = await readSite(url)
  return {
    repo: repo.name,
    url,
    host: hostOf(url),
    sourceUrl: repo.private ? null : repo.html_url,
    language: repo.language,
    title: site.title ?? repo.name,
    description: site.description ?? repo.description ?? "",
    pushedAt: repo.pushed_at,
    online: site.online,
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
) {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i] as T)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
  return results
}

async function readExisting(): Promise<SyncFile | null> {
  try {
    return JSON.parse(await readFile(OUTPUT, "utf8")) as SyncFile
  } catch {
    return null
  }
}

// Comma-separated repository names never to list. Kept out of this public repository on purpose (a repository variable
// in CI, .env.local on a laptop): naming private repositories here would publish exactly what the list hides.
// Required, so a missing setting fails loudly instead of listing everything.
const excludeSetting = process.env.SYNC_EXCLUDE?.trim()
if (!excludeSetting) {
  console.error(
    "Set SYNC_EXCLUDE (comma-separated repository names), e.g. in .env.local"
  )
  process.exit(1)
}
const excluded = new Set(excludeSetting.split(",").map((name) => name.trim()))
const repos = (await ownedRepos()).filter(
  (r) => !r.fork && !r.archived && !excluded.has(r.name)
)
const projects = (await mapPool(repos, CONCURRENCY, toProject))
  .filter((p): p is SyncedProject => p !== null)
  // Code-point order, not localeCompare: the same bytes on every machine and runner
  .sort((a, b) => (a.repo.toLowerCase() < b.repo.toLowerCase() ? -1 : 1))

const existing = await readExisting()
// Losing half the list at once is a token that lost access, not half the sites going away: refuse to publish that
const kept = new Set(projects.map((p) => p.repo))
const lost = existing?.projects.filter((p) => !kept.has(p.repo)) ?? []
if (
  existing &&
  lost.length * 2 >= existing.projects.length &&
  lost.length > 0
) {
  console.error(
    `Refusing to drop ${lost.length} of ${existing.projects.length} projects (${lost.map((p) => p.repo).join(", ")}); check the token's repository access`
  )
  process.exit(1)
}
if (
  existing &&
  JSON.stringify(existing.projects) === JSON.stringify(projects)
) {
  console.log(styleText("dim", `No change (${projects.length} projects)`))
} else {
  const file: SyncFile = { syncedAt: new Date().toISOString(), projects }
  await writeFile(OUTPUT, `${JSON.stringify(file, null, 2)}\n`)
  console.log(styleText("green", `Wrote ${projects.length} projects`))
}
for (const p of projects) {
  const mark = p.online ? "✓" : styleText("red", "✘")
  console.log(`${mark} ${p.repo.padEnd(24)} ${p.url}`)
}
