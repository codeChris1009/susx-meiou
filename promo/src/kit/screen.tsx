/**
 * The product on screen: a capture of the live site (a still, a tall full-page still or a live clip) seen through a
 * camera that pushes, pans and scrolls across it, either filling the frame or floated as a card in 3D. Overlays drawn in
 * the capture's own pixels (Marks, Cursor) ride the same camera, so a ring drawn round a button stays on the button.
 */
import {
  type CSSProperties,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  Easing,
  Img,
  OffthreadVideo,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

import type { PointerTrack } from "./capture-plan"

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const
export const glide = Easing.bezier(0.45, 0, 0.2, 1)

/** Where the camera looks: the centre of the view as a share of the capture (0 to 1), and zoom (1 just covers) */
export interface Cam {
  x?: number
  y?: number
  zoom?: number
}

/** A capture floated as a card: centre as a share of the frame, width as a share of it, turned in 3D (degrees) */
export interface Card {
  x?: number
  y?: number
  w?: number
  rx?: number
  ry?: number
  rz?: number
  opacity?: number
}

export interface Skin {
  radius?: number
  edge?: string
  shadow?: string
}

const ImageSpace = createContext({ scale: 1, frame: 0, fps: 30, clipTime: 0 })
/** Inside a Screen: how many frame px one capture px is, and the clip's own time */
export const useImageSpace = () => useContext(ImageSpace)

const mix = (
  a: number | undefined,
  b: number | undefined,
  k: number,
  d: number
) => (a ?? d) + ((b ?? a ?? d) - (a ?? d)) * k

interface ScreenProps {
  /** Under public/, a .jpg/.png still or an .mp4 clip */
  src: string
  /** The capture's size in px; a full-page still is taller */
  size?: readonly [number, number]
  /** Frames the camera takes from the first to the second */
  duration: number
  cam?: readonly [Cam, Cam]
  /** Floated as a card instead of filling the frame */
  card?: readonly [Card, Card]
  skin?: Skin
  /** A clip: where in it to start, seconds, and how fast to play it */
  clipFrom?: number
  rate?: number
  ease?: (t: number) => number
  style?: CSSProperties
  children?: ReactNode
}

export function Screen({
  src,
  size = [1920, 1080],
  duration,
  cam = [{}, {}],
  card,
  skin = {},
  clipFrom = 0,
  rate = 1,
  ease = glide,
  style,
  children,
}: ScreenProps) {
  const frame = useCurrentFrame()
  const { width: W, height: H, fps } = useVideoConfig()
  const k = ease(interpolate(frame, [0, Math.max(1, duration)], [0, 1], clamp))
  const [iw, ih] = size

  // The window the capture is seen through: the whole frame, or the card
  const c = card && {
    x: mix(card[0].x, card[1].x, k, 0.5),
    y: mix(card[0].y, card[1].y, k, 0.5),
    w: mix(card[0].w, card[1].w, k, 0.6),
    rx: mix(card[0].rx, card[1].rx, k, 0),
    ry: mix(card[0].ry, card[1].ry, k, 0),
    rz: mix(card[0].rz, card[1].rz, k, 0),
    opacity: mix(card[0].opacity, card[1].opacity, k, 1),
  }
  const vw = c ? c.w * W : W
  const vh = c ? (vw * 9) / 16 : H

  const zoom = mix(cam[0].zoom, cam[1].zoom, k, 1)
  const scale = zoom * Math.max(vw / iw, vh / ih)
  const half = (view: number, length: number) =>
    Math.min(0.5, view / (2 * scale * length))
  const hx = half(vw, iw)
  const hy = half(vh, ih)
  const cx = Math.min(1 - hx, Math.max(hx, mix(cam[0].x, cam[1].x, k, 0.5)))
  const cy = Math.min(1 - hy, Math.max(hy, mix(cam[0].y, cam[1].y, k, 0.5)))
  const clipTime = clipFrom + (frame / fps) * rate

  const content = (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: iw,
        height: ih,
        transformOrigin: "0 0",
        transform: `translate(${vw / 2 - cx * iw * scale}px, ${vh / 2 - cy * ih * scale}px) scale(${scale})`,
      }}
    >
      {src.endsWith(".mp4") ? (
        <OffthreadVideo
          src={staticFile(src)}
          muted
          startFrom={Math.round(clipFrom * fps)}
          playbackRate={rate}
          style={{ width: iw, height: ih, display: "block" }}
        />
      ) : (
        <Img
          src={staticFile(src)}
          style={{ width: iw, height: ih, display: "block" }}
        />
      )}
      <ImageSpace.Provider value={{ scale, frame, fps, clipTime }}>
        {children}
      </ImageSpace.Provider>
    </div>
  )

  if (!c)
    return (
      <div
        style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}
      >
        {content}
      </div>
    )
  return (
    <div
      style={{ position: "absolute", inset: 0, perspective: 2200, ...style }}
    >
      <div
        style={{
          position: "absolute",
          left: c.x * W - vw / 2,
          top: c.y * H - vh / 2,
          width: vw,
          height: vh,
          overflow: "hidden",
          opacity: c.opacity,
          borderRadius: skin.radius ?? 14,
          border: skin.edge ?? "1px solid rgba(255,255,255,0.14)",
          boxShadow: skin.shadow ?? "0 40px 120px rgba(0,0,0,0.55)",
          transform: `rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg)`,
        }}
      >
        {content}
      </div>
    </div>
  )
}

export interface Mark {
  kind: "box" | "ring" | "underline" | "bracket"
  /** In capture px */
  x: number
  y: number
  w: number
  h: number
  /** Frame it starts drawing, within the Screen */
  at: number
  /** A note set beside it, frame-sized whatever the zoom */
  label?: {
    en: string
    zh?: string
    side?: "left" | "right" | "above" | "below"
  }
}

export interface MarkStyle {
  colour: string
  muted?: string
  width?: number
  font: string
  han: string
  size?: number
  /** Frames a mark takes to draw */
  draw?: number
}

/** Annotations drawn onto the capture: a box, ring, underline or brackets that draw themselves, and a note beside */
export function Marks({
  marks,
  look,
}: {
  marks: readonly Mark[]
  look: MarkStyle
}) {
  const { scale, frame } = useImageSpace()
  const draw = look.draw ?? 18
  const sw = look.width ?? 1.6
  return (
    <>
      <svg
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        width="100%"
        height="100%"
      >
        {marks.map((m, i) => {
          const p = Easing.out(Easing.cubic)(
            interpolate(frame, [m.at, m.at + draw], [0, 1], clamp)
          )
          if (p <= 0) return null
          const common = {
            fill: "none",
            stroke: look.colour,
            strokeWidth: sw,
            vectorEffect: "non-scaling-stroke",
            pathLength: 1,
            strokeDasharray: 1,
            strokeDashoffset: 1 - p,
          } as const
          const { x, y, w, h } = m
          const t = 14 / scale
          const d =
            m.kind === "box"
              ? `M${x} ${y}H${x + w}V${y + h}H${x}Z`
              : m.kind === "underline"
                ? `M${x} ${y + h}H${x + w}`
                : m.kind === "bracket"
                  ? `M${x + t} ${y}H${x}V${y + h}H${x + t}M${x + w - t} ${y}H${x + w}V${y + h}H${x + w - t}`
                  : ""
          return m.kind === "ring" ? (
            <ellipse
              key={i}
              cx={x + w / 2}
              cy={y + h / 2}
              rx={w / 2}
              ry={h / 2}
              {...common}
            />
          ) : (
            <path key={i} d={d} {...common} />
          )
        })}
      </svg>
      {marks.map((m, i) => {
        if (!m.label) return null
        const p = interpolate(
          frame,
          [m.at + draw * 0.6, m.at + draw * 0.6 + 14],
          [0, 1],
          clamp
        )
        if (p <= 0) return null
        const side = m.label.side ?? "right"
        const gap = 18 / scale
        const pos: CSSProperties =
          side === "right"
            ? {
                left: m.x + m.w + gap,
                top: m.y + m.h / 2,
                transform: `scale(${1 / scale}) translateY(-50%)`,
                transformOrigin: "0 0",
              }
            : side === "left"
              ? {
                  right: `calc(100% - ${m.x - gap}px)`,
                  top: m.y + m.h / 2,
                  transform: `scale(${1 / scale}) translateY(-50%)`,
                  transformOrigin: "100% 0",
                  textAlign: "right",
                }
              : side === "above"
                ? {
                    left: m.x,
                    bottom: `calc(100% - ${m.y - gap}px)`,
                    transform: `scale(${1 / scale})`,
                    transformOrigin: "0 100%",
                  }
                : {
                    left: m.x,
                    top: m.y + m.h + gap,
                    transform: `scale(${1 / scale})`,
                    transformOrigin: "0 0",
                  }
        return (
          <div
            key={`l${i}`}
            style={{
              position: "absolute",
              whiteSpace: "nowrap",
              opacity: p,
              ...pos,
            }}
          >
            <div
              style={{
                fontFamily: look.font,
                fontSize: look.size ?? 22,
                letterSpacing: "0.16em",
                color: look.colour,
                transform: `translateY(${(1 - p) * 8}px)`,
              }}
            >
              {m.label.en}
            </div>
            {m.label.zh && (
              <div
                style={{
                  fontFamily: look.han,
                  fontSize: (look.size ?? 22) * 0.78,
                  letterSpacing: "0.2em",
                  marginTop: 6,
                  color: look.muted ?? look.colour,
                }}
              >
                {m.label.zh}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/** Fetches JSON from public/ before the frame is captured */
export function useJson<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [handle] = useState(() => delayRender(`Loading ${path}`))
  useEffect(() => {
    fetch(staticFile(path))
      .then((r) => r.json() as Promise<T>)
      .then((d) => {
        setData(d)
        continueRender(handle)
      })
      .catch((e: unknown) => {
        console.error(e)
        continueRender(handle)
      })
  }, [path, handle])
  return data
}

/**
 * The pointer through a live clip (the .json beside it), drawn in the film's own style: a ring and dot, an arrow, or a
 * soft glow. A press sends out a ripple.
 */
export function Cursor({
  track,
  kind = "ring",
  colour,
  size = 26,
}: {
  /** Under public/, the clip's .json */
  track: string
  kind?: "ring" | "arrow" | "glow"
  colour: string
  size?: number
}) {
  const data = useJson<PointerTrack>(track)
  const { clipTime } = useImageSpace()
  if (!data?.points.length) return null
  const pts = data.points
  let i = 0
  while (i + 1 < pts.length && pts[i + 1]!.t <= clipTime) i++
  const a = pts[i]!
  const b = pts[Math.min(i + 1, pts.length - 1)]!
  const k =
    b.t > a.t ? Math.min(1, Math.max(0, (clipTime - a.t) / (b.t - a.t))) : 0
  const x = a.x + (b.x - a.x) * k
  const y = a.y + (b.y - a.y) * k
  // The last press before now, for its ripple
  const press = [...pts]
    .reverse()
    .find((p, j, all) => p.t <= clipTime && p.down && !all[j + 1]?.down)
  const since = press ? clipTime - press.t : Infinity
  const ripple = since < 0.6 ? since / 0.6 : null
  const down = a.down
  return (
    <div
      style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}
    >
      {ripple !== null && (
        <div
          style={{
            position: "absolute",
            left: -size * (0.5 + ripple * 1.2),
            top: -size * (0.5 + ripple * 1.2),
            width: size * (1 + ripple * 2.4),
            height: size * (1 + ripple * 2.4),
            borderRadius: "50%",
            border: `2px solid ${colour}`,
            opacity: 1 - ripple,
          }}
        />
      )}
      {kind === "ring" && (
        <>
          <div
            style={{
              position: "absolute",
              left: -size / 2,
              top: -size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `1.5px solid ${colour}`,
              transform: `scale(${down ? 0.75 : 1})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -3,
              top: -3,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: colour,
            }}
          />
        </>
      )}
      {kind === "glow" && (
        <div
          style={{
            position: "absolute",
            left: -size,
            top: -size,
            width: size * 2,
            height: size * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colour} 0%, transparent 65%)`,
            transform: `scale(${down ? 0.8 : 1})`,
          }}
        />
      )}
      {kind === "arrow" && (
        <svg
          width={size}
          height={size * 1.4}
          style={{
            position: "absolute",
            left: -2,
            top: -2,
            overflow: "visible",
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))",
          }}
        >
          <path
            d={`M0 0L0 ${size * 1.15}L${size * 0.3} ${size * 0.85}L${size * 0.52} ${size * 1.32}L${size * 0.68} ${size * 1.25}L${size * 0.46} ${size * 0.78}L${size * 0.86} ${size * 0.78}Z`}
            fill={colour}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={1.2}
          />
        </svg>
      )}
    </div>
  )
}
