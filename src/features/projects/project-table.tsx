import { ArrowDown, ArrowUp, ArrowUpDown, ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

import { GithubMark } from "@/components/github-mark"
import { cn } from "@/lib/utils"

import {
  HOST_LABEL,
  stackOf,
  type Entry,
  type Group,
  type Sort,
  type SortKey,
} from "./collection"
import { displayDate, displayUrl, pad } from "@/lib/format"

const SHOWN_FROM = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const

/** One column, header and cells together, so the two can never disagree on order or visibility */
interface Column {
  key: SortKey
  label: string
  /** Hidden below this breakpoint, so the table never needs a sideways scroll (which would unfreeze its header) */
  from?: keyof typeof SHOWN_FROM
  /** Width, set on the header: the table lays out fixed from its first row */
  width?: string
  cell: (entry: Entry) => ReactNode
  cellClassName?: string
}

const COLUMNS: readonly Column[] = [
  {
    key: "no",
    label: "No",
    width: "w-14",
    cell: (p) => pad(p.no),
    cellClassName: "text-xs text-muted-foreground tabular-nums",
  },
  { key: "name", label: "Project", cell: (p) => <ProjectCell project={p} /> },
  { key: "stack", label: "Stack", from: "sm", width: "w-36", cell: stackOf },
  {
    key: "host",
    label: "Host",
    from: "md",
    width: "w-36",
    cell: (p) => HOST_LABEL[p.host],
  },
  {
    key: "updated",
    label: "Updated",
    from: "sm",
    width: "w-32",
    cell: (p) => displayDate(p.pushedAt),
    cellClassName: "tabular-nums",
  },
]

function ProjectCell({ project: p }: { project: Entry }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <span className="table-thumb" aria-hidden>
        {p.shot && (
          <img
            src={p.shot}
            alt=""
            width={1280}
            height={800}
            loading="lazy"
            decoding="async"
          />
        )}
      </span>
      <span className="min-w-0">
        <a
          href={p.url}
          target="_blank"
          rel="noopener"
          className="table-link font-medium"
        >
          {p.title}
        </a>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {p.description || displayUrl(p.url)}
        </span>
      </span>
    </div>
  )
}

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const

interface ProjectTableProps {
  groups: readonly Group[]
  sort: Sort
  onSort: (key: SortKey) => void
  /** Caption for assistive tech: what the table lists */
  caption: string
}

/**
 * TABLE: the spec sheet. Every project on one line, sortable by any column, with a header row that stays frozen under
 * the toolbar as the page scrolls. Each row opens its site (a stretched link); the source link sits above it.
 */
export function ProjectTable({
  groups,
  sort,
  onSort,
  caption,
}: ProjectTableProps) {
  const span = COLUMNS.length + 1
  return (
    <table className="collection-table w-full border-separate border-spacing-0 text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead lang="en">
        <tr>
          {COLUMNS.map((col) => {
            const active = sort.key === col.key
            const Icon = !active
              ? ArrowUpDown
              : sort.dir === "asc"
                ? ArrowUp
                : ArrowDown
            return (
              <th
                key={col.key}
                scope="col"
                aria-sort={active ? ARIA_SORT[sort.dir] : undefined}
                className={cn(col.width, col.from && SHOWN_FROM[col.from])}
              >
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className="table-sort pressable group/sort"
                  data-active={active || undefined}
                >
                  {col.label}
                  <Icon
                    aria-hidden
                    className="size-3 transition-[opacity,translate] duration-300 group-hover/sort:-translate-y-px"
                  />
                </button>
              </th>
            )
          })}
          <th scope="col" className="w-12">
            <span className="sr-only">原始碼</span>
          </th>
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.key}>
          {group.key && (
            <tr>
              <th scope="rowgroup" colSpan={span} className="table-group">
                {group.key}
                <span className="ml-3 text-metal tabular-nums">
                  {pad(group.entries.length)}
                </span>
              </th>
            </tr>
          )}
          {group.entries.map((p) => (
            <tr key={p.repo} className="group/row table-row">
              {COLUMNS.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    col.cellClassName,
                    col.from && SHOWN_FROM[col.from]
                  )}
                >
                  {col.cell(p)}
                </td>
              ))}
              <td className="text-right">
                {p.sourceUrl ? (
                  <a
                    href={p.sourceUrl}
                    target="_blank"
                    rel="noopener"
                    aria-label={`${p.title} 原始碼`}
                    className="pressable relative z-10 inline-grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <GithubMark aria-hidden className="size-3.5" />
                  </a>
                ) : (
                  <ArrowUpRight
                    aria-hidden
                    className="ml-auto size-3.5 text-muted-foreground transition-transform duration-500 ease-(--ease-spring) group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5 group-hover/row:text-foreground"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  )
}
