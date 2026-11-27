/**
 * 3D Art Gallery: a 31-second launch trailer. Mysterious, Renaissance: chiaroscuro, candlelight, gold construction
 * lines, Latin. The beat sheet is timeline.ts; the score (scripts/score.ts) is built from the same cues.
 */
import "../kit/fonts"

import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

import { Caption } from "../kit/caption"
import { Dip, Grain, Letterbox, Vignette } from "../kit/film"
import { Geometry } from "../kit/geometry"
import { SparkField, unroll, type Burst, type Spray } from "../kit/sparks"
import { Gallery3D } from "./Gallery3D"
import { frontAt, stageAt } from "./shots"
import { EMBERS, FONT, GILT, GOLD_METAL, HALO, IVORY, MUTED } from "./style"
import { HANG, HEIGHT, SHOT, WIDTH, f } from "./timeline"

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const
const CX = WIDTH / 2
const CY = HEIGHT / 2
const ALL_ROUND = Math.PI * 2

/** The name on the title card, and the box the sparks leave from */
const TITLE_BOX = { left: CX - 560, top: CY - 150, width: 1120, height: 210 }
/** The artist's signature in the script shot */
const SIGNATURE_BOX = { left: CX - 380, top: 300, width: 760, height: 120 }

/** The gallery's countdown sparks, intensity 1..8 (cursor.js createCountdownSparks), scaled for a 1080p frame */
const countdown = (intensity: number): Spray => ({
  from: "area",
  spread: ALL_ROUND,
  distance: [(10 + intensity * 4) * 3, (24 + intensity * 16) * 3],
  life: [(700 + intensity * 120) / 1000, (1100 + intensity * 220) / 1000],
  size: [3.6 + intensity * 0.3, 5.6 + intensity * 0.3],
  end: 0.16,
})

const BURSTS: Burst[] = [
  // Cold open: dust in the dark, and one ember rising through it
  ...unroll({
    from: 0,
    to: 4,
    every: () => 0.09,
    count: () => 1,
    box: () => ({ left: 0, top: 140, width: WIDTH, height: HEIGHT - 280 }),
    spray: () => ({
      from: "area",
      angle: -Math.PI / 2,
      spread: ALL_ROUND,
      distance: [12, 70],
      life: [2.2, 3.6],
      size: [1.2, 2.2],
      end: 0.6,
    }),
    seed: 1,
  }),
  {
    at: 0.3,
    count: 1,
    box: { left: CX - 4, top: HEIGHT - 150, width: 8, height: 4 },
    spray: {
      from: "area",
      angle: -Math.PI / 2,
      spread: 0.05,
      distance: [560, 560],
      life: [3.6, 3.6],
      size: [5, 5],
      end: 0.35,
    },
    seed: 2,
  },
  // The script shot: the signature's sparks (cursor.js createTitleSparks), a few at a time
  ...unroll({
    from: SHOT.script[0] + 0.35,
    to: SHOT.script[1] - 0.2,
    every: () => 0.12,
    count: () => 3,
    box: () => SIGNATURE_BOX,
    spray: () => ({
      from: "edge",
      spread: 1.1,
      distance: [20, 130],
      life: [1.2, 2],
      size: [3.4, 5],
      end: 0.18,
    }),
    seed: 3,
  }),
  // The climb: the countdown's sparks, quicker, larger and further as it nears the cut
  ...unroll({
    from: SHOT.rise[0],
    to: SHOT.rise[1] - 0.05,
    every: (p) => 0.24 - 0.17 * p,
    count: (p) => 1 + Math.floor((1 + 7 * p) * 0.68) * 2,
    box: () => ({ left: CX - 220, top: CY - 120, width: 440, height: 240 }),
    spray: (p) => countdown(1 + 7 * p),
    seed: 4,
  }),
  // The title: a firework off the name and a ring off its frame (createTextFireworkBurst, createOuterFrameSparks)
  {
    at: SHOT.title[0] + 1.05,
    count: 46,
    box: TITLE_BOX,
    spray: {
      from: "area",
      spread: ALL_ROUND,
      distance: [70, 400],
      life: [3, 4.6],
      size: [5, 10],
      end: 0.12,
    },
    seed: 5,
  },
  {
    at: SHOT.title[0] + 1.05,
    count: 64,
    box: TITLE_BOX,
    spray: {
      from: "edge",
      spread: 0.8,
      distance: [50, 260],
      life: [1.3, 1.95],
      size: [7, 8],
      end: 0.22,
      halo: true,
    },
    seed: 6,
  },
  ...unroll({
    from: SHOT.title[0] + 1.8,
    to: SHOT.title[1] - 1,
    every: () => 0.2,
    count: () => 2,
    box: () => TITLE_BOX,
    spray: () => ({
      from: "edge",
      spread: 1.1,
      distance: [20, 120],
      life: [1.6, 2.2],
      size: [3.4, 4.6],
      end: 0.18,
    }),
    seed: 7,
  }),
]

const fonts = { serif: FONT.serif, han: FONT.han }

function Card({
  at,
  until,
  en,
  zh,
  y = 0.8,
  size,
}: {
  at: number
  until: number
  en: string
  zh?: string
  y?: number
  size?: number
}) {
  return (
    <Sequence from={f(at)} durationInFrames={f(until) - f(at)}>
      <Caption
        en={en}
        zh={zh}
        y={y}
        size={size}
        duration={f(until) - f(at)}
        fonts={fonts}
        colour={IVORY}
        muted={MUTED}
      />
    </Sequence>
  )
}

/** Gold metal set in the script face, written on from the left with a light crossing it */
function Signature({
  text,
  size,
  start,
  duration,
  top,
}: {
  text: string
  size: number
  start: number
  duration: number
  top: number
}) {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const shine = interpolate(
    frame,
    [start, start + duration * 3],
    [100, -20],
    clamp
  )
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        textAlign: "center",
        filter: `drop-shadow(0 0 ${size * 0.12}px rgba(255, 212, 138, 0.35))`,
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "0 0.4em",
          fontFamily: FONT.script,
          fontSize: size,
          lineHeight: 1.3,
          backgroundImage: `linear-gradient(100deg, ${GOLD_METAL[4]} 0%, ${GOLD_METAL[2]} 32%, ${GOLD_METAL[0]} 50%, ${GOLD_METAL[3]} 68%, ${GOLD_METAL[4]} 100%)`,
          backgroundSize: "260% 100%",
          backgroundPosition: `${shine}% 0`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitMaskImage: `linear-gradient(90deg, #000 ${p * 120 - 20}%, transparent ${p * 120}%)`,
          maskImage: `linear-gradient(90deg, #000 ${p * 120 - 20}%, transparent ${p * 120}%)`,
        }}
      >
        {text}
      </span>
    </div>
  )
}

export function Trailer() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const front = HANG[frontAt(SHOT.script[0] + 0.5)]!

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Gallery3D state={stageAt(t)} />
      {/* A scrim under the lower captions, so the words never sit on a bright painting */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, transparent 58%, rgba(0, 0, 0, 0.55) 84%, rgba(0, 0, 0, 0.7) 100%)",
        }}
      />

      {/* Cold open: the construction of the figure, and the motto inside its circle */}
      <Sequence durationInFrames={f(SHOT.open[1])}>
        <Geometry
          start={f(0.4)}
          duration={f(3.2)}
          colour={GILT}
          opacity={0.42}
        />
      </Sequence>
      <Card
        at={1.15}
        until={3.85}
        en="IN TENEBRIS LUX"
        zh="黑暗之中有光"
        y={0.5}
        size={52}
      />

      <Card
        at={6.3}
        until={8.95}
        en="A GALLERY THAT LIVES IN YOUR BROWSER"
        zh="一座住在瀏覽器裡的展間"
      />
      <Card
        at={12.3}
        until={14.95}
        en="SIX MASTERS IN ONE ROOM"
        zh="六幅名畫 同在一室"
      />
      <Card
        at={15.25}
        until={16.97}
        en="LIGHT THAT FINDS THE PAINTING"
        zh="光落在畫上"
      />
      <Card
        at={17.25}
        until={18.97}
        en="A FLOOR OF BLACK MARBLE"
        zh="黑色大理石映出倒影"
      />
      <Card at={19.25} until={20.97} en="TURN THE ROOM" zh="一鍵轉動整個展間" />
      <Card at={21.25} until={22.97} en="SIGNED IN SCRIPT" zh="花體署名" />

      {/* The script shot: the painting's title, and its painter signing beneath it */}
      <Sequence from={f(SHOT.script[0])} durationInFrames={f(2)}>
        <Caption
          en={front.title.toUpperCase()}
          duration={f(2)}
          y={0.2}
          size={26}
          fonts={fonts}
          colour={IVORY}
          muted={MUTED}
        />
        <Signature
          text={front.artist}
          size={104}
          start={8}
          duration={f(1.1)}
          top={290}
        />
      </Sequence>

      {/* The title */}
      <Sequence from={f(SHOT.title[0])}>
        <Geometry
          start={0}
          duration={f(2)}
          colour={GILT}
          opacity={0.16}
          radius={400}
        />
        <Signature
          text="3D Art Gallery"
          size={200}
          start={f(0.2)}
          duration={f(1.3)}
          top={TITLE_BOX.top - 30}
        />
        <Card at={1.3} until={5} en="立體藝廊" y={0.66} size={34} />
        <Card
          at={1.9}
          until={5}
          en="THREE JS  WEBGL  REAL TIME"
          y={0.75}
          size={20}
        />
      </Sequence>

      <SparkField bursts={BURSTS} colours={EMBERS} halo={HALO} />

      <Dip from={0} to={f(SHOT.open[1])} outFrames={12} />
      <Dip
        from={f(SHOT.title[0])}
        to={f(SHOT.title[1])}
        inFrames={6}
        outFrames={f(0.8)}
      />

      <Vignette />
      <Grain />
      <Letterbox />

      <Audio src={staticFile("3d-art/score.wav")} />
    </AbsoluteFill>
  )
}
