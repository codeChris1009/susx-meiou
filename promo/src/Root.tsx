import { Composition } from "remotion"

import { Trailer } from "./3d-art/Trailer"
import { FPS, HEIGHT, SECONDS, WIDTH } from "./3d-art/timeline"
import { FILMS } from "./films"

export function Root() {
  return (
    <>
      <Composition
        id="3d-art"
        component={Trailer}
        durationInFrames={FPS * SECONDS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {FILMS.map((film) => (
        <Composition
          key={film.id}
          id={film.id}
          component={film.Trailer}
          durationInFrames={Math.round(film.fps * film.seconds)}
          fps={film.fps}
          width={film.width}
          height={film.height}
        />
      ))}
    </>
  )
}
