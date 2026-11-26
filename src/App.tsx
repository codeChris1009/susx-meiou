import { ArrowDown, ArrowUp } from "lucide-react"

import { GithubMark } from "@/components/github-mark"
import { SiteHeader } from "@/components/site-header"
import data from "@/data/projects.json"
import { curation } from "@/features/projects/curation"
import { ProjectCard } from "@/features/projects/project-card"
import { buildShowcase, shotsByRepo } from "@/features/projects/showcase"
import type { SyncFile } from "@/features/projects/types"
import { useReveal } from "@/hooks/use-reveal"
import { useScrollEffects } from "@/hooks/use-scroll-effects"
import { site } from "@/site"

// Written by scripts/sync.ts against the same SyncFile type; JSON imports widen string unions, hence the assertion
const sync = data as SyncFile
const shots = shotsByRepo(
  import.meta.glob<string>("/src/assets/shots/*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  })
)
const { featured, practice } = buildShowcase(sync.projects, curation, shots)
const syncedOn = sync.syncedAt.slice(0, 10)
const year = syncedOn.slice(0, 4)
const platforms = new Set([...featured, ...practice].map((p) => p.host)).size

// Cards in a row arrive one after another; the stagger restarts every row so late cards never wait long
const stagger = (index: number, perRow: number) => (index % perRow) * 110

const HERO_ID = "top"

interface SectionHeadingProps {
  id: string
  index: string
  title: string
  note: string
}

function SectionHeading({ id, index, title, note }: SectionHeadingProps) {
  const reveal = useReveal<HTMLDivElement>()
  const rule = useReveal<HTMLDivElement>()
  return (
    <div className="mb-10">
      <div
        ref={reveal}
        className="reveal flex items-end justify-between gap-6 pb-5"
      >
        <h2 id={id} className="flex items-baseline gap-4">
          <span
            aria-hidden
            className="font-mono text-5xl leading-none font-light tracking-tighter text-metal sm:text-6xl"
          >
            {index}
          </span>
          <span className="display-cjk text-2xl font-semibold sm:text-3xl">
            {title}
          </span>
        </h2>
        <p className="pb-1 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          {note}
        </p>
      </div>
      <div ref={rule} aria-hidden className="reveal-rule hairline-metal" />
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="group/stat cursor-default">
      <dt className="font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-4xl font-light text-metal tabular-nums transition-transform duration-500 ease-(--ease-spring) group-hover/stat:-translate-y-0.5">
        {String(value).padStart(2, "0")}
      </dd>
    </div>
  )
}

function Hero() {
  return (
    <section id={HERO_ID} className="relative -mt-16 overflow-hidden pt-16">
      <div
        aria-hidden
        className="hero-field dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_25%_10%,black,transparent)]"
      />
      <div
        aria-hidden
        className="hero-glow absolute -top-1/4 left-1/3 size-[42rem] rounded-full blur-2xl"
      />

      <div className="hero-content container-wide relative flex min-h-[calc(92svh-4rem)] flex-col justify-center py-24">
        <p className="animate-rise flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.28em] text-muted-foreground uppercase">
          <span aria-hidden className="hairline-metal w-10" />
          Selected work · {year}
        </p>

        <h1 className="display-cjk mt-7 max-w-4xl text-5xl font-semibold text-balance sm:text-6xl lg:text-7xl">
          <span className="animate-rise block [--rise-delay:90ms]">
            每一個作品，
          </span>
          <span className="animate-rise metal-shine block pb-2 [--rise-delay:180ms]">
            都能直接打開
          </span>
        </h1>

        <p className="animate-rise prose-cjk mt-7 max-w-xl text-pretty text-muted-foreground [--rise-delay:280ms] sm:text-lg">
          Fullstack 工程師 {site.owner} 的線上作品：資料閱讀、互動敘事與 WebGPU
          場景，部署在 Cloudflare Workers 與 GitHub Pages，清單每週由 GitHub
          Actions 自動同步。
        </p>

        <div className="animate-rise mt-10 flex flex-wrap items-center gap-3 [--rise-delay:380ms]">
          <a
            href="#works"
            className="pressable group/cta inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:shadow-[0_12px_30px_-12px_rgb(0_0_0/0.5)]"
          >
            瀏覽作品
            <ArrowDown className="size-4 transition-transform duration-500 ease-(--ease-spring) group-hover/cta:translate-y-0.5" />
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener"
            className="pressable group/cta inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium ring-1 ring-foreground/15 hover:bg-accent hover:ring-metal/50"
          >
            <GithubMark
              aria-hidden
              className="size-4 transition-transform duration-500 ease-(--ease-spring) group-hover/cta:-rotate-12"
            />
            GitHub
          </a>
        </div>

        <dl className="animate-rise mt-16 grid max-w-md grid-cols-3 gap-6 [--rise-delay:480ms]">
          <Stat value={featured.length} label="Works" />
          <Stat value={practice.length} label="Practice" />
          <Stat value={platforms} label="Platforms" />
        </dl>
      </div>

      <a
        href="#works"
        aria-label="捲動到作品"
        className="pressable group/cue absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-mono text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase hover:text-foreground sm:flex"
      >
        Scroll
        <span className="scroll-cue-line block h-12 w-px bg-foreground/15 transition-[height] duration-500 ease-(--ease-out-expo) group-hover/cue:h-16" />
      </a>
    </section>
  )
}

function Footer() {
  const reveal = useReveal<HTMLDivElement>()
  return (
    <footer className="relative mt-12 overflow-hidden border-t">
      <div ref={reveal} className="reveal container-wide py-16">
        <p
          aria-hidden
          className="font-mono text-5xl font-semibold tracking-tighter text-metal select-none sm:text-7xl lg:text-8xl"
        >
          {site.brand}
        </p>
        <div className="hairline-metal mt-10" />
        <div className="mt-6 flex flex-col gap-4 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.owner} · 清單更新於 {syncedOn}
          </p>
          <div className="flex items-center gap-5">
            <a
              href={site.github}
              target="_blank"
              rel="noopener"
              className="pressable link-draw inline-flex items-center gap-1.5 pb-0.5 hover:text-foreground"
            >
              <GithubMark aria-hidden className="size-3.5" />
              {site.githubUser}
            </a>
            <a
              href={`#${HERO_ID}`}
              className="pressable group/top inline-flex items-center gap-1.5 hover:text-foreground"
            >
              回到頂端
              <ArrowUp className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/top:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function App() {
  useScrollEffects(HERO_ID)

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        <section className="container-wide py-24" aria-labelledby="works">
          <SectionHeading
            id="works"
            index="01"
            title="作品"
            note={`${featured.length} projects`}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
            {featured.map((project, i) => (
              <ProjectCard
                key={project.repo}
                project={project}
                index={i}
                variant={i === 0 ? "feature" : "default"}
                delayMs={i === 0 ? 0 : stagger(i - 1, 2)}
                eager={i < 3}
              />
            ))}
          </div>
        </section>

        {practice.length > 0 && (
          <section className="container-wide pb-24" aria-labelledby="practice">
            <SectionHeading
              id="practice"
              index="02"
              title="練習"
              note="Early studies"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {practice.map((project, i) => (
                <ProjectCard
                  key={project.repo}
                  project={project}
                  index={i}
                  variant="compact"
                  delayMs={stagger(i, 4)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
