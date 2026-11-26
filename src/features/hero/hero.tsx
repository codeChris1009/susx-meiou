import { ArrowDown } from "lucide-react"

import { Roll, actionVariants } from "@/components/action"
import { GithubMark } from "@/components/github-mark"
import { featured, platforms, practice, year } from "@/content"
import { site } from "@/site"

import { Hello } from "./hello"

export const HERO_ID = "top"

const pad = (n: number) => String(n).padStart(2, "0")

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="group/stat cursor-default transition-transform duration-300 ease-(--ease-spring) select-none active:scale-95">
      <dt className="text-[0.66rem] tracking-[0.22em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-metal text-4xl font-light tracking-tight tabular-nums transition-[translate,filter] duration-500 ease-(--ease-spring) group-hover/stat:-translate-y-1 group-hover/stat:brightness-125">
        {pad(value)}
      </dd>
    </div>
  )
}

/**
 * The title page. A running head across the top (who, what, when), the greeting and the name as one two-line poster,
 * then a Chinese subtitle, the actions and the count of what is inside. A hairline column grid sits behind it all.
 */
export function Hero() {
  return (
    <section
      id={HERO_ID}
      aria-labelledby="hero-title"
      className="intro-veil relative -mt-16 overflow-hidden pt-16"
    >
      <div
        aria-hidden
        className="hero-rules container-wide pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[16%] right-[5%] hidden aspect-[1024/1292] h-[58%] lg:block"
      >
        <span className="hero-mark-fill absolute inset-0" />
        <span className="hero-mark absolute inset-0" />
      </div>

      <div className="hero-content container-wide relative flex min-h-[calc(100svh-4rem)] flex-col justify-between gap-16 pt-8 pb-12">
        <p className="animate-rise grid grid-cols-2 gap-4 border-b border-foreground/10 pb-4 text-[0.66rem] tracking-[0.24em] text-muted-foreground uppercase sm:grid-cols-4">
          <span>{site.brand}</span>
          <span>{site.role}</span>
          <span className="hidden sm:block">Selected work {year}</span>
          <span className="hidden text-right tabular-nums sm:block">
            Index {pad(featured.length + practice.length)}
          </span>
        </p>

        <div>
          <h1
            id="hero-title"
            className="heading-display group/headline origin-left cursor-default text-[clamp(2.25rem,8.2vw,8rem)] select-none"
          >
            <span className="sr-only">Hello world {site.name} Here</span>
            <span aria-hidden className="animate-rise block">
              <Hello />
            </span>
            <span
              aria-hidden
              className="animate-rise metal-shine hero-name block [--rise-delay:140ms]"
            >
              {site.name} Here
            </span>
          </h1>

          <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="animate-rise [--rise-delay:260ms] lg:col-span-5">
              <p className="text-lg font-medium tracking-[0.12em] sm:text-xl">
                每一個作品都能直接打開
              </p>
              <p className="prose-cjk mt-3 max-w-md text-sm text-pretty text-muted-foreground sm:text-[0.95rem]">
                {`${site.role} ${site.name} 的線上作品：資料閱讀、互動敘事與 WebGPU 場景，部署在 Cloudflare Workers 與 GitHub Pages，清單每週由 GitHub Actions 自動同步。`}
              </p>
            </div>

            <div className="animate-rise flex flex-wrap gap-3 [--rise-delay:360ms] lg:col-span-4 lg:col-start-6">
              <a href="#gallery" className={actionVariants({ tone: "solid" })}>
                <Roll>Explore works</Roll>
                <ArrowDown className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/action:translate-y-0.5" />
              </a>
              <a
                href={site.github}
                target="_blank"
                rel="noopener"
                className={actionVariants({ tone: "outline" })}
              >
                <GithubMark
                  aria-hidden
                  className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/action:-rotate-12"
                />
                <Roll>GitHub</Roll>
              </a>
            </div>

            <dl className="animate-rise grid grid-cols-3 gap-6 [--rise-delay:460ms] lg:col-span-3">
              <Stat value={featured.length} label="Works" />
              <Stat value={practice.length} label="Practice" />
              <Stat value={platforms} label="Platforms" />
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
