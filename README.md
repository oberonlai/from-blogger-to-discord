# 從停權到 Discord — 0829 桃園小聚

9 個章節、56 張投影片。**一個章節一個 HTML**，改哪一段就開哪個檔，不會動到別的章節。

風格：淺色極簡，Blogger 橘 `#F57C00` × WordPress 藍 `#21759B`。
每個章節的第一張是**滿版色塊的章節首頁**（由下往上刷過來的動畫），刻意跟內容頁長得不一樣。

## 檔案結構

```
taoyuan/
├── index.html            目錄頁（點章節跳過去，或按 → 從封面開始）
├── 01-cover.html         UNIT 01  開場與講者          4 張
├── 02-suspend.html       UNIT 02  停權那天            6 張   ← 章節首頁：橘
├── 03-migrate.html       UNIT 03  決定搬家            5 張   ← 章節首頁：藍
├── 04-design.html        UNIT 04  復刻設計            9 張   ← 章節首頁：墨黑
├── 05-theme.html         UNIT 05  蓋一個新家          7 張   ← 章節首頁：深橘
├── 06-import.html        UNIT 06  一萬篇搬進來        5 張   ← 章節首頁：深藍
├── 07-deploy.html        UNIT 07  推上線              7 張   ← 章節首頁：橘
├── 08-discord.html       UNIT 08  在 Discord 改網站   6 張   ← 章節首頁：墨黑
├── 09-recap.html         UNIT 09  收尾                7 張   ← 章節首頁：藍
├── assets/
│   ├── deck.css          全部樣式（顏色、字級、元件）
│   └── deck.js           翻頁、動畫、終端機模擬、QR 產生器
├── images/               你要放進來的截圖（見下表）
├── avatar.jpg            UNIT 01 講者大頭照
├── build.mjs             合併成單一檔案供線上分享
└── dist/taoyuan.html     合併後的成品（執行 build.mjs 產生）
```

## 內容大綱

| # | 章節 | 這一段講什麼 |
|---|---|---|
| 01 | 開場與講者 | 封面 → 講者介紹（`avatar.jpg`）→ 13 年 / 10,044 篇 / 0 篇能編輯 → 今天的三段路 |
| 02 | 停權那天 | 那封信（Gmail UI）→ 後台進得去但文章打不開 → 前台禁止畫面 → 申訴罐頭訊息 → 只能等 |
| 03 | 決定搬家 | 不等了直接搬 → 還好有備份（每週 XML＋每天 iPad 原稿）→ 還原 1 萬篇＋手動補這週 |
| 04 | 復刻設計 | 前台看不到怎麼照做 → Web Archive 撈快照 → 四種版型 → Claude Design 三個好處＋三個功能 |
| 05 | 蓋一個新家 | everything-wp → 為什麼用區塊佈景主題 → ValetPress → `vp empty` → `/everything-wp:init-theme` → 設計稿 Share 丟給 Claude Code |
| 06 | 一萬篇搬進來 | 8 個 XML 1:1 匯入 → 坑 01 `?m=1` 要做 301 → 坑 02 HTML 區塊要補註解 → 本機驗收 |
| 07 | 推上線 | InstaWP（$2 / $5）→ 有 CLI → 後台可開 MCP（伏筆）→ push → Actions → 自動部署 → agent-browser 驗收 → Bunny CDN |
| 08 | 在 Discord 改網站 | 業主嫌後台複雜 → 那就不要進後台 → Discord 對話示範 → kiro-discord-bot → 每個頻道各自的 MCP 權限 |
| 09 | 收尾 | 五步總結 → 隔天收到恢復信（Gmail UI）→ 平台不會把主控權還你 → 三個連結 QR → 一對一教學（LINE @codotx） |

兩封 Blogger 的信都是**用 HTML 重畫的 Gmail 介面**（字級放大過），不是截圖，所以投影出來很清楚。
想改回真的截圖，把 `.gmail` 那一段換成 `.shot` 就好（用法見下）。

## 你要放進來的截圖

放到 `images/` 底下，檔名要一模一樣。**沒放也不會壞**，會顯示標了檔名的虛線佔位框。

| 檔案 | 用在 | 內容 |
|---|---|---|
| `images/wayback-snapshot.jpg` | UNIT 04 | Web Archive 上撈到的舊站快照畫面 |
| `images/claude-design-system.jpg` | UNIT 04 | Claude Design 從截圖擷取出的色票 / 字型 / 元件 |
| `images/claude-design-variants.jpg` | UNIT 04 | 首頁或主選單的五個版本並排 |

**可以再加的（現在沒放，想放再說一聲我幫你插進去）：**

| 建議檔案 | 可以放在 | 內容 |
|---|---|---|
| `images/blogger-blocked.jpg` | UNIT 02 | 前台真正的停權禁止畫面 |
| `images/instawp-mcp.jpg` | UNIT 07 | InstaWP 後台啟用 MCP 的那一頁 |
| `images/discord-real.jpg` | UNIT 08 | 業主在 Discord 實際下指令的畫面 |
| `images/before-after.jpg` | UNIT 09 | 舊站 / 新站對照 |

截圖佔位框的寫法：

```html
<div class="shot r">
  <img src="images/檔名.jpg" alt="說明">
  <div class="ph"><div class="box"></div>
    <div class="fn">images/檔名.jpg</div>
    <div class="hint">這裡放什麼的提示</div></div>
</div>
```

## 操作

| 鍵 | 作用 |
|---|---|
| `→` / `空白鍵` | 下一步（含分段浮現；到章節最後一張會跳下一章）|
| `←` | 上一步（在章節第一張會跳回上一章的最後一張）|
| `F` | 全螢幕 |
| `R` | 重播這一頁的終端機動畫 |
| `M` | 回目錄 |

左下角的「F 全螢幕」「M 目錄」跟右下角的 `‹` `›`，用滑鼠直接點也可以。

## 怎麼改內容

每張投影片就是一個 `<section class="slide">`：

- `data-sec="…"` — 左上角顯示的小標
- `data-steps="3"` — 這張要按 3 次 → 才會全部出現
- `class="r"` — 進場淡入；`style="--d:.2s"` 控制先後順序
- `class="step" data-step="1"` — 第 1 次按 → 才出現

**章節首頁**：`<section class="slide sec o">`，色塊由 `o`（橘）/ `b`（藍）/ `k`（墨黑）/ `od`（深橘）/ `bd`（深藍）決定。
章節首頁會自動把邊框收起來、頁碼與提示字轉成淺色。

**終端機動畫**：`<div class="term"><template class="lines">`，一行一列：

```
cmt| ● 說明文字
p|   $ 指令
tool| 動作 <b>檔名</b>
ok|  ✔ 完成訊息
link| https://…
sp|  （空行）
```

**常用元件**：`.stats`（三個大數字）、`.steps`（直式條列）、`.pipe` / `.pipe.sm`（流程圖）、
`.card` / `.tri`（卡片）、`.wire`（版型縮圖）、`.code` / `.code.dark`（程式碼）、
`.quote`（引言塊）、`.gmail`（Gmail 信件）、`.dc`（Discord 視窗）、`.win`（瀏覽器視窗）、`.shot`（截圖框）。
加 `.b` 通常就是換成 WordPress 藍。

**改配色與字級**：只改 `assets/deck.css` 最上面的 `:root`。

## 產生線上分享版

```bash
node build.mjs
```

會把 9 個章節合併成 `dist/taoyuan.html`（單一檔案，CSS/JS 內嵌）。
注意：合併版不會帶 `images/` 裡的截圖，那些只在本機顯示。

## 結尾的三個 QR code

`09-recap.html` 最後幾張的 `data-qr` 直接填連結就會自動產生 QR，不需要另外做圖檔：

```html
<div class="qr" data-qr="https://github.com/nczz/kiro-discord-bot"></div>
```

目前放的是 everything-wp、ValetPress 設定文、kiro-discord-bot 三個連結，
最後一頁另有 LINE 官方帳號 `@codotx` 的加好友 QR（`https://line.me/R/ti/p/@codotx`）。

---

## 另一版：用 dashi-ppt Skill 重做的版本

同樣的內容，另外用 [dashi-ppt](https://github.com/chuspeeism/dashi-ppt-skill) 這套 Skill 重新編排了一份，
主題 `theme03`（深淺代碼風），22 頁，跟上面這份手刻的深/淺色簡報是兩個獨立版本，互不影響。

```
taoyuan/output/from-blogger-to-discord/
├── goal.json        內容計畫（改文案改這個檔，再重跑渲染）
└── ppt/
    ├── index.html   成品（自帶編輯控制台）
    └── assets/      主題資源與 assets/user-media/ 裡的三張圖
```

**預覽與編輯**（要用它自己的預覽服務，靜態伺服器沒有存檔與匯出介面）：

```bash
SK=~/.claude/skills/dashi-ppt
DASHI_PPT_PREVIEW_PORT=5290 bash $SK/scripts/render_goal_deck.sh \
  output/from-blogger-to-discord/goal.json \
  output/from-blogger-to-discord/ppt/index.html
# → http://127.0.0.1:5290/
```

開起來右邊有控制台可以改版式參數，點文字可以直接改字，左上「導出」可以出 PDF / 可編輯 PPTX。
在預覽服務下的編輯會自動存回 `ppt/index.html`。

用到的三張圖已經複製進 `ppt/assets/user-media/`：講者大頭照、Web Archive 快照、Claude Design 設計系統截圖。
