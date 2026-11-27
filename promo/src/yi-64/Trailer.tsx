/**
 * YI 64, thirty-six still seconds, every cut an ink bloom. A hexagram (27, Nourishment) is built in the dark one line
 * at a time, bottom first; the landing page in passing; then the components in use: the eight and their tabs and
 * chamber, the chart, hexagram 27 through its six tabs, a reading cast, a passage observed; the name.
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
import { Grain, Vignette } from "../kit/film"
import { Shot } from "../kit/shot"
import { Words } from "../kit/words"
import { FONT, INK, NOTE } from "./style"
import { COPY, FPS, HEXAGRAM, SHOT } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `yi-64/capture/${name}`
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

/** The hexagram, drawn from the bottom line up, each line a brush stroke from its centre outwards */
function Hexagram({
  x = 960,
  y = 402,
  w = 300,
  gap = 34,
  every = 18.6,
  at = 0,
}: {
  x?: number
  y?: number
  w?: number
  gap?: number
  every?: number
  at?: number
}) {
  const frame = useCurrentFrame()
  const h = gap * 0.42
  return (
    <svg width={1920} height={804} style={{ position: "absolute", inset: 0 }}>
      {HEXAGRAM.map((yang, k) => {
        const p = Easing.out(Easing.cubic)(
          interpolate(
            frame,
            [at + k * every, at + k * every + 22],
            [0, 1],
            clamp
          )
        )
        if (p <= 0) return null
        const cy = y + (2.5 - k) * gap
        const half = (w / 2) * p
        const fill =
          k === HEXAGRAM.length - 1 && frame > at + k * every + 22
            ? INK.bone
            : INK.sage
        return yang ? (
          <rect
            key={k}
            x={x - half}
            y={cy - h / 2}
            width={half * 2}
            height={h}
            fill={fill}
            opacity={0.9}
          />
        ) : (
          <g key={k} fill={fill} opacity={0.9}>
            <rect
              x={x - half}
              y={cy - h / 2}
              width={Math.max(0, half - w * 0.08)}
              height={h}
            />
            <rect
              x={x + w * 0.08}
              y={cy - h / 2}
              width={Math.max(0, half - w * 0.08)}
              height={h}
            />
          </g>
        )
      })}
    </svg>
  )
}

const ink = { kind: "ink", frames: 16, colour: INK.ground } as const
const ring = { kind: "ring", colour: INK.bone, size: 22 } as const
const right = { x: 0.94, y: 0.86, align: "right" } as const

export function Trailer() {
  return (
    <AbsoluteFill style={{ background: INK.ground }}>
      <Audio src={staticFile("yi-64/score.wav")} />

      <Beat
        from={SHOT.open[0]}
        to={SHOT.open[1]}
        exit={{ kind: "fade", frames: 10 }}
        name="open"
      >
        <Hexagram y={340} at={4} every={9.6} />
        <Sequence from={40}>
          <Words
            duration={len(SHOT.open) - 40}
            y={0.8}
            stagger={10}
            out={0}
            pace={0.8}
            lines={[
              {
                text: COPY.open.en,
                font: FONT.mono,
                size: 20,
                colour: INK.bone,
                tracking: 0.6,
                manner: "decode",
              },
              {
                text: COPY.open.zh,
                font: FONT.serif,
                size: 24,
                colour: INK.muted,
                tracking: 0.8,
                gap: 14,
                manner: "fade",
              },
            ]}
          />
        </Sequence>
      </Beat>

      <Shot
        from={SHOT.gate[0]}
        to={SHOT.gate[1]}
        src={cap("gate.mp4")}
        clipFrom={1}
        cam={[{ zoom: 1.2 }, { zoom: 1.1 }]}
        enter={ink}
        name="gate"
      />
      <Shot
        from={SHOT.trigrams[0]}
        to={SHOT.trigrams[1]}
        src={cap("trigrams.mp4")}
        clipFrom={0.3}
        rate={1.25}
        enter={ink}
        cursor={ring}
        note={NOTE}
        at={right}
        notes={[
          [0.2, 3.6, COPY.eight.en, COPY.eight.zh],
          [3.6, 6.4, COPY.tabs.en, COPY.tabs.zh],
          [6.4, 9, COPY.chamber.en, COPY.chamber.zh],
        ]}
        name="trigrams"
      />
      <Shot
        from={SHOT.chart[0]}
        to={SHOT.chart[1]}
        src={cap("chart.mp4")}
        rate={1.3}
        cam={[
          { zoom: 1, x: 0.6 },
          { zoom: 1.25, x: 0.62, y: 0.52 },
        ]}
        enter={ink}
        cursor={ring}
        note={NOTE}
        notes={[[0.2, 3.8, COPY.chart.en, COPY.chart.zh]]}
        name="chart"
      />
      <Shot
        from={SHOT.nourish[0]}
        to={SHOT.nourish[1]}
        src={cap("nourish.mp4")}
        clipFrom={0.3}
        rate={1.35}
        cam={[
          { zoom: 1.05, y: 0.45 },
          { zoom: 1.05, y: 0.6 },
        ]}
        enter={ink}
        cursor={ring}
        note={NOTE}
        at={right}
        notes={[
          [0.2, 1.6, COPY.nourish.en, COPY.nourish.zh],
          [1.6, 6.2, COPY.six.en, COPY.six.zh],
          [6.2, 9, COPY.kin.en, COPY.kin.zh],
        ]}
        name="nourish"
      />
      <Shot
        from={SHOT.oracle[0]}
        to={SHOT.oracle[1]}
        src={cap("oracle.mp4")}
        clipFrom={1}
        rate={2}
        cam={[
          { zoom: 1, y: 0.5 },
          { zoom: 1.06, y: 0.45 },
        ]}
        enter={ink}
        cursor={ring}
        note={NOTE}
        at={right}
        notes={[[0.2, 3.6, COPY.oracle.en, COPY.oracle.zh]]}
        name="oracle"
      />
      <Shot
        from={SHOT.observe[0]}
        to={SHOT.observe[1]}
        src={cap("observe.mp4")}
        clipFrom={1}
        rate={2.4}
        enter={ink}
        exit={{ kind: "fade", frames: 10 }}
        cursor={ring}
        note={NOTE}
        notes={[[0.2, 2.8, COPY.observe.en, COPY.observe.zh]]}
        name="observe"
      />

      <Beat from={SHOT.title[0]} to={SHOT.title[1]} enter={ink} name="title">
        <Hexagram x={560} y={402} w={240} gap={30} every={3} />
        <Words
          duration={len(SHOT.title) + 10}
          x={0.4}
          y={0.47}
          align="left"
          stagger={12}
          out={0}
          lines={[
            {
              text: COPY.title.en,
              font: FONT.sans,
              size: 132,
              weight: 300,
              colour: INK.bone,
              tracking: 0.08,
            },
            {
              text: COPY.strap.en,
              font: FONT.mono,
              size: 16,
              colour: INK.muted,
              tracking: 0.5,
              gap: 18,
              manner: "decode",
            },
            {
              text: COPY.title.zh,
              font: FONT.serif,
              size: 26,
              colour: INK.bone,
              tracking: 0.6,
              gap: 16,
              manner: "fade",
            },
          ]}
        />
      </Beat>

      <Grain strength={0.06} />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  )
}
