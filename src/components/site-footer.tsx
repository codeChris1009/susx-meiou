import { ArrowUp, ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

import { Roll, actionVariants } from "@/components/action"
import { GithubMark } from "@/components/github-mark"
import { syncedOn, year } from "@/content"
import { HERO_ID } from "@/features/hero/hero"
import { useReveal } from "@/hooks/use-reveal"
import { cn } from "@/lib/utils"
import { NAV } from "@/nav"
import { site } from "@/site"

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[0.62rem] tracking-[0.26em] text-muted-foreground uppercase">
        {title}
      </p>
      <div className="mt-4 flex flex-col items-start gap-1">{children}</div>
    </div>
  )
}

const quiet = actionVariants({ tone: "quiet", className: "-mx-2.5 h-8" })

/**
 * The colophon. Three short columns, the way a catalogue closes (where things are, where else to find them, how it
 * was made), then the page signs off as the loader opened it: the mark and the script wordmark, in metal.
 */
export function SiteFooter() {
  const reveal = useReveal<HTMLDivElement>()
  return (
    <footer className="relative mt-12 overflow-hidden border-t">
      <div ref={reveal} className="reveal container-wide pt-20 pb-12">
        <div className="grid gap-12 sm:grid-cols-3">
          <Column title="Index">
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={quiet}>
                <Roll>{item.label}</Roll>
              </a>
            ))}
          </Column>
          <Column title="Elsewhere">
            <a
              href={site.github}
              target="_blank"
              rel="noopener"
              className={quiet}
            >
              <GithubMark aria-hidden className="size-3.5" />
              <Roll>GitHub</Roll>
              <ArrowUpRight
                aria-hidden
                className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5"
              />
            </a>
          </Column>
          <Column title="Colophon">
            <p className="prose-cjk max-w-xs text-sm text-muted-foreground">
              Set in Geist, Noto Sans TC and Stalemate. Built with React and
              three.js, served from Cloudflare Workers.
            </p>
          </Column>
        </div>

        <div className="mt-20 flex items-center gap-5 sm:gap-7">
          <span
            aria-hidden
            className="brand-mark inline-block aspect-[1024/1292] h-14 shrink-0 sm:h-20 lg:h-28"
          />
          <p
            aria-hidden
            className="wordmark inline-block cursor-default px-[0.2em] text-6xl leading-[1.3] select-none sm:text-8xl lg:text-[10rem]"
          >
            {site.brand}
          </p>
        </div>
        <div className="hairline-metal mt-8" />
        <div className="mt-5 flex flex-col gap-3 text-[0.66rem] tracking-[0.2em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums">
            © {year} {site.name}
            <span aria-hidden className="mx-3 opacity-40">
              /
            </span>
            Synced {syncedOn}
          </p>
          <a
            href={`#${HERO_ID}`}
            className={cn(quiet, "self-start sm:self-auto")}
          >
            <Roll>Back to top</Roll>
            <ArrowUp
              aria-hidden
              className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/action:-translate-y-0.5"
            />
          </a>
        </div>
      </div>
    </footer>
  )
}
