/**
 * Gym Leaders, thirty-five seconds on the beat, hard cuts with a flash of white or gold: the creed, the molten home
 * page and its regions, then the product in use (Kalos, the index, Korrina's card and Mega Lucario, Nessa and G-Max
 * Drednaw, the badge vault, the spectrum), then the name in gold inside a badge's outline.
 */
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion"

import { Beat, Flash } from "../kit/beat"
import { Grain, Vignette } from "../kit/film"
import { Dust, drawn } from "../kit/lines"
import { Shot } from "../kit/shot"
import { Words } from "../kit/words"
import { FONT, GOLD, INK, NOTE } from "./style"
import { COPY, FPS, SHOT } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `gym-leaders/capture/${name}`

/** Molten light: two slow blobs of gold and crimson, the site's silk without its detail */
function Molten({ heat = 1 }: { heat?: number }) {
  const frame = useCurrentFrame()
  const a = 30 + 12 * Math.sin(frame * 0.03)
  const b = 68 + 10 * Math.cos(frame * 0.025)
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 55% 70% at ${a}% 60%, rgba(246,196,83,${0.35 * heat}) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at ${b}% 40%, rgba(179,18,42,${0.45 * heat}) 0%, transparent 65%), ${INK.ground}`,
      }}
    />
  )
}

/** A badge's outline: an octagon drawn on in gold, turning slowly */
function Badge({
  r = 300,
  at = 0,
  draw = 24,
  opacity = 1,
}: {
  r?: number
  at?: number
  draw?: number
  opacity?: number
}) {
  const frame = useCurrentFrame()
  const p = drawn(frame, at, draw)
  const pts = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    return `${960 + Math.cos(a) * r},${402 + Math.sin(a) * r}`
  }).join(" ")
  const inner = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    return `${960 + Math.cos(a) * r * 0.86},${402 + Math.sin(a) * r * 0.86}`
  }).join(" ")
  return (
    <svg
      width={1920}
      height={804}
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        transform: `rotate(${frame * 0.15}deg)`,
        transformOrigin: "960px 402px",
      }}
    >
      <polygon
        points={pts}
        fill="none"
        stroke={INK.gold}
        strokeWidth={2.5}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
      <polygon
        points={inner}
        fill="none"
        stroke={INK.line}
        strokeWidth={1}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - drawn(frame, at + 6, draw)}
      />
    </svg>
  )
}

/** Speed lines bursting from the centre on a hit */
function Burst({ at = 0 }: { at?: number }) {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < 0 || t > 16) return null
  const k = t / 16
  return (
    <svg width={1920} height={804} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2 + i * 0.37
        const r0 = 200 + k * 700
        const r1 = r0 + 120 + (i % 5) * 60
        return (
          <line
            key={i}
            x1={960 + Math.cos(a) * r0}
            y1={402 + Math.sin(a) * r0}
            x2={960 + Math.cos(a) * r1}
            y2={402 + Math.sin(a) * r1}
            stroke={i % 3 ? INK.gold : INK.white}
            strokeWidth={3 - k * 2}
            opacity={1 - k}
          />
        )
      })}
    </svg>
  )
}

const flash = { kind: "flash", frames: 6, colour: INK.white } as const
const gold = { kind: "flash", frames: 6, colour: INK.gold } as const
const glow = { kind: "glow", colour: "rgba(246,196,83,0.7)", size: 40 } as const
const at = { x: 0.94, y: 0.86, align: "right" } as const

export function Trailer() {
  return (
    <AbsoluteFill style={{ background: INK.ground }}>
      <Audio src={staticFile("gym-leaders/score.wav")} />

      <Beat from={SHOT.cold[0]} to={SHOT.cold[1]} name="cold">
        <Molten heat={0.8} />
        <Badge r={330} draw={30} opacity={0.5} />
        <Words
          duration={len(SHOT.cold)}
          manner="slam"
          y={0.44}
          out={4}
          lines={[
            {
              text: COPY.cold.en,
              font: FONT.sans,
              size: 96,
              weight: 800,
              colour: INK.white,
              tracking: -0.02,
            },
            {
              text: COPY.cold.zh,
              font: FONT.serif,
              size: 26,
              weight: 700,
              colour: INK.gold,
              tracking: 0.3,
              gap: 18,
              manner: "fade",
            },
          ]}
        />
      </Beat>

      <Shot
        from={SHOT.hero[0]}
        to={SHOT.hero[1]}
        src={cap("hero.mp4")}
        clipFrom={0.3}
        cam={[
          { zoom: 1.18, x: 0.4 },
          { zoom: 1, x: 0.5 },
        ]}
        enter={flash}
        name="hero"
      >
        <Burst />
      </Shot>
      <Shot
        from={SHOT.regions[0]}
        to={SHOT.regions[1]}
        src={cap("regions.mp4")}
        clipFrom={1}
        rate={1.6}
        enter={gold}
        note={NOTE}
        at={{ x: 0.94, y: 0.22, align: "right" }}
        notes={[[0.2, 4, COPY.regions.en, COPY.regions.zh]]}
        name="regions"
      />
      <Shot
        from={SHOT.kalos[0]}
        to={SHOT.kalos[1]}
        src={cap("kalos.mp4")}
        clipFrom={0.3}
        rate={1.4}
        enter={flash}
        cursor={glow}
        note={NOTE}
        at={at}
        notes={[[0, 3, COPY.kalos.en, COPY.kalos.zh]]}
        name="kalos"
      />
      <Shot
        from={SHOT.list[0]}
        to={SHOT.list[1]}
        src={cap("list.mp4")}
        clipFrom={0.5}
        rate={1.6}
        enter={{ kind: "wipe", frames: 6, from: "right" }}
        cursor={glow}
        note={NOTE}
        at={at}
        notes={[[0, 3, COPY.list.en, COPY.list.zh]]}
        name="list"
      />
      <Shot
        from={SHOT.korrina[0]}
        to={SHOT.korrina[1]}
        src={cap("korrina-card.mp4")}
        clipFrom={0.3}
        rate={1.3}
        cam={[{ zoom: 1.05 }, { zoom: 1.18, x: 0.68, y: 0.6 }]}
        enter={gold}
        cursor={glow}
        note={NOTE}
        at={{ x: 0.055, y: 0.2 }}
        notes={[[0, 3, COPY.korrina.en, COPY.korrina.zh]]}
        name="korrina"
      />
      <Shot
        from={SHOT.lucario[0]}
        to={SHOT.lucario[1]}
        src={cap("korrina-lucario.mp4")}
        clipFrom={0.5}
        rate={1.2}
        cam={[{ zoom: 1 }, { zoom: 1.15, x: 0.42, y: 0.55 }]}
        enter={flash}
        cursor={glow}
        note={NOTE}
        at={at}
        notes={[[0.4, 4, COPY.lucario.en, COPY.lucario.zh]]}
        name="lucario"
      />
      <Shot
        from={SHOT.nessa[0]}
        to={SHOT.nessa[1]}
        src={cap("nessa-card.mp4")}
        clipFrom={0.3}
        rate={1.3}
        cam={[{ zoom: 1.05 }, { zoom: 1.15, x: 0.66, y: 0.58 }]}
        enter={gold}
        cursor={glow}
        note={NOTE}
        at={{ x: 0.055, y: 0.2 }}
        notes={[[0, 3, COPY.nessa.en, COPY.nessa.zh]]}
        name="nessa"
      />
      <Shot
        from={SHOT.drednaw[0]}
        to={SHOT.drednaw[1]}
        src={cap("nessa-drednaw.mp4")}
        clipFrom={1}
        rate={1.6}
        cam={[{ zoom: 1 }, { zoom: 1.12, x: 0.42, y: 0.55 }]}
        enter={flash}
        cursor={glow}
        note={NOTE}
        at={at}
        notes={[[0.2, 2.5, COPY.drednaw.en, COPY.drednaw.zh]]}
        name="drednaw"
      />
      <Shot
        from={SHOT.badges[0]}
        to={SHOT.badges[1]}
        src={cap("badges.mp4")}
        clipFrom={0.3}
        rate={2}
        cam={[
          { zoom: 1.1, y: 0.62 },
          { zoom: 1.1, y: 0.62 },
        ]}
        enter={gold}
        cursor={glow}
        note={NOTE}
        at={{ x: 0.94, y: 0.2, align: "right" }}
        notes={[[0, 2.5, COPY.badges.en, COPY.badges.zh]]}
        name="badges"
      />
      <Shot
        from={SHOT.spectrum[0]}
        to={SHOT.spectrum[1]}
        src={cap("spectrum.mp4")}
        clipFrom={0.3}
        rate={2}
        enter={flash}
        cursor={glow}
        note={NOTE}
        at={at}
        notes={[[0, 2, COPY.spectrum.en, COPY.spectrum.zh]]}
        name="spectrum"
      />

      <Beat from={SHOT.title[0]} to={SHOT.title[1]} name="title">
        <Molten />
        <Dust
          count={70}
          colour={INK.gold}
          size={2}
          speed={1.4}
          opacity={0.7}
          seed={11}
        />
        <Badge r={300} draw={18} />
        <Burst />
        <TitleWord />
        <Sequence from={14}>
          <Words
            duration={len(SHOT.title)}
            manner="fade"
            y={0.74}
            out={0}
            lines={[
              {
                text: COPY.title.zh,
                font: FONT.serif,
                size: 30,
                weight: 700,
                colour: INK.white,
                tracking: 0.4,
              },
            ]}
          />
        </Sequence>
        <Flash at={0} rise={0} fall={10} />
      </Beat>

      <Grain strength={0.06} />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  )
}

/** The name, slammed in and set in the site's gold */
function TitleWord() {
  const frame = useCurrentFrame()
  const s = interpolate(frame, [0, 6, 10], [1.6, 0.97, 1], {
    extrapolateRight: "clamp",
  })
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "50%",
        transform: `translateY(-58%) scale(${s})`,
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 168,
          letterSpacing: "-0.035em",
          backgroundImage: GOLD,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 10px 40px rgba(255,122,47,0.45))",
        }}
      >
        {COPY.title.en.replace(" ", " ")}
      </span>
    </div>
  )
}
