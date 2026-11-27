import { RotateCcw, Volume2, VolumeX } from "lucide-react"
import { type MouseEvent, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { SparkRing } from "@/components/spark-ring/spark-ring"
import { burst } from "@/components/spark-ring/sparks"

import { type FilmPhase, FilmPlayer, type FilmState } from "./film-player"
import { ART_ASPECT } from "./ring"
import type { GalleryScene } from "./scene"

interface FilmPreviewProps {
  scene: GalleryScene
  /** The piece in front, and its film */
  index: number
  film: string
  /** The mouse is resting on that piece and the ring is at rest */
  watching: boolean
  /** The room's cursor: the loading ring rides beside it, and its ring is how near the film counts as watched */
  cursor: HTMLElement | null
  /** This film has opened before: the replay button stays */
  primed: boolean
  /** The film has opened, the first time or again */
  onPrimed: (film: string) => void
  onPhase: (phase: FilmPhase) => void
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * The film's parts outside the scene: the small ring of light beside the cursor while the film loads, the video the
 * scene paints onto the piece, and the film's controls at the piece's lower right: sound while it plays, and replay
 * once it has played. The scene writes the piece's place on screen onto this layer every frame (scene.anchor), which
 * places them. The controls count as watching: pointer on them or focus in them, the film plays on.
 */
export function FilmPreview({
  scene,
  index,
  film,
  watching,
  cursor,
  primed,
  onPrimed,
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
    const p = new FilmPlayer({ scene, index, video: v, onChange: setState })
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

  const open = state.phase === "opening" || state.phase === "playing"
  useEffect(() => {
    if (state.phase === "opening") onPrimed(film)
  }, [state.phase, film, onPrimed])

  // Once open, the mouse may wander: the film plays on while the cursor's ring still touches the frame
  useEffect(() => {
    scene.setReach(open && cursor ? cursor.offsetWidth / 2 : 0)
    return () => scene.setReach(0)
  }, [scene, open, cursor])

  // Loaded: the cursor ring throws the gallery's click sparks as the film opens under it
  useEffect(() => {
    const stage = cursor?.parentElement
    if (state.phase !== "opening" || !cursor || !stage) return
    const x = parseFloat(cursor.style.getPropertyValue("--x"))
    const y = parseFloat(cursor.style.getPropertyValue("--y"))
    if (Number.isFinite(x) && Number.isFinite(y))
      burst(stage, x, y, cursor.offsetWidth / 2, 16)
  }, [state.phase, cursor])

  const toggle = () => {
    const on = !sound
    setSound(on)
    player.current?.setSound(on)
  }
  /** Replays from the button: the film opens out of it, at its place on the piece */
  const replay = (e: MouseEvent<HTMLButtonElement>) => {
    const el = root.current
    if (!el) return
    const v = (name: string) => parseFloat(el.style.getPropertyValue(name))
    const [x, y, h] = [v("--piece-x"), v("--piece-y"), v("--piece-h")]
    const r = el.getBoundingClientRect()
    const b = e.currentTarget.getBoundingClientRect()
    const w = h * ART_ASPECT
    const at = {
      x: clamp01((b.left + b.width / 2 - r.left - (x - w / 2)) / w),
      y: clamp01(1 - (b.top + b.height / 2 - r.top - (y - h / 2)) / h),
    }
    player.current?.replay(
      Number.isFinite(at.x) && Number.isFinite(at.y) ? at : { x: 0.5, y: 0.5 }
    )
  }
  const hold = {
    onPointerEnter: () => player.current?.hold(true),
    onPointerLeave: () => player.current?.hold(false),
    onFocus: () => player.current?.hold(true),
    onBlur: () => player.current?.hold(false),
  }
  const playing = state.phase === "playing"

  return (
    <div
      ref={root}
      data-phase={state.phase}
      data-primed={primed || undefined}
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
      {cursor &&
        createPortal(
          <SparkRing
            key={state.seed}
            progress={state.phase === "painting" ? state.progress : 1}
            label="宣傳影片載入中"
            className="gallery-cursor-loader"
          />,
          cursor
        )}
      <div className="film-controls">
        <button
          type="button"
          aria-pressed={sound}
          aria-label="影片聲音"
          inert={!playing}
          onClick={toggle}
          {...hold}
          className="film-control film-sound"
        >
          {sound ? (
            <Volume2 aria-hidden className="size-3.5" />
          ) : (
            <VolumeX aria-hidden className="size-3.5" />
          )}
          <span>Sound</span>
        </button>
        <button
          type="button"
          aria-label="重播宣傳影片"
          inert={!primed}
          onClick={replay}
          {...hold}
          className="film-control film-replay"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          <span>Replay</span>
        </button>
      </div>
    </div>
  )
}
