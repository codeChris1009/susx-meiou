# promo：作品發佈預告片

每個精選作品一支發佈預告片，重點放在功能的實際操作與畫面流程：從線上網站錄下真實互動，加上程式繪製的線條、幾何、說明文字、轉場與合成配樂，風格跟著產品走
片中產品以外的素材全部由程式即時繪製或合成，沒有外部素材，也就沒有授權問題

流程（Brief → 盤點功能並逐支和使用者確認 → 萃取風格 → 分鏡 → 擷取 → 畫面與配樂 → 驗收 → 出片）寫在使用者層級的 skill `launch-trailer`（`~/.claude/skills/launch-trailer/`），這份 README 只記這個專案自己的東西

## 工具

**Remotion 4**：用 React + TypeScript 寫影片，逐幀渲染、同一幀永遠畫出同一張圖，自帶 ffmpeg；授權：個人與 3 人以下的公司免費（以 `node_modules/remotion/LICENSE.md` 原文為準）
擷取用 **playwright-core** 開本機的 Chrome（channel `chrome`），不下載瀏覽器，WebGL／WebGPU 和訪客看到的一樣

promo 是獨立的 pnpm workspace（自己的 `pnpm-workspace.yaml` 與 lockfile），Remotion、ffmpeg、Playwright 不會進到網站的 lockfile 與 CI

## 目錄與指令

```
promo/
  src/kit/            共用：capture-plan（擷取計畫格式）、screen（Screen 運鏡／Marks 標註／Cursor 游標）、shot（一行一個鏡頭）、
                      words（六種文字動態）、note（旁註）、beat（段落與轉場：iris、blur、wipe、flash、glitch、ink、boss…）、
                      lines（Graticule 地球、Rings、Rules、Dust、Count）、synth（合成器）、ready（等字體）、film、random
  src/<作品>/         capture.ts（拍什麼）、timeline.ts（分鏡、文字、音效點）、style.ts（色票與字體）、score.ts（配樂）、Trailer.tsx（畫面）
  src/films.ts        登記每支片；id 與精選展品 id 相同
  scripts/capture.ts  依 capture.ts 從線上網站拍靜態、長頁與 live 片段（附游標軌跡）；scan 模式出整站縮圖表
  scripts/peek.ts     每段片段的開頭、中段、結尾拼成一張表，確認操作真的發生
  scripts/compose.ts  合成配樂 → public/<作品>/score.wav
  scripts/stills.ts   抽幀；--every=2 拼成整支片的縮圖表
  scripts/release.ts  配樂 → 母帶 out/<作品>.mp4 → 網站版 ../src/assets/promo/<作品>.mp4
```

擷取素材（`public/*/capture/`）與配樂（`public/**/score.wav`）不進版控，用上面的指令重新產生；不公開的網站（Anthology）網址放在 gitignored 的 `promo/.env.local`（`ANTHOLOGY_URL=…`），`pnpm capture` 會讀它

```bash
cd promo && pnpm install
pnpm capture anthology            # 拍；pnpm capture scan <url> [--dark] 先看整站
pnpm peek anthology               # 檢查擷取
pnpm stills anthology --every=2   # 整支片縮圖表 out/stills/anthology-sheet.jpg
pnpm studio                       # 瀏覽器裡逐幀預覽
pnpm release anthology            # 出片並放進網站
```

網站版：1600×668（2.39:1），H.264 CRF 24、AAC 160k、faststart；檔名跟展品 id 一樣，[content.ts](../src/content.ts) 會自動接到那件展品上，黑邊由展間的 shader 補

## 精選宣傳片

| 片           | 長度 | 調性               | 展示的功能（使用者確認）                                                                                       | 運鏡與轉場                 |
| ------------ | ---- | ------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------- |
| anthology    | 60 s | 深色、星光、經緯線 | 首頁 SIGNAL 運鏡、Artisanal Zen 模式轉動縮放、切回後點台灣的情報小瓶並展開、其他四空間快剪                     | 全幅跟拍＋光圈開場         |
| gym-leaders  | 35 s | 熔金、運動感       | 首頁熔金與九大地區、卡洛斯地區頁、館主列表、可爾妮角色卡與超級路卡利歐、露璃娜與超極巨暴噬龜、徽章館、戰術光譜 | 卡點硬切＋閃白             |
| fovea        | 36 s | 紙張、編輯感       | 以 Anthropic 為主：書架三種陳列、拿起翻面翻開、公司頁、招股書目錄跳讀；深色模式與首頁列表                      | 中央窩對焦＋溶接           |
| ash          | 40 s | 星空、金色中軸     | 以皮卡丘為主：首頁換帽子、王牌、帽子時間軸、伽勒爾世代頁、夥伴遊行、圖鑑、TCG 卡牌                             | 金色中軸線＋閃白           |
| heroines     | 36 s | 粉彩、光柱         | 章節切換、莎莉娜與莉莉艾的卡牌、雷達、十維度、Expand context                                                   | 柔和溶接＋專屬色暈染       |
| yi-64        | 36 s | 墨、機器讀易       | 八卦與分頁、進入、星盤、27 頤卦六個分頁、測卦、觀文；首頁只帶過                                                | 墨染轉場                   |
| rivals       | 40 s | 魔王戰、金與火     | 首頁風暴與十五層塔、宿敵列表與雷達、長按挑戰：丹帝＞竹蘭＞艾嵐、Versus 竹蘭對丹帝                              | 魔王戰式：急推、震動、閃紅 |
| villain-orgs | 38 s | 機密檔案           | 章節切換、火箭隊、等離子團、以太與骷髏：首領卡牌、雷達、兩面切換、十維度                                       | 打字、塗黑條、故障、戳章   |

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
