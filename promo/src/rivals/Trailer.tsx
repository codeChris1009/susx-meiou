/**
 * Pokémon Rivals, forty seconds as a boss fight: every shot lurches in, shakes and flares red. A gold sigil among
 * embers; the storm and the tower of fifteen; the roster's radar; Leon, Cynthia and Alain each summoned by a held
 * challenge; Versus, Cynthia against Leon; the name in gilt.
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
import type { Mark } from "../kit/screen"
import { Shot } from "../kit/shot"
import { Words } from "../kit/words"
import { FONT, GILT, INK, NOTE } from "./style"
import { BPM, COPY, FPS, REVEAL, SHOT } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `rivals/capture/${name}`

/** The site's emblem as a sigil: a ring, an arch rising inside it, a horizon, drawn on in gold */
function Sigil({
  r = 150,
  at = 0,
  cy = 402,
}: {
  r?: number
  at?: number
  cy?: number
}) {
  const frame = useCurrentFrame()
  const stroke = (k: number, d: number) => ({
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - drawn(frame, at + k, d),
  })
  return (
    <svg width={1920} height={804} style={{ position: "absolute", inset: 0 }}>
      <g fill="none" stroke={INK.gold} strokeWidth={1.6}>
        <circle cx={960} cy={cy} r={r} {...stroke(0, 40)} />
        <circle
          cx={960}
          cy={cy}
          r={r * 0.9}
          strokeWidth={0.8}
          opacity={0.6}
          {...stroke(10, 40)}
        />
        <path
          d={`M${960 - r * 0.62} ${cy + r * 0.28} Q960 ${cy - r * 0.95} ${960 + r * 0.62} ${cy + r * 0.28}`}
          {...stroke(26, 30)}
        />
        <line
          x1={960 - r * 0.9}
          y1={cy + r * 0.28}
          x2={960 + r * 0.9}
          y2={cy + r * 0.28}
          {...stroke(40, 20)}
        />
      </g>
    </svg>
  )
}

/** Embers rising in the firelight */
function Embers({
  count = 70,
  speed = 1.6,
}: {
  count?: number
  speed?: number
}) {
  return (
    <Dust
      count={count}
      colour={INK.ember}
      size={1.8}
      speed={speed}
      opacity={0.75}
      seed={21}
    />
  )
}

const boss = { kind: "boss", frames: 12 } as const
const glow = { kind: "glow", colour: "rgba(255,107,58,0.6)", size: 36 } as const
const right = { x: 0.94, y: 0.86, align: "right" } as const
const MARK = {
  colour: INK.gold,
  muted: INK.pale,
  font: FONT.cormorant,
  han: FONT.serif,
  size: 22,
  width: 1.6,
}

export function Trailer() {
  return (
    <AbsoluteFill style={{ background: INK.ground }}>
      <Audio src={staticFile("rivals/score.wav")} />

      <Beat
        from={SHOT.open[0]}
        to={SHOT.open[1]}
        exit={{ kind: "fade", frames: 8 }}
        name="open"
      >
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 60% at 50% 110%, rgba(255,107,58,0.25), transparent 70%)`,
          }}
        />
        <Embers />
        <Sigil r={110} cy={290} />
        <Sequence from={16}>
          <Words
            duration={len(SHOT.open) - 16}
            manner="spaced"
            y={0.72}
            stagger={10}
            out={6}
            pace={0.7}
            lines={[
              ...COPY.open.en.map((text, k) => ({
                text,
                font: FONT.cinzel,
                size: 44,
                weight: 500,
                colour: INK.pale,
                tracking: 0.3,
                gap: k ? 6 : 0,
              })),
              {
                text: COPY.open.zh,
                font: FONT.serif,
                size: 22,
                weight: 600,
                colour: INK.gold,
                tracking: 0.6,
                gap: 16,
                manner: "fade" as const,
              },
            ]}
          />
        </Sequence>
      </Beat>

      <Shot
        from={SHOT.storm[0]}
        to={SHOT.storm[1]}
        src={cap("storm.mp4")}
        clipFrom={0.5}
        rate={1.3}
        cam={[{ zoom: 1.06 }, { zoom: 1.2 }]}
        enter={boss}
        name="storm"
      >
        <Embers count={40} />
      </Shot>
      <Shot
        from={SHOT.tower[0]}
        to={SHOT.tower[1]}
        src={cap("tower.mp4")}
        clipFrom={0.2}
        rate={2.4}
        cam={[{ zoom: 1.04 }, { zoom: 1.1 }]}
        enter={boss}
        note={NOTE}
        notes={[[0.2, 5, COPY.tower.en, COPY.tower.zh]]}
        name="tower"
      >
        {Array.from({ length: 7 }, (_, k) => (
          <Flash
            key={k}
            at={Math.round(k * (60 / BPM) * FPS)}
            colour={INK.ember}
            rise={0}
            fall={5}
            peak={0.16}
          />
        ))}
      </Shot>
      <Shot
        from={SHOT.list[0]}
        to={SHOT.list[1]}
        src={cap("list.mp4")}
        clipFrom={0.3}
        rate={2}
        enter={boss}
        cursor={glow}
        note={NOTE}
        at={right}
        notes={[[0, 4, COPY.list.en, COPY.list.zh]]}
        name="list"
      />
      <Shot
        from={SHOT.leon[0]}
        to={SHOT.leon[1]}
        src={cap("leon.mp4")}
        clipFrom={0.3}
        rate={0.75}
        cam={[
          { zoom: 1.12, x: 0.6 },
          { zoom: 1, x: 0.5 },
        ]}
        enter={boss}
        cursor={glow}
        marks={ACE}
        markStyle={MARK}
        note={NOTE}
        at={right}
        notes={[
          [0, 3.2, COPY.hold.en, COPY.hold.zh],
          [3.6, 8, COPY.leon.en, COPY.leon.zh],
        ]}
        name="leon"
      >
        <Flash
          at={Math.round((REVEAL.leon - SHOT.leon[0]) * FPS)}
          colour={INK.ember}
          rise={2}
          fall={14}
          peak={0.5}
        />
      </Shot>
      <Shot
        from={SHOT.cynthia[0]}
        to={SHOT.cynthia[1]}
        src={cap("cynthia.mp4")}
        clipFrom={0.3}
        rate={0.9}
        cam={[
          { zoom: 1.1, x: 0.6 },
          { zoom: 1, x: 0.5 },
        ]}
        enter={boss}
        cursor={glow}
        note={NOTE}
        at={right}
        notes={[[2.2, 5.5, COPY.cynthia.en, COPY.cynthia.zh]]}
        name="cynthia"
      >
        <Flash
          at={Math.round((REVEAL.cynthia - SHOT.cynthia[0]) * FPS)}
          colour="#b48cff"
          rise={2}
          fall={14}
          peak={0.45}
        />
      </Shot>
      <Shot
        from={SHOT.alain[0]}
        to={SHOT.alain[1]}
        src={cap("alain.mp4")}
        clipFrom={0.5}
        rate={1.4}
        enter={boss}
        note={NOTE}
        at={right}
        notes={[[1.2, 3, COPY.alain.en, COPY.alain.zh]]}
        name="alain"
      >
        <Flash
          at={Math.round((REVEAL.alain - SHOT.alain[0]) * FPS)}
          colour="#6fb8ff"
          rise={2}
          fall={12}
          peak={0.45}
        />
      </Shot>
      <Shot
        from={SHOT.versus[0]}
        to={SHOT.versus[1]}
        src={cap("versus.mp4")}
        clipFrom={0.3}
        rate={1.5}
        cam={[{ zoom: 1.15 }, { zoom: 1.02 }]}
        enter={boss}
        exit={{ kind: "fade", frames: 8 }}
        note={NOTE}
        at={{ x: 0.5, y: 0.2, align: "left" }}
        notes={[[0.3, 4.5, COPY.versus.en, COPY.versus.zh]]}
        name="versus"
      >
        <Embers count={50} />
      </Shot>

      <Beat from={SHOT.name[0]} to={SHOT.name[1]} enter={boss} name="name">
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 70% at 50% 100%, rgba(255,107,58,0.3), transparent 70%)`,
          }}
        />
        <Embers count={110} speed={2.2} />
        <Dust
          count={140}
          colour={INK.gold}
          size={0.9}
          speed={0.12}
          opacity={0.5}
          seed={4}
        />
        <Sigil r={250} at={0} />
        <Name />
        <Flash at={0} colour={INK.pale} rise={0} fall={14} />
      </Beat>

      <Grain strength={0.07} />
      <Vignette strength={0.6} />
    </AbsoluteFill>
  )
}

/** Leon's ace on his page, once he has appeared, in capture px (leon.mp4) */
const ACE: Mark[] = [
  {
    kind: "box",
    x: 596,
    y: 884,
    w: 270,
    h: 54,
    at: 120,
    label: { en: COPY.ace.en, zh: COPY.ace.zh, side: "above" },
  },
]

/** RIVALS in gilt, settling from a slight scale, with the Chinese and the strap beneath */
function Name() {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" })
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "46%",
          transform: `translateY(-50%) scale(${1.08 - 0.08 * p})`,
          textAlign: "center",
          opacity: p,
        }}
      >
        <span
          style={{
            fontFamily: FONT.cinzel,
            fontWeight: 600,
            fontSize: 150,
            letterSpacing: "0.16em",
            paddingLeft: "0.16em",
            backgroundImage: GILT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 6px 30px rgba(255,107,58,0.35))",
          }}
        >
          {COPY.name.en}
        </span>
      </div>
      <Sequence from={20}>
        <Words
          duration={160}
          manner="spaced"
          y={0.72}
          stagger={12}
          out={0}
          lines={[
            {
              text: COPY.name.zh,
              font: FONT.serif,
              size: 28,
              weight: 600,
              colour: INK.pale,
              tracking: 0.8,
            },
            {
              text: COPY.strap.en,
              font: FONT.cormorant,
              size: 20,
              weight: 500,
              colour: INK.gold,
              tracking: 0.6,
              gap: 14,
            },
          ]}
        />
      </Sequence>
    </>
  )
}
