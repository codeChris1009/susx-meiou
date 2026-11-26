import { RotateCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Roll, actionVariants } from "@/components/action"

import {
  defaultPresentation,
  isFiltered,
  nextSort,
  number,
  present,
  stacksOf,
  type Presentation,
} from "./collection"
import { CollectionToolbar } from "./collection-toolbar"
import { ProjectGrid } from "./project-grid"
import { ProjectIndex } from "./project-index"
import { ProjectTable } from "./project-table"
import type { Project } from "./types"

/** What a filter that leaves nothing shows: say so, and offer the way back */
function EmptyResult({ onReset }: { onReset: () => void }) {
  return (
    <div
      lang="en"
      className="grid place-items-center gap-5 rounded-lg py-20 text-center ring-1 ring-foreground/8 ring-inset"
    >
      <p className="text-[0.7rem] tracking-[0.24em] text-muted-foreground uppercase">
        Nothing matches
      </p>
      <button
        type="button"
        onClick={onReset}
        className={actionVariants({
          tone: "outline",
          className: "group/reset",
        })}
      >
        <RotateCcw
          aria-hidden
          className="size-3.5 transition-transform duration-500 ease-(--ease-settle) group-hover/reset:-rotate-45"
        />
        <Roll>Reset</Roll>
      </button>
    </div>
  )
}

interface ProjectCollectionProps {
  /** Prefix for ids, unique on the page */
  id: string
  projects: readonly Project[]
  /** Plural noun for the count and captions: "works" */
  noun: string
  /** Grid density: the main works get a lead card and two columns, the early studies four small ones */
  density: "feature" | "compact"
}

/**
 * A section's projects in three views over one presentation state: GRID (screens first), TABLE (a sortable spec sheet
 * with a frozen header) and LIST (an index of names with a trailing preview). Filter, group and sort carry across
 * views, so switching views changes how the same selection is shown, never what is selected.
 */
export function ProjectCollection({
  id,
  projects,
  noun,
  density,
}: ProjectCollectionProps) {
  const entries = useMemo(() => number(projects), [projects])
  const stacks = useMemo(() => stacksOf(projects), [projects])
  const [presentation, setPresentation] = useState<Presentation>(() =>
    defaultPresentation()
  )
  const { groups, count } = useMemo(
    () => present(entries, presentation),
    [entries, presentation]
  )

  // The table's frozen header sits under the (sticky) toolbar, so it needs the toolbar's height as it wraps
  const root = useRef<HTMLDivElement>(null)
  const toolbar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    const bar = toolbar.current
    if (!el || !bar) return
    const ro = new ResizeObserver(() =>
      el.style.setProperty("--toolbar-h", `${bar.offsetHeight}px`)
    )
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  // The ring floats (sticky) from md up; a sentinel just above it says when it has left its place in the flow
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const mark = sentinel.current
    const bar = toolbar.current
    if (!mark || !bar) return
    const wide = matchMedia("(min-width: 768px)")
    const io = new IntersectionObserver(
      ([entry]) =>
        bar.toggleAttribute(
          "data-stuck",
          !!entry &&
            wide.matches &&
            !entry.isIntersecting &&
            entry.boundingClientRect.top < 0
        ),
      // The header is 3.5rem once the page has moved, and the ring sticks 0.75rem below it
      { rootMargin: "-68px 0px 0px 0px" }
    )
    io.observe(mark)
    return () => io.disconnect()
  }, [])

  const reset = () => setPresentation(defaultPresentation(presentation.view))

  return (
    <div ref={root} className="collection">
      <div ref={sentinel} aria-hidden className="h-px" />
      <CollectionToolbar
        ref={toolbar}
        id={id}
        noun={noun}
        presentation={presentation}
        onChange={setPresentation}
        stacks={stacks}
        shown={count}
        total={entries.length}
      />

      <div
        key={presentation.view}
        data-view={presentation.view}
        className="collection-view mt-8"
      >
        {count === 0 ? (
          <EmptyResult onReset={reset} />
        ) : presentation.view === "grid" ? (
          <ProjectGrid
            groups={groups}
            density={density}
            lead={!isFiltered(presentation)}
          />
        ) : presentation.view === "table" ? (
          <ProjectTable
            groups={groups}
            sort={presentation.sort}
            onSort={(key) =>
              setPresentation((p) => ({ ...p, sort: nextSort(p.sort, key) }))
            }
            caption={`${count} ${noun}`}
          />
        ) : (
          <ProjectIndex groups={groups} />
        )}
      </div>
    </div>
  )
}
