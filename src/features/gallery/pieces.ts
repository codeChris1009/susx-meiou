import type { SyncedProject } from "@/features/projects/types"

/**
 * The gallery's hang: nine pieces, in ring order. Images are hand-picked frames (src/assets/gallery, 1200×800 WebP),
 * not the weekly screenshots: a gallery shows each work at its best moment, which is rarely its first screen.
 *
 * Links come from the synced project list, so a site that moves or goes offline is followed (or unlinked) by the
 * weekly sync rather than by editing this file. `repo: null` is a piece with no public site: shown, never linked.
 */
export interface GallerySpec {
  /** Image file name in src/assets/gallery, without extension */
  id: string
  repo: string | null
  /** Set in the script face, so Latin only */
  title: string
  caption: string
}

export interface GalleryPiece extends GallerySpec {
  image: string
  href: string | null
}

export const HANG: readonly GallerySpec[] = [
  {
    id: "anthology",
    repo: null,
    title: "Anthology",
    caption: "未竟之問的世界地圖 · 團隊專案，未公開",
  },
  {
    id: "gym-leaders",
    repo: "pokemon-gym-leaders",
    title: "Gym Leaders",
    caption: "寶可夢動畫 · 歷代道館館主",
  },
  {
    id: "fovea",
    repo: "fovea",
    title: "Fovea",
    caption: "公司官方長文的閱讀站",
  },
  {
    id: "ash",
    repo: "pokemon-ash",
    title: "I Choose You",
    caption: "小智的二十六年與八頂帽子",
  },
  {
    id: "heroines",
    repo: "pokemon-girl-friends",
    title: "Pokémon Heroines",
    caption: "陪小智走過旅途的女主角們",
  },
  {
    id: "yi-64",
    repo: "yi-64",
    title: "YI 64",
    caption: "易經六十四卦的互動閱讀",
  },
  {
    id: "rivals",
    repo: "pokemon-rivals",
    title: "Pokémon Rivals",
    caption: "站在小智與冠軍之間的勁敵",
  },
  {
    id: "villain-orgs",
    repo: "pokemon-anti-org",
    title: "Pokémon Anti Org",
    caption: "九個世代的反派組織",
  },
  {
    id: "art-gallery",
    repo: "demo-3js-Gallery0",
    title: "3D Art Gallery",
    caption: "這座展間的原型：Three.js 藝廊",
  },
]

/** Joins the hang with images and live links; a piece without an image is left out rather than hung as a blank */
export function buildGallery(
  hang: readonly GallerySpec[],
  projects: readonly SyncedProject[],
  /** Image URLs by id (file name), see byFileStem */
  images: Readonly<Record<string, string>>
): GalleryPiece[] {
  const live = new Map(
    projects.filter((p) => p.online).map((p) => [p.repo, p.url])
  )
  return hang.flatMap((spec) => {
    const image = images[spec.id]
    if (!image) return []
    return [
      { ...spec, image, href: (spec.repo && live.get(spec.repo)) || null },
    ]
  })
}
