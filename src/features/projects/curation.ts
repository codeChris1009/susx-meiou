import type { Curation } from "./types.ts"

export const curation = {
  practice: [
    "React-TodoList0",
    "demoIndieBookstore",
    "Py-Bookshelf0",
    "demo-3js-Gallery0",
  ],
  order: [
    "fovea",
    "yi-64",
    "pokemon-ash",
    "pokemon-rivals",
    "pokemon-gym-leaders",
    "pokemon-girl-friends",
    "pokemon-anti-org",
  ],
  overrides: {
    fovea: { title: "Fovea" },
    "yi-64": { title: "YI·64" },
    "pokemon-ash": { title: "I Choose You" },
    "pokemon-rivals": { title: "Pokémon Rivals" },
    "pokemon-gym-leaders": { title: "Gym Leaders" },
    "pokemon-girl-friends": { title: "Pokémon Heroines" },
    "pokemon-anti-org": { title: "Pokémon Anti-Org" },
    // The practice sites have no meta description and their repo descriptions are notes to self
    "React-TodoList0": {
      title: "React Todo List",
      description: "第一個 React 專案：霓虹風格的待辦清單",
    },
    demoIndieBookstore: {
      title: "Indie Bookstore",
      description: "獨立書店的活動推廣頁，HTML / CSS 響應式版面練習",
    },
    "Py-Bookshelf0": {
      title: "Neon Bookshelf",
      description: "霓虹風格的書櫃：新增書籍與書單列表",
    },
    "demo-3js-Gallery0": {
      title: "3D Art Gallery",
      description: "Three.js 打造的 3D 藝廊展間",
    },
  },
} as const satisfies Curation
