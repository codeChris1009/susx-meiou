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

- **CI/CD**（[ci.yml](.github/workflows/ci.yml)）：PR 與 push 都跑 `pnpm check`；main 上通過後部署到 Cloudflare、
  對線上站做 smoke test，失敗就 rollback
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

shadcn `radix-nova`、`neutral` 單色 oklch、`--radius: 0.35rem`、Geist / Geist Mono，
中文走各平台的系統字（PingFang TC → Noto Sans TC → 微軟正黑體），不載任何 CJK webfont。
唯一的彩色是「上線中」的綠點，顏色留給作品截圖。
