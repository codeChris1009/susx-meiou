import { SectionHeading } from "@/components/section-heading"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { featured, gallery, practice } from "@/content"
import { GallerySection } from "@/features/gallery/gallery-section"
import { HERO_ID, Hero } from "@/features/hero/hero"
import { ProjectCollection } from "@/features/projects/project-collection"
import { useScrollEffects } from "@/hooks/use-scroll-effects"

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
          <ProjectCollection
            id="works"
            projects={featured}
            noun="works"
            density="feature"
          />
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
            <ProjectCollection
              id="practice"
              projects={practice}
              noun="studies"
              density="compact"
            />
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

export default App
