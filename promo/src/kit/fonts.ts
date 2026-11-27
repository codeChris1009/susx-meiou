/**
 * Fonts, self-hosted through fontsource and waited for: a frame must never be captured in a fallback face.
 */
import "@fontsource/cormorant/400.css"
import "@fontsource/cormorant/500.css"
import "@fontsource/stalemate/400.css"
import "@fontsource/noto-serif-tc/400.css"

import { continueRender, delayRender } from "remotion"

const waiting = delayRender("Loading fonts")
void Promise.all([
  document.fonts.load('500 46px "Cormorant"', "ABC"),
  document.fonts.load('400 46px "Cormorant"', "ABC"),
  document.fonts.load('400 46px "Stalemate"', "Art Gallery"),
  // Noto Serif TC is cut into unicode-range slices: ask for every character the trailers set
  document.fonts.load(
    '400 24px "Noto Serif TC"',
    "黑暗之中有光一座住在瀏覽器裡的展間六幅名畫同在一室光落在畫上黑色大理石映出倒影一鍵轉動整個展間花體署名立體藝廊"
  ),
]).then(() => continueRender(waiting))
