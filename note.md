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
