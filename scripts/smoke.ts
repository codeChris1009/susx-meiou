/**
 * After a deploy: the live page answers, is this build (not a cached old one), and its assets load: the script and
 * stylesheet it links, plus what the script loads later (the lazy gallery chunks and the gallery frames), which a
 * broken deploy would otherwise hide until someone scrolls down.
 * Edge locations pick up a new version unevenly (seen: over 30 s for the page and its assets to agree), so it
 * retries for about two minutes before failing.
 *
 *   pnpm smoke   # checks package.json "homepage" against the local dist/
 */
import { readFile } from "node:fs/promises"

const { homepage } = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
) as { homepage: string }
const built = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8"
)
// The hashed entry script names this exact build
const entry = /src="(\/assets\/index-[^"]+\.js)"/.exec(built)?.[1]
if (!entry)
  throw new Error("dist/index.html has no entry script; run the build first")

const ATTEMPTS = 12
const WAIT_MS = 10_000

async function check(): Promise<string | null> {
  const page = await fetch(homepage, { cache: "no-store" })
  if (!page.ok) return `GET ${homepage} → ${page.status}`
  const html = await page.text()
  if (!html.includes(entry!)) return `live page does not reference ${entry} yet`
  const linked = [
    ...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g),
  ].map((m) => m[1]!)
  // Follow scripts one level at a time: the entry imports the gallery chunk, which imports three.js
  const seen = new Set<string>()
  const queue = [...linked]
  while (queue.length) {
    const path = queue.shift()!
    if (seen.has(path)) continue
    seen.add(path)
    const res = await fetch(new URL(path, homepage))
    if (!res.ok) return `GET ${path} → ${res.status}`
    if (!path.endsWith(".js")) continue
    const code = await res.text()
    for (const ref of code.matchAll(/assets\/[\w.-]+\.(?:js|webp)/g)) {
      queue.push(`/${ref[0]}`)
    }
  }
  return null
}

for (let attempt = 1; ; attempt++) {
  const problem = await check()
  if (!problem) {
    console.log(`✓ ${homepage} serves ${entry} and every asset it loads`)
    break
  }
  if (attempt === ATTEMPTS) {
    console.error(`✘ ${problem}`)
    process.exit(1)
  }
  console.log(`… ${problem}, retrying`)
  await new Promise((r) => setTimeout(r, WAIT_MS))
}
