import { Moon, Sun } from "lucide-react"

import { GithubMark } from "@/components/github-mark"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { site } from "@/site"

function ThemeToggle() {
  const { setTheme } = useTheme()
  // Read the class, not `theme`: "system" says nothing about what is on screen right now
  const toggle = () =>
    setTheme(
      document.documentElement.classList.contains("dark") ? "light" : "dark"
    )

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="切換深淺色"
    >
      <Sun aria-hidden className="hidden dark:block" />
      <Moon aria-hidden className="dark:hidden" />
    </Button>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 h-14 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide flex h-full items-center justify-between">
        <a
          href="/"
          className="inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-tight"
        >
          {/* The artwork is portrait (1024 x 1292), so the width is 0.79 of the height */}
          <span
            aria-hidden
            className="brand-mark inline-block h-5 w-[0.99rem] shrink-0"
          />
          {site.brand}
          <span className="text-muted-foreground"> / works</span>
        </a>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" asChild>
            <a
              href={site.github}
              target="_blank"
              rel="noopener"
              aria-label="GitHub"
            >
              <GithubMark aria-hidden />
            </a>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
