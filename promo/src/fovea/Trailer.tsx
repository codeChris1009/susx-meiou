/**
 * Fovea, thirty-four quiet seconds. The fovea is the small pit at the centre of the eye that sees sharply; the film
 * reads the way an eye does, in fixations and quick jumps (saccades), only the fixated spot in focus and the page around
 * it soft. Two lines say what the room is for; then Anthropic carries the product in use: off the rack, turned over,
 * opened, its company page, its prospectus read by the contents; dark mode; the name with its red dot.
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
import { Shot } from "../kit/shot"
import { Words } from "../kit/words"
import { FONT, INK, NOTE } from "./style"
import { COPY, FPS, SHOT } from "./timeline"

const len = (shot: readonly [number, number]) =>
  Math.round((shot[1] - shot[0]) * FPS)
const cap = (name: string) => `fovea/capture/${name}`

/** Where the eye rests, frame px, and for how many frames: it jumps between them in five frames, as eyes do */
type Fixation = readonly [number, number, number]

function gaze(path: readonly Fixation[], frame: number) {
  let t = 0
  for (let i = 0; i < path.length; i++) {
    const [x, y, hold] = path[i]!
    const next = path[i + 1]
    if (frame < t + hold || !next) return { x, y }
    if (frame < t + hold + 5) {
      const k = Easing.inOut(Easing.cubic)((frame - t - hold) / 5)
      return { x: x + (next[0] - x) * k, y: y + (next[1] - y) * k }
    }
    t += hold + 5
  }
  return { x: 960, y: 402 }
}

/** Everything but the fixated spot softened: a backdrop blur with a sharp hole where the eye rests */
function Fovea({
  path,
  radius = 230,
  blur = 7,
}: {
  path: readonly Fixation[]
  radius?: number
  blur?: number
}) {
  const frame = useCurrentFrame()
  const { x, y } = gaze(path, frame)
  const mask = `radial-gradient(circle at ${x}px ${y}px, transparent ${radius}px, black ${radius + 110}px)`
  return (
    <>
      <AbsoluteFill
        style={{
          backdropFilter: `blur(${blur}px)`,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
      <svg width={1920} height={804} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={x}
          cy={y}
          r={radius + 40}
          fill="none"
          stroke={INK.rule}
          strokeWidth={1}
          strokeDasharray="2 8"
        />
      </svg>
    </>
  )
}

const arrow = { kind: "arrow", colour: INK.paper, size: 24 } as const
const fade = { kind: "fade", frames: 12 } as const
/** Each shot outstays its slot by this much, seconds, so the next one fades in over it: a dissolve, not a dip */
const DISSOLVE = 0.4
const right = { x: 0.94, y: 0.86, align: "right" } as const

export function Trailer() {
  return (
    <AbsoluteFill style={{ background: INK.paper }}>
      <Audio src={staticFile("fovea/score.wav")} />

      <Beat
        from={SHOT.open[0]}
        to={SHOT.open[1]}
        exit={{ kind: "fade", frames: 10 }}
        name="open"
      >
        <Words
          duration={len(SHOT.open)}
          manner="rise"
          x={0.1}
          y={0.44}
          align="left"
          stagger={22}
          out={0}
          lines={COPY.open.en.map((text, k) => ({
            text,
            font: FONT.sans,
            size: 76,
            weight: 500,
            colour: k ? INK.ink : INK.muted,
            tracking: -0.025,
            gap: k ? 8 : 0,
          }))}
        />
        <Sequence from={40}>
          <Words
            duration={len(SHOT.open) - 40}
            manner="fade"
            x={0.1}
            y={0.72}
            align="left"
            out={0}
            lines={[
              {
                text: COPY.open.zh,
                font: FONT.han,
                size: 24,
                colour: INK.muted,
                tracking: 0.3,
              },
            ]}
          />
        </Sequence>
        <Fovea
          radius={150}
          blur={3}
          path={[
            [420, 320, 16],
            [980, 320, 12],
            [560, 430, 16],
            [1280, 430, 40],
          ]}
        />
      </Beat>

      <Shot
        from={SHOT.rack[0]}
        to={SHOT.rack[1] + DISSOLVE}
        src={cap("rack.mp4")}
        clipFrom={0.3}
        rate={1.4}
        cam={[{ zoom: 1.12 }, { zoom: 1.04, y: 0.46 }]}
        enter={{ kind: "blur", frames: 14 }}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[[0, 3.8, COPY.rack.en, COPY.rack.zh]]}
        name="rack"
      >
        <Fovea
          radius={170}
          blur={6}
          path={[
            [540, 380, 20],
            [830, 370, 18],
            [1130, 380, 18],
            [700, 400, 60],
          ]}
        />
      </Shot>
      <Shot
        from={SHOT.displays[0]}
        to={SHOT.displays[1] + DISSOLVE}
        src={cap("displays.mp4")}
        clipFrom={0.4}
        rate={1.5}
        enter={fade}
        cursor={arrow}
        note={NOTE}
        notes={[[0, 4.4, COPY.displays.en, COPY.displays.zh]]}
        name="displays"
      />
      <Shot
        from={SHOT.anthropic[0]}
        to={SHOT.anthropic[1] + DISSOLVE}
        src={cap("anthropic.mp4")}
        clipFrom={0.3}
        rate={1.2}
        cam={[{ zoom: 1 }, { zoom: 1.06, x: 0.45 }]}
        enter={fade}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[
          [0, 2.6, COPY.pick.en, COPY.pick.zh],
          [2.6, 5.6, COPY.flip.en, COPY.flip.zh],
        ]}
        name="anthropic"
      />
      <Shot
        from={SHOT.read[0]}
        to={SHOT.read[1] + DISSOLVE}
        src={cap("open.mp4")}
        clipFrom={0.4}
        rate={1.4}
        cam={[{ zoom: 1.02 }, { zoom: 1.1 }]}
        enter={fade}
        cursor={arrow}
        note={NOTE}
        notes={[[0, 4, COPY.read.en, COPY.read.zh]]}
        name="read"
      />
      <Shot
        from={SHOT.company[0]}
        to={SHOT.company[1] + DISSOLVE}
        src={cap("company.mp4")}
        clipFrom={0.3}
        rate={1.4}
        cam={[{ zoom: 1.12, x: 0.42 }, { zoom: 1.04 }]}
        enter={fade}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[[0, 4.2, COPY.company.en, COPY.company.zh]]}
        name="company"
      />
      <Shot
        from={SHOT.prospectus[0]}
        to={SHOT.prospectus[1] + DISSOLVE}
        src={cap("prospectus.mp4")}
        clipFrom={0.4}
        rate={1.6}
        cam={[{ zoom: 1.05 }, { zoom: 1.12, x: 0.45 }]}
        enter={fade}
        cursor={arrow}
        note={NOTE}
        at={right}
        notes={[
          [0, 2.6, COPY.facts.en, COPY.facts.zh],
          [2.6, 5.2, COPY.bull.en, COPY.bull.zh],
        ]}
        name="prospectus"
      >
        <Fovea
          radius={300}
          blur={4}
          path={[
            [760, 330, 40],
            [1100, 420, 40],
            [760, 520, 80],
          ]}
        />
      </Shot>
      <Shot
        from={SHOT.dark[0]}
        to={SHOT.dark[1] + DISSOLVE}
        src={cap("dark.mp4")}
        clipFrom={0.3}
        rate={2.2}
        enter={fade}
        cursor={arrow}
        note={{ ...NOTE, muted: INK.paper }}
        notes={[[0, 3, COPY.dark.en, COPY.dark.zh]]}
        name="dark"
      />

      <Beat
        from={SHOT.title[0]}
        to={SHOT.title[1]}
        enter={{ kind: "fade", frames: 12 }}
        name="title"
      >
        <Title />
      </Beat>

      <Grain strength={0.035} />
    </AbsoluteFill>
  )
}

/** The name as the site sets it, with the red dot it carries in its corner */
function Title() {
  const frame = useCurrentFrame()
  const p = Easing.out(Easing.exp)(
    interpolate(frame, [4, 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  )
  const dot = interpolate(frame, [24, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          transform: `translate(-50%, -50%) translateY(${(1 - p) * 40}px)`,
          opacity: p,
          display: "flex",
          alignItems: "flex-start",
          gap: 18,
        }}
      >
        <span
          style={{
            fontFamily: FONT.sans,
            fontWeight: 500,
            fontSize: 176,
            letterSpacing: "-0.045em",
            color: INK.ink,
            lineHeight: 1,
          }}
        >
          {COPY.title.en}
        </span>
        <span
          style={{
            width: 26,
            height: 26,
            marginTop: 30,
            borderRadius: "50%",
            background: INK.accent,
            transform: `scale(${dot})`,
          }}
        />
      </div>
      <Sequence from={22}>
        <Words
          duration={80}
          manner="fade"
          y={0.72}
          stagger={10}
          out={0}
          lines={[
            {
              text: COPY.strap.en,
              font: FONT.mono,
              size: 18,
              colour: INK.accent,
              tracking: 0.5,
            },
            {
              text: COPY.title.zh,
              font: FONT.han,
              size: 24,
              colour: INK.muted,
              tracking: 0.4,
              gap: 14,
            },
          ]}
        />
      </Sequence>
    </>
  )
}
