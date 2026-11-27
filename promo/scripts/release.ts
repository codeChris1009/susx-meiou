/**
 * Renders films and cuts them for the site: score → master (out/<id>.mp4, 1920×804) → web cut in the site's assets
 * (../src/assets/promo/<id>.mp4: 1600×668, H.264 CRF 24, AAC 160k, faststart), named after the gallery piece so
 * content.ts hangs it on the right one. Prints each cut's length and size.
 *
 *   node scripts/release.ts anthology fovea     → just those
 *   node scripts/release.ts                     → every film in src/films.ts
 */
import { execFileSync } from "node:child_process"
import { statSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dirname, "..")
const bin = join(root, "node_modules", ".bin", "remotion")
const ids = process.argv.slice(2)
const all = [
  "anthology",
  "gym-leaders",
  "fovea",
  "ash",
  "heroines",
  "yi-64",
  "rivals",
  "villain-orgs",
]

for (const id of ids.length ? ids : all) {
  const master = join(root, "out", `${id}.mp4`)
  const web = join(root, "..", "src", "assets", "promo", `${id}.mp4`)
  execFileSync("node", [join(root, "scripts", "compose.ts"), id], {
    stdio: "inherit",
  })
  execFileSync(bin, ["render", id, master, "--log=error"], {
    stdio: "inherit",
    cwd: root,
  })
  execFileSync(
    bin,
    [
      "ffmpeg",
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      master,
      "-vf",
      "scale=1600:668:flags=lanczos,format=yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "24",
      "-profile:v",
      "high",
      "-level",
      "4.1",
      "-g",
      "60",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-ac",
      "2",
      "-movflags",
      "+faststart",
      web,
    ],
    { stdio: "inherit" }
  )
  const seconds = Number(
    execFileSync(bin, [
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      web,
    ]).toString()
  )
  const audio = execFileSync(bin, [
    "ffprobe",
    "-v",
    "error",
    "-select_streams",
    "a",
    "-show_entries",
    "stream=codec_name",
    "-of",
    "csv=p=0",
    web,
  ])
    .toString()
    .trim()
  console.log(
    `${id}: ${seconds.toFixed(1)} s, ${(statSync(web).size / 1e6).toFixed(1)} MB, audio ${audio || "none"}`
  )
}
