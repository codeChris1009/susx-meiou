import { GithubMark } from "@/components/github-mark"
import { SiteHeader } from "@/components/site-header"
import data from "@/data/projects.json"
import { curation } from "@/features/projects/curation"
import { ProjectCard } from "@/features/projects/project-card"
import { buildShowcase, shotsByRepo } from "@/features/projects/showcase"
import type { SyncFile } from "@/features/projects/types"
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

interface SectionHeadingProps {
  id: string
  index: string
  title: string
  note: string
}

function SectionHeading({ id, index, title, note }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4 border-b pb-3">
      <h2
        id={id}
        className="flex items-baseline gap-3 text-lg font-medium tracking-tight"
      >
        <span aria-hidden className="font-mono text-xs text-muted-foreground">
          {index}
        </span>
        {title}
      </h2>
      <p className="font-mono text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

export function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_20%_0%,black,transparent)]"
          />
          <div className="container-wide relative py-20 sm:py-28">
            <p className="animate-fade-up font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Selected work · {featured.length + practice.length} live sites
            </p>
            <h1 className="animate-fade-up mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance [animation-delay:80ms] sm:text-5xl">
              每一個作品，都能直接打開
            </h1>
            <p className="animate-fade-up mt-5 max-w-2xl leading-relaxed text-pretty text-muted-foreground [animation-delay:160ms]">
              Fullstack 工程師 {site.owner}{" "}
              的線上作品：資料閱讀、互動敘事、WebGPU 場景與早期練習，部署在
              Cloudflare Workers 與 GitHub Pages。清單每週由 GitHub Actions
              自動同步。
            </p>
          </div>
        </section>

        <section className="container-wide py-14" aria-labelledby="works">
          <SectionHeading
            id="works"
            index="01"
            title="作品"
            note={`${featured.length} projects`}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {featured.map((project, i) => (
              <ProjectCard key={project.repo} project={project} eager={i < 2} />
            ))}
          </div>
        </section>

        {practice.length > 0 && (
          <section className="container-wide pb-20" aria-labelledby="practice">
            <SectionHeading
              id="practice"
              index="02"
              title="練習"
              note="早期的學習作品"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {practice.map((project) => (
                <ProjectCard key={project.repo} project={project} compact />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t">
        <div className="container-wide flex flex-col gap-2 py-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {syncedOn.slice(0, 4)} {site.owner} · 清單更新於 {syncedOn}
          </p>
          <a
            href={site.github}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <GithubMark aria-hidden className="size-3.5" />
            {site.githubUser}
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
