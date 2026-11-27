/**
 * Anthology, a minute at night. A signal in the dark opens onto the home page's flight from the whole world down to
 * one island; then Artisanal at length, the product's own globe turned, zoomed and read country by country, each
 * gesture named in the margin; the other four spaces in a breath; the name over a globe drawn in fine line.
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
import { Dust, Graticule, Rings, drawn } from "../kit/lines"
import { Note } from "../kit/note"
import { Cursor, type Mark, Marks, Screen } from "../kit/screen"
import { Words } from "../kit/words"
import { FONT, INK, NOTE } from "./style"
import { COPY, FPS, SHOT, SPACE_BEAT, SPACES } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `anthology/capture/${name}`
const MARK = {
  colour: INK.star,
  muted: INK.muted,
  font: FONT.mono,
  han: FONT.han,
  size: 20,
  width: 1.4,
}

/** The point of light and the line it hangs from, as the site's own first screen draws it */
function Signal() {
  const frame = useCurrentFrame()
  const p = drawn(frame, 0, 42)
  const glow = 0.6 + 0.4 * Math.sin(frame * 0.18)
  return (
    <svg width={1920} height={804} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="star">
          <stop offset="0" stopColor={INK.star} stopOpacity={1} />
          <stop offset="0.25" stopColor={INK.rim} stopOpacity={0.5} />
          <stop offset="1" stopColor={INK.rim} stopOpacity={0} />
        </radialGradient>
      </defs>
      <line
        x1={960}
        y1={0}
        x2={960}
        y2={452 * p}
        stroke={INK.line}
        strokeWidth={1}
      />
      <path
        d="M-200 860 Q960 360 2120 860"
        fill="none"
        stroke={INK.faint}
        strokeWidth={1.2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - drawn(frame, 18, 60)}
      />
      <circle cx={960} cy={452} r={46 * glow * p} fill="url(#star)" />
    </svg>
  )
}

export function Trailer() {
  return (
    <AbsoluteFill style={{ background: INK.ground }}>
      <Audio src={staticFile("anthology/score.wav")} />

      <Beat from={SHOT.open[0]} to={SHOT.open[1]} name="open">
        <Dust
          count={90}
          colour={INK.star}
          size={1.1}
          speed={0.15}
          opacity={0.35}
        />
        <Rings
          cy={452 / 804}
          colour={INK.faint}
          period={34}
          reach={0.7}
          from={10}
        />
        <Signal />
        <Sequence from={22}>
          <Words
            duration={len(SHOT.open) - 22}
            y={0.24}
            manner="decode"
            stagger={18}
            out={10}
            lines={[
              {
                text: COPY.signal.en,
                font: FONT.mono,
                size: 26,
                colour: INK.star,
                tracking: 0.6,
              },
              {
                text: COPY.signal.zh,
                font: FONT.han,
                size: 19,
                colour: INK.muted,
                tracking: 0.5,
                gap: 18,
                manner: "fade",
              },
            ]}
          />
        </Sequence>
      </Beat>

      <Beat
        from={SHOT.signal[0]}
        to={SHOT.signal[1]}
        enter={{ kind: "iris", frames: 26, at: [0.5, 452 / 804] }}
        name="signal"
      >
        <Screen
          src={cap("home-signal.mp4")}
          clipFrom={0.3}
          duration={len(SHOT.signal)}
          cam={[{ zoom: 1 }, { zoom: 1.06 }]}
        />
        <Sequence from={40}>
          <Note
            duration={len(SHOT.signal) - 40}
            x={0.945}
            y={0.9}
            align="right"
            en="25.0330° N · 121.5654° E"
            look={{ ...NOTE, size: 18, tracking: 0.3 }}
          />
        </Sequence>
      </Beat>

      <Beat
        from={SHOT.island[0]}
        to={SHOT.island[1]}
        exit={{ kind: "fade", frames: 16 }}
        name="island"
      >
        <Screen
          src={cap("home-island.mp4")}
          clipFrom={0}
          rate={1.05}
          duration={len(SHOT.island)}
          cam={[{ zoom: 1.04 }, { zoom: 1 }]}
        />
      </Beat>

      <Beat
        from={SHOT.chapter[0]}
        to={SHOT.chapter[1]}
        exit={{ kind: "fade", frames: 12 }}
        name="chapter"
      >
        <Graticule
          r={0.42}
          cy={0.52}
          colour={INK.faint}
          draw={30}
          dots={160}
          dotColour={INK.muted}
          spin={0.35}
        />
        <Words
          duration={len(SHOT.chapter)}
          y={0.5}
          stagger={12}
          lines={[
            {
              text: COPY.chapter.index,
              font: FONT.mono,
              size: 18,
              colour: INK.muted,
              tracking: 0.5,
              manner: "decode",
            },
            {
              text: COPY.chapter.en,
              font: FONT.sans,
              size: 52,
              weight: 300,
              colour: INK.star,
              tracking: 0.26,
              gap: 26,
            },
            {
              text: COPY.chapter.zh,
              font: FONT.han,
              size: 22,
              weight: 300,
              colour: INK.muted,
              tracking: 0.5,
              gap: 22,
              manner: "fade",
            },
          ]}
        />
      </Beat>

      <Beat
        from={SHOT.idle[0]}
        to={SHOT.idle[1]}
        enter={{ kind: "blur", frames: 18 }}
        name="idle"
      >
        <Screen
          src={cap("art-idle.mp4")}
          duration={len(SHOT.idle)}
          cam={[
            { y: 0.46, zoom: 1.08 },
            { y: 0.5, zoom: 1 },
          ]}
        >
          <Cursor track={cap("art-idle.json")} colour={INK.star} />
        </Screen>
        <Note
          duration={len(SHOT.idle)}
          x={0.945}
          y={0.9}
          align="right"
          en="ARTISANAL · VIAL GLOBE"
          zh={COPY.idle.zh}
          look={{ ...NOTE, size: 20 }}
        />
      </Beat>

      <Beat from={SHOT.zen[0]} to={SHOT.zen[1] + 0.6} name="zen">
        <Screen
          src={cap("art-zen.mp4")}
          clipFrom={0.6}
          duration={len(SHOT.zen)}
          cam={[{ zoom: 1 }, { zoom: 1.04 }]}
        >
          <Cursor track={cap("art-zen.json")} colour={INK.star} />
        </Screen>
        {ZEN_NOTES.map(([from, to, copy, index]) => (
          <Sequence
            key={index}
            from={Math.round(from * FPS)}
            durationInFrames={Math.round((to - from) * FPS)}
          >
            <Note
              duration={Math.round((to - from) * FPS)}
              index={index}
              en={copy.en}
              zh={copy.zh}
              look={NOTE}
            />
          </Sequence>
        ))}
      </Beat>

      <Beat
        from={SHOT.taiwan[0]}
        to={SHOT.taiwan[1]}
        enter={{ kind: "iris", frames: 18, at: [0.57, 0.44] }}
        name="taiwan"
      >
        <Screen
          src={cap("art-taiwan.mp4")}
          clipFrom={0.5}
          duration={len(SHOT.taiwan)}
          cam={[
            { zoom: 1, y: 0.5 },
            { zoom: 1.04, y: 0.58 },
          ]}
        >
          <Cursor track={cap("art-taiwan.json")} colour={INK.star} />
          <Marks look={MARK} marks={TAIWAN_MARKS} />
        </Screen>
        <Note
          duration={len(SHOT.taiwan)}
          index="V"
          en={COPY.taiwan.en}
          zh={COPY.taiwan.zh}
          look={NOTE}
        />
      </Beat>

      <Beat
        from={SHOT.expand[0]}
        to={SHOT.expand[1]}
        exit={{ kind: "fade", frames: 10 }}
        name="expand"
      >
        <Screen
          src={cap("art-taiwan.mp4")}
          clipFrom={6.2}
          rate={0.85}
          duration={len(SHOT.expand)}
          cam={[
            { zoom: 1, y: 0.5 },
            { zoom: 1.1, x: 0.5, y: 0.52 },
          ]}
        >
          <Cursor track={cap("art-taiwan.json")} colour={INK.star} />
          <Marks look={MARK} marks={DOSSIER_MARKS} />
        </Screen>
        <Note
          duration={len(SHOT.expand)}
          x={0.945}
          y={0.17}
          align="right"
          index="VI"
          en={COPY.expand.en}
          zh={COPY.expand.zh}
          look={NOTE}
        />
      </Beat>

      <Beat from={SHOT.spaces[0]} to={SHOT.spaces[1]} name="spaces">
        <Graticule
          r={0.5}
          cx={0.72}
          cy={0.55}
          colour={INK.faint}
          draw={30}
          spin={0.6}
        />
        {SPACES.map((space, k) => (
          <Sequence
            key={space}
            from={Math.round(k * SPACE_BEAT * FPS)}
            durationInFrames={Math.round(SPACE_BEAT * FPS)}
          >
            <SpaceCard space={space} k={k} />
          </Sequence>
        ))}
      </Beat>

      <Beat from={SHOT.title[0]} to={SHOT.title[1]} name="title">
        <Graticule
          r={0.36}
          cy={0.5}
          colour={INK.faint}
          draw={70}
          dots={220}
          dotColour={INK.muted}
          spin={0.22}
          tilt={22}
        />
        <Rings colour={INK.faint} period={40} reach={0.75} count={3} from={4} />
        <Words
          duration={len(SHOT.title) + 20}
          y={0.47}
          stagger={16}
          out={0}
          lines={[
            {
              text: COPY.title.en,
              font: FONT.sans,
              size: 104,
              weight: 300,
              colour: INK.star,
              tracking: 0.42,
              style: { textIndent: "0.42em" },
            },
            {
              text: COPY.strap.en,
              font: FONT.mono,
              size: 17,
              colour: INK.muted,
              tracking: 0.5,
              gap: 30,
              manner: "decode",
            },
            {
              text: COPY.title.zh,
              font: FONT.han,
              size: 20,
              weight: 300,
              colour: INK.muted,
              tracking: 0.6,
              gap: 16,
              manner: "fade",
            },
          ]}
        />
        <Flash at={0} colour={INK.star} rise={0} fall={14} peak={0.5} />
      </Beat>

      <Grain strength={0.05} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  )
}

/** One of the other spaces: its page floated as a card, turning in, its name beside */
function SpaceCard({
  space,
  k,
}: {
  space: (typeof SPACES)[number]
  k: number
}) {
  const frame = useCurrentFrame()
  const d = Math.round(SPACE_BEAT * FPS)
  const side = k % 2 ? -1 : 1
  const o = interpolate(frame, [0, 6, d - 5, d], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const copy = COPY[space]
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Screen
        src={cap(`${space}.jpg`)}
        duration={d}
        card={[
          { x: 0.5 + side * 0.14, y: 0.5, w: 0.56, ry: -side * 16, rx: 4 },
          { x: 0.5 + side * 0.11, y: 0.5, w: 0.58, ry: -side * 9, rx: 2 },
        ]}
        cam={[{ zoom: 1.1 }, { zoom: 1.02 }]}
        skin={{
          radius: 10,
          edge: `1px solid ${INK.faint}`,
          shadow: "0 50px 140px rgba(0,0,0,0.8)",
        }}
      />
      <Words
        duration={d}
        x={side > 0 ? 0.07 : 0.93}
        y={0.5}
        align={side > 0 ? "left" : "right"}
        stagger={6}
        out={5}
        lines={[
          {
            text: `0${k + 2}`,
            font: FONT.mono,
            size: 16,
            colour: INK.muted,
            tracking: 0.4,
            manner: "decode",
          },
          {
            text: copy.en,
            font: FONT.sans,
            size: 46,
            weight: 300,
            colour: INK.star,
            tracking: 0.3,
            gap: 10,
            manner: "decode",
          },
          {
            text: copy.zh,
            font: FONT.han,
            size: 19,
            weight: 300,
            colour: INK.muted,
            tracking: 0.3,
            gap: 14,
            manner: "fade",
          },
        ]}
      />
    </AbsoluteFill>
  )
}

/** Zen mode's gestures, named as they happen: seconds within the beat, the copy, the index */
const ZEN_NOTES = [
  [0, 1.6, COPY.zen, "I"],
  [1.6, 4.6, COPY.drag, "II"],
  [4.6, 9.4, COPY.zoom, "III"],
  [9.4, 11.8, COPY.back, "IV"],
] as const

/** Taiwan, outlined once the camera has flown to it, and its vial's card, in capture px (art-taiwan.mp4) */
const TAIWAN_MARKS: Mark[] = [
  { kind: "ring", x: 890, y: 500, w: 150, h: 160, at: 100 },
  {
    kind: "box",
    x: 1476,
    y: 650,
    w: 430,
    h: 392,
    at: 40,
    label: { en: "THE VIAL", zh: "台灣的情報小瓶", side: "left" },
  },
]
/** The expanded imprint: provenance, fingerprint, trend (art-taiwan.mp4, once expanded) */
const DOSSIER_MARKS: Mark[] = [
  { kind: "bracket", x: 24, y: 300, w: 920, h: 352, at: 16 },
  { kind: "bracket", x: 952, y: 300, w: 948, h: 352, at: 28 },
  { kind: "bracket", x: 24, y: 680, w: 1876, h: 282, at: 40 },
]
