/**
 * Holds the render until a film's faces are loaded, so no frame is ever captured in a fallback face. Han faces are cut
 * into unicode-range slices, so each film names the text it sets and only those slices are fetched.
 */
import { continueRender, delayRender } from "remotion"

/** `faces`: [font shorthand, the text set in it] */
export function waitForFonts(faces: readonly (readonly [string, string])[]) {
  const handle = delayRender("Loading fonts")
  void Promise.all(faces.map(([font, text]) => document.fonts.load(font, text)))
    .catch((e: unknown) => console.error(e))
    .then(() => continueRender(handle))
}
