/**
 * Pokémon Anti Org, thirty-eight seconds read as a declassified file. A file header is typed and struck through with
 * redaction bars; the site's cover glitches in; the nine regimes flicked through; then Rocket, Plasma and Aether /
 * Skull opened in use (leader cards, the radar, a regime's two faces, its dimensions), each step typed in the margin;
 * the verdict; the name, stamped DECLASSIFIED in red.
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

import { Beat, Flash } from "../kit/beat"
import { Grain, Vignette } from "../kit/film"
import { Rules } from "../kit/lines"
import { Shot } from "../kit/shot"
import { Words } from "../kit/words"
import { FONT, INK, NOTE } from "./style"
import { COPY, FPS, SHOT } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `villain-orgs/capture/${name}`
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

/** Black bars sliding over lines of a file, as a censor's pen would */
function Redactions({
  bars,
  at = 0,
}: {
  bars: readonly (readonly [number, number, number])[]
  at?: number
}) {
  const frame = useCurrentFrame()
  return (
    <>
      {bars.map(([x, y, w], k) => {
        const p = Easing.inOut(Easing.cubic)(
          interpolate(frame, [at + k * 5, at + k * 5 + 8], [0, 1], clamp)
        )
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w * p,
              height: 22,
              background: "#000",
              boxShadow: "0 0 0 1px rgba(233,228,216,0.08)",
            }}
          />
        )
      })}
    </>
  )
}

/** A rubber stamp, slammed down at an angle, its ink a little uneven */
function Stamp({
  text,
  at = 0,
  x = 0.5,
  y = 0.5,
  size = 64,
}: {
  text: string
  at?: number
  x?: number
  y?: number
  size?: number
}) {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < 0) return null
  const s = interpolate(t, [0, 4, 7], [2.2, 0.95, 1], clamp)
  return (
    <div
      style={{
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: `translate(-50%, -50%) rotate(-8deg) scale(${s})`,
        opacity: interpolate(t, [0, 3], [0, 0.92], clamp),
        border: `5px solid ${INK.red}`,
        padding: "10px 26px",
        fontFamily: FONT.mono,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.18em",
        color: INK.red,
        mixBlendMode: "screen",
        maskImage:
          "repeating-linear-gradient(93deg, black 0 7px, rgba(0,0,0,0.75) 7px 9px)",
      }}
    >
      {text}
    </div>
  )
}

const glitch = { kind: "glitch", frames: 8 } as const
const arrow = { kind: "arrow", colour: "#e9e4d8", size: 24 } as const
const right = { x: 0.94, y: 0.86, align: "right" } as const

export function Trailer() {
  return (
    <AbsoluteFill style={{ background: INK.ground }}>
      <Audio src={staticFile("villain-orgs/score.wav")} />

      <Beat
        from={SHOT.open[0]}
        to={SHOT.open[1]}
        exit={{ kind: "glitch", frames: 8 }}
        name="open"
      >
        <Rules
          colour={INK.rule}
          font={FONT.mono}
          rules={[
            {
              y: 0.18,
              at: 0,
              draw: 20,
              label: "CLASSIFICATION: RESTRICTED",
              ticks: 24,
            },
            { y: 0.84, at: 6, draw: 20, ticks: 24 },
          ]}
        />
        <Words
          duration={len(SHOT.open)}
          manner="type"
          x={0.1}
          y={0.42}
          align="left"
          stagger={20}
          out={0}
          pace={0.6}
          lines={COPY.open.en.map((text, k) => ({
            text,
            font: FONT.mono,
            size: k ? 30 : 64,
            colour: INK.paper,
            tracking: 0.08,
            gap: k ? 16 : 0,
          }))}
        />
        <Sequence from={36}>
          <Words
            duration={len(SHOT.open) - 36}
            manner="type"
            x={0.1}
            y={0.63}
            align="left"
            out={0}
            pace={0.6}
            lines={[
              {
                text: COPY.open.fields,
                font: FONT.mono,
                size: 20,
                colour: INK.muted,
                tracking: 0.08,
              },
            ]}
          />
        </Sequence>
        <Redactions
          at={58}
          bars={[
            [188, 495, 104],
            [366, 495, 122],
            [552, 495, 236],
            [850, 495, 116],
          ]}
        />
        <Sequence from={60}>
          <Words
            duration={len(SHOT.open) - 60}
            manner="fade"
            x={0.1}
            y={0.78}
            align="left"
            out={0}
            lines={[
              {
                text: COPY.open.zh,
                font: FONT.han,
                size: 24,
                weight: 500,
                colour: INK.red,
                tracking: 0.4,
              },
            ]}
          />
        </Sequence>
      </Beat>

      <Shot
        from={SHOT.intro[0]}
        to={SHOT.intro[1]}
        src={cap("intro.jpg")}
        cam={[
          { zoom: 1.2, y: 0.42 },
          { zoom: 1.3, y: 0.42 },
        ]}
        enter={glitch}
        name="intro"
      />
      <Shot
        from={SHOT.switch[0]}
        to={SHOT.switch[1]}
        src={cap("switch.mp4")}
        clipFrom={0.3}
        rate={1.6}
        enter={glitch}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[[0.2, 4, COPY.switch.en, COPY.switch.zh]]}
        name="switch"
      />
      <Shot
        from={SHOT.rocket[0]}
        to={SHOT.rocket[1]}
        src={cap("rocket.mp4")}
        clipFrom={0.3}
        rate={1.3}
        enter={glitch}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[
          [
            0.2,
            3,
            COPY.rocketCards.en,
            COPY.rocketCards.zh,
            "REGIME 01 · GEN I · II",
          ],
          [3, 5, COPY.radar.en, COPY.radar.zh],
          [5, 9, COPY.rule.en, COPY.rule.zh],
        ]}
        name="rocket"
      />
      <Shot
        from={SHOT.plasma[0]}
        to={SHOT.plasma[1]}
        src={cap("plasma.mp4")}
        clipFrom={0.2}
        rate={1.28}
        enter={glitch}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[
          [
            0.2,
            3.4,
            COPY.plasmaFaces.en,
            COPY.plasmaFaces.zh,
            "REGIME 04 · GEN V",
          ],
          [3.4, 7.5, COPY.ideology.en, COPY.ideology.zh],
        ]}
        name="plasma"
      />
      <Shot
        from={SHOT.aether[0]}
        to={SHOT.aether[1]}
        src={cap("aether-skull.mp4")}
        clipFrom={0.3}
        rate={1.5}
        enter={glitch}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[
          [0.2, 3, COPY.aether.en, COPY.aether.zh, "REGIME 06 · GEN VII"],
          [3, 7, COPY.real.en, COPY.real.zh],
        ]}
        name="aether"
      />
      <Shot
        from={SHOT.verdict[0]}
        to={SHOT.verdict[1]}
        src={cap("verdict.jpg")}
        cam={[
          { zoom: 1.5, x: 0.26, y: 0.4 },
          { zoom: 1.62, x: 0.26, y: 0.4 },
        ]}
        enter={glitch}
        exit={{ kind: "fade", frames: 8 }}
        note={NOTE}
        at={{ x: 0.94, y: 0.18, align: "right" }}
        notes={[[0.2, 2.5, COPY.verdict.en, COPY.verdict.zh]]}
        name="verdict"
      />

      <Beat from={SHOT.title[0]} to={SHOT.title[1]} name="title">
        <Rules
          colour={INK.rule}
          font={FONT.mono}
          rules={[
            { y: 0.2, at: 0, draw: 14, label: COPY.strap.en, ticks: 30 },
            { y: 0.8, at: 4, draw: 14, ticks: 30 },
          ]}
        />
        <Words
          duration={len(SHOT.title) + 10}
          manner="slam"
          y={0.46}
          stagger={10}
          out={0}
          lines={[
            {
              text: COPY.title.en,
              font: FONT.sans,
              size: 120,
              weight: 800,
              colour: INK.paper,
              tracking: -0.02,
            },
            {
              text: COPY.title.zh,
              font: FONT.han,
              size: 30,
              weight: 500,
              colour: INK.muted,
              tracking: 0.6,
              gap: 20,
              manner: "fade",
            },
          ]}
        />
        <Stamp text={COPY.stamp.en} at={26} x={0.7} y={0.66} size={40} />
        <Flash at={0} colour={INK.red} rise={0} fall={8} peak={0.45} />
      </Beat>

      <Grain strength={0.07} />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  )
}
