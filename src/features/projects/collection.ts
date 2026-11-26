import type { Host, Project } from "./types.ts"

/**
 * How a collection of projects is presented: which view, what is filtered out, how it is grouped and sorted. Pure
 * functions over plain data, so the toolbar's every combination is unit-tested rather than clicked through.
 */
export type View = "grid" | "table" | "list"
export type GroupBy = "none" | "stack" | "host" | "year"
export type SortKey = "no" | "name" | "stack" | "host" | "updated"
export type SortDir = "asc" | "desc"

export interface Sort {
  key: SortKey
  dir: SortDir
}

export interface Presentation {
  view: View
  /** Free text, matched against name, note, repository, stack and host */
  query: string
  /** One stack (the repository's main language) to keep, or null for all */
  stack: string | null
  group: GroupBy
  sort: Sort
}

/** A project with its place in the curated order, which every view shows as No. 01 */
export type Entry = Project & { no: number }

export interface Group {
  /** Stable key, also the group's label */
  key: string
  entries: Entry[]
}

export const VIEWS: readonly View[] = ["grid", "table", "list"]
export const GROUPS: readonly GroupBy[] = ["none", "stack", "host", "year"]

export const DEFAULT_SORT: Sort = { key: "no", dir: "asc" }

export function defaultPresentation(view: View = "grid"): Presentation {
  return { view, query: "", stack: null, group: "none", sort: DEFAULT_SORT }
}

/** Anything but the view differs from the default: what RESET would undo */
export function isFiltered(p: Presentation) {
  return (
    p.query.trim() !== "" ||
    p.stack !== null ||
    p.group !== "none" ||
    p.sort.key !== DEFAULT_SORT.key ||
    p.sort.dir !== DEFAULT_SORT.dir
  )
}

export const HOST_LABEL: Record<Host, string> = {
  cloudflare: "Cloudflare",
  "github-pages": "GitHub Pages",
  vercel: "Vercel",
  other: "Web",
}

const OTHER_STACK = "Other"
export const stackOf = (p: Project) => p.language ?? OTHER_STACK
export const yearOf = (p: Project) => p.pushedAt.slice(0, 4)

export function number(projects: readonly Project[]): Entry[] {
  return projects.map((p, i) => ({ ...p, no: i + 1 }))
}

/** The stacks present, most used first, for the filter's choices */
export function stacksOf(projects: readonly Project[]): string[] {
  const counts = new Map<string, number>()
  for (const p of projects) {
    const stack = stackOf(p)
    counts.set(stack, (counts.get(stack) ?? 0) + 1)
  }
  return [...counts]
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .map(([stack]) => stack)
}

export function filterEntries(
  entries: readonly Entry[],
  { query, stack }: Pick<Presentation, "query" | "stack">
): Entry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  return entries.filter((e) => {
    if (stack !== null && stackOf(e) !== stack) return false
    if (!terms.length) return true
    const haystack = [
      e.title,
      e.description,
      e.repo,
      stackOf(e),
      HOST_LABEL[e.host],
      yearOf(e),
    ]
      .join(" ")
      .toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}

const sortValue: Record<SortKey, (e: Entry) => string | number> = {
  no: (e) => e.no,
  name: (e) => e.title.toLowerCase(),
  stack: (e) => stackOf(e).toLowerCase(),
  host: (e) => HOST_LABEL[e.host].toLowerCase(),
  updated: (e) => e.pushedAt,
}

/** Stable: ties keep the curated order */
export function sortEntries(entries: readonly Entry[], sort: Sort): Entry[] {
  const value = sortValue[sort.key]
  const sign = sort.dir === "asc" ? 1 : -1
  return [...entries].sort((a, b) => {
    const x = value(a)
    const y = value(b)
    const order =
      typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y))
    return order * sign || a.no - b.no
  })
}

/** The next sort when a column header is pressed: ascending, then descending, then back to the curated order */
export function nextSort(current: Sort, key: SortKey): Sort {
  if (current.key !== key)
    return { key, dir: key === "updated" ? "desc" : "asc" }
  const first = key === "updated" ? "desc" : "asc"
  if (current.dir === first)
    return { key, dir: first === "asc" ? "desc" : "asc" }
  return DEFAULT_SORT
}

const groupKey: Record<Exclude<GroupBy, "none">, (e: Entry) => string> = {
  stack: stackOf,
  host: (e) => HOST_LABEL[e.host],
  year: yearOf,
}

/**
 * Groups keep the entries' order inside them. Years run newest first; stacks and hosts largest first, then by name.
 * Ungrouped is a single group with an empty key, so every view renders groups the same way.
 */
export function groupEntries(entries: readonly Entry[], by: GroupBy): Group[] {
  if (by === "none") return [{ key: "", entries: [...entries] }]
  const keyOf = groupKey[by]
  const groups = new Map<string, Entry[]>()
  for (const e of entries) {
    const key = keyOf(e)
    const list = groups.get(key)
    if (list) list.push(e)
    else groups.set(key, [e])
  }
  return [...groups]
    .map(([key, list]) => ({ key, entries: list }))
    .sort((a, b) =>
      by === "year"
        ? b.key.localeCompare(a.key)
        : b.entries.length - a.entries.length || a.key.localeCompare(b.key)
    )
}

/** Everything the toolbar decides, applied in order: filter, sort, group */
export function present(
  entries: readonly Entry[],
  p: Presentation
): { groups: Group[]; count: number } {
  const kept = sortEntries(filterEntries(entries, p), p.sort)
  return { groups: groupEntries(kept, p.group), count: kept.length }
}
