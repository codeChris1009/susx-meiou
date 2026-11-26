/**
 * `import.meta.glob(..., { query: "?url", import: "default", eager: true })` keys its result by source path; the page
 * wants it keyed by file name. `/src/assets/shots/fovea.jpg` → `fovea`. Only the last extension goes, so repository
 * names with dots (`name-0.0.0.jpg`) survive.
 */
export function byFileStem(
  modules: Readonly<Record<string, string>>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, url]) => [
      path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]+$/, ""),
      url,
    ])
  )
}
