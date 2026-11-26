import { ArrowDown } from "lucide-react"
import { useEffect, useRef } from "react"

import { Roll, actionVariants } from "@/components/action"
import { GithubMark } from "@/components/github-mark"
import { featured, platforms, practice, year } from "@/content"
import { useMagnetic } from "@/hooks/use-magnetic"
import { pad } from "@/lib/format"
import { SECTION, href } from "@/sections"
import { site } from "@/site"

import { Hello } from "./hello"

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
/**
 * A soft light that follows the mouse across the title page, raking the hairline grid like a lamp over paper. One
 * radial gradient whose centre is written per frame through the CSSOM; fine pointers only, off under reduced motion.
 */
function useRakingLight() {
  const section = useRef<HTMLElement>(null)
  const light = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = section.current
    const lamp = light.current
    if (
      !el ||
      !lamp ||
      !matchMedia("(pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    let frame = 0
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect()
        lamp.style.setProperty("--lx", `${e.clientX - box.left}px`)
        lamp.style.setProperty("--ly", `${e.clientY - box.top}px`)
        lamp.setAttribute("data-on", "")
      })
    }
    const leave = () => lamp.removeAttribute("data-on")
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
    }
  }, [])
  return { section, light }
}

export function Hero() {
  const { section, light } = useRakingLight()
  const explore = useMagnetic<HTMLAnchorElement>()
  const github = useMagnetic<HTMLAnchorElement>()
  return (
    <section
      ref={section}
      id={SECTION.hero}
      aria-labelledby="hero-title"
      className="intro-veil relative -mt-16 overflow-hidden pt-16"
    >
      <div
        aria-hidden
        className="hero-rules container-wide pointer-events-none absolute inset-0"
      />
      <div
        ref={light}
        aria-hidden
        className="hero-light pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[16%] right-[5%] hidden aspect-[1024/1292] h-[58%] lg:block"
      >
        <span className="hero-mark-fill absolute inset-0" />
        <span className="hero-mark absolute inset-0" />
      </div>

      <div className="hero-content container-wide relative flex min-h-[calc(88svh-4rem)] flex-col justify-between gap-16 pt-8 pb-12 sm:min-h-[calc(100svh-4rem)] lg:pb-28">
        <p
          lang="en"
          className="animate-rise grid grid-cols-2 gap-4 border-b border-foreground/10 pb-4 text-[0.66rem] tracking-[0.24em] text-muted-foreground uppercase sm:grid-cols-4"
        >
          <span>{site.brand}</span>
          <span>{site.role}</span>
          <span className="hidden sm:block">Selected work {year}</span>
          <span className="hidden text-right tabular-nums sm:block">
            {pad(featured.length + practice.length)} live sites
          </span>
        </p>

        <div>
          <h1
            id="hero-title"
            lang="en"
            className="heading-display hero-title group/headline origin-left cursor-default select-none"
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

          <div className="mt-12 grid gap-10 border-t border-foreground/10 pt-8 lg:grid-cols-12 lg:items-end">
            <div className="animate-rise [--rise-delay:260ms] lg:col-span-5">
              <p className="text-lg font-medium tracking-[0.12em] sm:text-xl">
                每一個作品都能直接打開
              </p>
              <p className="prose-cjk mt-3 max-w-md text-sm text-pretty text-muted-foreground sm:text-[0.95rem]">
                {`${site.role} ${site.name} 的線上作品：資料閱讀、互動敘事與 WebGPU 場景，部署在 Cloudflare Workers 與 GitHub Pages，清單每週由 GitHub Actions 自動同步。`}
              </p>
            </div>

            <div
              lang="en"
              className="animate-rise flex flex-wrap gap-3 [--rise-delay:360ms] lg:col-span-4 lg:col-start-6"
            >
              <a
                ref={explore}
                href={href(SECTION.gallery)}
                className={actionVariants({ tone: "solid" })}
              >
                <Roll>Explore works</Roll>
                <ArrowDown className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/action:translate-y-0.5" />
              </a>
              <a
                ref={github}
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

            <dl
              lang="en"
              className="animate-rise grid grid-cols-3 gap-6 [--rise-delay:460ms] lg:col-span-3"
            >
              <Stat value={featured.length} label="Works" />
              <Stat value={practice.length} label="Practice" />
              <Stat value={platforms} label="Platforms" />
            </dl>
          </div>
        </div>
      </div>

      <a
        href={href(SECTION.gallery)}
        lang="en"
        aria-label="Scroll to the gallery"
        className="hero-cue pressable group/cue absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.58rem] tracking-[0.3em] text-muted-foreground uppercase hover:text-foreground sm:right-6 lg:flex"
      >
        Scroll
        <span className="scroll-cue-line block h-12 w-px bg-foreground/15 transition-[height] duration-500 ease-(--ease-out-expo) group-hover/cue:h-16" />
      </a>
    </section>
  )
}
