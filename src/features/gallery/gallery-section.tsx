import { ArrowLeft, ArrowRight, ArrowUpRight, Lock } from "lucide-react"
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { SectionHeading } from "@/components/section-heading"

import type { GalleryPiece } from "./pieces"
import type { GalleryScene } from "./scene"

/** Start fetching three.js this far before the section scrolls into view, so it is ready when it arrives */
const PRELOAD_MARGIN = "800px 0px"

type Mode = "idle" | "loading" | "3d" | "flat"

const pad = (n: number) => String(n).padStart(2, "0")

function supportsWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl2")
  } catch {
    return false
  }
}

interface GallerySectionProps {
  pieces: readonly GalleryPiece[]
  index: string
}

/**
 * The gallery room. The three.js scene (scene.ts, its own chunk) does the 3D; this owns everything a reader and a
 * screen reader can reach: the plaque, the controls, the keyboard, and a flat framed picture that stands in while the
 * scene loads and stays if WebGL is unavailable. Turning the ring and pressing the buttons are the same action.
 */
export function GallerySection({
  pieces,
  index: sectionIndex,
}: GallerySectionProps) {
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<GalleryScene | null>(null)
  const [mode, setMode] = useState<Mode>("idle")
  const [current, setCurrent] = useState(0)
  const count = pieces.length
  const piece = pieces[current]

  const open = useCallback(
    (i: number) => {
      const href = pieces[i]?.href
      if (href) window.open(href, "_blank", "noopener")
    },
    [pieces]
  )

  // Relative to where the ring is heading, not where it is: quick presses add up instead of repeating one step
  const step = useCallback(
    (delta: number) => {
      if (scene.current) scene.current.step(delta)
      else setCurrent((c) => (((c + delta) % count) + count) % count)
    },
    [count]
  )

  // The latest values, for callbacks the scene keeps across renders
  const latest = useRef({ open, current })
  useEffect(() => {
    latest.current = { open, current }
  })

  // Load the scene as the section approaches; fall back to the flat hang if WebGL is missing or anything fails
  useEffect(() => {
    const el = stage.current
    const cv = canvas.current
    if (!el || !cv || !pieces.length) return
    let disposed = false
    let made: GalleryScene | null = null
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        if (!supportsWebGL()) return setMode("flat")
        setMode("loading")
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
        import("./scene")
          .then(async ({ GalleryScene }) => {
            if (disposed) return
            made = new GalleryScene(
              cv,
              pieces.map((p) => p.image),
              { onFocus: setCurrent, onOpen: (i) => latest.current.open(i) },
              reduced
            )
            const box = cv.getBoundingClientRect()
            made.resize(box.width, box.height)
            await made.load()
            if (disposed) return
            made.goTo(latest.current.current)
            scene.current = made
            setMode("3d")
          })
          .catch(() => {
            made?.dispose()
            made = null
            if (!disposed) setMode("flat")
          })
      },
      { rootMargin: PRELOAD_MARGIN }
    )
    io.observe(el)
    return () => {
      disposed = true
      io.disconnect()
      made?.dispose()
      scene.current = null
    }
  }, [pieces])

  // Render only while on screen; keep the canvas sized to its box
  useEffect(() => {
    const el = stage.current
    const s = scene.current
    if (!el || !s || mode !== "3d") return
    const io = new IntersectionObserver(([entry]) =>
      s.setActive(!!entry?.isIntersecting)
    )
    const ro = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect
      if (box) s.resize(box.width, box.height)
    })
    io.observe(el)
    ro.observe(el)
    return () => {
      io.disconnect()
      ro.disconnect()
      s.setActive(false)
    }
  }, [mode])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else if (e.key === "Enter" && e.target === e.currentTarget) open(current)
    else return
    e.preventDefault()
  }

  if (!piece) return null
  const flat = mode !== "3d"

  return (
    <section aria-labelledby="gallery" className="gallery-room dark relative">
      <div className="container-wide pt-24">
        <SectionHeading
          id="gallery"
          index={sectionIndex}
          title="精選"
          note={`Gallery · ${count} pieces`}
          className="mb-0"
        />
      </div>

      <div
        ref={stage}
        role="group"
        aria-roledescription="carousel"
        aria-label="精選作品展間，用左右方向鍵切換"
        tabIndex={0}
        onKeyDown={onKey}
        className="gallery-stage relative mt-6 h-[clamp(34rem,86svh,56rem)] outline-none focus-visible:ring-1 focus-visible:ring-metal/40"
      >
        <canvas
          ref={canvas}
          aria-hidden
          data-ready={mode === "3d" || undefined}
          className="gallery-canvas absolute inset-0 size-full cursor-grab touch-pan-y active:cursor-grabbing"
        />

        {/* Stand-in while three.js loads, and the whole gallery where WebGL is unavailable */}
        <div
          aria-hidden={!flat}
          data-hidden={!flat || undefined}
          className="gallery-flat pointer-events-none absolute inset-x-0 top-[8%] mx-auto w-[min(88%,52rem)]"
        >
          <div className="rounded-[3px] bg-metal p-[3px] shadow-[0_40px_80px_-30px_color-mix(in_oklch,var(--shade)_80%,transparent)]">
            <img
              key={piece.id}
              src={piece.image}
              alt=""
              width={1200}
              height={800}
              decoding="async"
              className="gallery-flat-img block aspect-[3/2] w-full rounded-[1px] bg-background object-cover"
            />
          </div>
          {mode === "loading" && (
            <p className="mt-4 text-center font-mono text-[0.65rem] tracking-[0.3em] text-muted-foreground uppercase">
              Hanging the gallery…
            </p>
          )}
        </div>

        <div className="gallery-plaque pointer-events-none absolute inset-x-0 bottom-0 pt-24 pb-8 sm:pb-12">
          <div className="container-wide flex flex-col items-center text-center">
            <div key={piece.id} aria-live="polite" className="plaque-swap">
              <p className="font-mono text-[0.65rem] tracking-[0.32em] text-muted-foreground tabular-nums">
                {pad(current + 1)} / {pad(count)}
              </p>
              <h3 className="gallery-title mt-1 text-metal px-[0.3em] text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.35]">
                {piece.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {piece.caption}
              </p>
            </div>

            <div className="pointer-events-auto mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="上一件"
                className="pressable inline-flex size-11 items-center justify-center rounded-full ring-1 ring-foreground/15 hover:bg-accent hover:ring-metal/50"
              >
                <ArrowLeft className="size-4" />
              </button>
              {piece.href ? (
                <a
                  href={piece.href}
                  target="_blank"
                  rel="noopener"
                  className="pressable group/open inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:shadow-[0_12px_30px_-12px_color-mix(in_oklch,var(--metal-hi)_45%,transparent)]"
                >
                  開啟作品
                  <ArrowUpRight className="size-4 transition-transform duration-500 ease-(--ease-spring) group-hover/open:translate-x-0.5 group-hover/open:-translate-y-0.5" />
                </a>
              ) : (
                <span className="inline-flex h-11 cursor-default items-center gap-2 rounded-full px-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
                  <Lock className="size-3.5" />
                  未公開
                </span>
              )}
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="下一件"
                className="pressable inline-flex size-11 items-center justify-center rounded-full ring-1 ring-foreground/15 hover:bg-accent hover:ring-metal/50"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
            <p className="mt-4 hidden font-mono text-[0.6rem] tracking-[0.28em] text-muted-foreground/70 uppercase sm:block">
              Drag · ← → · Click the front piece to open
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
