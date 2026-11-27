# promo：作品發佈預告片

每個作品（Works 或 Practice）一支 20 到 40 秒的發佈預告片，節奏與畫質比照電影預告片，秀出產品真正會做的事。
片中產品以外的素材（火花、塵埃、光束、線稿、顆粒、字卡、配樂）全部用程式依產品自己的風格即時繪製或合成，
沒有外部素材，也就沒有授權問題。第一支是 [3D Art Gallery](https://codechris1009.github.io/demo-3js-Gallery0/)。

## 工具

推薦 **Remotion 4**：用 React + TypeScript 寫影片，逐幀渲染、同一幀永遠畫出同一張圖，自帶 ffmpeg，可以直接在畫面裡跑 three.js。
跟網站同一套語言與元件思維，作品的 three.js 程式碼可以原樣搬進來當「遊戲引擎內運鏡（in-engine cinematics）」。

| 方案                         | 取捨                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| Remotion 4（採用）           | React/TS、逐幀 deterministic、內建編碼；授權見下              |
| Motion Canvas                | MIT，但不是 React，3D 要自己接                                |
| Playwright 逐幀截圖 + ffmpeg | 能錄真實網站，但要自己接管時鐘（rAF、計時器、CSS 動畫）與編碼 |

授權：Remotion 對個人與 3 人以下的公司免費，超過要買公司授權（以 `node_modules/remotion/LICENSE.md` 原文為準）。

## 每支影片的流程

1. **Brief**：產品一句話、要秀的 3 到 4 個功能、風格關鍵字、片長。
2. **萃取風格**：從產品原始碼取色票、字體、動效參數，寫成這支片的 `style.ts`，不憑印象配色。
3. **分鏡 Beat sheet**（`timeline.ts`）：預告片的三幕：冷開場（謎）→ 揭示產品 → 功能蒙太奇（越剪越快）→ 黑場重擊 → 片名卡。
   每一拍寫死起訖幀與音效點，畫面與配樂讀同一份時間表，所以永遠對拍。
4. **畫面**：產品本體用 in-engine 方式重建（產品的 three.js 場景在 composition 裡跑，鏡頭自由運鏡）；
   額外素材用 canvas 2D 繪製，全部是「幀數 → 畫面」的純函式加固定亂數種子（seed），平行渲染、任意跳幀都畫得一樣。
5. **配樂**（`score.ts`）：Node 腳本以加法合成與雜訊合成 drone、braam、riser、impact、心跳，輸出 WAV；同一個 seed、同一份時間表。
6. **渲染**：`pnpm render:<作品>` 輸出 `out/<作品>.mp4`（H.264、1920×1080、30fps）與海報幀 `out/<作品>.png`。
7. **驗收**：抽關鍵幀拼成 contact sheet 檢查構圖與字；確認時長、音軌、無黑幀。

## 目錄與指令

```
promo/
  src/Root.tsx              註冊每支片的 composition
  src/kit/                  共用：seeded random、火花場、字卡、金線構圖、寬銀幕黑邊、顆粒、暗角、字體
  src/3d-art/
    style.ts                從 3d art 原始碼取的色票、字體、場景常數
    timeline.ts             分鏡與音效 cue（畫面與配樂共用）
    stage.ts                three.js 展間：照原作重建，加上光束、塵埃、燭光
    shots.ts                每一幀的鏡頭與燈光（純函式）
    Trailer.tsx             組裝：3D、字卡、火花、片名
  scripts/score.ts          合成配樂 → public/<作品>/score.wav（不進版控，渲染前自動產生）
  scripts/stills.ts         抽關鍵幀 → out/stills/
  public/3d-art/            六幅畫作（Rijksmuseum 公有領域，2048px JPEG）
```

promo 是獨立的 pnpm workspace（自己的 `pnpm-workspace.yaml` 與 lockfile），Remotion 與它自帶的 ffmpeg、Chrome Headless Shell
不會進到網站的 lockfile 與 CI。

```bash
cd promo && pnpm install
pnpm studio                         # 在瀏覽器裡逐幀預覽、拖時間軸
pnpm render:3d-art                  # 配樂 → out/3d-art.mp4 → 海報幀 out/3d-art.png
pnpm web:3d-art                     # 網站用的版本 → ../src/assets/promo/art-gallery.mp4
node scripts/stills.ts 3d-art 150 470 850   # 只看幾個關鍵幀
```

網站用的版本：裁掉寬銀幕上下黑邊，只留 2.39:1 的畫面（1600×668，H.264 CRF 23，AAC 160k，faststart），約 5.4 MB，原檔 31 MB。
黑邊交給展間的 shader 補回來，不浪費位元率。檔名跟展品 id 一樣（`art-gallery`），
[content.ts](../src/content.ts) 會自動把它接到那件展品上。

## 3D Art Gallery：神秘文藝復興（約 31 秒）

風格來源（demo-3js-Gallery0）：黑底、拋光黑鏡地板、聚光燈、銀灰圓角畫框、Stalemate 花體與 Cormorant 襯線、
`INTRO_FIREWORK_COLORS` 香檳金火花（#ffffffe6 #fffae6 #fff5c8 #ecdc9d #ffd48a）、冷色光暈 rgba(200, 220, 255, 0.35)。
神秘文藝復興：明暗對照（chiaroscuro）、燭光塵埃、金色細線的維特魯威構圖與黃金比例弧、拉丁銘文、膠片顆粒、2.39:1 寬銀幕黑邊。

| 秒    | 拍         | 畫面                                                                                       | 字卡                                         | 聲音                            |
| ----- | ---------- | ------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------- |
| 0–4   | 冷開場     | 全黑，一粒火星升起；金線慢慢畫出圓、方、對角線與黃金螺線                                   | IN TENEBRIS LUX／光在黑暗之中                | 低頻 drone，0.3 秒一記深沉 boom |
| 4–9   | 揭示       | 聚光燈「啪」地打亮一幅畫（The Holy Family at Night），光束裡有塵埃，鏡面地板倒影，緩慢推近 | A GALLERY THAT LIVES IN THE BROWSER          | impact，弦樂 pad 進來           |
| 9–15  | 展間       | 鏡頭升起後拉，八幅畫圍成環，環轉一格（產品的左右切換）                                     | EIGHT MASTERPIECES IN ONE ROOM／八幅名畫一室 | 心跳加入                        |
| 15–23 | 功能蒙太奇 | 四個快切：光隨畫轉、鏡面地板、一鍵轉動展間、花體署名伴火花                                 | 每個功能一張字卡                             | 每個剪點一記 braam              |
| 23–26 | 爬升       | 環越轉越快、火花越噴越密（產品倒數火花的強度曲線），閃切畫作，25.6 秒切黑                  |                                              | riser 到頂，切黑重擊            |
| 26–31 | 片名       | 「3D Art Gallery」花體金屬字寫出，火花煙火炸開                                             | 立體藝廊／three.js                           | 最後一記 boom 與殘響            |
