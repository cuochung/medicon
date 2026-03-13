# 2026-03-13 工作記錄

## 主要工作內容

### 會員儲值版本二：會員儲金一覽表（WalletV2/BalanceList）
1. **基準日設定（walletActivationDate）**
   - `BalanceList.vue` 透過 `api.get('other_data')` 讀取第一筆資料，優先取資料表欄位 `walletActivationDate`，若沒有則從 `datalist.walletActivationDate` 解析後顯示為目前基準日。
   - 使用者可在畫面上以 `type="date"` 的輸入欄選擇新日期，按「儲存」後會：
     - 再次呼叫 `api.get('other_data')` 取得第一筆資料。
     - 以 `api.post('other_data', { snkey, walletActivationDate })` 方式更新該筆，沿用專案共用 `other_data` 來存放儲值相關全域設定。
   - 儲存成功與失敗訊息皆依照 SweetAlert 規範顯示（成功：`icon: 'success'`，失敗：`icon: 'error'`，無資料時提醒無法儲存）。

2. **會員儲金一覽表**
   - 以 `api.get('walletdatav2')` 取得所有儲值資料，對每筆做 `JSON.parse(datalist)` 後組成 `{ snkey, customerName, balance }` 寫入 `list`。
   - 上方工具列提供「搜尋客戶關鍵字」欄位，可輸入多個關鍵字（以空白分隔），會對整筆物件做 `JSON.stringify` 後轉大寫比對，所有關鍵字都符合才會留下。
   - 表格使用 `PaginatedIterator` 分頁，欄位僅保留：
     - 客戶名稱：`rowData(item).customerName`。
     - 儲金剩餘金額：以 `formatBalance` 將 `balance` 轉為千分位整數字串，無法解析為數字時顯示 `—`。
   - 當 `list` 為空或搜尋無結果時，分別顯示「尚無資料，請使用匯入」與「查無符合關鍵字」的提示。

3. **Excel 匯入與其他行為**
   - 右側嵌入 `ImportExcelDialog`，完成匯入後觸發 `@imported="loadWalletData"` 重新讀取 `walletdatav2`，確保列表與基準日試算資料一致。
   - 標題區與整體樣式延續 Wallet 系列的卡片設計（漸層背景、圓角卡片、陰影），與 WalletV2 首頁整體視覺保持一致。

### 會員儲值版本二：交易記錄查詢與餘額試算（WalletV2）
1. **後端 API（walletV2TransactionQuery）**
   - 在 `mediconapi` 的 `General` 控制器新增 `walletV2TransactionQuery($databaseName)`。
   - 依參數 `customerName`、`startDate`、`endDate`、`orderNo` 從 `orderdata` 撈資料，僅保留 `datalist.customerFullName === customerName`，並套用日期區間與訂單編號模糊查詢。
   - 從 `other_data` 第一筆資料的 `walletActivationDate` 取得基準日，從 `walletdatav2` 依 `datalist.customerName` 找出該客戶的目前儲值餘額 `balance`。
   - 對符合條件的訂單，以 `amount + taxAmount` 算出含稅金額；若 `orderDate >= walletActivationDate` 則累加為「本次查詢扣款金額（usedAmount）」。
   - 回傳結構：
     - `walletInfo`: `{ baseDate, baseAmount, usedAmount, remainAmount }`，其中 `remainAmount = baseAmount - usedAmount`。
     - `orders`: 每筆包含 `snkey`、`documentNumber`、`orderDate`、`customerNumber`、`customerFullName`、`productName`、`amount`、`taxAmount`、`amountWithTax`、`createInfo` 等欄位。

2. **前端查詢頁（WalletV2/TransactionHistory.vue）**
   - 在 `router/index.js` 新增路由 `WalletV2/TransactionHistory`，並在 `WalletV2/index.vue` 增加「交易記錄查詢」功能卡片。
   - 查詢條件：
     - 客戶名稱：從 `walletdatav2` 讀取 `datalist.customerName` 組成下拉選單。
     - 開始／結束日期：使用日期選擇器，送出前檢查「開始日期不可晚於結束日期」。
     - 訂單編號：文字欄位，後端以 `documentNumber` 模糊搜尋。
   - 點擊「查詢記錄」：
     - 使用 `api.options('general/walletV2TransactionQuery/{databaseName}', payload)` 呼叫新 API。
     - 顯示頂部四張卡片：基準日、目前儲值餘額、基準日後扣款總額、本次查詢後預估餘額。
     - 下方表格列出每筆訂單：訂購日期、訂單編號、客戶名稱、產品名稱、金額(含稅)；修正 `PaginatedIterator` 的資料結構，改以 `rowData(item)` 取得實際欄位，避免出現全為 0 或空白的情況。

3. **匯出交易記錄報表（PrintOrderHistory.vue）**
   - 新增 `WalletV2` 專用匯出元件 `PrintOrderHistory.vue`，從 `orders`、`walletInfo` 與查詢條件組出一份 HTML 報表。
   - 報表內容：
     - 標題「會員儲值 V2 交易記錄」，副標顯示查詢日期區間與客戶名稱。
     - 基準日、目前儲值餘額、本次查詢扣款金額、預估剩餘餘額等資訊。
     - 明細表：序號、訂購日期、訂單編號、客戶名稱、產品名稱、金額(含稅)；**已移除「操作人員」欄位與內容**。
   - `TransactionHistory.vue` 中在表格標題列右側加入「輸出交易記錄」按鈕，按下時呼叫 `printOrderHistoryRef.exportTransactions()`：
     - 只會在新分頁開啟報表 HTML，不再自動觸發 `window.print()`，由使用者自行決定是否列印。

## 修改的檔案清單
- `Sites/mediconapi/app/Controllers/General.php`（新增 `walletV2TransactionQuery` API）
- `src/router/index.js`（新增 `WalletV2/TransactionHistory` 路由）
- `src/views/main/WalletV2/index.vue`（新增「交易記錄查詢」功能卡片）
- `src/views/main/WalletV2/BalanceList.vue`（基準日讀寫、儲金一覽與搜尋／分頁、匯入後重載資料）
- `src/views/main/WalletV2/TransactionHistory.vue`（新增交易查詢頁、修正表格資料綁定、串接新 API、加入輸出按鈕）
- `src/views/main/WalletV2/PrintOrderHistory.vue`（新增：會員儲值 V2 交易記錄匯出報表）

---

# 2026-03-10 工作記錄

## 主要工作內容

### 業務專用交易記錄查詢（SalesTransactionHistory.vue）
1. **表格欄位**
   - 在「交易日期」右側新增一欄「訂購日期」。
   - 表頭：`<th>訂購日期</th>`；表格內容：`transaction.raw.orderDate` 以 `formatDateDisplay` 顯示，無值顯示 `-`。

2. **查詢條件（開始日期／結束日期）**
   - 按下「查詢記錄」時，日期區間改為依 **訂購日期（orderDate）** 篩選。
   - 開始日期：僅保留 `orderDate` 有效且 `>= 開始日期` 的資料。
   - 結束日期：僅保留 `orderDate` 有效且 `<= 結束日期` 的資料。

### 一般交易記錄查詢（TransactionHistory.vue）
- **查詢條件（開始日期／結束日期）**
  - 按下「查詢記錄」時，日期區間改為依 **訂購日期（orderDate）** 篩選，邏輯同上（orderDate 有效且在區間內）。

## 修改的檔案清單
- `src/views/main/Wallet/SalesTransactionHistory.vue`（新增訂購日期欄、日期篩選改為 orderDate）
- `src/views/main/Wallet/TransactionHistory.vue`（日期篩選改為 orderDate）

---

# 2026-03-09 工作記錄

## 主要工作內容

### 成分表功能（配方管理 → 輸出成分表）
依計畫在配方管理中新增「成分表」功能，於新頁面顯示配方的 INCI 成分與計算後 wt%。

1. **功能入口**
   - 在 `Recipe/index.vue` 列表每列的齒輪選單中，於「修改」「刪除」旁新增「成分表」。
   - 點擊時呼叫 `openCompositionSheet(item.raw)`，以 `router.push({ name: 'RecipeComposition', params: { snkey: item.snkey } })` 導向新頁。

2. **路由與頁面**
   - **路由**：在 `router/index.js` 的 `/main` 子路由新增 `RecipeComposition/:snkey`，`name: 'RecipeComposition'`，`component: CompositionSheet.vue`，`props: true`。
   - **新組件**：`src/views/main/Recipe/CompositionSheet.vue`。

3. **資料與計算邏輯**
   - **取得配方**：`api.get('recipe')` 後依 route 的 `snkey` 篩出單筆，解析 `datalist` 取得 `items`（配方明細，含 `materialNumber`、`percentage`）。
   - **取得原料成分**：`api.get('raw_material')`，每筆 `JSON.parse(datalist)` 後以 `materialNumber` 建 Map，保留 `compositions[]`（每筆含 `composition`、`breakdownInciName`、`wtPercent`、`casNo`、`ingredientFunction`）。
   - **計算公式**：對每個配方明細項，以料號找到原料，對該原料每個成分計算  
     **P_final = 配方明細百分比 × 原料成分 wt% / 100**；  
     以 `(casNo|inciName)` 為 key 彙總同一成分的 P_final，`inciName = breakdownInciName || composition`。
   - **wt% 解析**：沿用匯入邏輯（去 `%`、0～1 視為 Excel 百分比乘 100）。

4. **成分表表格**
   - 欄位：**No**、**Composition**、**Breakdown INCI Name**、**CAS No**、**Function**、**wt%**、**來源原料**。
   - Composition、Breakdown INCI Name 依匯入資料各別顯示；無資料時顯示空白（不顯示 `-`）。
   - wt% 以純文字顯示（不使用 chip）。
   - 來源原料：列出每個貢獻來源的「料號（原料名）：配方% × 原料 wt%」。

5. **版面**
   - **上方區塊（上下排列）**  
     - **配方資訊卡**：三欄排版，欄距加大。左欄 配方編號、產品名稱；中欄 版本、產品規格；右欄 生產批量、總生產量、原料數量。  
     - **成分統計卡**：成分數量、總 wt%。
   - 已移除搜尋欄與「總和 xx%」chip。

6. **錯誤與提示**
   - 找不到指定配方時顯示錯誤訊息。
   - 缺料號或原料未建立成分組成時，於警告區列出，不納入計算。

## 修改的檔案清單
- `src/views/main/Recipe/index.vue`（齒輪選單新增「成分表」、`openCompositionSheet`、`useRouter`）
- `src/router/index.js`（新增 `RecipeComposition/:snkey` 路由）
- `src/views/main/Recipe/CompositionSheet.vue`（新增）

---

# 2026-02-24 工作記錄

## 主要工作內容

### 匯入成分組成（importCostComposition.vue）
1. **Breakdown INCI Name 與 Composition 各別獨立匯入**
   - 不再合併兩欄：Excel「Breakdown INCI Name」→ `breakdownInciName`，「Composition」→ `composition`，各自寫入每筆成分。
   - 每筆成分結構：`itemNumber`、`breakdownInciName`、`composition`、`wtPercent`、`casNo`、`ingredientFunction`、`color`。

2. **預覽表格**
   - 在「Composition 預覽」右側新增「Breakdown INCI Name 預覽」欄；展開詳細表為兩欄：「Breakdown INCI Name」、「Composition」。
   - Composition 預覽與 Breakdown INCI Name 預覽分別顯示對應欄位內容。

3. **匯入邏輯調整**
   - **原料料號正規化**：若為純數字 5 碼（如 30004），自動補前綴 `SC` 以對應資料庫（如 SC30004）。
   - **項次為空**：若該列有原料料號且有成分內容（Breakdown INCI Name 或 Composition），自動給項次 `1`，不略過該列。
   - **一律視為文字**：以 `toText(val)` 將所有儲存格讀成字串並 trim；空行判斷一併以文字處理。
   - **Composition 百分比**：若 Excel 將 100% 存成數字 1，轉成文字 `"100%"` 再儲存與顯示（0～1 的數字轉成百分比字串）。

### 原料新增/編輯（Add.vue）— 成分組成
1. **欄位分離與順序**
   - 表單改為兩欄：「Composition」（左，寬 220px）、「Breakdown INCI Name」（右，寬 90px）。
   - 欄位順序：項次 → Composition → Breakdown INCI Name → CAS NO. → Function → **wt%**（已移到 Function 右邊）→ 字體顏色 → 操作。

2. **版面與寬度**
   - 成分組成表格：`th`、`td` 設 `white-space: nowrap`，內容不換行；外層可橫向捲動。
   - 原料彈窗：`v-dialog` 改為 `max-width="96vw"`，略小於螢幕寬度。

3. **資料結構**
   - 新增一筆成分時預設物件加入 `breakdownInciName: ''`。
   - 載入編輯時，舊資料若無 `breakdownInciName` 會補上空字串，避免 undefined。

### 原料列表（index.vue）
- 成分組成列表與 tooltip 顯示改為：`comp.breakdownInciName || comp.composition`，相容舊資料與新匯入兩欄。

## 修改的檔案清單
- `src/views/main/RawMaterial/importCostComposition.vue`
- `src/views/main/RawMaterial/Add.vue`
- `src/views/main/RawMaterial/index.vue`

---

# 2026-02-12 工作記錄

## 主要工作內容

### 匯入成分組成功能調整（importCostComposition.vue）
1. **成分欄位改為優先抓取 Breakdown INCI Name**
   - 讀取邏輯：優先使用 Excel 欄位「Breakdown INCI Name」，若為空再使用「Composition」。
   - 必要欄位改為：至少要有「Breakdown INCI Name」或「Composition」其一，加上項次、原料料號、wt%。

2. **CAS NO. 抓取**
   - 支援辨識表頭「CAS NO」、「CAS NO.」、「CAS#」，並將每列該欄位寫入每筆成分的 `casNo`。

3. **Function 欄位抓取**
   - 支援辨識表頭「Function」或「功能」，並將每列該欄位寫入每筆成分的 `ingredientFunction`（因 `function` 為 JS 保留字故用此名稱）。

4. **預覽表格**
   - 詳細表格新增「CAS NO.」、「Function」欄位；表頭「Composition」改為「成分 (Breakdown INCI Name)」。

5. **每筆成分資料結構**
   - 匯入後每筆成分包含：`itemNumber`、`composition`、`wtPercent`、`casNo`、`ingredientFunction`、`color`（顏色由表單後續選擇）。

### 原料新增/編輯（Add.vue）— 成分組成
1. **新增欄位**
   - 表格新增「CAS NO.」、「Function」、「字體顏色」欄。
   - 項次、成分、wt%、CAS NO.、Function、字體顏色、操作。

2. **字體顏色選擇**
   - 每筆成分可點擊色筆圖示，以 v-color-picker 選擇字體顏色（色票 + hex 輸入），可清除顏色。
   - 儲存於每筆成分的 `color`（hex，如 #2196F3）。

3. **表格 overflow 與欄寬**
   - 成分組成表格外層加上 `.compositions-table-wrap`：`max-height: 320px`、`overflow: auto`，表頭設為 sticky 捲動時固定。
   - CAS NO. 欄寬 170px、Function 欄寬 180px。

4. **新增一筆成分時**
   - 預設帶入 `casNo`、`ingredientFunction`、`color`（空字串）。

### 原料列表（index.vue）
- 成分組成 tooltip 中顯示每筆成分的 CAS（若有）、Function（若有），若有設定 `color` 則以該顏色顯示成分文字。

## 修改的檔案清單
- `src/views/main/RawMaterial/importCostComposition.vue`
- `src/views/main/RawMaterial/Add.vue`
- `src/views/main/RawMaterial/index.vue`

---

# 2026-02-11 工作記錄

## 主要工作內容

### 客戶匯入：已存在且內容不同時改為更新
- **importCustomer.vue**
  - 當客戶編號已存在於資料庫但**內容不同**時，改為使用 **editMulti** 更新該筆資料（不再只跳過）。
  - 流程調整：
    - 改為呼叫 `api.get('customer')` 取得完整客戶列表（含 `snkey`、`datalist`），以客戶編號建立 Map。
    - 每筆 Excel 列分類為：**新增**（編號不存在）、**更新**（編號存在且內容不同）、**跳過**（編號存在且內容相同）。
  - 內容比對：除 `customerNumber` 外，依 `fieldMapping` 所有欄位（客戶全稱、業務人員、聯絡人、電話、地址等）比對；空值正規化後比較。
  - 同一 Excel 內重複客戶編號時，僅保留最後一筆作為更新來源。
  - 更新 payload：合併既有資料與 Excel 欄位、保留 `createInfo`、在 `editInfo` 前插入一筆修改紀錄，呼叫 `general/editMulti/${databaseName}/customer`。
  - 確認與成功訊息改為顯示「新增 X 筆、更新 Y 筆、跳過 Z 筆（內容相同）」。

## 修改的檔案清單
- `src/views/main/Customer/importCustomer.vue`

---

# 2026-01-28 工作記錄

## 主要工作內容

### 1. 新增 Rust 伺服器整合功能
- **api.js**: 新增 `rustAddMulti` 方法
  - 用於發送資料到 Rust 伺服器的 `/ingest` 端點
  - 支援批量新增資料功能
  - 包含完整的錯誤處理機制

- **useStore.js**: 新增 Rust 伺服器設定
  - 新增 `rustBaseURL` 設定（預設為 `${setBaseUrl}:3000`）
  - 新增 `rustApiToken` 設定（內部認證金鑰）
  - 統一使用 `setBaseUrl` 變數管理不同環境的 URL

### 2. 統一資料表命名規範
將所有 `rawMaterial` 改為 `raw_material`（使用底線命名），修改的檔案包括：
- `importRawMaterial.vue`
- `importCostComposition.vue`
- `importUnitPrice.vue`
- `index.vue` (RawMaterial)
- `Add.vue` (Recipe)

### 3. 整合 Rust 伺服器到原料匯入功能
- **importRawMaterial.vue**: 
  - 改用 Rust 伺服器的 `rustAddMulti` API 進行批量新增
  - 調整回應處理邏輯，適配 Rust 伺服器的回應格式（`{ok, rowsInserted}`）
  - 優化錯誤處理和成功訊息顯示
  - 保留原本 CI 伺服器的程式碼作為備註（可切換使用）

## 修改的檔案清單
1. `src/assets/js/api.js` - 新增 Rust 伺服器 API 方法
2. `src/stores/useStore.js` - 新增 Rust 伺服器設定
3. `src/views/main/RawMaterial/importRawMaterial.vue` - 整合 Rust 伺服器
4. `src/views/main/RawMaterial/importCostComposition.vue` - 修正資料表名稱
5. `src/views/main/RawMaterial/importUnitPrice.vue` - 修正資料表名稱
6. `src/views/main/RawMaterial/index.vue` - 修正資料表名稱
7. `src/views/main/Recipe/Add.vue` - 修正資料表名稱
