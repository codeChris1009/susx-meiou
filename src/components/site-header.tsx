import { Moon, Sun } from "lucide-react"

import { GithubMark } from "@/components/github-mark"
import { useTheme } from "@/components/theme-provider"
import { useActiveSection } from "@/hooks/use-active-section"
import { site } from "@/site"

const NAV = [
  { id: "gallery", label: "精選" },
  { id: "works", label: "作品" },
  { id: "practice", label: "練習" },
] as const

const iconButton =
  "pressable group/icon grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"

function ThemeToggle() {
  const { setTheme } = useTheme()
  // Read the class, not `theme`: "system" says nothing about what is on screen right now
  const toggle = () =>
    setTheme(
      document.documentElement.classList.contains("dark") ? "light" : "dark"
    )

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切換深淺色"
      className={iconButton}
    >
      {/* The two icons swap with a quarter turn; hover nudges the visible one */}
      <span className="relative size-4 transition-transform duration-500 ease-(--ease-spring) group-hover/icon:rotate-12">
        <Sun
          aria-hidden
          className="absolute inset-0 size-4 scale-50 -rotate-90 opacity-0 transition-all duration-500 ease-(--ease-out-expo) dark:scale-100 dark:rotate-0 dark:opacity-100"
        />
        <Moon
          aria-hidden
          className="absolute inset-0 size-4 transition-all duration-500 ease-(--ease-out-expo) dark:scale-50 dark:rotate-90 dark:opacity-0"
        />
      </span>
    </button>
  )
}

const NAV_IDS = NAV.map((item) => item.id)

export function SiteHeader() {
  const active = useActiveSection(NAV_IDS)
  return (
    <header className="site-header sticky top-0 z-50">
      <div className="container-wide flex h-full items-center justify-between">
        <a
          href="#top"
          className="pressable group/logo inline-flex items-center gap-2.5 rounded-md text-sm font-semibold tracking-tight"
        >
          {/* The artwork is portrait (1024 x 1292), so the width is 0.79 of the height */}
          <span
            aria-hidden
            className="brand-mark inline-block h-6 w-[1.19rem] shrink-0 transition-transform duration-700 ease-(--ease-spring) group-hover/logo:scale-110 group-hover/logo:-rotate-6"
          />
          <span className="transition-[letter-spacing] duration-500 ease-(--ease-out-expo) group-hover/logo:tracking-wide">
            {site.brand}
          </span>
        </a>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="主要">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id || undefined}
              className="pressable link-draw hidden px-2 py-1 text-sm text-muted-foreground hover:text-foreground sm:inline-block"
            >
              {item.label}
            </a>
          ))}
          <span
            aria-hidden
            className="mx-1 hidden h-4 w-px bg-border sm:block"
          />
          <a
            href={site.github}
            target="_blank"
            rel="noopener"
            aria-label="GitHub"
            className={iconButton}
          >
            <GithubMark
              aria-hidden
              className="size-4 transition-transform duration-500 ease-(--ease-spring) group-hover/icon:scale-110"
            />
          </a>
          <ThemeToggle />
        </nav>
      </div>
      <div
        aria-hidden
        data-scroll-rule
        className="scroll-rule absolute inset-x-0 bottom-0 h-px bg-metal"
      />
    </header>
  )
}
