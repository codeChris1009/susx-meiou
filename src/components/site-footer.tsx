import { ArrowUp } from "lucide-react"

import { Roll, actionVariants } from "@/components/action"
import { GithubMark } from "@/components/github-mark"
import { syncedOn, year } from "@/content"
import { HERO_ID } from "@/features/hero/hero"
import { useReveal } from "@/hooks/use-reveal"
import { site } from "@/site"

/** The page signs off the way the loader opened it: the mark and the script wordmark, in metal */
export function SiteFooter() {
  const reveal = useReveal<HTMLDivElement>()
  return (
    <footer className="relative mt-12 overflow-hidden border-t">
      <div ref={reveal} className="reveal container-wide py-16">
        <div className="flex items-center gap-5 sm:gap-7">
          <span
            aria-hidden
            className="brand-mark inline-block aspect-[1024/1292] h-14 shrink-0 sm:h-20 lg:h-24"
          />
          <p
            aria-hidden
            className="wordmark inline-block cursor-default px-[0.2em] text-6xl leading-[1.3] select-none sm:text-8xl lg:text-9xl"
          >
            {site.brand}
          </p>
        </div>
        <div className="hairline-metal mt-10" />
        <div className="mt-6 flex flex-col gap-4 text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums">
            © {year} {site.name} <span className="mx-2 opacity-40">/</span>{" "}
            Synced {syncedOn}
          </p>
          <div className="-mx-2.5 flex items-center gap-1">
            <a
              href={site.github}
              target="_blank"
              rel="noopener"
              className={actionVariants({ tone: "quiet" })}
            >
              <GithubMark aria-hidden className="size-3.5" />
              <Roll>GitHub</Roll>
            </a>
            <a
              href={`#${HERO_ID}`}
              className={actionVariants({ tone: "quiet" })}
            >
              <Roll>Back to top</Roll>
              <ArrowUp className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/action:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
