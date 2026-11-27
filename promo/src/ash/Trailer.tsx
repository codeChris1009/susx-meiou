/**
 * Pokémon Ash, forty seconds with Pikachu at the centre and Ash passing through. The site's gold centre line is the
 * film's spine: it draws down the dark at the start, stays faint over the product, and splits the title at the end.
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
import { CHOOSE, FONT, INK, NOTE, SKY } from "./style"
import { COPY, FPS, SHOT } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `ash/capture/${name}`

/** The gold line down the middle, with a spark travelling along it */
function Spine({
  at = 0,
  draw = 40,
  opacity = 1,
}: {
  at?: number
  draw?: number
  opacity?: number
}) {
  const frame = useCurrentFrame()
  const p = drawn(frame, at, draw)
  const spark = ((frame * 6) % 1000) / 1000
  return (
    <svg
      width={1920}
      height={804}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      <defs>
        <linearGradient id="spine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK.gold} stopOpacity={0} />
          <stop offset="0.5" stopColor={INK.gold} stopOpacity={0.9} />
          <stop offset="1" stopColor={INK.gold} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={959.5} y={0} width={1.4} height={804 * p} fill="url(#spine)" />
      {p >= 1 && (
        <circle
          cx={960}
          cy={spark * 804}
          r={3}
          fill={INK.gold}
          opacity={Math.sin(spark * Math.PI)}
        />
      )}
    </svg>
  )
}

const glow = {
  kind: "glow",
  colour: "rgba(236,197,108,0.6)",
  size: 36,
} as const
const white = { kind: "flash", frames: 7, colour: INK.white } as const
const gold = { kind: "flash", frames: 6, colour: INK.gold } as const
const right = { x: 0.94, y: 0.86, align: "right" } as const
const top = { x: 0.94, y: 0.2, align: "right" } as const

export function Trailer() {
  return (
    <AbsoluteFill style={{ background: INK.navy }}>
      <Audio src={staticFile("ash/score.wav")} />

      <Beat
        from={SHOT.open[0]}
        to={SHOT.open[1]}
        exit={{ kind: "fade", frames: 8 }}
        name="open"
      >
        <AbsoluteFill style={{ background: SKY }} />
        <Dust
          count={160}
          colour={INK.white}
          size={1}
          speed={0.08}
          opacity={0.55}
          seed={9}
        />
        <Spine draw={30} />
        <Sequence from={10}>
          <Words
            duration={len(SHOT.open) - 10}
            y={0.45}
            stagger={12}
            out={8}
            lines={[
              {
                text: COPY.open.zh,
                font: FONT.serif,
                size: 50,
                weight: 500,
                colour: INK.white,
                tracking: 0.3,
              },
              {
                text: COPY.open.en,
                font: FONT.mono,
                size: 18,
                colour: INK.gold,
                tracking: 0.6,
                gap: 24,
                manner: "decode",
              },
            ]}
          />
        </Sequence>
      </Beat>

      <Shot
        from={SHOT.hats[0]}
        to={SHOT.hats[1]}
        src={cap("hero-hats.mp4")}
        clipFrom={0.3}
        rate={1.25}
        cam={[
          { zoom: 1.1, y: 0.56 },
          { zoom: 1.04, y: 0.58 },
        ]}
        enter={white}
        cursor={glow}
        note={NOTE}
        at={{ x: 0.055, y: 0.88 }}
        notes={[[0.3, 7.2, COPY.hats.en, COPY.hats.zh]]}
        name="hats"
      >
        <Spine draw={1} opacity={0.35} />
      </Shot>
      <Shot
        from={SHOT.aces[0]}
        to={SHOT.aces[1]}
        src={cap("aces.mp4")}
        clipFrom={0.5}
        rate={2}
        cam={[
          { zoom: 1.1, y: 0.6 },
          { zoom: 1.15, y: 0.62 },
        ]}
        enter={gold}
        cursor={glow}
        note={NOTE}
        at={top}
        notes={[[0, 1.8, COPY.aces.en, COPY.aces.zh]]}
        name="aces"
      />
      <Shot
        from={SHOT.timeline[0]}
        to={SHOT.timeline[1]}
        src={cap("hats.mp4")}
        clipFrom={0.4}
        rate={1.6}
        enter={{ kind: "wipe", frames: 8, from: "right" }}
        note={NOTE}
        at={top}
        notes={[[0, 4, COPY.timeline.en, COPY.timeline.zh]]}
        name="timeline"
      />
      <Shot
        from={SHOT.galar[0]}
        to={SHOT.galar[1]}
        src={cap("galar.mp4")}
        clipFrom={0.4}
        rate={1.25}
        cam={[{ zoom: 1.02 }, { zoom: 1.08 }]}
        enter={white}
        cursor={glow}
        note={NOTE}
        at={right}
        notes={[
          [0.3, 4.4, COPY.galar.en, COPY.galar.zh],
          [5.6, 10, COPY.volt.en, COPY.volt.zh],
        ]}
        name="galar"
      >
        <Spine draw={1} opacity={0.3} />
      </Shot>
      <Shot
        from={SHOT.friends[0]}
        to={SHOT.friends[1]}
        src={cap("friends.mp4")}
        clipFrom={0.3}
        rate={2}
        cam={[
          { zoom: 1.02, y: 0.55 },
          { zoom: 1.08, y: 0.58 },
        ]}
        enter={gold}
        note={NOTE}
        at={top}
        notes={[[0.2, 3.6, COPY.friends.en, COPY.friends.zh]]}
        name="friends"
      />
      <Shot
        from={SHOT.pokedex[0]}
        to={SHOT.pokedex[1]}
        src={cap("pokedex.mp4")}
        clipFrom={0.3}
        rate={1.8}
        cam={[
          { zoom: 1.05, y: 0.55 },
          { zoom: 1.12, y: 0.6 },
        ]}
        enter={white}
        cursor={glow}
        note={NOTE}
        at={top}
        notes={[[0, 3.4, COPY.pokedex.en, COPY.pokedex.zh]]}
        name="pokedex"
      />
      <Shot
        from={SHOT.cards[0]}
        to={SHOT.cards[1]}
        src={cap("cards.mp4")}
        clipFrom={0.3}
        rate={1.7}
        cam={[{ zoom: 1.04 }, { zoom: 1.1, y: 0.45 }]}
        enter={gold}
        exit={{ kind: "fade", frames: 6 }}
        cursor={glow}
        note={NOTE}
        at={right}
        notes={[[0, 3.6, COPY.cards.en, COPY.cards.zh]]}
        name="cards"
      />

      <Beat from={SHOT.title[0]} to={SHOT.title[1]} name="title">
        <AbsoluteFill style={{ background: SKY }} />
        <Dust
          count={160}
          colour={INK.white}
          size={1}
          speed={0.2}
          opacity={0.6}
          seed={9}
        />
        <Spine draw={1} opacity={0.6} />
        <Title />
        <Flash at={0} rise={0} fall={12} />
      </Beat>

      <Grain strength={0.05} />
      <Vignette strength={0.4} />
    </AbsoluteFill>
  )
}

/** I CHOOSE YOU in the site's gradient, the two halves meeting at the gold line */
function Title() {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" })
  const ease = 1 - (1 - p) ** 3
  const word = {
    fontFamily: FONT.sans,
    fontWeight: 800,
    fontSize: 150,
    letterSpacing: "-0.02em",
    backgroundImage: CHOOSE,
    backgroundSize: "1500px 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    lineHeight: 1,
  } as const
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          display: "flex",
          justifyContent: "center",
          gap: 46,
        }}
      >
        <span
          style={{
            ...word,
            backgroundPosition: "0 0",
            transform: `translateX(${(1 - ease) * -160}px)`,
            opacity: p,
          }}
        >
          {COPY.title.en[0]}
        </span>
        <span
          style={{
            ...word,
            backgroundPosition: "-900px 0",
            transform: `translateX(${(1 - ease) * 160}px)`,
            opacity: p,
          }}
        >
          {COPY.title.en[1]}
        </span>
      </div>
      <Sequence from={14}>
        <Words
          duration={120}
          manner="fade"
          y={0.7}
          stagger={10}
          out={0}
          lines={[
            {
              text: COPY.title.zh,
              font: FONT.serif,
              size: 36,
              weight: 500,
              colour: INK.white,
              tracking: 0.5,
            },
            {
              text: COPY.strap.en,
              font: FONT.mono,
              size: 17,
              colour: INK.gold,
              tracking: 0.5,
              gap: 18,
            },
          ]}
        />
      </Sequence>
    </>
  )
}
