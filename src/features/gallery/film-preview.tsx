import { Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { SparkRing } from "@/components/spark-ring/spark-ring"
import { burst } from "@/components/spark-ring/sparks"

import { type FilmPhase, FilmPlayer, type FilmState } from "./film-player"
import type { GalleryScene } from "./scene"

interface FilmPreviewProps {
  scene: GalleryScene
  /** The piece in front, and its film */
  index: number
  film: string
  /** The mouse is resting on that piece and the ring is at rest */
  watching: boolean
  /** The room's cursor: the loading ring rides beside it */
  cursor: HTMLElement | null
  onPhase: (phase: FilmPhase) => void
}

/**
 * The film's parts outside the scene: the small ring of light beside the cursor while the film loads, the video the
 * scene paints onto the piece, and the film's one control, sound. The scene writes the piece's place on screen onto
 * this layer every frame (scene.anchor), which places the sound button.
 */
export function FilmPreview({
  scene,
  index,
  film,
  watching,
  cursor,
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
