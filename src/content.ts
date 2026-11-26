/**
 * The page's content, assembled once at build time: synced projects + curation + screenshots → the works and practice
 * sections; the hang + gallery frames → the gallery. Components import finished data from here and only lay it out.
 */
import data from "@/data/projects.json"
import { HANG, buildGallery } from "@/features/gallery/pieces"
import { curation } from "@/features/projects/curation"
import { buildShowcase } from "@/features/projects/showcase"
import type { SyncFile } from "@/features/projects/types"
import { byFileStem } from "@/lib/assets"

// Written by scripts/sync.ts against the same SyncFile type; JSON imports widen string unions, hence the assertion
const sync = data as SyncFile

const shots = byFileStem(
  import.meta.glob<string>("/src/assets/shots/*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  })
)
const frames = byFileStem(
  import.meta.glob<string>("/src/assets/gallery/*.webp", {
    eager: true,
    query: "?url",
    import: "default",
  })
)

export const { featured, practice } = buildShowcase(
  sync.projects,
  curation,
  shots
)
export const gallery = buildGallery(HANG, sync.projects, frames)

/** When the project list last changed, as YYYY-MM-DD */
export const syncedOn = sync.syncedAt.slice(0, 10)
export const year = syncedOn.slice(0, 4)
export const platforms = new Set([...featured, ...practice].map((p) => p.host))
  .size
