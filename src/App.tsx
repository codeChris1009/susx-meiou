import { SectionHeading } from "@/components/section-heading"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { featured, gallery, practice } from "@/content"
import { GallerySection } from "@/features/gallery/gallery-section"
import { HERO_ID, Hero } from "@/features/hero/hero"
import { ProjectCard } from "@/features/projects/project-card"
import { useScrollEffects } from "@/hooks/use-scroll-effects"

// Cards in a row arrive one after another; the stagger restarts every row so late cards never wait long
const stagger = (index: number, perRow: number) => (index % perRow) * 110

const pad = (n: number) => String(n).padStart(2, "0")

export function App() {
  useScrollEffects(HERO_ID)

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        <GallerySection pieces={gallery} numeral="01" />

        <section className="container-wide py-24" aria-labelledby="works">
          <SectionHeading
            id="works"
            index="02"
            title="Works"
            subtitle="作品"
            note={`${pad(featured.length)} projects`}
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
              index="03"
              title="Practice"
              subtitle="早期練習"
              note={`${pad(practice.length)} studies`}
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

      <SiteFooter />
    </div>
  )
}

export default App
