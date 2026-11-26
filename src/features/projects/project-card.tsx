import { ArrowUpRight } from "lucide-react"
import { cn } from "cn"

import { GithubMark } from "@/components/github-mark"
import { Badge } from "@/components/ui/badge"
import type { Host, Project } from "./types.ts"

const HOST_LABEL: Record<Host, string> = {
  cloudflare: "Cloudflare",
  "github-pages": "GitHub Pages",
  vercel: "Vercel",
  other: "Web",
}

const displayUrl = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "")

interface ProjectCardProps {
  project: Project
  compact?: boolean
  /** Above-the-fold cards load eagerly; the rest wait until scrolled near */
  eager?: boolean
}

/**
 * The whole card opens the site through a stretched title link (`after:inset-0`), so the source link can sit inside
 * it as a sibling: an <a> inside an <a> is invalid HTML and screen readers announce it badly.
 */
export function ProjectCard({
  project,
  compact = false,
  eager = false,
}: ProjectCardProps) {
  return (
    <article
      className={cn(
        "group/project relative flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow",
        "focus-within:ring-2 focus-within:ring-ring hover:ring-foreground/25"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b bg-muted">
        {project.shot ? (
          <img
            src={project.shot}
            alt=""
            width={1280}
            height={800}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover object-top transition-transform duration-500 ease-out motion-safe:group-hover/project:scale-[1.03]"
          />
        ) : (
          <div className="dot-grid flex size-full items-center justify-center">
            <span className="font-mono text-4xl font-semibold tracking-tight text-muted-foreground">
              {project.title.slice(0, 2)}
            </span>
          </div>
        )}
      </div>

      <div
        className={cn("flex flex-1 flex-col gap-2", compact ? "p-3" : "p-4")}
      >
        <h3
          className={cn(
            "font-medium tracking-tight",
            compact ? "text-sm" : "text-base"
          )}
        >
          <a
            href={project.url}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-between gap-2 outline-none after:absolute after:inset-0"
          >
            {project.title}
            <ArrowUpRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover/project:translate-x-0.5 motion-safe:group-hover/project:-translate-y-0.5"
            />
          </a>
        </h3>
        {project.description && (
          <p
            className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              compact ? "line-clamp-2 text-xs" : "line-clamp-2"
            )}
          >
            {project.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 font-mono text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full bg-live"
            />
            <span className="truncate">{displayUrl(project.url)}</span>
          </span>
          {!compact && (
            <span className="ml-auto flex items-center gap-1.5">
              <Badge variant="outline" className="font-mono font-normal">
                {HOST_LABEL[project.host]}
              </Badge>
              {project.language && (
                <Badge variant="outline" className="font-mono font-normal">
                  {project.language}
                </Badge>
              )}
              {project.sourceUrl && (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  aria-label={`${project.title} 原始碼`}
                  className="relative z-10 -m-1 rounded-sm p-1 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
