import { ArrowUpRight } from "lucide-react"
import type { CSSProperties } from "react"

import { GithubMark } from "@/components/github-mark"
import { useReveal } from "@/hooks/use-reveal"
import { cn } from "@/lib/utils"
import { HOST_LABEL, type Entry } from "./collection"
import { displayUrl, pad } from "@/lib/format"

export type CardVariant = "feature" | "default" | "compact"

interface ProjectCardProps {
  project: Entry
  variant?: CardVariant
  /** Stagger for the scroll reveal */
  delayMs?: number
  /** Above-the-fold cards load eagerly; the rest wait until scrolled near */
  eager?: boolean
}

/**
 * The whole card opens the site through a stretched title link (`after:inset-0`), so the source link can sit inside
 * it as a sibling: an <a> inside an <a> is invalid HTML and screen readers announce it badly.
 *
 * Hover: the card lifts, a metal hairline lights its top edge, the screenshot slowly zooms while a band of light
 * sweeps across it, the title underline draws in and the arrow leaves its corner. Press: the card sinks back.
 */
export function ProjectCard({
  project,
  variant = "default",
  delayMs = 0,
  eager = false,
}: ProjectCardProps) {
  const reveal = useReveal<HTMLElement>()
  const feature = variant === "feature"
  const compact = variant === "compact"

  return (
    <article
      ref={reveal}
      style={{ "--reveal-delay": `${delayMs}ms` } as CSSProperties}
      className={cn(
        "reveal group/project relative flex flex-col overflow-hidden rounded-lg bg-card text-card-foreground ring-1 ring-foreground/8",
        "shadow-[0_1px_2px_color-mix(in_oklch,var(--shade)_5%,transparent)] transition-[translate,scale,box-shadow,--tw-ring-color] duration-700 ease-(--ease-out-expo)",
        "hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-24px_color-mix(in_oklch,var(--shade)_35%,transparent)] hover:ring-metal/45",
        "focus-within:ring-2 focus-within:ring-metal/70",
        "active:translate-y-0 active:scale-[0.988] active:duration-150",
        feature && "sm:col-span-2 lg:grid lg:grid-cols-[1.55fr_1fr]"
      )}
    >
      {/* Metal edge that lights up on hover */}
      <div
        aria-hidden
        className="hairline-metal absolute inset-x-0 top-0 z-10 opacity-0 transition-opacity duration-700 group-hover/project:opacity-100"
      />

      <div
        className={cn(
          "sheen relative overflow-hidden bg-muted",
          feature
            ? "aspect-[16/10] lg:aspect-auto lg:min-h-full"
            : "aspect-[16/10]",
          feature ? "border-b lg:border-r lg:border-b-0" : "border-b"
        )}
      >
        {project.shot ? (
          <img
            src={project.shot}
            alt=""
            width={1280}
            height={800}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={(e) => e.currentTarget.setAttribute("data-loaded", "")}
            className="img-reveal size-full object-cover object-top group-hover/project:scale-[1.045] group-hover/project:brightness-[1.04]"
          />
        ) : (
          <div className="dot-grid flex size-full items-center justify-center">
            <span className="text-4xl font-semibold tracking-tight text-metal">
              {project.title.slice(0, 2)}
            </span>
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "gap-1.5 p-4" : feature ? "gap-3 p-6 lg:p-8" : "gap-2.5 p-5"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            lang="en"
            className="text-[0.7rem] tracking-[0.2em] text-metal uppercase tabular-nums"
          >
            No. {pad(project.no)}
          </span>
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-lg ring-1 ring-foreground/10 transition-all duration-500 ease-(--ease-settle) group-hover/project:bg-metal group-hover/project:text-background group-hover/project:ring-transparent"
          >
            <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-(--ease-settle) group-hover/project:translate-x-px group-hover/project:-translate-y-px group-hover/project:rotate-12" />
          </span>
        </div>

        <h3
          className={cn(
            "display-cjk font-semibold",
            compact ? "text-base" : feature ? "text-2xl lg:text-3xl" : "text-lg"
          )}
        >
          <a
            href={project.url}
            target="_blank"
            rel="noopener"
            className="link-draw outline-none after:absolute after:inset-0 after:z-0"
          >
            {project.title}
          </a>
        </h3>

        {project.description && (
          <p
            className={cn(
              "prose-cjk text-pretty text-muted-foreground",
              compact
                ? "line-clamp-2 text-xs"
                : feature
                  ? "line-clamp-4 text-[0.95rem]"
                  : "line-clamp-2 text-sm"
            )}
          >
            {project.description}
          </p>
        )}
        {feature && (
          // The whole card is the link (the stretched title); this only says so, in the space a short description leaves
          <span
            aria-hidden
            lang="en"
            className="mt-2 inline-flex items-center gap-2 self-start text-xs tracking-[0.18em] text-foreground uppercase"
          >
            <span className="hairline-metal w-6 transition-[width] duration-700 ease-(--ease-out-expo) group-hover/project:w-12" />
            Open the site
          </span>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="relative flex size-1.5 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-60 motion-reduce:hidden" />
              <span className="relative size-1.5 rounded-full bg-live" />
            </span>
            <span className="truncate transition-colors duration-300 group-hover/project:text-foreground">
              {displayUrl(project.url)}
            </span>
          </span>
          {!compact && (
            <span className="ml-auto flex items-center gap-1.5">
              {[HOST_LABEL[project.host], project.language]
                .filter((label): label is string => Boolean(label))
                .map((label) => (
                  <span
                    key={label}
                    className="rounded-lg px-2 py-0.5 ring-1 ring-foreground/10 transition-[color,--tw-ring-color] duration-500 group-hover/project:text-foreground group-hover/project:ring-metal/50"
                  >
                    {label}
                  </span>
                ))}
              {project.sourceUrl && (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  aria-label={`${project.title} 原始碼`}
                  className="pressable relative z-10 grid size-7 place-items-center rounded-lg hover:bg-accent hover:text-foreground"
                >
                  <GithubMark aria-hidden className="size-3.5" />
                </a>
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
