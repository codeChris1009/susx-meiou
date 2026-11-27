import { ArrowUpRight, X } from "lucide-react"
import { useEffect, useRef } from "react"

import { Roll, actionVariants } from "@/components/action"

import type { GalleryPiece } from "./pieces"

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches

interface PieceViewerProps {
  /** The piece to show, or null when closed */
  piece: GalleryPiece | null
  onClose: () => void
}

/**
 * A piece, viewed: the frame at full size (its film, where it has one) with its title, name and line, in a modal
 * <dialog> (focus is held inside, Escape closes, the page behind is inert, all native). Every piece in the room opens
 * here first; a public one offers Open, to its own site, at the foot. A private one is never linked.
 */
export function PieceViewer({ piece, onClose }: PieceViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (piece && !el.open) el.showModal()
    if (!piece && el.open) el.close()
  }, [piece])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="piece-viewer-name"
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself, never on its content
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
      className="piece-viewer dark"
    >
      {piece && (
        <div className="piece-viewer-body">
          <p
            aria-hidden
            className="gallery-title metal-shine text-center text-[clamp(2.4rem,5vw,4rem)] leading-[1.3]"
          >
            {piece.title}
          </p>
          <div className="piece-viewer-frame mt-4 rounded-[3px] bg-metal p-[3px] shadow-[0_40px_80px_-30px_color-mix(in_oklch,var(--shade)_80%,transparent)]">
            {piece.film ? (
              <video
                src={piece.film}
                poster={piece.image}
                aria-label={`${piece.name} 宣傳影片`}
                controls
                muted
                playsInline
                autoPlay={!still()}
                preload="metadata"
                className="block aspect-[3/2] w-full rounded-[1px] bg-black object-contain"
              />
            ) : (
              <img
                src={piece.image}
                alt={`${piece.name} 作品畫面`}
                width={1200}
                height={800}
                decoding="async"
                className="block aspect-[3/2] w-full rounded-[1px] bg-background object-cover"
              />
            )}
          </div>
          <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
            <h2
              id="piece-viewer-name"
              lang="en"
              className="text-lg font-medium tracking-[0.04em]"
            >
              {piece.name}
            </h2>
            <p className="text-sm tracking-[0.14em] text-muted-foreground">
              {piece.caption}
            </p>
            {!piece.href && (
              <p
                lang="en"
                className="mt-2 text-[0.6875rem] tracking-[0.24em] text-muted-foreground uppercase"
              >
                Team project{" "}
                <span aria-hidden className="mx-2 opacity-40">
                  /
                </span>{" "}
                Not public yet
              </p>
            )}
          </div>
          {/* A plain button, not <form method="dialog">: the CSP sets form-action 'none' */}
          <div className="mt-7 flex justify-center gap-3">
            {piece.href && (
              <a
                href={piece.href}
                target="_blank"
                rel="noopener"
                lang="en"
                className={actionVariants({ tone: "solid" })}
              >
                <Roll>Open</Roll>
                <ArrowUpRight
                  aria-hidden
                  className="size-3.5 transition-transform duration-500 ease-(--ease-settle) group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5"
                />
              </a>
            )}
            <button
              type="button"
              lang="en"
              onClick={() => dialog.current?.close()}
              className={actionVariants({
                tone: "outline",
                className: "group/close",
              })}
            >
              <X
                aria-hidden
                className="size-3.5 transition-transform duration-500 ease-(--ease-settle) group-hover/close:rotate-90"
              />
              <Roll>Close</Roll>
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
