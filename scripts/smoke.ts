/**
 * After a deploy: the live page answers, is this build (not a cached old one), and its script and stylesheet load.
 * Edge caches can take a moment to pick up a new version, so it retries before failing.
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

const ATTEMPTS = 6
const WAIT_MS = 5000

async function check(): Promise<string | null> {
  const page = await fetch(homepage, { cache: "no-store" })
  if (!page.ok) return `GET ${homepage} → ${page.status}`
  const html = await page.text()
  if (!html.includes(entry!)) return `live page does not reference ${entry} yet`
  for (const asset of html.matchAll(
    /(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g
  )) {
    const res = await fetch(new URL(asset[1]!, homepage))
    if (!res.ok) return `GET ${asset[1]} → ${res.status}`
  }
  return null
}

for (let attempt = 1; ; attempt++) {
  const problem = await check()
  if (!problem) {
    console.log(`✓ ${homepage} serves ${entry}`)
    break
  }
  if (attempt === ATTEMPTS) {
    console.error(`✘ ${problem}`)
    process.exit(1)
  }
  console.log(`… ${problem}, retrying`)
  await new Promise((r) => setTimeout(r, WAIT_MS))
}
