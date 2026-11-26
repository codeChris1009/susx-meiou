import { LayoutGrid, List, RotateCcw, Search, Table2 } from "lucide-react"
import { useMemo, type Ref } from "react"

import { Roll, actionVariants } from "@/components/action"
import { Segmented, type SegmentOption } from "@/components/segmented"
import { pad } from "@/lib/format"

import {
  defaultPresentation,
  isFiltered,
  type GroupBy,
  type Presentation,
  type View,
} from "./collection"

const VIEW_OPTIONS: readonly SegmentOption<View>[] = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "table", label: "Table", icon: Table2 },
  { value: "list", label: "List", icon: List },
]

const GROUP_OPTIONS: readonly SegmentOption<GroupBy>[] = [
  { value: "none", label: "None" },
  { value: "stack", label: "Stack" },
  { value: "host", label: "Host" },
  { value: "year", label: "Year" },
]

/** What each view is for, said once under the switch */
const VIEW_PITCH: Record<View, string> = {
  grid: "Every site at a glance",
  table: "Sort by any column",
  list: "Hover a name to preview",
}

const ALL = "all"

interface CollectionToolbarProps {
  ref?: Ref<HTMLDivElement>
  /** Prefix for element ids, unique on the page */
  id: string
  /** What is being counted, plural: "works" */
  noun: string
  presentation: Presentation
  onChange: (next: Presentation) => void
  stacks: readonly string[]
  shown: number
  total: number
}

/**
 * The control ring above a collection: the count, a filter field, the stack filter, grouping, the view switch and
 * RESET. Sorting lives in the table's column headers, the one place it can be read and changed at once.
 */
export function CollectionToolbar({
  ref,
  id,
  noun,
  presentation: p,
  onChange,
  stacks,
  shown,
  total,
}: CollectionToolbarProps) {
  const set = (patch: Partial<Presentation>) => onChange({ ...p, ...patch })
  const stackOptions = useMemo<SegmentOption<string>[]>(
    () => [
      { value: ALL, label: "All" },
      ...stacks.map((s) => ({ value: s, label: s })),
    ],
    [stacks]
  )

  return (
    <div ref={ref} lang="en" className="collection-toolbar">
      <div className="flex flex-wrap items-center gap-2">
        <p
          aria-live="polite"
          className="min-w-24 pl-2 text-[0.6875rem] tracking-[0.2em] text-muted-foreground uppercase tabular-nums"
        >
          <span className="text-foreground">{pad(shown)}</span> / {pad(total)}{" "}
          {noun}
        </p>

        <label className="collection-search group/search">
          <Search
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground transition-[color,scale] duration-300 group-focus-within/search:scale-110 group-focus-within/search:text-foreground group-hover/search:text-foreground"
          />
          <span className="sr-only">Filter {noun}</span>
          <input
            id={`${id}-filter`}
            type="search"
            value={p.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Filter by name stack or note"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[0.7rem] placeholder:tracking-[0.16em] placeholder:text-muted-foreground/70 placeholder:uppercase"
          />
        </label>

        <Segmented
          label="View"
          value={p.view}
          options={VIEW_OPTIONS}
          onChange={(view) => set({ view })}
          iconsOnlyOnSmall
        />

        <button
          type="button"
          onClick={() => onChange(defaultPresentation(p.view))}
          disabled={!isFiltered(p)}
          className={actionVariants({
            tone: "outline",
            className: "group/reset h-9 px-3.5",
          })}
        >
          <RotateCcw
            aria-hidden
            className="size-3.5 transition-transform duration-500 ease-(--ease-settle) group-hover/reset:-rotate-45 group-active/reset:-rotate-90"
          />
          <Roll>Reset</Roll>
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-foreground/8 pt-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="toolbar-label">Stack</span>
          <Segmented
            label="Stack"
            value={p.stack ?? ALL}
            options={stackOptions}
            onChange={(stack) => set({ stack: stack === ALL ? null : stack })}
            className="max-w-full overflow-x-auto"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="toolbar-label">Group</span>
          <Segmented
            label="Group"
            value={p.group}
            options={GROUP_OPTIONS}
            onChange={(group) => set({ group })}
          />
        </div>
        <p
          key={p.view}
          className="toolbar-pitch ml-auto hidden pr-2 text-[0.6875rem] tracking-[0.2em] text-muted-foreground uppercase lg:block"
        >
          {VIEW_PITCH[p.view]}
        </p>
      </div>
    </div>
  )
}
