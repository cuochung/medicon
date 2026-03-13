---
name: wallet-v2-transaction-query
overview: 在會員儲值版本二頁面中新增交易記錄查詢區塊，依條件查詢 orderdata，並顯示扣除之後的最新儲值餘額。
todos:
  - id: db-inspect
    content: 確認 medicon 資料庫中 orderdata、walletdatav2、other_data 結構與欄位意義
    status: completed
  - id: backend-api-design
    content: 在 mediconapi 中設計或擴充查詢 API，回傳交易紀錄與錢包資訊
    status: completed
  - id: frontend-ui-walletv2
    content: 在 WalletV2 頁面新增交易記錄查詢區塊與表格 UI
    status: completed
  - id: frontend-api-integration
    content: 在 WalletV2 串接後端 API 並實作查詢流程與狀態管理
    status: completed
  - id: validation-testing
    content: 加入表單驗證、錯誤處理，並以實際資料驗證金額計算正確性
    status: completed
isProject: false
---

### 目標

- **交易記錄查詢 UI**：在 `WalletV2` 頁面中新增一個「交易記錄查詢」區塊，可依客戶名稱、開始日期、結束日期、訂單編號進行查詢。
- **後端查詢資料來源**：從資料表 `orderdata` 取得符合條件的交易紀錄，並且同時取得該客戶在 `walletdatav2` 及 `other_data` 中的相關資訊。
- **儲值餘額計算邏輯**：以 `other_data` 中第一筆資料的 `walletActivationDate` 作為基準日，將該基準日之後（含當天）所有符合查詢條件的交易金額，從 `walletdatav2` 的原始儲值金額中扣除，計算出「目前剩餘儲值金」。
- **結果表格化呈現**：將交易明細、基準日、原始儲值金額、累計扣款金額與計算後的剩餘儲值金一起表格化顯示。

---

### 實作步驟

- **一、確認資料庫結構與現有 API**
  - **1.1**：透過 MCP / 資料庫工具查看 `medicon` 資料庫中 `orderdata`、`walletdatav2`、`other_data` 的欄位結構（特別是客戶識別欄位、金額欄位、日期欄位）。
  - **1.2**：檢查後端專案 `mediconapi` 中現有的 `GeneralModel`、`General` 控制器，確認是否已有可重用的查詢方法或 Byjson/datalist API，可以用來查詢 `orderdata` 與 `walletdatav2`。
  - **1.3**：若有適用的 Byjson / 通用查詢 API，規劃查詢條件（客戶名稱、日期區間、訂單編號）的 key 對應；若沒有，規劃新增一支專用 API。
- **二、後端 API 規劃**
  - **2.1**：在 `mediconapi` 專案中（例如 `[app/Controllers/General.php](app/Controllers/General.php)` 與 `[app/Models/GeneralModel.php](app/Models/GeneralModel.php)`）設計一個新的方法或擴充既有 Byjson 查詢：
    - 接收參數：`customerName`（或對應的客戶代碼）、`startDate`、`endDate`, `orderNo`。
    - 查詢 `orderdata`：
      - 依客戶條件過濾（若實際上是用 `customerId` 或 `customerCode`，在查詢前先由名稱轉代碼）。
      - 過濾 `orderDate` 介於 `startDate` 與 `endDate` 之間（含邊界）。
      - 若有輸入 `orderNo` 則增加精確或模糊比對條件。
    - 查詢 `walletdatav2` / `other_data`：
      - 以同一客戶為單位，取得最新或指定一筆儲值紀錄（需依實際 schema 決定）。
      - 從 `other_data` 取出該客戶第一筆的 `walletActivationDate` 作為基準日。
  - **2.2**：在 Model 端實作一個方法，用來：
    - 根據客戶與 `walletActivationDate` 取得自基準日起的所有 `orderdata` 交易紀錄。
    - 將這些紀錄的金額欄位（例如 `usedAmount` 或 `totalPrice` 等，需依實際欄位決定）加總為「累計扣款金額」。
    - 將 `walletdatav2` 的原始儲值金額欄位（例如 `walletAmount`）減去累計扣款金額，計算得出「目前剩餘儲值金」。
  - **2.3**：規劃 API 回傳格式：
    - `orders`: 交易列表陣列（含訂單編號、日期、品項簡述、金額、備註等）。
    - `walletInfo`: 包含 `baseAmount`（原始儲值）、`baseDate`（`walletActivationDate`）、`usedAmount`（累計扣款）、`remainAmount`（目前剩餘儲值金）。
- **三、前端 WalletV2 畫面調整**
  - **3.1**：查看現有 `WalletV2` 畫面元件，例如：`[src/views/main/WalletV2/index.vue](src/views/main/WalletV2/index.vue)`、`[src/views/main/WalletV2/BalanceList.vue](src/views/main/WalletV2/BalanceList.vue)`、`[src/views/main/WalletV2/ImportExcelDialog.vue](src/views/main/WalletV2/ImportExcelDialog.vue)`，了解目前 UI 結構與 Pinia 狀態使用方式。
  - **3.2**：在 `WalletV2` 中新增「交易記錄查詢」區塊：
    - 查詢條件表單：
      - 客戶名稱：使用與「會員儲值」其它地方一致的客戶選擇元件（若已有共用元件或 autocomplete，則沿用）。
      - 開始日期、結束日期：使用專案一致的日期挑選元件，預設可以為空或預設區間。
      - 訂單編號：文字輸入欄位，可留空表示不以此條件過濾。
      - 查詢按鈕、清除條件按鈕。
    - 顯示區塊：
      - 上方顯示從 API 回傳的 `walletInfo`（基準日、原始儲值金額、累計扣款金額、目前剩餘儲值金）。
      - 下方表格顯示 `orders` 交易明細，欄位包含：訂單日期、訂單編號、交易金額、使用項目、備註等（依實際欄位調整）。
- **四、前端資料流與 API 串接**
  - **4.1**：使用專案既有的 `api.js` 封裝方式（依照 `[.cursor/skills/api-usage/SKILL.md]` 的規範），在適當位置建立 `getWalletV2Transaction` 之類的 API 呼叫方法，呼叫後端新建／擴充的 API。
  - **4.2**：在 `WalletV2` 元件中：
    - 定義查詢參數的 `ref/ reactive` 狀態。
    - 點擊查詢按鈕時，組合參數並呼叫 API，取得 `orders` 與 `walletInfo`，寫入本地狀態。
    - 根據狀態控制載入中 spinner、無資料時顯示提示等。
  - **4.3**：若需要權限控管（例如只有特定角色可使用交易記錄查詢），檢查 `useStore` 中的 `authKeys` 與既有頁面權限邏輯，決定是否新增或沿用對應的 `authKey`。
- **五、UI/UX 細節與驗證**
  - **5.1**：表單驗證：
    - 至少必填「客戶名稱」，日期區間允許空白或需同時輸入起訖，依你偏好設定。
    - 當 `startDate` > `endDate` 時，前端給予提示，不送出請求。
  - **5.2**：載入及錯誤處理：
    - 查詢期間顯示 loading 狀態，避免重複送出。
    - 若 API 回傳錯誤或查無資料，使用專案標準的提示（如 SweetAlert 或 toast，多參考 `[.cursor/skills/alert-usage/SKILL.md]`）。
  - **5.3**：表格排序與分頁：
    - 至少支援依訂單日期排序；若現有表格元件支援分頁或滾動載入則沿用，避免一次載入太多資料。
- **六、測試與驗證情境**
  - **6.1**：建立或選擇一個有儲值紀錄且有交易紀錄的客戶：
    - 確認 `other_data` 中存在 `walletActivationDate`，`walletdatav2` 中有對應儲值金額。
  - **6.2**：測試不同查詢條件：
    - 只輸入客戶名稱、不給日期與訂單編號。
    - 限縮日期區間，確認只顯示該區間的交易，且累計扣款金額正確。
    - 輸入特定訂單編號，確認只顯示該筆或相關訂單。
  - **6.3**：驗證金額計算：
    - 手動從資料庫抓出基準日後的交易金額，加總後與畫面顯示的累計扣款與剩餘儲值金比對。
    - 測試無交易時，剩餘儲值金應等於原始儲值金額。

---

### 可能需要你進一步決定的細節

- **金額欄位來源與表單顯示方式**：\n  - 交易金額相關欄位與表格欄位配置，統一**參照** `src/views/main/Wallet/TransactionHistory.vue` 目前使用的欄位與顯示方式（例如實際扣款金額欄位、表頭名稱、排版）。\n  - 新增在 `WalletV2` 的「交易記錄查詢」區塊，表單與表格整體 UX 風格也會盡量與 `TransactionHistory.vue` 保持一致，減少使用者學習成本。\n- **多筆儲值紀錄處理**：\n  - 若 `walletdatav2` 中同一客戶存在多筆儲值金資料，前端畫面會**全部列出**這些儲值紀錄（例如以列表或表格方式呈現）。\n  - 每筆儲值紀錄會顯示其對應的原始金額、相關日期（含 `walletActivationDate` 基準日）與目前剩餘金額，方便業務或管理者檢視不同批次儲值的使用情形。\n\n上述部分將依照你提供的既有畫面與實務規則落實在實作中。