import { SectionHeading } from "@/components/section-heading"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { featured, gallery, practice } from "@/content"
import { GallerySection } from "@/features/gallery/gallery-section"
import { Hero } from "@/features/hero/hero"
import { ProjectCollection } from "@/features/projects/project-collection"
import { useScrollEffects } from "@/hooks/use-scroll-effects"
import { pad } from "@/lib/format"
import { SECTION } from "@/sections"

export function App() {
  useScrollEffects(SECTION.hero)

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        <GallerySection pieces={gallery} numeral="01" />

        <section
          className="container-wide py-28 lg:py-36"
          aria-labelledby={SECTION.works}
        >
          <SectionHeading
            id={SECTION.works}
            index="02"
            title="Works"
            subtitle="作品"
            note={`${pad(featured.length)} projects`}
          />
          <ProjectCollection
            id={SECTION.works}
            projects={featured}
            noun="works"
            density="feature"
          />
        </section>

        {practice.length > 0 && (
          <section
            className="container-wide pb-28 lg:pb-36"
            aria-labelledby={SECTION.practice}
          >
            <SectionHeading
              id={SECTION.practice}
              index="03"
              title="Practice"
              subtitle="早期練習"
              note={`${pad(practice.length)} studies`}
            />
            <ProjectCollection
              id={SECTION.practice}
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
