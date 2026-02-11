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
          <div class="text-h6 font-weight-bold">匯入客戶資料</div>
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
                  <th>客戶全稱</th>
                  <th>業務人員</th>
                  <th>客戶編號</th>
                  <th>聯絡人</th>
                  <th>聯絡電話</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in datas.slice(0, 5)" :key="index">
                  <td>{{ item.customerFullName || '-' }}</td>
                  <td>{{ item.salesPerson || '-' }}</td>
                  <td>{{ item.customerNumber || '-' }}</td>
                  <td>{{ item.contactPerson || '-' }}</td>
                  <td>{{ item.contactPhone || '-' }}</td>
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
  '客戶全稱': 'customerFullName',
  '業務人員': 'salesPerson',
  '送貨地址': 'deliveryAddress',
  '聯絡電話一': 'contactPhone1',
  '客戶編號': 'customerNumber',
  '地址編號': 'addressNumber',
  '地址': 'address',
  '郵遞區號': 'postalCode',
  '聯絡人': 'contactPerson',
  '聯絡電話': 'contactPhone',
  '聯絡人職稱': 'contactTitle',
  '傳真號碼': 'faxNumber',
  '行走路線': 'route',
  '備註': 'notes'
}

// 用於比對內容的欄位（不含 customerNumber，因已用於判斷是否同一筆）
const compareFields = Object.values(fieldMapping).filter((k) => k !== 'customerNumber')

/** 正規化欄位值供比對 */
const norm = (v) => (v != null && v !== '' ? String(v).trim() : '')

/** 兩筆資料內容是否不同（只比對 compareFields） */
const isContentDifferent = (existing, excelRow) => {
  return compareFields.some((key) => norm(existing[key]) !== norm(excelRow[key]))
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
            dataItem[englishField] = row[index] ? String(row[index]).trim() : ''
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
    // 取得資料庫中所有客戶（含 snkey、datalist）以比對內容並組更新 payload
    const allCustomers = await api.get('customer')
    const existingByNumber = new Map()
    if (Array.isArray(allCustomers)) {
      allCustomers.forEach((item) => {
        try {
          const parsed = { ...JSON.parse(item.datalist || '{}'), snkey: item.snkey }
          const num = parsed.customerNumber ? String(parsed.customerNumber).trim() : ''
          if (num) existingByNumber.set(num, parsed)
        } catch (e) {
          console.warn('解析客戶資料時發生錯誤:', e)
        }
      })
    }

    const newDatas = []
    const toUpdateMap = new Map() // customerNumber -> { existing, excelRow }，同一編號只保留最後一筆

    datas.value.forEach((excelRow) => {
      const num = excelRow.customerNumber ? String(excelRow.customerNumber).trim() : ''
      if (!num) return

      const existing = existingByNumber.get(num)
      if (!existing) {
        newDatas.push(excelRow)
        return
      }
      if (isContentDifferent(existing, excelRow)) {
        toUpdateMap.set(num, { existing, excelRow })
      }
    })

    const toUpdate = Array.from(toUpdateMap.values())
    const sameContentCount = datas.value.filter((row) => {
      const num = row.customerNumber ? String(row.customerNumber).trim() : ''
      return num && existingByNumber.has(num) && !toUpdateMap.has(num)
    }).length

    console.log('原始資料筆數:', datas.value.length)
    console.log('新增筆數:', newDatas.length)
    console.log('更新筆數（已存在且內容不同）:', toUpdate.length)
    console.log('跳過筆數（已存在且內容相同）:', sameContentCount)

    if (newDatas.length === 0 && toUpdate.length === 0) {
      loading.value = false
      let text = '沒有新資料需要匯入'
      if (sameContentCount > 0) {
        text += `，且已存在的 ${sameContentCount} 筆資料內容皆相同，無需更新。`
      } else {
        text += '（無有效客戶編號或客戶編號皆已存在且內容相同）。'
      }
      proxy.$swal({
        icon: 'info',
        title: '無需匯入或更新',
        text,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }

    const confirmParts = []
    if (newDatas.length > 0) confirmParts.push(`新增 ${newDatas.length} 筆`)
    if (toUpdate.length > 0) confirmParts.push(`更新 ${toUpdate.length} 筆（客戶編號已存在但內容不同）`)
    if (sameContentCount > 0) confirmParts.push(`跳過 ${sameContentCount} 筆（已存在且內容相同）`)

    const shouldContinue = await proxy.$swal({
      icon: 'warning',
      title: '確認匯入',
      text: `將${confirmParts.join('、')}。\n是否繼續？`,
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

    let addResult = null
    let editResult = null

    if (newDatas.length > 0) {
      const payload = newDatas.map((item) => ({
        customerNumber: item.customerNumber,
        datalist: JSON.stringify({
          ...item,
          createInfo: {
            snkey: store.state.pData.snkey,
            name: store.state.pData.username,
            time: dayjs().format('YYYY-MM-DD HH:mm:ss')
          },
          editInfo: []
        })
      }))
      addResult = await api.options(`general/addMulti/${store.state.databaseName}/customer`, payload)
    }

    if (toUpdate.length > 0) {
      const updatePayload = toUpdate.map(({ existing, excelRow }) => {
        const merged = { ...existing, ...excelRow }
        merged.createInfo = existing.createInfo || {}
        merged.editInfo = Array.isArray(existing.editInfo) ? [...existing.editInfo] : []
        merged.editInfo.unshift({
          snkey: store.state.pData.snkey,
          name: store.state.pData.username,
          time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
        return {
          snkey: existing.snkey,
          customerNumber: existing.customerNumber,
          datalist: JSON.stringify(merged),
          updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
      })
      editResult = await api.options(`general/editMulti/${store.state.databaseName}/customer`, updatePayload)
    }

    loading.value = false

    const addHasError = Array.isArray(addResult) && addResult.some((item) => item?.state === 0)
    const editHasError = Array.isArray(editResult) && editResult.some((item) => item?.state === 0)

    if (addHasError || editHasError) {
      proxy.$swal({
        icon: 'error',
        title: '匯入／更新過程發生錯誤',
        text: '部分資料可能未能成功匯入或更新，請稍後再試',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }

    const successParts = []
    if (newDatas.length > 0) successParts.push(`匯入 ${newDatas.length} 筆`)
    if (toUpdate.length > 0) successParts.push(`更新 ${toUpdate.length} 筆`)
    if (sameContentCount > 0) successParts.push(`跳過 ${sameContentCount} 筆（內容相同）`)

    proxy.$swal({
      icon: 'success',
      title: '完成',
      text: `已成功${successParts.join('、')}`,
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6'
    })

    closeDialog()
    emit('getAllData')
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

