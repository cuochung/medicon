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
