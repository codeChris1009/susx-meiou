# susx.meiou

susx 的作品集：每一個 GitHub repo 裡有線上前端的專案，集中在一頁，點了就能打開。

**https://susx-meiou.susx.workers.dev**

meiou = Latin _mei_ + Greek _μου_，兩個都是「我的」。

## 運作方式

```
GitHub API ──pnpm sync──▶ src/data/projects.json ─┐
各站首頁  ──pnpm shots─▶ src/assets/shots/*.jpg ──┼─▶ vite build ─▶ Cloudflare Workers（純靜態資源）
手寫的取捨 ────────────▶ src/features/projects/curation.ts ┘
```

- **`pnpm sync`**（[scripts/sync.ts](scripts/sync.ts)）：列出自己擁有的 repo，跳過 fork、封存與 `SYNC_EXCLUDE` 列出的 repo，
  用 homepage → 成功的 deployment → GitHub Pages 的順序找出網站網址，再抓網站自己的 `<title>` 與 meta description。
  清單沒變就不寫檔；一次少掉一半以上的專案會直接失敗，因為那通常是 token 權限出了問題
- **`pnpm shots`**（[scripts/shots.ts](scripts/shots.ts)）：用本機的 Google Chrome 幫還沒有截圖的網站截圖，
  `--all` 全部重截，`pnpm shots <repo>` 只重截指定的
- **[curation.ts](src/features/projects/curation.ts)**：練習區（`practice`）、
  主區排序（`order`）與顯示名稱（`overrides`）。sync 找到的新專案會自動出現在主區最後面
- 私有 repo 只放網站連結，不放原始碼連結；離線的網站不顯示

## 指令

| 指令                                  | 做什麼                                       |
| ------------------------------------- | -------------------------------------------- |
| `pnpm dev`                            | 本機開發                                     |
| `pnpm check`                          | 格式、lint、型別、測試、build，CI 跑的就是它 |
| `GH_TOKEN=$(gh auth token) pnpm sync` | 用自己的 gh 登入重新掃描 GitHub              |
| `pnpm shots`                          | 截新網站的圖                                 |

## 自動化

- **CI/CD**（[ci.yml](.github/workflows/ci.yml)）：PR 與 push 都跑 `pnpm check`；main 上通過後，把通過檢查的那份
  `dist/` 原封不動部署到 Cloudflare（不重新 build），再對線上站做 smoke test（連同延遲載入的展間 chunk 與畫作），失敗就 rollback
- **Sync**（[sync.yml](.github/workflows/sync.yml)）：每週一 09:17（台北）重掃 GitHub 並截新圖，有變動才 commit，
  再觸發 CI/CD 部署。Actions 頁面的 Run workflow 可以隨時手動跑

## Setup

Repository secrets（Settings → Secrets and variables → Actions），三個都是免費、不用綁卡：

| Secret                  | 怎麼拿                                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare → My Profile → API Tokens → Create Token → 範本「Edit Cloudflare Workers」                                                                                 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages 右側欄的 Account ID                                                                                                                      |
| `SYNC_TOKEN`            | GitHub → Settings → Developer settings → Fine-grained tokens：Repository access 選 All repositories，權限只給 Metadata、Contents、Deployments、Pages 的 **Read-only** |

Repository variable（同一頁的 Variables 分頁）：

| Variable       | 值                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------- |
| `SYNC_EXCLUDE` | 不要上站的 repo 名稱，逗號分隔。本機放在 `.env.local`（已 gitignore），不寫進公開的原始碼 |

`SYNC_TOKEN` 不能用內建的 `GITHUB_TOKEN` 代替：它只看得到這個 repo，私有 repo 的作品會從站上消失。

## 設計

**色票**（[palette.ts](src/theme/palette.ts)）：兩種材質。中性色是 50–950 共 11 階的暖色階，全部落在金屬的色相
（oklch 86°），從象牙紙到墨，沒有純白也沒有純黑；淺色模式是紙上的墨，深色模式反過來。金屬是三段漸層加最亮面：
深色模式是香檳到暖灰，淺色模式是同一塊金屬的暗面。CSS 變數在 [index.css](src/index.css)，同一組 hex 由 palette.ts
給 three.js 用，[palette.test.ts](scripts/palette.test.ts) 確保兩邊（含 404 頁）一致。

shadcn `radix-nova`、`--radius: 0.35rem`；字體是 Geist、Noto Sans TC（自架、unicode-range 切片，只下載頁面用到的字）、
Geist Mono，以及只用在進場字標與展間名牌的花體字 Stalemate（自架、只有 Latin）。

**進場動畫**（[src/features/intro](src/features/intro)）：標記寫死在 `index.html`，bundle 還沒執行就先畫出來。品牌標記與
花體字標由下往上注入金屬，邊緣噴出火花（canvas + 固定大小的粒子池），100% 時爆一次再淡出。進度是誠實的：時間只推到 92%，
最後 8% 等首次 render 與字體；同一個 session 重新整理時改成短版；bundle 載入失敗時 8 秒後 CSS 自動收起。

**精選展間**（[src/features/gallery](src/features/gallery)）：three.js 環形畫廊，九件作品圍著鏡頭、石材地面反射。
three.js 獨立成 chunk，展間接近畫面才下載；只在看得到時算圖。要換展品：把 1200×800 的 WebP 放進
`src/assets/gallery/`，再改 [pieces.ts](src/features/gallery/pieces.ts) 的 `HANG`（`repo` 對應作品清單，連結跟著每週同步走；
`repo: null` 是不公開的作品，只展示不連結）。沒有 WebGL 時改用同一組按鈕切換的平面畫框。

動態：卡片 hover 會上浮、截圖慢速放大並掃過一道光，按下會回沉；捲動時區塊依序浮現、標題細線由左畫出、header 收合，
主視覺隨捲動淡出並有視差。系統設定「減少動態效果」時全部關閉。
