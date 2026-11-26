import { cn } from "@/lib/utils"

import type { Group } from "./collection"
import { GroupLabel } from "./group-label"
import { ProjectCard } from "./project-card"

// Cards in a row arrive one after another; the stagger restarts every row so late cards never wait long
const stagger = (index: number, perRow: number) => (index % perRow) * 110

interface ProjectGridProps {
  groups: readonly Group[]
  /** "feature": two columns and a lead card; "compact": four small columns */
  density: "feature" | "compact"
  /** Give the first card the lead (only while the list is in its curated, unfiltered order) */
  lead: boolean
}

/** GRID: screens first. Every site as a card with its own screenshot, the work seen before it is read about */
export function ProjectGrid({ groups, density, lead }: ProjectGridProps) {
  const compact = density === "compact"
  const perRow = compact ? 4 : 2
  return (
    <div className="space-y-14">
      {groups.map((group, g) => (
        <div key={group.key}>
          {group.key && (
            <GroupLabel name={group.key} count={group.entries.length} />
          )}
          <div
            className={cn(
              "grid gap-6 sm:grid-cols-2",
              compact ? "gap-5 lg:grid-cols-4" : "lg:gap-8"
            )}
          >
            {group.entries.map((project, i) => {
              const leads = lead && !compact && i === 0
              return (
                <ProjectCard
                  key={project.repo}
                  project={project}
                  variant={compact ? "compact" : leads ? "feature" : "default"}
                  delayMs={
                    leads ? 0 : stagger(lead && !compact ? i - 1 : i, perRow)
                  }
                  // Only the first screen of cards loads eagerly, not the first three of every group
                  eager={g === 0 && i < 3}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
