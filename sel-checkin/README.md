# SEL 情緒簽到（自我覺察）

全校以班級為單位，學生用「4 色 + 5 手勢」簽到，老師在看板即時看到全班情緒並記錄處遇。

| 檔案 | 用途 |
|---|---|
| `index.html` | 學生簽到頁（每班一個 QR：`.../sel-checkin/?c=301` = 3 年 1 班） |
| `teacher.html` | 教師看板（密碼保護） |
| `Code.gs` | Google Apps Script 後端，資料存進你的 Google 試算表 |

## 部署（約 5 分鐘）
1. 新增一份 Google 試算表 → 擴充功能 → Apps Script → 貼上 `Code.gs`。
2. 專案設定 → 指令碼屬性 → 新增 `TEACHER_PASSCODE`（教師密碼）。
3. 部署 → 新增部署 → 網頁應用程式 → 執行身分「我」、存取「任何人」→ 複製網址。
4. 把網址貼到 `index.html` 與 `teacher.html` 的 `GAS_URL`，推上 GitHub Pages。
5. 教師看板 →「📋 班級名單」貼上名單（`座號 姓名` 一行一位）。

未設定 `GAS_URL` 時為展示模式，資料只存在該裝置，方便試玩。

## 需要依學校調整
- `GESTURES`（index.html）：五種手勢的圖示、名稱、等級（0–3）。目前是暫定值。
- `teacher.html` 的 `GESTURE_LEVEL` 要與之對應。
- 4 色的緩和策略文字在 `COLORS`。

## 隱私提醒
試算表含學生個資，只分享給授課教師；密碼為全校共用，建議定期更換。
