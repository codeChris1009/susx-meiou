import { Composition } from "remotion"

import { Trailer } from "./3d-art/Trailer"
import { FPS, HEIGHT, SECONDS, WIDTH } from "./3d-art/timeline"

export function Root() {
  return (
    <Composition
      id="3d-art"
      component={Trailer}
      durationInFrames={FPS * SECONDS}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  )
}
