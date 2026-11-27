/**
 * Pokémon Heroines, thirty-six soft seconds, dissolves only. A pillar of light rises with bubbles; the site's cover;
 * the chapter nav passing four heroines; then Serena and Lillie in use (cards, radar, dimensions, context), each in
 * her colour washing over the frame; the promise; the name, with six dots of their six colours.
 */
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion"

import { Beat } from "../kit/beat"
import { Grain } from "../kit/film"
import { generator } from "../kit/random"
import { Shot } from "../kit/shot"
import { Words } from "../kit/words"
import { FONT, INK } from "./style"
import { COPY, FPS, SHOT, SIX } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `heroines/capture/${name}`
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

/** A soft pillar of light, as each chapter of the site stands in one */
function Pillar({ colour, rise = 40 }: { colour: string; rise?: number }) {
  const frame = useCurrentFrame()
  const p = Easing.out(Easing.cubic)(
    interpolate(frame, [0, rise], [0, 1], clamp)
  )
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 9% 100% at 50% 100%, ${colour} 0%, transparent 70%)`,
        opacity: 0.55 * p,
        transform: `scaleY(${0.3 + 0.7 * p})`,
        transformOrigin: "50% 100%",
      }}
    />
  )
}

/** Bubbles drifting up, each a ring with a glint, in the given colours */
function Bubbles({
  colours,
  count = 40,
  seed = 3,
}: {
  colours: readonly string[]
  count?: number
  seed?: number
}) {
  const frame = useCurrentFrame()
  const rnd = generator(seed)
  return (
    <svg width={1920} height={804} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: count }, (_, i) => {
        const x = rnd() * 1920
        const r = 4 + rnd() * 16
        const v = 0.6 + rnd() * 1.4
        const y = 860 - ((rnd() * 900 + frame * v * 2.2) % 960)
        const c = colours[i % colours.length]!
        return (
          <g key={i} opacity={0.55}>
            <circle
              cx={x + Math.sin(frame * 0.03 + i) * 14}
              cy={y}
              r={r}
              fill="none"
              stroke={c}
              strokeWidth={1.6}
            />
            <circle
              cx={x + Math.sin(frame * 0.03 + i) * 14 - r * 0.35}
              cy={y - r * 0.35}
              r={r * 0.18}
              fill="#fff"
            />
          </g>
        )
      })}
    </svg>
  )
}

const fade = { kind: "fade", frames: 15 } as const
const arrow = { kind: "arrow", colour: "#ffffff", size: 24 } as const
const NOTE = {
  colour: INK.ink,
  muted: INK.muted,
  rule: "transparent",
  mono: FONT.round,
  han: FONT.han,
  face: FONT.round,
  weight: 700,
  size: 28,
  tracking: 0.16,
  manner: "fade",
  panel: "rgba(253, 248, 243, 0.86)",
} as const

export function Trailer() {
  const serena = SIX[4].colour
  const lillie = SIX[5].colour
  return (
    <AbsoluteFill style={{ background: INK.cream }}>
      <Audio src={staticFile("heroines/score.wav")} />

      <Beat
        from={SHOT.open[0]}
        to={SHOT.open[1] + 0.5}
        exit={{ kind: "fade", frames: 15 }}
        name="open"
      >
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${INK.cream} 0%, ${INK.rose} 100%)`,
          }}
        />
        <Pillar colour="#f2b6cf" rise={40} />
        <Bubbles colours={SIX.map((s) => s.colour)} />
        <Words
          duration={len(SHOT.open) + 15}
          manner="spaced"
          y={0.46}
          stagger={16}
          out={0}
          pace={0.8}
          lines={[
            {
              text: COPY.open.en,
              font: FONT.round,
              size: 36,
              weight: 300,
              colour: INK.ink,
              tracking: 0.3,
            },
            {
              text: COPY.open.zh,
              font: FONT.han,
              size: 24,
              colour: INK.muted,
              tracking: 0.5,
              gap: 20,
              manner: "fade",
            },
          ]}
        />
      </Beat>

      <Shot
        from={SHOT.intro[0]}
        to={SHOT.intro[1] + 0.5}
        src={cap("intro.jpg")}
        cam={[
          { zoom: 1.08, y: 0.42 },
          { zoom: 1.2, y: 0.4 },
        ]}
        enter={fade}
        exit={fade}
        name="intro"
      />
      <Shot
        from={SHOT.switch[0]}
        to={SHOT.switch[1] + 0.5}
        src={cap("switch.mp4")}
        clipFrom={0.3}
        rate={1.3}
        enter={fade}
        exit={fade}
        cursor={arrow}
        note={NOTE}
        at={{ x: 0.5, y: 0.89, align: "center" }}
        notes={[[0.3, 5, COPY.switch.en, COPY.switch.zh]]}
        name="switch"
      />
      <Shot
        from={SHOT.serena[0]}
        to={SHOT.serena[1] + 0.5}
        src={cap("serena.mp4")}
        clipFrom={0.3}
        rate={1.2}
        cam={[{ zoom: 1.02 }, { zoom: 1.06 }]}
        enter={fade}
        exit={fade}
        cursor={arrow}
        note={{ ...NOTE, colour: serena }}
        at={{ x: 0.5, y: 0.89, align: "center" }}
        notes={[
          [0.3, 3.4, COPY.serenaCards.en, COPY.serenaCards.zh],
          [3.4, 6, COPY.radar.en, COPY.radar.zh],
          [6, 10.4, COPY.dimension.en, COPY.dimension.zh],
        ]}
        name="serena"
      >
        <Wash colour={serena} />
      </Shot>
      <Shot
        from={SHOT.lillie[0]}
        to={SHOT.lillie[1] + 0.5}
        src={cap("lillie.mp4")}
        clipFrom={0.3}
        rate={1.25}
        cam={[{ zoom: 1.02 }, { zoom: 1.06 }]}
        enter={fade}
        exit={fade}
        cursor={arrow}
        note={{ ...NOTE, colour: lillie }}
        at={{ x: 0.5, y: 0.89, align: "center" }}
        notes={[
          [0.3, 3.6, COPY.lillieCards.en, COPY.lillieCards.zh],
          [3.6, 6.4, COPY.growth.en, COPY.growth.zh],
          [6.4, 8.5, COPY.context.en, COPY.context.zh],
        ]}
        name="lillie"
      >
        <Wash colour={lillie} />
      </Shot>
      <Shot
        from={SHOT.promise[0]}
        to={SHOT.promise[1] + 0.5}
        src={cap("promise.jpg")}
        cam={[
          { zoom: 1.45, x: 0.3, y: 0.42 },
          { zoom: 1.6, x: 0.3, y: 0.42 },
        ]}
        enter={fade}
        exit={fade}
        name="promise"
      >
        <Sequence from={20}>
          <Words
            duration={len(SHOT.promise)}
            manner="spaced"
            x={0.94}
            y={0.12}
            align="right"
            out={12}
            lines={[
              {
                text: COPY.promise.en,
                font: FONT.round,
                size: 26,
                weight: 600,
                colour: INK.ink,
                tracking: 0.35,
              },
            ]}
          />
        </Sequence>
      </Shot>

      <Beat from={SHOT.title[0]} to={SHOT.title[1]} enter={fade} name="title">
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${INK.cream} 0%, ${INK.rose} 100%)`,
          }}
        />
        <Pillar colour="#f2b6cf" rise={50} />
        <Bubbles colours={SIX.map((s) => s.colour)} count={30} seed={8} />
        <Words
          duration={len(SHOT.title) + 10}
          manner="spaced"
          y={0.42}
          stagger={18}
          out={0}
          lines={[
            {
              text: COPY.title.en,
              font: FONT.round,
              size: 140,
              weight: 800,
              colour: INK.ink,
              tracking: 0.02,
            },
            {
              text: COPY.strap.en,
              font: FONT.round,
              size: 18,
              weight: 600,
              colour: INK.muted,
              tracking: 0.5,
              gap: 18,
            },
            {
              text: COPY.title.zh,
              font: FONT.han,
              size: 26,
              colour: INK.ink,
              tracking: 0.5,
              gap: 14,
              manner: "fade",
            },
          ]}
        />
        <Dots />
      </Beat>

      <Grain strength={0.03} />
    </AbsoluteFill>
  )
}

/** Her colour washing over the frame as she arrives, then lifting to a faint tint at the edges */
function Wash({ colour }: { colour: string }) {
  const frame = useCurrentFrame()
  const o = interpolate(frame, [0, 10, 30], [0.5, 0.35, 0.12], clamp)
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 80% at 50% 50%, transparent 40%, ${colour} 130%)`,
        opacity: o * 2.2,
        mixBlendMode: "multiply",
      }}
    />
  )
}

/** Six dots in their colours, landing one after another under the name */
function Dots() {
  const frame = useCurrentFrame()
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "83%",
        display: "flex",
        justifyContent: "center",
        gap: 22,
      }}
    >
      {SIX.map((h, k) => {
        const p = Easing.out(Easing.back(2))(
          interpolate(frame, [30 + k * 5, 42 + k * 5], [0, 1], clamp)
        )
        return (
          <span
            key={h.id}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: h.colour,
              transform: `scale(${p})`,
            }}
          />
        )
      })}
    </div>
  )
}
