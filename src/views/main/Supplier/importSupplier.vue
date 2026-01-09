<template>
  <div class="import-supplier">
    <v-dialog v-model="dialog" max-width="800" persistent>
      <template #activator="{ props }">
        <v-btn 
          v-bind="props" 
          color="primary" 
          variant="elevated"
          prepend-icon="mdi-file-import"
          rounded="pill"
          elevation="6"
          @click="openDialog"
        >
          匯入 Excel
        </v-btn>
      </template>

      <v-card class="import-dialog" rounded="xl">
        <v-card-title class="d-flex dialog-title dialog-title--import" primary-title>
          <div class="text-h6 font-weight-bold">匯入廠商資料</div>
          <v-spacer></v-spacer>
          <v-btn 
            icon="mdi-close" 
            class="ml-2" 
            variant="text" 
            color="white" 
            @click="closeDialog"
          ></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-sheet class="info-section" color="primary-lighten-5" variant="tonal" rounded="lg">
            <div class="info-section__header mb-4">
              <v-icon color="primary" size="24">mdi-file-excel</v-icon>
              <span class="text-subtitle-1 font-weight-bold text-primary ml-2">選擇 Excel 檔案</span>
            </div>
            
            <v-file-input
              v-model="selectedFile"
              label="選擇 Excel 檔案"
              accept=".xlsx,.xls"
              prepend-icon="mdi-file-excel"
              variant="outlined"
              density="comfortable"
              :rules="fileRules"
              @update:model-value="onFileSelected"
            ></v-file-input>

            <v-alert
              v-if="selectedFileName"
              type="info"
              variant="tonal"
              class="mt-4"
            >
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-file-check</v-icon>
                <span>已選擇檔案: {{ selectedFileName }}</span>
              </div>
            </v-alert>
          </v-sheet>

          <v-sheet 
            v-if="datas.length > 0" 
            class="data-preview mt-4" 
            color="success-lighten-5" 
            variant="tonal" 
            rounded="lg"
          >
            <div class="info-section__header mb-3">
              <v-icon color="success" size="24">mdi-check-circle</v-icon>
              <span class="text-subtitle-1 font-weight-bold text-success ml-2">
                資料預覽 (共 {{ datas.length }} 筆)
              </span>
            </div>
            
            <v-alert type="success" variant="tonal" class="mb-4">
              資料已成功解析，共 {{ datas.length }} 筆記錄
            </v-alert>

            <v-table density="compact" class="preview-table">
              <thead>
                <tr>
                  <th>廠商編號</th>
                  <th>廠商全稱</th>
                  <th>統一編號</th>
                  <th>聯絡人</th>
                  <th>聯絡電話一</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in datas.slice(0, 5)" :key="index">
                  <td>{{ item.supplierNumber || '-' }}</td>
                  <td>{{ item.supplierFullName || '-' }}</td>
                  <td>{{ item.unifiedNumber || '-' }}</td>
                  <td>{{ item.contactPerson || '-' }}</td>
                  <td>{{ item.contactPhone1 || '-' }}</td>
                </tr>
              </tbody>
            </v-table>
            <div v-if="datas.length > 5" class="text-caption text-center mt-2 pa-2">
              僅顯示前 5 筆，共 {{ datas.length }} 筆資料
            </div>
          </v-sheet>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            {{ errorMessage }}
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            color="grey" 
            variant="text" 
            @click="closeDialog"
          >
            取消
          </v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            class="text-white" 
            @click="processImport"
            :disabled="!selectedFile || datas.length === 0"
            :loading="loading"
          >
            確認匯入
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'
import { useStore } from '@/stores/useStore'
import * as XLSX from 'xlsx'
import api from '@/assets/js/api.js'
import dayjs from 'dayjs'

const { proxy } = getCurrentInstance()
const store = useStore()

// Emits
const emit = defineEmits(['getAllData'])

// Refs
const dialog = ref(false)
const selectedFile = ref(null)
const selectedFileName = ref('')
const datas = ref([])
const errorMessage = ref('')
const loading = ref(false)

// 欄位映射：中文欄位名 -> 英文欄位名
// 根據實際 Excel 檔案的欄位名稱
const fieldMapping = {
  '廠商編號': 'supplierNumber',
  '廠商全稱': 'supplierFullName',
  '統一編號': 'unifiedNumber',
  '負責人': 'personInCharge',
  '聯絡人': 'contactPerson',
  '聯絡人職稱': 'contactPersonTitle',
  '聯絡電話一': 'contactPhone1',
  '聯絡電話二': 'contactPhone2',
  '行動電話': 'mobilePhone',
  '傳真號碼': 'faxNumber',
  '電子郵件': 'email',
  '網址': 'website',
  '名稱': 'bankName',
  '銀行帳號': 'bankAccountNumber',
  '每月結帳日': 'monthlyBillingDate',
  '貨到付款天數': 'codDays',
  '發票地址': 'invoiceAddress',
  '收貨地址郵遞區號': 'shippingAddressPostalCode',
  '收貨地址': 'shippingAddress',
  '類別名稱': 'categoryName',
  '行業別': 'industryCategory',
  '備註': 'notes',
  '外商': 'isForeignSupplier',
  '採購員': 'purchaser',
  '其它付款方式描述': 'otherPaymentMethods',
  '交易條件': 'paymentTerms',
  '月結付款日': 'monthlyPaymentDate'
}

// Validation rules
const fileRules = [
  (v) => !!v || '請選擇 Excel 檔案',
  (v) => {
    if (!v) return true
    const extension = v.name.split('.').pop().toLowerCase()
    return ['xlsx', 'xls'].includes(extension) || '請選擇 .xlsx 或 .xls 檔案'
  }
]

// Methods
const openDialog = () => {
  dialog.value = true
  resetForm()
}

const closeDialog = () => {
  if (loading.value) return
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  selectedFile.value = null
  selectedFileName.value = ''
  datas.value = []
  errorMessage.value = ''
  loading.value = false
}

const onFileSelected = async (file) => {
  if (!file) {
    selectedFileName.value = ''
    datas.value = []
    errorMessage.value = ''
    return
  }

  selectedFileName.value = file.name
  errorMessage.value = ''
  datas.value = []

  try {
    await parseExcelFile(file)
  } catch (error) {
    console.error('Excel parsing error:', error)
    errorMessage.value = `解析 Excel 檔案時發生錯誤: ${error.message}`
    datas.value = []
  }
}

const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 讀取第一個工作表
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // 將工作表轉換為 JSON，header: 1 表示使用第一行作為標題
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        })
        
        // Excel 格式：第1-2列不使用，第3列為欄位名，第4列開始為資料內容
        if (jsonData.length < 4) {
          reject(new Error('Excel 檔案至少需要包含前2列（不使用）、第3列（欄位名）和第4列（資料）'))
          return
        }
        
        // 第3列（索引 2）是中文欄位名
        const headers = jsonData[2]
        const headerRowIndex = 2
        
        // 清理欄位名（去除前後空格和換行符）
        const cleanedHeaders = headers ? headers.map(h => h ? String(h).trim().replace(/\n/g, '').replace(/\r/g, '') : '') : []
        
        // 驗證欄位（只檢查核心必要欄位）
        const coreRequiredFields = ['廠商編號', '廠商全稱']
        const missingCoreFields = coreRequiredFields.filter(field => !cleanedHeaders.includes(field))
        
        if (missingCoreFields.length > 0) {
          // 顯示實際讀取到的欄位名以便調試
          const actualHeaders = cleanedHeaders.filter(h => h).join(', ')
          const debugInfo = `\n\n欄位名在第 ${headerRowIndex + 1} 列（索引 ${headerRowIndex}）\n實際讀取到的欄位名: ${actualHeaders}\n\n前5列的內容預覽:\n${jsonData.slice(0, 5).map((row, idx) => `第${idx + 1}列: ${(row || []).slice(0, 5).join(', ')}`).join('\n')}`
          reject(new Error(`缺少核心必要欄位: ${missingCoreFields.join(', ')}${debugInfo}`))
          return
        }
        
        // 檢查可選欄位，記錄缺失的欄位（但不阻止匯入）
        const allRequiredFields = Object.keys(fieldMapping)
        const missingOptionalFields = allRequiredFields.filter(field => !cleanedHeaders.includes(field) && !coreRequiredFields.includes(field))
        
        if (missingOptionalFields.length > 0) {
          console.warn('以下欄位在 Excel 中不存在，將使用空值:', missingOptionalFields.join(', '))
        }
        
        // 建立欄位索引映射（使用清理後的欄位名）
        const headerIndexMap = {}
        cleanedHeaders.forEach((header, index) => {
          if (fieldMapping[header]) {
            headerIndexMap[fieldMapping[header]] = index
          }
        })
        
        // 轉換資料：從第4列開始（索引 3）
        const parsedData = []
        for (let i = 3; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          // 跳過空行
          if (row.every(cell => !cell || cell.toString().trim() === '')) {
            continue
          }
          
          const dataItem = {}
          
          // 根據映射轉換欄位
          Object.keys(headerIndexMap).forEach(englishField => {
            const index = headerIndexMap[englishField]
            let value = row[index] ? String(row[index]).trim() : ''
            
            // 特殊處理：外商欄位（轉換為布林值）
            if (englishField === 'isForeignSupplier') {
              value = value === '是' || value === 'Y' || value === 'y' || value === '1' || value === 'true'
            }
            
            dataItem[englishField] = value
          })
          
          parsedData.push(dataItem)
        }
        
        if (parsedData.length === 0) {
          reject(new Error('Excel 檔案中沒有有效的資料行'))
          return
        }
        
        datas.value = parsedData
        resolve(parsedData)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('讀取檔案時發生錯誤'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

const processImport = async () => {
  if (datas.value.length === 0) {
    proxy.$swal({
      icon: 'warning',
      title: '沒有可匯入的資料',
      text: '請先選擇並解析 Excel 檔案',
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6'
    })
    return
  }

  loading.value = true
  
  try {
    // 先取得資料庫中已存在的 supplierNumber
    const existingDataPayload = {
      columns: 'supplierNumber'
    }
    const existingDataResponse = await api.options(`general/getByColumns/${store.state.databaseName}/supplier`, existingDataPayload)
    console.log('existingDataResponse', existingDataResponse)
   
    // 從回應中提取已存在的 supplierNumber 列表
    const existingSupplierNumbers = new Set()
    if (Array.isArray(existingDataResponse)) {
      existingDataResponse.forEach((item) => {
        try {
          let supplierNumber = null
          
          // 如果直接有 supplierNumber 欄位
          if (item.supplierNumber) {
            supplierNumber = String(item.supplierNumber).trim()
          } 
          // 如果需要從 datalist 解析
          else if (item.datalist) {
            const parsedData = JSON.parse(item.datalist || '{}')
            if (parsedData.supplierNumber) {
              supplierNumber = String(parsedData.supplierNumber).trim()
            }
          }
          
          if (supplierNumber) {
            existingSupplierNumbers.add(supplierNumber)
          }
        } catch (error) {
          console.warn('解析已存在資料時發生錯誤:', error)
        }
      })
    }
    
    console.log('已存在的 supplierNumber:', Array.from(existingSupplierNumbers))

    // 過濾出不存在於資料庫中的資料
    const newDatas = datas.value.filter((item) => {
      const supplierNumber = item.supplierNumber ? String(item.supplierNumber).trim() : ''
      return supplierNumber && !existingSupplierNumbers.has(supplierNumber)
    })
    
    const skippedCount = datas.value.length - newDatas.length
    
    console.log('原始資料筆數:', datas.value.length)
    console.log('新資料筆數:', newDatas.length)
    console.log('跳過筆數（已存在）:', skippedCount)
    
    // 如果沒有新資料需要匯入
    if (newDatas.length === 0) {
      loading.value = false
      proxy.$swal({
        icon: 'info',
        title: '沒有新資料需要匯入',
        text: `所有 ${datas.value.length} 筆資料的廠商編號都已存在於資料庫中`,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }
    
    // 如果有部分資料已存在，提示用戶
    if (skippedCount > 0) {
      const shouldContinue = await proxy.$swal({
        icon: 'warning',
        title: '發現重複資料',
        text: `共有 ${skippedCount} 筆資料的廠商編號已存在，將跳過這些資料。\n將匯入 ${newDatas.length} 筆新資料。\n是否繼續？`,
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: true,
        position: 'center'
      })
      
      if (!shouldContinue.isConfirmed) {
        loading.value = false
        return
      }
    }
    
    // 構建 payload 陣列，每個元素包含 datalist（JSON字符串）
    const payload = newDatas.map((item) => {
      return {
        supplierNumber: item.supplierNumber,
        datalist: JSON.stringify({
          ...item,
          createInfo: {
            snkey: store.state.pData.snkey,
            name: store.state.pData.username,
            time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          },
          editInfo: [],
        })
      }
    })

    console.log('要匯入的資料:', newDatas)
    console.log('資料筆數:', newDatas.length)
    console.log('Payload:', payload)

    const rs = await api.options(`general/addMulti/${store.state.databaseName}/supplier`, payload)
    
    console.log('API 回應:', rs)
    console.log('回應類型:', typeof rs)
    console.log('是否為陣列:', Array.isArray(rs))
    
    loading.value = false
    
    // 檢查回應結果
    if (!rs) {
      proxy.$swal({
        icon: 'error',
        title: '匯入失敗',
        text: '伺服器沒有返回回應，請檢查網路連線或稍後再試',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }
    
    const hasError = Array.isArray(rs) && rs.some((item) => item?.state === 0)
    
    if (hasError) {
      const errorItems = Array.isArray(rs) ? rs.filter((item) => item?.state === 0) : []
      console.error('匯入錯誤的項目:', errorItems)
      proxy.$swal({
        icon: 'error',
        title: '匯入過程發生錯誤',
        text: `部分資料可能未能成功匯入。\n錯誤項目數: ${errorItems.length}`,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
    } else {
      let successMessage = `已成功匯入 ${newDatas.length} 筆資料`
      if (skippedCount > 0) {
        successMessage += `\n（已跳過 ${skippedCount} 筆已存在的資料）`
      }
      
      proxy.$swal({
        icon: 'success',
        title: '匯入成功',
        text: successMessage,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      
      // 關閉對話框並刷新資料
      closeDialog()
      emit('getAllData')
    }
  } catch (error) {
    loading.value = false
    console.error('匯入錯誤:', error)
    proxy.$swal({
      icon: 'error',
      title: '匯入失敗',
      text: `發生錯誤: ${error.message || '未知錯誤'}`,
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6'
    })
  }
}
</script>

<style scoped lang="scss">
.import-dialog {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 24px 60px rgba(74, 107, 95, 0.22);
}

.dialog-title {
  padding: 18px 24px;
  font-size: 1.15rem;
  color: #ffffff;

  &--import {
    background: linear-gradient(135deg, rgba(74, 107, 95, 0.95), rgba(123, 163, 184, 0.85));
  }
}

.info-section {
  padding: 18px 20px;
  background-color: rgba(255, 255, 255, 0.86) !important;
  border: 1px solid rgba(123, 163, 184, 0.25);
  box-shadow: 0 8px 22px rgba(74, 107, 95, 0.12);

  &__header {
    display: flex;
    align-items: center;
  }
}

.data-preview {
  padding: 18px 20px;
  background-color: rgba(255, 255, 255, 0.86) !important;
  border: 1px solid rgba(123, 163, 184, 0.25);
  box-shadow: 0 8px 22px rgba(74, 107, 95, 0.12);
}

.preview-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: rgba(74, 107, 95, 0.1);
    font-weight: 600;
    color: var(--daycare-primary);
  }

  td, th {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(123, 163, 184, 0.2);
  }
}
</style>
