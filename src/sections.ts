/**
 * The page's sections: one place for every anchor id, so a link and the element it points at cannot drift apart. The
 * header's nav and the footer's index both read NAV.
 */
export const SECTION = {
  hero: "top",
  gallery: "gallery",
  works: "works",
  practice: "practice",
} as const

export type SectionId = (typeof SECTION)[keyof typeof SECTION]

export const NAV: readonly { id: SectionId; label: string }[] = [
  { id: SECTION.gallery, label: "Gallery" },
  { id: SECTION.works, label: "Works" },
  { id: SECTION.practice, label: "Practice" },
]

export const href = (id: SectionId) => `#${id}`
