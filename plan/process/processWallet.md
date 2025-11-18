# 會員儲值系統邏輯架構文件

## 一、系統概述

### 1.1 核心功能
- 會員儲值功能：允許會員預先儲值到系統中（手動操作）
- 訂單手動扣款：透過篩選條件選擇訂單後，手動決定是否扣除儲值餘額
- 訂單查詢功能：可查詢所有訂單（包括啟動日期之前和之後的），標示哪些可扣款
- 時間分界點控制：在指定日期（如 2025/1/1）之後的訂單才可進行扣款操作
- 餘額管理：記錄並維護各會員的剩餘儲值金額
- 交易記錄查詢：提供功能畫面顯示儲值及扣款記錄

### 1.2 系統邊界
- **orderdata 資料表**：維持現狀，僅負責匯入訂單資料（只讀，這是訂單資料）
- **customer 資料表**：維持現狀，僅負責匯入客戶資料（只讀，這是客戶資料）
- **儲值系統**：獨立於 orderdata 和 customer，負責管理會員儲值與扣款邏輯
- **時間分界**：以設定日期（如 2025/1/1）區分哪些訂單可以進行扣款操作
- **操作方式**：儲值和扣款均為手動操作，不進行自動處理

---

## 二、資料結構設計

### 2.1 會員儲值資料表（walletdata）

#### 基本欄位
- `snkey`: 主鍵（系統自動生成）
- `customerNumber`: 客戶編號（關聯到 customer 資料表，customer 為只讀）
- `balance`: 當前餘額（數值型，預設 0）
- `createInfo`: 建立資訊（包含 snkey, name, time）
- `editInfo`: 修改資訊陣列（包含 snkey, name, time）

#### 業務邏輯欄位
- `lastTransactionDate`: 最後交易日期
- `totalRecharge`: 累計儲值總額
- `totalDeduction`: 累計扣款總額

### 2.2 儲值交易記錄表（wallet_transactions）

#### 基本欄位
- `snkey`: 主鍵
- `customerNumber`: 客戶編號
- `transactionType`: 交易類型（'recharge' 儲值 / 'deduction' 扣款）
- `amount`: 交易金額（正數表示儲值，負數表示扣款）
- `balanceBefore`: 交易前餘額
- `balanceAfter`: 交易後餘額
- `orderNumber`: 關聯訂單號碼（扣款時使用，儲值時為空）
- `documentNumber`: 關聯單據號碼（扣款時使用）
- `transactionDate`: 交易日期時間
- `createInfo`: 建立資訊
- `notes`: 備註說明

### 2.3 系統設定（使用 other_data）

#### 說明
儲值系統啟動日期設定直接存放在 `other_data` 資料表中，無需建立額外的系統設定表。

#### 欄位設計
在 `other_data` 資料表中新增欄位：
- `walletActivationDate`: 儲值系統啟動日期（格式：YYYY-MM-DD，如 '2025-01-01'）

#### 使用方式
- 透過 `api.get('other_data')` 取得資料
- 從 `cData.walletActivationDate` 讀取啟動日期
- 在手動扣款功能中，與訂單的 `orderDate` 進行比較，僅顯示 orderDate >= walletActivationDate 的訂單供選擇

---

## 三、核心業務邏輯流程

### 3.1 會員儲值流程（手動操作）

#### 流程步驟
1. **選擇客戶**
   - 從 customer 資料表中選擇要儲值的客戶
   - 顯示客戶基本資訊（客戶編號、客戶全稱等）

2. **查詢並顯示當前餘額**
   - 查詢 walletdata 中是否存在該客戶編號的記錄
   - **如果不存在**：
     - 顯示餘額為 0
     - 提示將建立新的儲值記錄
   - **如果存在**：
     - 取得並顯示當前餘額（balance）
     - 顯示最後交易日期（lastTransactionDate）
     - 顯示累計儲值總額（totalRecharge）
     - 顯示累計扣款總額（totalDeduction）
   - 此時使用者已知道當前餘額狀況

3. **輸入儲值金額**
   - 在已知當前餘額的情況下，手動輸入儲值金額
   - 驗證：儲值金額是否為正數
   - 驗證：儲值金額格式是否正確

4. **顯示儲值預覽**
   - 顯示當前餘額（已在前一步顯示）
   - 顯示儲值金額
   - 顯示儲值後的新餘額（自動計算：當前餘額 + 儲值金額）
   - 使用者確認後執行儲值

5. **執行儲值操作**
   - 如果客戶不存在於 walletdata，先建立新記錄（餘額初始為 0）
   - 計算新餘額 = 當前餘額 + 儲值金額
   - 更新 walletdata 的 balance 欄位
   - 更新 totalRecharge 欄位（累計儲值）
   - 更新 lastTransactionDate

6. **記錄交易明細**
   - 在 wallet_transactions 中新增一筆記錄
   - transactionType = 'recharge'
   - amount = 儲值金額（正數）
   - balanceBefore = 交易前餘額
   - balanceAfter = 交易後餘額
   - transactionDate = 當前時間

7. **返回結果**
   - 返回儲值成功訊息
   - 返回更新後的餘額

### 3.2 訂單手動扣款流程

#### 流程步驟

1. **篩選訂單條件**
   - 提供篩選條件選項：
     - **指定日期區間**：選擇開始日期和結束日期
     - **客戶名稱**：輸入或選擇客戶名稱（從 customer 資料表）
     - **訂單編號**：輸入訂單編號（documentNumber）
   - 可單獨使用或組合使用多個篩選條件
   - 從 `other_data` 讀取 `walletActivationDate`（儲值系統啟動日期）
   - **重要**：僅顯示 orderDate >= walletActivationDate 的訂單供扣款選擇
   - 啟動日期之前的訂單不在此功能中顯示（因為不能進行扣款操作）

2. **顯示符合條件的訂單**
   - 根據篩選條件查詢 orderdata
   - 顯示訂單列表，包含：
     - 單據號碼（documentNumber）
     - 客戶編號（customerNumber）
     - 客戶全稱（customerFullName）
     - 訂購日期（orderDate）
     - **出貨日期**（shippingDate，如果 orderdata 中有此欄位；否則可顯示訂購日期或留空）
     - **品名**（productName）
     - **規格**（specification，如果 orderdata 中有此欄位；否則可從 productName 中解析或留空）
     - **單價**（unitPrice）
     - **數量**（quantity）
     - **小計**（amount，或計算 unitPrice × quantity）
     - 金額（amount，總金額）
     - 是否已扣款狀態（從 wallet_transactions 查詢）
   - 對於已扣款的訂單，標示已扣款狀態

3. **選擇要扣款的訂單**
   - 使用者可選擇一筆或多筆訂單
   - 顯示選中訂單的總金額
   - 顯示對應客戶的當前餘額（從 walletdata 查詢）
   - 如果客戶不存在於 walletdata，顯示餘額為 0

4. **扣款預覽與確認**
   - 對於每筆選中的訂單：
     - 顯示客戶編號和客戶名稱
     - 顯示訂單金額
     - 顯示客戶當前餘額
     - 顯示扣款後的新餘額（自動計算：當前餘額 - 訂單金額）
     - 標示餘額是否足夠
   - 如果餘額不足，提示使用者
   - 使用者確認後執行扣款

5. **執行扣款操作**
   - 對於每筆選中的訂單：
     - 取得訂單的 customerNumber（客戶編號）
     - 取得訂單的 amount（金額）
     - 查詢 walletdata 中該客戶的餘額記錄
     - **如果客戶不存在於 walletdata**：
       - 建立新記錄（餘額為 0）
       - 如果餘額不足，不執行扣款，記錄扣款失敗
     - **如果客戶存在**：
       - 檢查餘額是否足夠：balance >= amount
       - **餘額足夠**：
         - 計算新餘額 = 當前餘額 - amount
         - 更新 walletdata 的 balance
         - 更新 totalDeduction（累計扣款）
         - 更新 lastTransactionDate
         - 在 wallet_transactions 記錄扣款明細
         - transactionType = 'deduction'
         - amount = -amount（負數）
         - documentNumber = 單據號碼
         - orderDate = 訂購日期
       - **餘額不足**：
         - 不執行扣款
         - 記錄扣款失敗交易（amount = 0，notes 標註餘額不足）

6. **返回扣款結果**
   - 顯示扣款成功和失敗的訂單數量
   - 顯示每筆訂單的扣款狀態
   - 返回更新後的客戶餘額資訊

### 3.3 訂單查詢功能

#### 功能說明
提供訂單查詢功能，可查詢所有訂單（包括啟動日期之前和之後的訂單），並標示哪些訂單可以進行扣款操作。

#### 流程步驟

1. **查詢條件設定**
   - 提供多種查詢條件：
     - **指定日期區間**：選擇開始日期和結束日期
     - **客戶名稱**：輸入或選擇客戶名稱（從 customer 資料表）
     - **訂單編號**：輸入訂單編號（documentNumber）
   - 可單獨使用或組合使用多個查詢條件
   - **不限制**：可查詢所有訂單，包括啟動日期之前的訂單

2. **顯示訂單列表**
   - 根據篩選條件查詢 orderdata（不限制啟動日期）
   - 顯示訂單列表，包含：
     - 單據號碼（documentNumber）
     - 客戶編號（customerNumber）
     - 客戶全稱（customerFullName）
     - 訂購日期（orderDate）
     - 金額（amount）
     - **是否可扣款**：標示 orderDate >= walletActivationDate（可扣款）或 orderDate < walletActivationDate（不可扣款）
     - **是否已扣款狀態**：從 wallet_transactions 查詢（僅對可扣款的訂單顯示）

3. **訂單狀態說明**
   - **可扣款且未扣款**：訂單日期在啟動日期之後，且尚未扣款
   - **可扣款且已扣款**：訂單日期在啟動日期之後，且已完成扣款
   - **不可扣款**：訂單日期在啟動日期之前，僅作為歷史記錄，不進行扣款操作

### 3.4 交易記錄查詢功能

#### 功能說明
提供專門的功能畫面，用於顯示儲值及扣款記錄。

#### 流程步驟

1. **查詢條件設定**
   - 提供多種查詢條件：
     - **客戶編號**：輸入或選擇客戶編號
     - **客戶名稱**：輸入或選擇客戶名稱（從 customer 資料表）
     - **交易類型**：選擇「儲值」、「扣款」或「全部」
     - **日期區間**：選擇開始日期和結束日期
     - **訂單編號**：輸入訂單編號（documentNumber）
   - 可單獨使用或組合使用多個查詢條件

2. **顯示交易記錄列表**
   - 從 wallet_transactions 查詢符合條件的記錄
   - 顯示欄位包含：
     - 交易日期時間（transactionDate）
     - 客戶編號（customerNumber）
     - 客戶名稱（從 customer 資料表關聯取得）
     - 交易類型（transactionType：儲值/扣款）
     - 交易金額（amount：正數為儲值，負數為扣款）
     - 交易前餘額（balanceBefore）
     - 交易後餘額（balanceAfter）
     - 關聯訂單編號（documentNumber，扣款時顯示）
     - 備註說明（notes）
     - 建立資訊（createInfo）
   - 按交易日期倒序排列（最新的在前）

3. **顯示統計資訊**
   - 當前查詢結果的統計：
     - 儲值總額
     - 扣款總額
     - 交易筆數
   - 客戶當前餘額（從 walletdata 查詢）

4. **詳細資訊查看**
   - 可點擊單筆記錄查看詳細資訊
   - 顯示完整的交易資訊
   - 如果是扣款記錄，可顯示關聯的訂單詳細資訊

### 3.5 會員餘額查詢

#### 流程步驟
1. **查詢會員餘額**
   - 輸入：客戶編號或客戶名稱
   - 查詢 walletdata 取得 balance
   - 如果不存在，返回餘額為 0
   - 顯示客戶基本資訊（從 customer 資料表）
   - 顯示當前餘額
   - 顯示最後交易日期

---

## 四、系統整合點

### 4.1 與現有系統的整合

#### 4.1.1 與 orderdata 的整合
- **整合方式**：單向讀取（orderdata 為只讀資料表）
- **用途**：
  - **手動扣款功能**：根據篩選條件查詢訂單，僅顯示 orderDate >= walletActivationDate 的訂單供扣款選擇
  - **訂單查詢功能**：根據篩選條件查詢所有訂單（不限制啟動日期），標示哪些訂單可扣款
  - 檢查訂單是否已扣款（從 wallet_transactions 查詢）
- **注意事項**：
  - orderdata 資料表僅負責匯入，不進行任何修改操作
  - 扣款操作不會修改 orderdata 資料
  - 扣款狀態透過 wallet_transactions 的 documentNumber 欄位關聯
  - 啟動日期之前的訂單在扣款功能中不顯示，但在查詢功能中可以顯示

#### 4.1.2 與 customer 資料表的整合
- **整合方式**：單向讀取（customer 為只讀資料表）
- **用途**：
  - 驗證客戶編號是否存在（僅用於驗證，不修改 customer 資料）
  - 顯示客戶名稱等資訊
  - 建立 walletdata 時關聯客戶（透過 customerNumber 關聯）
- **注意事項**：
  - customer 資料表僅負責匯入，不進行任何修改操作
  - 儲值系統不會對 customer 資料表進行寫入或更新

### 4.2 資料一致性保證

#### 4.2.1 交易原子性
- 每次儲值或扣款操作必須在單一交易中完成
- 更新 walletdata 與新增 wallet_transactions 必須同時成功或同時失敗

#### 4.2.2 防止重複扣款
- 建立訂單與扣款記錄的對應關係
- 扣款前檢查該訂單是否已扣款
- 使用唯一標識（如 documentNumber + orderDate）防止重複處理

#### 4.2.3 餘額校驗
- 定期執行餘額校驗：根據交易記錄重新計算餘額
- 如果發現不一致，記錄錯誤並通知管理員

---

## 五、特殊情況處理

### 5.1 訂單日期在啟動日期之前
- **處理方式**：
  - **在手動扣款功能中**：不顯示這些訂單（因為不能進行扣款操作）
  - **在訂單查詢功能中**：可以顯示這些訂單，但標示為「不可扣款」
  - 不執行扣款，僅作為歷史記錄
- **邏輯**：這些訂單在系統啟動前已存在，不應從儲值系統扣款，但仍可在查詢功能中查看

### 5.2 訂單日期在啟動日期之後，但客戶無儲值記錄
- **處理方式**：
  - 在手動扣款功能中，顯示該客戶餘額為 0
  - 扣款預覽時提示餘額不足
  - 如果使用者仍選擇扣款，建立 walletdata 記錄（餘額為 0），記錄扣款失敗（餘額不足）

### 5.3 餘額不足的情況
- **處理方式**：
  - 在扣款預覽階段，顯示餘額不足的提示
  - 如果使用者仍選擇扣款，不執行扣款操作
  - 記錄扣款失敗交易（amount = 0，notes 標註餘額不足）
  - 保留訂單記錄，可後續補足餘額後再次嘗試扣款

### 5.4 重複扣款的情況
- **處理方式**：
  - 在手動扣款功能中，顯示訂單是否已扣款狀態
  - 扣款前檢查該訂單是否已扣款（從 wallet_transactions 查詢 documentNumber）
  - 如果已扣款，提示使用者並禁止重複扣款
  - 使用 documentNumber 作為唯一識別

### 5.5 訂單金額為 0 或負數
- **處理方式**：
  - 跳過扣款流程
  - 記錄異常情況

### 5.6 系統啟動日期變更
- **處理方式**：
  - 如果啟動日期往後調整：
    - 已扣款的訂單不受影響
    - 在手動扣款功能中，會顯示更多可扣款的訂單
  - 如果啟動日期往前調整：
    - 在手動扣款功能中，會顯示較少的可扣款訂單
    - 歷史訂單保持原樣，不進行任何處理

---

## 六、批次處理邏輯

### 6.1 餘額校驗批次處理

#### 觸發時機
- 定期執行（如每週一次）
- 手動觸發

#### 處理邏輯
1. 遍歷所有 walletdata 記錄
2. 根據 wallet_transactions 重新計算餘額
3. 與 walletdata 中的 balance 比較
4. 如果發現不一致，記錄錯誤
5. 可選擇自動修正或僅報告

---

## 七、權限與安全

### 7.1 功能權限
- **儲值功能**：需要特定權限（如 wallet_recharge_key）
- **查詢餘額**：一般使用者可查詢自己的餘額
- **查詢交易明細**：一般使用者可查詢自己的交易記錄
- **系統設定**：僅管理員可修改 `other_data` 中的 `walletActivationDate`

### 7.2 資料安全
- 所有金額計算使用精確數值型別（避免浮點數誤差）
- 交易記錄不可刪除（僅可新增）
- 重要操作記錄操作日誌

---

## 八、報表與統計

### 8.1 會員餘額報表
- 所有會員的當前餘額
- 餘額為負數的會員（異常情況）
- 長期未使用的儲值帳戶

### 8.2 交易統計報表
- 每日/每月儲值總額
- 每日/每月扣款總額
- 交易次數統計
- 餘額不足次數統計

### 8.3 訂單扣款狀態報表
- 可透過訂單查詢功能查看所有訂單的狀態
- 已成功扣款的訂單（從 wallet_transactions 查詢）
- 扣款失敗的訂單（餘額不足，從 wallet_transactions 查詢失敗記錄）
- 可扣款但尚未扣款的訂單（orderDate >= walletActivationDate 且未在 wallet_transactions 中找到對應記錄）
- 不可扣款的訂單（orderDate < walletActivationDate，僅作為歷史記錄）

---

## 九、擴展性考量

### 9.1 未來可能的功能擴展
- 儲值優惠活動（儲值送金額）
- 退款功能
- 轉帳功能（會員間轉帳）
- 儲值卡功能
- 自動儲值設定

### 9.2 資料表設計的擴展性
- walletdata 可新增欄位支援未來功能
- wallet_transactions 的 notes 欄位可記錄額外資訊
- `other_data` 可靈活新增各種設定欄位

---

## 十、實施建議

### 10.1 階段性實施
1. **第一階段**：建立資料表結構與基本儲值功能（手動儲值）
2. **第二階段**：實作訂單手動扣款功能（篩選、選擇、確認扣款）
3. **第三階段**：實作訂單查詢功能（可查詢所有訂單，標示可扣款狀態）
4. **第四階段**：實作交易記錄查詢功能
5. **第五階段**：餘額校驗與報表功能
6. **第六階段**：優化與擴展功能

### 10.2 測試建議
- 單元測試：測試儲值、扣款邏輯
- 整合測試：測試與 orderdata、customer 的整合
- 邊界測試：測試餘額不足、重複扣款、篩選條件等情況
- 使用者介面測試：測試手動操作流程的易用性
- 資料一致性測試：測試餘額計算的正確性

### 10.3 資料遷移
- 系統啟動時，無需處理歷史訂單
- 在手動扣款功能中，僅顯示啟動日期（walletActivationDate）之後的訂單供選擇
- 歷史訂單保持原樣，不進行任何扣款操作

---

## 十一、資料流程圖

### 11.1 手動儲值流程
```
選擇客戶（從 customer 資料表）
    ↓
查詢 walletdata 取得當前餘額
    ↓
顯示當前餘額及相關資訊
    ↓
輸入儲值金額
    ↓
顯示儲值預覽（當前餘額、儲值金額、新餘額）
    ↓
使用者確認
    ↓
如果客戶不存在，建立 walletdata 記錄
    ↓
更新餘額（balance += amount）
    ↓
記錄交易明細（wallet_transactions）
    ↓
返回成功結果
```

### 11.2 手動扣款流程
```
設定篩選條件（日期區間/客戶名/訂單編號）
    ↓
從 other_data 讀取 walletActivationDate
    ↓
查詢符合條件的訂單（orderDate >= walletActivationDate）
    ↓
顯示訂單列表（含是否已扣款狀態）
    ↓
選擇要扣款的訂單（一筆或多筆）
    ↓
顯示扣款預覽（客戶餘額、訂單金額、扣款後餘額）
    ↓
使用者確認扣款
    ↓
對於每筆選中的訂單：
    ├─ 檢查是否已扣款？
    │   ├─ 是 → 跳過此訂單
    │   └─ 否 → 繼續
    ├─ 查詢客戶餘額（walletdata）
    ├─ 檢查餘額是否足夠？
    │   ├─ 否 → 記錄扣款失敗
    │   └─ 是 → 繼續
    ├─ 更新餘額（balance -= amount）
    └─ 記錄交易明細（wallet_transactions）
    ↓
返回扣款結果（成功/失敗統計）
```

### 11.3 訂單查詢流程
```
設定查詢條件（日期區間/客戶名/訂單編號）
    ↓
從 other_data 讀取 walletActivationDate
    ↓
查詢所有符合條件的訂單（不限制啟動日期）
    ↓
顯示訂單列表
    ├─ 標示是否可扣款（orderDate >= walletActivationDate）
    └─ 標示是否已扣款（僅對可扣款的訂單）
    ↓
可查看訂單詳細資訊
```

### 11.4 交易記錄查詢流程
```
設定查詢條件（客戶/交易類型/日期區間/訂單編號）
    ↓
查詢 wallet_transactions
    ↓
顯示交易記錄列表
    ↓
顯示統計資訊（儲值總額/扣款總額/交易筆數）
    ↓
可查看單筆記錄詳細資訊
```

---

## 十二、關鍵決策點

### 12.1 扣款方式
- **選項 ：手動扣款（使用者選擇訂單後確認扣款）
  - 優點：可靈活控制，可預覽扣款結果，避免錯誤扣款
  - 缺點：需要人工操作


### 12.2 餘額不足的處理
- 選項 ：不扣款，僅記錄失敗
  - 優點：不會產生負餘額
  - 缺點：訂單可能無法完成


### 12.3 歷史訂單處理
- 選項 ：僅處理啟動日期之後的新訂單
  - 優點：簡單明確，不影響歷史資料
  - 缺點：歷史訂單無法追溯

---

## 十三、注意事項

1. **資料備份**：儲值相關資料非常重要，需定期備份
2. **審計追蹤**：所有交易記錄需完整保留，不可刪除
3. **數值精度**：金額計算需注意精度問題，建議使用整數（以分為單位）或使用 Decimal 型別
4. **併發控制**：多筆訂單同時扣款時，需注意併發控制，避免餘額計算錯誤
5. **錯誤處理**：所有異常情況都需記錄，便於追蹤與除錯

---

## 十四、總結

此架構設計將儲值系統與現有的 orderdata 和 customer 系統分離，保持 orderdata 和 customer 的只讀特性（兩者都僅負責匯入，不進行任何修改操作）。系統採用手動操作方式進行儲值和扣款，提供靈活的控制機制：

- **手動儲值**：選擇客戶後立即顯示當前餘額，然後輸入儲值金額，系統自動計算並顯示新餘額，確認後執行
- **手動扣款**：透過多種篩選條件（日期區間、客戶名、訂單編號）選擇訂單，僅顯示啟動日期之後的訂單供扣款選擇，預覽扣款結果後確認執行
- **訂單查詢**：可查詢所有訂單（包括啟動日期之前和之後的），標示哪些訂單可扣款、哪些已扣款
- **交易記錄查詢**：提供專門的功能畫面，可查詢和顯示所有儲值及扣款記錄

系統透過時間分界點（walletActivationDate）控制哪些訂單可以進行扣款操作。啟動日期之前的訂單在扣款功能中不顯示，但在查詢功能中可以顯示，僅作為歷史記錄。設計考慮了資料一致性、錯誤處理、擴展性等各方面，可作為實作時的參考依據。

---

## 十五、資料庫 SQL 建構語句

### 15.1 會員儲值資料表（walletdata）

```sql
CREATE TABLE IF NOT EXISTS `walletdata` (
  `snkey` INT(11) NOT NULL AUTO_INCREMENT COMMENT '主鍵',
  `datalist` TEXT NOT NULL COMMENT 'JSON格式資料，包含：customerNumber, balance, createInfo, editInfo, lastTransactionDate, totalRecharge, totalDeduction',
  PRIMARY KEY (`snkey`),
  KEY `idx_customerNumber` (`snkey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='會員儲值資料表';

-- datalist JSON 結構範例：
-- {
--   "customerNumber": "MD02066",
--   "balance": 10000,
--   "createInfo": {
--     "snkey": "1",
--     "name": "系統管理員",
--     "time": "2025-01-01 10:00:00"
--   },
--   "editInfo": [],
--   "lastTransactionDate": "2025-01-15 14:30:00",
--   "totalRecharge": 50000,
--   "totalDeduction": 40000
-- }
```

### 15.2 儲值交易記錄表（wallet_transactions）

```sql
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `snkey` INT(11) NOT NULL AUTO_INCREMENT COMMENT '主鍵',
  `datalist` TEXT NOT NULL COMMENT 'JSON格式資料，包含：customerNumber, transactionType, amount, balanceBefore, balanceAfter, orderNumber, documentNumber, transactionDate, createInfo, notes',
  PRIMARY KEY (`snkey`),
  KEY `idx_customerNumber` (`snkey`),
  KEY `idx_documentNumber` (`snkey`),
  KEY `idx_transactionDate` (`snkey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='儲值交易記錄表';

-- datalist JSON 結構範例（儲值）：
-- {
--   "customerNumber": "MD02066",
--   "transactionType": "recharge",
--   "amount": 5000,
--   "balanceBefore": 5000,
--   "balanceAfter": 10000,
--   "orderNumber": null,
--   "documentNumber": null,
--   "transactionDate": "2025-01-15 14:30:00",
--   "createInfo": {
--     "snkey": "1",
--     "name": "系統管理員",
--     "time": "2025-01-15 14:30:00"
--   },
--   "notes": "手動儲值"
-- }

-- datalist JSON 結構範例（扣款）：
-- {
--   "customerNumber": "MD02066",
--   "transactionType": "deduction",
--   "amount": -3000,
--   "balanceBefore": 10000,
--   "balanceAfter": 7000,
--   "orderNumber": null,
--   "documentNumber": "SO20251103001",
--   "transactionDate": "2025-01-16 09:15:00",
--   "createInfo": {
--     "snkey": "1",
--     "name": "系統管理員",
--     "time": "2025-01-16 09:15:00"
--   },
--   "notes": "訂單扣款"
-- }
```

### 15.3 系統設定（other_data 表新增欄位）

```sql
-- 為 other_data 表新增 walletActivationDate 欄位
-- 注意：如果 other_data 表使用 datalist JSON 格式，則不需要執行此 ALTER 語句
-- 而是直接在 datalist 的 JSON 中新增 walletActivationDate 欄位

-- 如果 other_data 表有獨立欄位結構，執行以下語句：
ALTER TABLE `other_data` 
ADD COLUMN IF NOT EXISTS `walletActivationDate` DATE NULL COMMENT '儲值系統啟動日期（格式：YYYY-MM-DD）' 
AFTER `snkey`;

-- 如果 other_data 表使用 datalist JSON 格式，則在 datalist JSON 中新增：
-- {
--   ...原有欄位,
--   "walletActivationDate": "2025-01-01"
-- }

-- 設定預設啟動日期（可選）
-- UPDATE `other_data` SET `walletActivationDate` = '2025-01-01' WHERE `snkey` = 1;
```

### 15.4 索引優化建議

```sql
-- 為 walletdata 表建立客戶編號索引（如果需要在 datalist JSON 外建立索引）
-- 注意：由於使用 JSON 格式存儲，索引建立方式可能需要根據實際資料庫版本調整

-- 為 wallet_transactions 表建立查詢優化索引
-- 由於使用 JSON 格式，建議在應用層建立適當的查詢邏輯
```

### 15.5 資料表說明

1. **walletdata 表**：
   - 主鍵：`snkey`（自動遞增）
   - 資料欄位：`datalist`（TEXT，存儲 JSON 格式的會員儲值資料）
   - 用途：記錄各會員的儲值餘額及相關統計資訊

2. **wallet_transactions 表**：
   - 主鍵：`snkey`（自動遞增）
   - 資料欄位：`datalist`（TEXT，存儲 JSON 格式的交易記錄）
   - 用途：記錄所有儲值和扣款交易明細，用於查詢和對帳

3. **other_data 表**：
   - 新增 `walletActivationDate` 欄位（或 JSON 欄位）
   - 用途：儲存儲值系統啟動日期，用於判斷哪些訂單可以進行扣款

### 15.6 注意事項

1. **JSON 格式**：本系統採用 JSON 格式存儲業務資料，所有業務欄位都存儲在 `datalist` TEXT 欄位中
2. **資料一致性**：確保每次儲值或扣款操作時，同時更新 walletdata 和 wallet_transactions
3. **索引優化**：根據實際查詢需求，可考慮在應用層建立適當的查詢邏輯
4. **資料備份**：儲值相關資料非常重要，建議定期備份 walletdata 和 wallet_transactions 表

