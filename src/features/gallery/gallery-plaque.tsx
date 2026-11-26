import { ArrowLeft, ArrowRight, ArrowUpRight, Expand } from "lucide-react"

import { Roll, actionVariants } from "@/components/action"
import { useMagnetic } from "@/hooks/use-magnetic"
import { pad } from "@/lib/format"

import type { GalleryPiece } from "./pieces"

/**
 * The words around the piece in front: its title in the script face above it, and below it the count, the English
 * name, the Chinese line and the controls. Presentational: the section owns which piece is current and how to turn.
 */
export function GallerySignature({ piece }: { piece: GalleryPiece }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[3.5%] flex justify-center"
    >
      <p
        key={piece.id}
        className="signature-swap gallery-title metal-shine px-[0.3em] text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.3]"
      >
        {piece.title}
      </p>
    </div>
  )
}

interface GalleryPlaqueProps {
  pieces: readonly GalleryPiece[]
  current: number
  /** The reader has turned the ring at least once: the hint retires */
  touched: boolean
  step: (delta: number) => void
  go: (index: number) => void
  /** Opens a piece with no public site in the viewer */
  view: (index: number) => void
}

export function GalleryPlaque({
  pieces,
  current,
  touched,
  step,
  go,
  view,
}: GalleryPlaqueProps) {
  const open = useMagnetic<HTMLAnchorElement>()
  const piece = pieces[current]
  if (!piece) return null
  const count = pieces.length
  return (
    <div className="gallery-plaque pointer-events-none absolute inset-x-0 bottom-0 pt-24 pb-8 sm:pb-10">
      <div className="container-wide flex flex-col items-center text-center">
        <p aria-live="polite" className="sr-only">
          {piece.title} {piece.name} {piece.caption}
        </p>
        <div key={piece.id} aria-hidden className="plaque-swap">
          <p className="text-[0.6875rem] tracking-[0.32em] text-muted-foreground tabular-nums">
            {pad(current + 1)} / {pad(count)}
          </p>
          <h3
            lang="en"
            className="mt-2.5 text-base font-medium tracking-[0.04em] sm:text-lg"
          >
            {piece.name}
          </h3>
          <p className="mt-1 text-sm tracking-[0.14em] text-balance text-muted-foreground">
            {piece.caption}
          </p>
        </div>

        <div className="pointer-events-auto mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="上一件"
            className={actionVariants({ tone: "icon" })}
          >
            <ArrowLeft className="size-4 transition-transform duration-500 ease-(--ease-settle) group-hover/action:-translate-x-0.5" />
          </button>
          {piece.href ? (
            <a
              ref={open}
              href={piece.href}
              target="_blank"
              rel="noopener"
              lang="en"
              className={actionVariants({ tone: "solid" })}
            >
              <Roll>Open project</Roll>
              <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-(--ease-settle) group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
            </a>
          ) : (
            <button
              type="button"
              lang="en"
              onClick={() => view(current)}
              className={actionVariants({ tone: "solid" })}
            >
              <Roll>View piece</Roll>
              <Expand
                aria-hidden
                className="size-3.5 transition-transform duration-500 ease-(--ease-settle) group-hover/action:scale-110"
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="下一件"
            className={actionVariants({ tone: "icon" })}
          >
            <ArrowRight className="size-4 transition-transform duration-500 ease-(--ease-settle) group-hover/action:translate-x-0.5" />
          </button>
        </div>

        {/* One tick per piece: where the ring is, and a way to jump straight to any piece */}
        <div className="pointer-events-auto mt-5 flex items-center">
          {pieces.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`${pad(i + 1)} ${p.name}`}
              aria-current={i === current || undefined}
              className="group/tick px-1 py-2.5"
            >
              <span className="gallery-tick block h-px" />
            </button>
          ))}
        </div>

        <p
          data-hidden={touched || undefined}
          lang="en"
          className="gallery-hint mt-3 hidden text-[0.6875rem] tracking-[0.28em] text-muted-foreground uppercase sm:block"
        >
          Drag or use the arrow keys <span className="mx-2 opacity-40">/</span>{" "}
          Click the front piece to open
        </p>
      </div>
    </div>
  )
}
