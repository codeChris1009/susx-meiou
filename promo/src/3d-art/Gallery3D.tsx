import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  continueRender,
  delayRender,
  staticFile,
  useVideoConfig,
} from "remotion"
import * as THREE from "three"

import { GalleryStage, type StageState } from "./stage"
import { HANG } from "./timeline"

/** The gallery on a canvas: built once per render tab, then drawn synchronously for each frame's state */
/** `state` null: nothing to draw this frame (a 2D shot), but the gallery stays built for the next one */
export function Gallery3D({ state }: { state: StageState | null }) {
  const { width, height } = useVideoConfig()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [stage, setStage] = useState<GalleryStage | null>(null)
  const [waiting] = useState(() => delayRender("Hanging the gallery"))
  const released = useRef(false)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let made: GalleryStage | null = null
    let cancelled = false
    const loader = new THREE.TextureLoader()
    void Promise.all(
      HANG.map((piece) =>
        loader.loadAsync(staticFile(`3d-art/${piece.file}`)).then((t) => {
          t.colorSpace = THREE.SRGBColorSpace
          t.anisotropy = 8
          return t
        })
      )
    ).then((textures) => {
      if (cancelled) return
      made = new GalleryStage(el, textures, width, height)
      setStage(made)
    })
    return () => {
      cancelled = true
      made?.dispose()
    }
  }, [width, height])

  useLayoutEffect(() => {
    if (!stage) return
    if (state) stage.render(state)
    if (released.current) return
    released.current = true
    continueRender(waiting)
  }, [stage, state, waiting])

  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        // The canvas keeps its last picture: hide it for the 2D shots rather than let a stale frame show through
        opacity: state ? 1 : 0,
      }}
    />
  )
}
