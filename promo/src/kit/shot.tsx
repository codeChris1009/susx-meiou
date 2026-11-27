/**
 * One shot of the product in one line: a Beat holding a Screen (a capture with its camera), the cursor drawn from the
 * clip's own pointer track, marks on the capture, and notes timed within the beat naming what the product is doing.
 */
import type { ReactNode } from "react"
import { Sequence, useVideoConfig } from "remotion"

import { Beat, type Turn } from "./beat"
import { Note, type NoteLook } from "./note"
import {
  type Cam,
  type Card,
  Cursor,
  type Mark,
  Marks,
  type MarkStyle,
  Screen,
  type Skin,
} from "./screen"

/** [from, to] in seconds within the shot, then the note's English, Chinese and index */
export type Timed = readonly [number, number, string, string?, string?]

interface ShotProps {
  from: number
  to: number
  /** Under public/; a clip's pointer track is the .json beside it */
  src: string
  clipFrom?: number
  rate?: number
  size?: readonly [number, number]
  cam?: readonly [Cam, Cam]
  card?: readonly [Card, Card]
  skin?: Skin
  enter?: Turn
  exit?: Turn
  cursor?: { kind?: "ring" | "arrow" | "glow"; colour: string; size?: number }
  marks?: readonly Mark[]
  markStyle?: MarkStyle
  notes?: readonly Timed[]
  note?: NoteLook
  /** Where the notes sit: shares of the frame, and their alignment */
  at?: { x: number; y: number; align?: "left" | "right" | "center" }
  name?: string
  children?: ReactNode
}

export function Shot({
  from,
  to,
  src,
  clipFrom,
  rate,
  size,
  cam,
  card,
  skin,
  enter,
  exit,
  cursor,
  marks,
  markStyle,
  notes = [],
  note,
  at,
  name,
  children,
}: ShotProps) {
  const { fps } = useVideoConfig()
  const duration = Math.round((to - from) * fps)
  return (
    <Beat from={from} to={to} enter={enter} exit={exit} name={name}>
      <Screen
        src={src}
        clipFrom={clipFrom}
        rate={rate}
        size={size}
        duration={duration}
        cam={cam}
        card={card}
        skin={skin}
      >
        {cursor && src.endsWith(".mp4") && (
          <Cursor track={src.replace(/\.mp4$/, ".json")} {...cursor} />
        )}
        {marks && markStyle && <Marks marks={marks} look={markStyle} />}
      </Screen>
      {note &&
        notes.map(([a, b, en, zh, index]) => (
          <Sequence
            key={`${a}${en}`}
            from={Math.round(a * fps)}
            durationInFrames={Math.round((b - a) * fps)}
          >
            <Note
              duration={Math.round((b - a) * fps)}
              en={en}
              zh={zh}
              index={index}
              look={note}
              x={at?.x}
              y={at?.y}
              align={at?.align}
            />
          </Sequence>
        ))}
      {children}
    </Beat>
  )
}
