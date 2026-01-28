<template>
  <div class="import-raw-material">
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
          匯入原料資料
        </v-btn>
      </template>

      <v-card class="import-dialog" rounded="xl">
        <v-card-title class="d-flex dialog-title dialog-title--import" primary-title>
          <div class="text-h6 font-weight-bold">匯入原料資料</div>
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
                  <th>原料料號</th>
                  <th>商品名</th>
                  <th>原料名稱</th>
                  <th>類別</th>
                  <th>提供廠商</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in datas.slice(0, 5)" :key="index">
                  <td>{{ item.materialNumber || '-' }}</td>
                  <td>{{ item.productName || '-' }}</td>
                  <td>{{ item.materialName || '-' }}</td>
                  <td>{{ item.category || '-' }}</td>
                  <td>{{ item.supplier || '-' }}</td>
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
const fieldMapping = {
  '項次': 'itemNumber',
  '類別': 'category',
  '原料料號': 'materialNumber',
  '商品名': 'productName',
  '原料名稱': 'materialName',
  'INCI NAME': 'inciName',
  '中文名': 'chineseName',
  '功效': 'efficacy',
  '提供廠商': 'supplier',
  '廠牌': 'brand',
  'MOQ(Kg)': 'moq',
  '單價': 'unitPrice',
  'CAS#': 'casNumber',
  'pH': 'ph'
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
        
        // 檢查是否有「原料特性表」工作表
        const targetSheetName = '原料特性表'
        if (!workbook.SheetNames.includes(targetSheetName)) {
          reject(new Error(`找不到名為「${targetSheetName}」的工作表。可用的工作表: ${workbook.SheetNames.join(', ')}`))
          return
        }
        
        // 讀取「原料特性表」工作表
        const worksheet = workbook.Sheets[targetSheetName]
        
        // 將工作表轉換為 JSON，header: 1 表示使用第一行作為標題
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        })
        
        // Excel 格式：第1列為欄位名，第2列開始為資料內容
        if (jsonData.length < 2) {
          reject(new Error('Excel 檔案至少需要包含第1列（欄位名）和第2列（資料）'))
          return
        }
        
        // 第1列（索引 0）是中文欄位名
        const headers = jsonData[0]
        const headerRowIndex = 0
        
        // 清理欄位名（去除前後空格和換行符）
        const cleanedHeaders = headers ? headers.map(h => h ? String(h).trim().replace(/\n/g, '').replace(/\r/g, '') : '') : []
        
        // 驗證欄位（原料料號不是必要欄位，但建議要有）
        // 移除原料料號的必要性檢查，允許沒有原料料號的資料匯入
        
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
        
        // 轉換資料：從第2列開始（索引 1）
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
            let value = row[index] ? String(row[index]).trim() : ''
            
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
    // 先取得資料庫中已存在的 materialNumber
    const existingDataPayload = {
      columns: 'materialNumber'
    }
    const existingDataResponse = await api.options(`general/getByColumns/${store.state.databaseName}/raw_material`, existingDataPayload)
    console.log('existingDataResponse', existingDataResponse)
   
    // 從回應中提取已存在的 materialNumber 列表
    const existingMaterialNumbers = new Set()
    if (Array.isArray(existingDataResponse)) {
      existingDataResponse.forEach((item) => {
        try {
          let materialNumber = null
          
          // 如果直接有 materialNumber 欄位
          if (item.materialNumber) {
            materialNumber = String(item.materialNumber).trim()
          } 
          // 如果需要從 datalist 解析
          else if (item.datalist) {
            const parsedData = JSON.parse(item.datalist || '{}')
            if (parsedData.materialNumber) {
              materialNumber = String(parsedData.materialNumber).trim()
            }
          }
          
          if (materialNumber) {
            existingMaterialNumbers.add(materialNumber)
          }
        } catch (error) {
          console.warn('解析已存在資料時發生錯誤:', error)
        }
      })
    }
    
    console.log('已存在的 materialNumber:', Array.from(existingMaterialNumbers))

    // 找出重複的資料（已存在於資料庫中的資料）
    // 只有當原料料號存在且重複時才算重複
    const duplicateDatas = datas.value.filter((item) => {
      const materialNumber = item.materialNumber ? String(item.materialNumber).trim() : ''
      return materialNumber && existingMaterialNumbers.has(materialNumber)
    })
    
    // 過濾出不存在於資料庫中的資料
    // 沒有原料料號的資料也視為新資料，允許匯入
    const newDatas = datas.value.filter((item) => {
      const materialNumber = item.materialNumber ? String(item.materialNumber).trim() : ''
      // 如果沒有原料料號，視為新資料
      // 如果有原料料號但不重複，也視為新資料
      return !materialNumber || !existingMaterialNumbers.has(materialNumber)
    })
    
    const skippedCount = datas.value.length - newDatas.length
    
    console.log('原始資料筆數:', datas.value.length)
    console.log('新資料筆數:', newDatas.length)
    console.log('重複的筆數:', duplicateDatas.length)
    
    // 如果有重複資料，顯示詳細內容
    if (duplicateDatas.length > 0) {
      console.log('==== 重複的資料詳細內容 ====')
      console.table(duplicateDatas)
      console.log('重複資料完整物件:', duplicateDatas)
    }
    
    // 如果沒有新資料需要匯入
    if (newDatas.length === 0) {
      loading.value = false
      proxy.$swal({
        icon: 'info',
        title: '沒有新資料需要匯入',
        text: `所有 ${datas.value.length} 筆資料的原料料號都已存在於資料庫中`,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }
    
    // 如果有部分資料已存在，提示用戶
    if (skippedCount > 0) {
      // 取得重複的原料料號列表（從 duplicateDatas 中提取）
      const duplicateMaterialNumbers = duplicateDatas
        .map(item => item.materialNumber)
        .filter(num => num) // 過濾掉空值
      
      // 如果重複料號太多，只顯示前 20 個
      const displayNumbers = duplicateMaterialNumbers.slice(0, 20)
      const hasMore = duplicateMaterialNumbers.length > 20
      const numbersList = displayNumbers.join('、') + (hasMore ? `... 等 ${duplicateMaterialNumbers.length} 個` : '')
      
      const shouldContinue = await proxy.$swal({
        icon: 'warning',
        title: '發現重複資料',
        html: `
          <div style="text-align: left;">
            <p>共有 <strong>${skippedCount}</strong> 筆資料的原料料號已存在，將跳過這些資料。</p>
            <p style="margin-top: 12px;">重複的原料料號：</p>
            <div style="
              max-height: 150px; 
              overflow-y: auto; 
              background: #f5f5f5; 
              padding: 12px; 
              border-radius: 6px; 
              margin-top: 8px;
              border: 1px solid #ddd;
              font-family: monospace;
              font-size: 14px;
              line-height: 1.6;
            ">
              ${numbersList || '(無料號)'}
            </div>
            <p style="margin-top: 12px;">將匯入 <strong>${newDatas.length}</strong> 筆新資料。</p>
            <p style="margin-top: 8px; color: #666;">是否繼續？</p>
          </div>
        `,
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
        materialNumber: item.materialNumber,
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

    // 使用 CI 伺服器新增多筆資料(沒開下面那個Rust伺服器時可以用)
    const rs = await api.options(`general/addMulti/${store.state.databaseName}/raw_material`, payload)
    
    // 使用 Rust 伺服器新增多筆資料
    // const rs = await api.rustAddMulti('raw_material', payload)
    
    console.log('API 回應:', rs)
    
    loading.value = false
    
    // 判斷回應結果
    if (rs.ok && rs.rowsInserted > 0) {
      let successMessage = `已成功匯入 ${rs.rowsInserted} 筆資料`
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
    } else if (rs.ok && rs.rowsInserted === 0) {
      proxy.$swal({
        icon: 'warning',
        title: '匯入完成',
        text: '匯入成功但沒有資料被寫入',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
    } else {
      proxy.$swal({
        icon: 'error',
        title: '匯入失敗',
        text: `匯入失敗: ${JSON.stringify(rs)}`,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
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
