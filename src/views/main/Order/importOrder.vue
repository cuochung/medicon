<template>
  <div class="import-customer">
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
          <div class="text-h6 font-weight-bold">匯入訂單資料</div>
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

            <v-table density="compact" class="preview-table text-no-wrap">
              <thead>
                <tr>
                  <th>單據號碼</th>
                  <th>客戶全稱</th>
                  <th>品名規格</th>
                  <th>單價</th>
                  <th>數量</th>
                  <th>金額</th>
                  <th>稅額</th>
                  <th>訂購日期</th>
                  <th>客戶編號</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in datas.slice(0, 5)" :key="index">
                  <td>{{ item.documentNumber || '-' }}</td>
                  <td>{{ item.customerFullName || '-' }}</td>
                  <td>{{ item.productName || '-' }}</td>
                  <td>{{ item.unitPrice || '-' }}</td>
                  <td>{{ item.quantity || '-' }}</td>
                  <td>{{ item.amount || '-' }}</td>
                  <td>{{ item.taxAmount || '-' }}</td>
                  <td>{{ item.orderDate || '-' }}</td>
                  <td>{{ item.customerNumber || '-' }}</td>
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
      <!-- <pre>
        {{ datas[0] }}
      </pre> -->
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

// 日期格式化函數：將各種日期格式轉換為 YYYY-MM-DD
const formatDate = (dateValue) => {
  if (!dateValue) return ''
  
  // 如果已經是 YYYY-MM-DD 格式，直接返回
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue
  }
  
  // 嘗試使用 dayjs 解析日期
  let date
  if (dateValue instanceof Date) {
    date = dayjs(dateValue)
  } else if (typeof dateValue === 'number') {
    // Excel 日期序列號
    date = dayjs((dateValue - 25569) * 86400 * 1000)
  } else {
    // 字符串日期
    date = dayjs(dateValue)
  }
  
  // 如果解析成功，格式化為 YYYY-MM-DD
  if (date.isValid()) {
    return date.format('YYYY-MM-DD')
  }
  
  // 如果解析失敗，嘗試手動處理常見格式
  const str = String(dateValue).trim()
  
  // 處理 YYYY/MM/DD 格式
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) {
    return str.replace(/\//g, '-')
  }
  
  // 處理 YYYYMMDD 格式
  if (/^\d{8}$/.test(str)) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`
  }
  
  // 如果都無法處理，返回原值
  return str
}

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
const fieldMapping = {
  '單據號碼': 'documentNumber',
  '客戶全稱': 'customerFullName',
  '品名規格': 'productName',
  '單價': 'unitPrice',
  '數量': 'quantity',
  '金額': 'amount',
  '稅額': 'taxAmount',
  '訂購日期': 'orderDate',
  '客戶編號': 'customerNumber'
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
        
        // 將工作表轉換為 JSON，第一行作為標題
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        })
        
        if (jsonData.length < 2) {
          reject(new Error('Excel 檔案至少需要包含標題行和一行資料'))
          return
        }
        
        // 第一行是中文欄位名
        const headers = jsonData[0]
        
        // 驗證欄位
        const requiredFields = Object.keys(fieldMapping)
        const missingFields = requiredFields.filter(field => !headers.includes(field))
        
        if (missingFields.length > 0) {
          reject(new Error(`缺少必要欄位: ${missingFields.join(', ')}`))
          return
        }
        
        // 建立欄位索引映射
        const headerIndexMap = {}
        headers.forEach((header, index) => {
          if (fieldMapping[header]) {
            headerIndexMap[fieldMapping[header]] = index
          }
        })
        
        // 轉換資料：從第二行開始（索引 1）
        const parsedData = []
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          // 跳過空行
          if (row.every(cell => !cell || cell.toString().trim() === '')) {
            continue
          }
          
          const dataItem = {}
          
          // 根據映射轉換欄位
          Object.keys(headerIndexMap).forEach(englishField => {
            const index = headerIndexMap[englishField]
            const cellValue = row[index]
            
            // 如果是日期欄位，進行格式化
            if (englishField === 'orderDate' && cellValue) {
              dataItem[englishField] = formatDate(cellValue)
            } else {
              dataItem[englishField] = cellValue ? String(cellValue).trim() : ''
            }
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
    // 讀取全部現有資料
    const existingDataResponse = await api.get('orderdata')
    console.log('existingDataResponse', existingDataResponse)
   
    // 從回應中解析所有現有資料
    const existingDatas = []
    if (Array.isArray(existingDataResponse)) {
      existingDataResponse.forEach((item) => {
        try {
          // 從 datalist 解析 JSON 資料
          if (item.datalist) {
            const parsedData = JSON.parse(item.datalist || '{}')
            // 只保留業務欄位，排除系統欄位（createInfo, editInfo, snkey 等）
            const businessData = {
              documentNumber: parsedData.documentNumber || '',
              customerFullName: parsedData.customerFullName || '',
              productName: parsedData.productName || '',
              unitPrice: parsedData.unitPrice || '',
              quantity: parsedData.quantity || '',
              amount: parsedData.amount || '',
              taxAmount: parsedData.taxAmount || '',
              orderDate: formatDate(parsedData.orderDate) || '',
              customerNumber: parsedData.customerNumber || ''
            }
            existingDatas.push(businessData)
          }
        } catch (error) {
          console.warn('解析已存在資料時發生錯誤:', error)
        }
      })
    }
    
    console.log('已存在的資料筆數:', existingDatas.length)

    // 比較兩個資料物件是否所有欄位都相同
    const isDataEqual = (data1, data2) => {
      const fields = ['documentNumber', 'customerFullName', 'productName', 'unitPrice', 'quantity', 'amount', 'taxAmount', 'orderDate', 'customerNumber']
      
      for (const field of fields) {
        const value1 = String(data1[field] || '').trim()
        const value2 = String(data2[field] || '').trim()
        if (value1 !== value2) {
          return false
        }
      }
      return true
    }

    // 過濾出不存在於資料庫中的資料（所有欄位都相同才算重複）
    const newDatas = datas.value.filter((importItem) => {
      // 標準化匯入資料的欄位值
      const normalizedImportData = {
        documentNumber: String(importItem.documentNumber || '').trim(),
        customerFullName: String(importItem.customerFullName || '').trim(),
        productName: String(importItem.productName || '').trim(),
        unitPrice: String(importItem.unitPrice || '').trim(),
        quantity: String(importItem.quantity || '').trim(),
        amount: String(importItem.amount || '').trim(),
        taxAmount: String(importItem.taxAmount || '').trim(),
        orderDate: formatDate(importItem.orderDate) || '',
        customerNumber: String(importItem.customerNumber || '').trim()
      }
      
      // 檢查是否存在完全相同的資料
      const isDuplicate = existingDatas.some((existingItem) => {
        return isDataEqual(normalizedImportData, existingItem)
      })
      
      return !isDuplicate
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
        text: `所有 ${datas.value.length} 筆資料都已存在於資料庫中（所有欄位完全相同）`,
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
        text: `共有 ${skippedCount} 筆資料的所有欄位都與資料庫中的資料完全相同，將跳過這些資料。\n將匯入 ${newDatas.length} 筆新資料。\n是否繼續？`,
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
        documentNumber: item.documentNumber,
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

    const rs = await api.options(`general/addMulti/${store.state.databaseName}/orderdata`, payload)
    loading.value = false
    
    // 檢查回應結果
    const hasError = Array.isArray(rs) && rs.some((item) => item?.state === 0)
    
    if (hasError) {
      proxy.$swal({
        icon: 'error',
        title: '匯入過程發生錯誤',
        text: '部分資料可能未能成功匯入，請稍後再試',
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

