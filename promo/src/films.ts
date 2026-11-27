/**
 * The films made from the shared kit (screen captures of the live product, drawn overlays, a synthesised score), one
 * per gallery piece. Each film's id is the piece's id, so its web cut lands on the right piece (../src/content.ts).
 */
import type { ComponentType } from "react"

import * as anthology from "./anthology/timeline"
import { Trailer as Anthology } from "./anthology/Trailer"
import * as gymLeaders from "./gym-leaders/timeline"
import { Trailer as GymLeaders } from "./gym-leaders/Trailer"
import * as fovea from "./fovea/timeline"
import { Trailer as Fovea } from "./fovea/Trailer"
import * as ash from "./ash/timeline"
import { Trailer as Ash } from "./ash/Trailer"
import * as heroines from "./heroines/timeline"
import { Trailer as Heroines } from "./heroines/Trailer"
import * as yi64 from "./yi-64/timeline"
import { Trailer as Yi64 } from "./yi-64/Trailer"
import * as rivals from "./rivals/timeline"
import { Trailer as Rivals } from "./rivals/Trailer"
import * as villainOrgs from "./villain-orgs/timeline"
import { Trailer as VillainOrgs } from "./villain-orgs/Trailer"

interface Film {
  id: string
  Trailer: ComponentType
  fps: number
  seconds: number
  width: number
  height: number
}

const film = (
  id: string,
  Trailer: ComponentType,
  t: { FPS: number; SECONDS: number; WIDTH: number; HEIGHT: number }
): Film => ({
  id,
  Trailer,
  fps: t.FPS,
  seconds: t.SECONDS,
  width: t.WIDTH,
  height: t.HEIGHT,
})

export const FILMS: Film[] = [
  film("anthology", Anthology, anthology),
  film("gym-leaders", GymLeaders, gymLeaders),
  film("fovea", Fovea, fovea),
  film("ash", Ash, ash),
  film("heroines", Heroines, heroines),
  film("yi-64", Yi64, yi64),
  film("rivals", Rivals, rivals),
  film("villain-orgs", VillainOrgs, villainOrgs),
]
