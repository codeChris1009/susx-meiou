import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { SectionHeading } from "@/components/section-heading"
import { pad } from "@/lib/format"
import { SECTION } from "@/sections"

import type { FilmPhase } from "./film-player"
import { FilmPreview } from "./film-preview"
import { GalleryPlaque, GallerySignature } from "./gallery-plaque"
import { PieceViewer } from "./piece-viewer"
import type { GalleryPiece } from "./pieces"
import type { GalleryScene } from "./scene"

/** Start fetching three.js this far before the section scrolls into view, so it is ready when it arrives */
const PRELOAD_MARGIN = "800px 0px"

type Mode = "idle" | "loading" | "3d" | "flat"

/** Probes for WebGL 2, then hands the context back: browsers cap live contexts, and a probe should not hold one */
function supportsWebGL() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2")
    gl?.getExtension("WEBGL_lose_context")?.loseContext()
    return !!gl
  } catch {
    return false
  }
}

interface GallerySectionProps {
  pieces: readonly GalleryPiece[]
  /** Section numeral in the page outline, "01" */
  numeral: string
}

/**
 * The gallery room. The three.js scene (scene.ts, its own chunk) does the 3D; this owns everything a reader and a
 * screen reader can reach: the plaque, the controls, the keyboard, and a flat framed picture that stands in while the
 * scene loads and stays if WebGL is unavailable. Turning the ring and pressing the buttons are the same action.
 */
export function GallerySection({ pieces, numeral }: GallerySectionProps) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<GalleryScene | null>(null)
  const [mode, setMode] = useState<Mode>("idle")
  /** The scene once it is up, for the parts that render against it */
  const [live, setLive] = useState<GalleryScene | null>(null)
  /** The piece the mouse rests on, in front, with the ring at rest (3D only) */
  const [present, setPresent] = useState<number | null>(null)
  const [filmPhase, setFilmPhase] = useState<FilmPhase>("idle")
  /** Films play on their own only for readers who have not asked for less motion */
  const [still] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const [current, setCurrent] = useState(0)
  /** The piece under the pointer (3D only): the cursor says what a click will do */
  const [hovered, setHovered] = useState<number | null>(null)
  /** The hint retires once the reader has turned the ring once */
  const [touched, setTouched] = useState(false)
  const count = pieces.length
  const piece = pieces[current]

  /** The piece open in the viewer (one with no public site), or null */
  const [viewing, setViewing] = useState<GalleryPiece | null>(null)

  // Every piece opens: a public one in its own tab, a private one in the viewer
  const open = useCallback(
    (i: number) => {
      const target = pieces[i]
      if (!target) return
      if (target.href) window.open(target.href, "_blank", "noopener")
      else setViewing(target)
    },
    [pieces]
  )

  // Relative to where the ring is heading, not where it is: quick presses add up instead of repeating one step
  const step = useCallback(
    (delta: number) => {
      setTouched(true)
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
            made = new GalleryScene({
              canvas: cv,
              images: pieces.map((p) => p.image),
              callbacks: {
                onFocus: setCurrent,
                onHover: setHovered,
                onPresent: setPresent,
                onOpen: (i) => latest.current.open(i),
              },
              reducedMotion: reduced,
            })
            const box = cv.getBoundingClientRect()
            made.resize(box.width, box.height)
            await made.load()
            if (disposed) return
            made.goTo(latest.current.current)
            scene.current = made
            setLive(made)
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

  const go = useCallback(
    (i: number) => {
      setTouched(true)
      if (scene.current) scene.current.goTo(i)
      else setCurrent(((i % count) + count) % count)
    },
    [count]
  )

  // On paper, the header borrows the ink tokens while this dark band is under it (see .site-header in index.css)
  useEffect(() => {
    const el = section.current
    if (!el) return
    const html = document.documentElement
    const io = new IntersectionObserver(
      ([entry]) =>
        html.toggleAttribute("data-header-dark", !!entry?.isIntersecting),
      { rootMargin: "0px 0px -94% 0px" }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      html.removeAttribute("data-header-dark")
    }
  }, [])

  /** The cursor ring follows the pointer through CSSOM writes (no style attributes under the CSP) */
  const follow = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = cursor.current
    if (!c || e.pointerType !== "mouse") return
    c.style.setProperty("--x", `${e.nativeEvent.offsetX}px`)
    c.style.setProperty("--y", `${e.nativeEvent.offsetY}px`)
  }
  const cursorLabel =
    hovered === null
      ? "Drag"
      : hovered !== current
        ? "View"
        : pieces[hovered]?.href
          ? "Open"
          : "View"

  const onKey = (e: KeyboardEvent) => {
    setTouched(true)
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else if (e.key === "Enter" && e.target === e.currentTarget) open(current)
    else return
    e.preventDefault()
  }

  if (!piece) return null
  const flat = mode !== "3d"

  return (
    <section
      ref={section}
      aria-labelledby={SECTION.gallery}
      className="gallery-room dark relative"
    >
      <div className="container-wide pt-28 lg:pt-36">
        <SectionHeading
          id={SECTION.gallery}
          index={numeral}
          title="Gallery"
          subtitle="精選展間"
          note={`${pad(count)} pieces`}
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
        className="gallery-stage relative mt-6 h-[clamp(38rem,94svh,60rem)]"
      >
        <canvas
          ref={canvas}
          aria-hidden
          data-ready={mode === "3d" || undefined}
          onPointerDown={(e) => {
            setTouched(true)
            cursor.current?.setAttribute("data-pressed", "")
            follow(e)
          }}
          onPointerUp={() => cursor.current?.removeAttribute("data-pressed")}
          onPointerMove={follow}
          onPointerEnter={() => cursor.current?.setAttribute("data-on", "")}
          onPointerLeave={() => {
            cursor.current?.removeAttribute("data-on")
            cursor.current?.removeAttribute("data-pressed")
          }}
          className="gallery-canvas absolute inset-0 size-full touch-pan-y"
        />

        {/* Stand-in while three.js loads, and the whole gallery where WebGL is unavailable */}
        <div
          aria-hidden={!flat}
          data-hidden={!flat || undefined}
          className="gallery-flat pointer-events-none absolute inset-x-0 top-[17%] mx-auto w-[min(84%,48rem)]"
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
            <p className="metal-shine mt-4 text-center text-[0.6875rem] tracking-[0.3em] uppercase">
              Hanging the gallery
            </p>
          )}
        </div>

        <div
          aria-hidden
          className="gallery-vignette pointer-events-none absolute inset-0"
        />

        {live && piece.film && !still && (
          <FilmPreview
            key={piece.id}
            scene={live}
            index={current}
            film={piece.film}
            watching={present === current}
            onPhase={setFilmPhase}
          />
        )}

        <GallerySignature piece={piece} />

        <div
          ref={cursor}
          aria-hidden
          data-ready={mode === "3d" || undefined}
          data-quiet={
            filmPhase === "painting" || filmPhase === "opening" || undefined
          }
          className="gallery-cursor pointer-events-none absolute top-0 left-0"
        >
          <span>{cursorLabel}</span>
        </div>

        <GalleryPlaque
          pieces={pieces}
          current={current}
          touched={touched}
          step={step}
          go={go}
          view={open}
        />
      </div>
      {/* Room for the vitrine to fade back into the page (on paper) below the plaque */}
      <div aria-hidden className="h-16" />
      <PieceViewer piece={viewing} onClose={() => setViewing(null)} />
    </section>
  )
}
