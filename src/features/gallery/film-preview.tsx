import { Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { OilRing } from "@/components/oil-ring/oil-ring"

import { type FilmPhase, FilmPlayer, type FilmState } from "./film-player"
import type { GalleryScene } from "./scene"

interface FilmPreviewProps {
  scene: GalleryScene
  /** The piece in front, and its film */
  index: number
  film: string
  /** The mouse is resting on that piece and the ring is at rest */
  watching: boolean
  onPhase: (phase: FilmPhase) => void
}

/**
 * The film's layer over the room: the oil ring painted over the piece while the film loads, the film itself (drawn
 * by the scene, onto the piece), and its one control, sound. Laid out by the piece's place on screen, which the scene
 * writes onto this layer every frame (scene.anchor).
 */
export function FilmPreview({
  scene,
  index,
  film,
  watching,
  onPhase,
}: FilmPreviewProps) {
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const player = useRef<FilmPlayer | null>(null)
  const [state, setState] = useState<FilmState>({
    phase: "idle",
    progress: 0,
    seed: 0,
  })
  const [sound, setSound] = useState(false)

  useEffect(() => {
    const el = root.current
    const v = video.current
    if (!el || !v) return
    scene.anchor(el)
    const p = new FilmPlayer({
      scene,
      index,
      video: v,
      root: el,
      onChange: setState,
    })
    player.current = p
    return () => {
      p.dispose()
      player.current = null
      scene.anchor(null)
    }
  }, [scene, index, film])

  useEffect(() => player.current?.watch(watching), [watching])
  useEffect(() => onPhase(state.phase), [state.phase, onPhase])
  useEffect(() => () => onPhase("idle"), [onPhase])

  const toggle = () => {
    const on = !sound
    setSound(on)
    player.current?.setSound(on)
  }
  const playing = state.phase === "playing"

  return (
    <div
      ref={root}
      data-phase={state.phase}
      aria-hidden={state.phase === "idle"}
      className="film pointer-events-none absolute inset-0"
    >
      {/* In the page and in view, as a playing video must be, but never seen: the scene paints its frames */}
      <video
        ref={video}
        src={film}
        muted
        playsInline
        preload="none"
        tabIndex={-1}
        aria-hidden
        className="film-source"
      />
      <OilRing
        progress={state.progress}
        seed={state.seed}
        label="宣傳影片載入中"
        className="film-ring"
      >
        <span className="film-ring-word gallery-title metal-shine">
          Trailer
        </span>
      </OilRing>
      <button
        type="button"
        aria-pressed={sound}
        aria-label="影片聲音"
        inert={!playing}
        onClick={toggle}
        onPointerEnter={() => player.current?.hold(true)}
        onPointerLeave={() => player.current?.hold(false)}
        className="film-sound"
      >
        {sound ? (
          <Volume2 aria-hidden className="size-3.5" />
        ) : (
          <VolumeX aria-hidden className="size-3.5" />
        )}
        <span>Sound</span>
      </button>
    </div>
  )
}
