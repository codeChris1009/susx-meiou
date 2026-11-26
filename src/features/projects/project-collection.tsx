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

  const reset = () => setPresentation(defaultPresentation(presentation.view))

  return (
    <div ref={root} className="collection">
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
          <div className="grid place-items-center gap-5 rounded-lg py-20 text-center ring-1 ring-foreground/8 ring-inset">
            <p className="text-[0.7rem] tracking-[0.24em] text-muted-foreground uppercase">
              Nothing matches
            </p>
            <button
              type="button"
              onClick={reset}
              className={actionVariants({
                tone: "outline",
                className: "group/reset",
              })}
            >
              <RotateCcw
                aria-hidden
                className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/reset:-rotate-45"
              />
              <Roll>Reset</Roll>
            </button>
          </div>
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
