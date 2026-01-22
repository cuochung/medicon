<template>
  <div class="import-unit-price">
    <v-dialog v-model="dialog" max-width="1200" persistent>
      <template #activator="{ props }">
        <v-btn 
          v-bind="props" 
          color="info" 
          variant="elevated"
          prepend-icon="mdi-file-excel"
          rounded="pill"
          elevation="6"
          @click="openDialog"
        >
          匯入原料單價
        </v-btn>
      </template>

      <v-card class="import-dialog" rounded="xl">
        <v-card-title class="d-flex dialog-title dialog-title--import" primary-title>
          <div class="text-h6 font-weight-bold">匯入原料單價 Excel</div>
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
              label="選擇原料單價 Excel 檔案"
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

            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              <div class="text-caption">
                <strong>提示：</strong>建議使用含有「工作表5」(或 Sheet5) 的 Excel 檔案，並確保包含 ProdID 和 StdPrice 欄位。
              </div>
            </v-alert>
          </v-sheet>

          <!-- 統計資訊 -->
          <v-sheet 
            v-if="comparisonResults.length > 0" 
            class="statistics-section mt-4" 
            color="info-lighten-5" 
            variant="tonal" 
            rounded="lg"
          >
            <div class="info-section__header mb-3">
              <v-icon color="info" size="24">mdi-chart-bar</v-icon>
              <span class="text-subtitle-1 font-weight-bold text-info ml-2">統計資訊</span>
            </div>
            
            <v-row dense>
              <v-col cols="6" md="3">
                <div class="stat-item">
                  <div class="stat-label">總筆數</div>
                  <div class="stat-value">{{ statistics.total }}</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <v-tooltip location="top" :disabled="statistics.canUpdate === 0">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="stat-item stat-item--success" :style="statistics.canUpdate > 0 ? 'cursor: help;' : ''">
                      <div class="stat-label">可更新</div>
                      <div class="stat-value">{{ statistics.canUpdate }}</div>
                    </div>
                  </template>
                  <div style="max-width: 400px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">可更新的原料料號：</div>
                    <div style="max-height: 300px; overflow-y: auto;">
                      <div v-for="result in comparisonResults.filter(r => r.canUpdate)" :key="result.prodId" style="margin-bottom: 4px;">
                        <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">
                          {{ result.prodId }}
                        </span>
                        <span style="margin-left: 8px; opacity: 0.9;">{{ result.materialName }}</span>
                      </div>
                    </div>
                  </div>
                </v-tooltip>
              </v-col>
              <v-col cols="6" md="3">
                <v-tooltip location="top" :disabled="statistics.notFound === 0">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="stat-item stat-item--error" :style="statistics.notFound > 0 ? 'cursor: help;' : ''">
                      <div class="stat-label">料號不存在</div>
                      <div class="stat-value">{{ statistics.notFound }}</div>
                    </div>
                  </template>
                  <div style="max-width: 400px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">不存在的原料料號：</div>
                    <div style="max-height: 300px; overflow-y: auto;">
                      <div v-for="result in comparisonResults.filter(r => !r.exists)" :key="result.prodId" style="margin-bottom: 4px;">
                        <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">
                          {{ result.prodId }}
                        </span>
                      </div>
                    </div>
                  </div>
                </v-tooltip>
              </v-col>
              <v-col cols="6" md="3">
                <v-tooltip location="top" :disabled="statistics.noPrice === 0">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="stat-item stat-item--warning" :style="statistics.noPrice > 0 ? 'cursor: help;' : ''">
                      <div class="stat-label">無單價跳過</div>
                      <div class="stat-value">{{ statistics.noPrice }}</div>
                    </div>
                  </template>
                  <div style="max-width: 400px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">無單價的原料料號：</div>
                    <div style="max-height: 300px; overflow-y: auto;">
                      <div v-for="result in comparisonResults.filter(r => r.exists && !r.hasValidPrice)" :key="result.prodId" style="margin-bottom: 4px;">
                        <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">
                          {{ result.prodId }}
                        </span>
                        <span style="margin-left: 8px; opacity: 0.9;">{{ result.materialName }}</span>
                      </div>
                    </div>
                  </div>
                </v-tooltip>
              </v-col>
            </v-row>
          </v-sheet>

          <!-- 比對結果預覽 -->
          <v-sheet 
            v-if="comparisonResults.length > 0" 
            class="data-preview mt-4" 
            color="success-lighten-5" 
            variant="tonal" 
            rounded="lg"
          >
            <div class="info-section__header mb-3">
              <v-icon color="success" size="24">mdi-check-circle</v-icon>
              <span class="text-subtitle-1 font-weight-bold text-success ml-2">
                比對結果預覽 (共 {{ comparisonResults.length }} 筆)
              </span>
            </div>
            
            <v-alert type="info" variant="tonal" class="mb-4" density="compact">
              <div class="text-caption">
                <strong>說明：</strong>以下顯示 Excel 中每個原料料號的比對結果。
                <strong class="text-success">綠色</strong>表示可更新（料號存在且有單價），
                <strong class="text-error">紅色</strong>表示料號不存在，
                <strong class="text-warning">橙色</strong>表示料號存在但無單價。
              </div>
            </v-alert>

            <div class="preview-container">
              <v-table density="compact" class="comparison-table" fixed-header>
                <thead>
                  <tr>
                    <th class="text-left">原料料號 (ProdID)</th>
                    <th class="text-left">狀態</th>
                    <th class="text-left">單價 (StdPrice)</th>
                    <th class="text-left">資料庫中的原料名稱</th>
                    <th class="text-left">目前單價</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(result, index) in comparisonResults" :key="index" 
                      :class="{ 
                        'row-can-update': result.canUpdate, 
                        'row-not-found': !result.exists,
                        'row-no-price': result.exists && !result.hasValidPrice
                      }">
                    <td class="text-left">
                      <strong>{{ result.prodId }}</strong>
                    </td>
                    <td class="text-left">
                      <v-chip 
                        :color="result.canUpdate ? 'success' : (result.exists ? 'warning' : 'error')" 
                        size="small" 
                        variant="flat"
                      >
                        {{ result.canUpdate ? '可更新' : (result.exists ? '無單價' : '不存在') }}
                      </v-chip>
                    </td>
                    <td class="text-left">
                      <span :class="{ 'text-success font-weight-bold': result.hasValidPrice }">
                        {{ result.stdPrice || '-' }}
                      </span>
                    </td>
                    <td class="text-left">
                      <span :class="{ 'text-success': result.exists }">
                        {{ result.materialName || '-' }}
                      </span>
                    </td>
                    <td class="text-left">
                      <span class="text-grey">
                        {{ result.currentPrice || '-' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </v-table>
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
            v-if="comparisonResults.length > 0 && statistics.canUpdate > 0"
            color="primary" 
            variant="flat" 
            class="text-white"
            :loading="loading"
            :disabled="loading"
            @click="processImport"
          >
            確認匯入 ({{ statistics.canUpdate }} 個原料)
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
import { useStore } from '@/stores/useStore'
import * as XLSX from 'xlsx'
import api from '@/assets/js/api.js'
import dayjs from 'dayjs'

const { proxy } = getCurrentInstance()
const store = useStore()

// Emits
const emit = defineEmits(['imported'])

// Refs
const dialog = ref(false)
const selectedFile = ref(null)
const selectedFileName = ref('')
const errorMessage = ref('')
const loading = ref(false)

// 用於存儲解析和比對結果
const priceData = ref([]) // 從 Excel 解析的價格資料：[{ prodId, stdPrice }]
const existingMaterials = ref(new Map()) // 現有原料資料映射表：Map<materialNumber, rawMaterialData>
const comparisonResults = ref([]) // 比對結果

// 欄位映射：中文欄位名 -> 英文欄位名
const fieldMapping = {
  'ProdID': 'prodId',
  'StdPrice': 'stdPrice'
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
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  selectedFile.value = null
  selectedFileName.value = ''
  errorMessage.value = ''
  priceData.value = []
  existingMaterials.value = new Map()
  comparisonResults.value = []
}

const onFileSelected = async (file) => {
  if (!file) {
    selectedFileName.value = ''
    errorMessage.value = ''
    priceData.value = []
    existingMaterials.value = new Map()
    comparisonResults.value = []
    return
  }

  selectedFileName.value = file.name
  errorMessage.value = ''
  priceData.value = []
  existingMaterials.value = new Map()
  comparisonResults.value = []

  try {
    await parseExcelFile(file)
  } catch (error) {
    console.error('Excel parsing error:', error)
    errorMessage.value = `解析 Excel 檔案時發生錯誤: ${error.message}`
    priceData.value = []
    existingMaterials.value = new Map()
    comparisonResults.value = []
  }
}

const parseExcelFile = (file) => {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true })
        
        // 檢查是否有「工作表5」或 「Sheet5」
        let targetSheetName = null
        if (workbook.SheetNames.includes('工作表5')) {
          targetSheetName = '工作表5'
        } else if (workbook.SheetNames.includes('Sheet5')) {
          targetSheetName = 'Sheet5'
        } else {
          reject(new Error(`找不到名為「工作表5」或「Sheet5」的工作表。可用的工作表: ${workbook.SheetNames.join(', ')}`))
          return
        }
        
        // 讀取目標工作表
        const worksheet = workbook.Sheets[targetSheetName]
        
        // 將工作表轉換為 JSON，header: 1 表示使用第一行作為標題
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        })
        
        if (jsonData.length < 2) {
          reject(new Error('Excel 檔案至少需要包含標題行和一行資料'))
          return
        }
        
        // 第一行是欄位名
        const headers = jsonData[0]
        
        // 清理欄位名（去除前後空格和換行符）
        const cleanedHeaders = headers ? headers.map(h => {
          if (!h) return ''
          let cleaned = String(h).trim().replace(/\n/g, '').replace(/\r/g, '')
          return cleaned
        }) : []
        
        // 建立欄位索引映射
        const headerIndexMap = {}
        cleanedHeaders.forEach((header, index) => {
          if (fieldMapping[header]) {
            headerIndexMap[fieldMapping[header]] = index
          }
        })
        
        // 檢查必要欄位
        const coreFields = ['ProdID', 'StdPrice']
        const missingFields = []
        coreFields.forEach(fieldName => {
          const found = cleanedHeaders.some(h => {
            const cleaned = String(h).trim()
            return cleaned === fieldName
          })
          if (!found) {
            missingFields.push(fieldName)
          }
        })
        
        if (missingFields.length > 0) {
          const actualHeaders = cleanedHeaders.filter(h => h).join(', ')
          reject(new Error(`缺少必要欄位: ${missingFields.join(', ')}\n\n實際讀取到的欄位名: ${actualHeaders}`))
          return
        }
        
        // 解析資料
        const prices = []
        const prodIdSeen = new Map() // 用於處理重複的 ProdID，取第一筆
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          // 跳過空行
          if (row.every(cell => !cell || cell.toString().trim() === '')) {
            continue
          }
          
          // 讀取欄位值
          const prodIdIndex = headerIndexMap['prodId']
          const stdPriceIndex = headerIndexMap['stdPrice']
          
          let prodId = row[prodIdIndex] ? String(row[prodIdIndex]).trim() : ''
          let stdPrice = row[stdPriceIndex] ? String(row[stdPriceIndex]).trim() : ''
          
          // 跳過 ProdID 為空的行
          if (!prodId) {
            continue
          }
          
          // 處理重複的 ProdID，取第一筆
          if (prodIdSeen.has(prodId)) {
            continue
          }
          prodIdSeen.set(prodId, true)
          
          // 處理 StdPrice：轉換為數字
          let priceValue = null
          if (stdPrice && stdPrice !== '') {
            const parsed = parseFloat(stdPrice)
            if (!isNaN(parsed)) {
              priceValue = parsed.toString()
            }
          }
          
          prices.push({
            prodId: prodId,
            stdPrice: priceValue
          })
        }
        
        if (prices.length === 0) {
          reject(new Error('Excel 檔案中沒有有效的價格資料'))
          return
        }
        
        priceData.value = prices
        
        // 查詢現有原料資料並進行比對
        await queryAndCompareMaterials()
        
        resolve(prices)
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

// 查詢現有原料資料並進行比對
const queryAndCompareMaterials = async () => {
  try {
    // 查詢所有原料資料
    const rs = await api.get('rawMaterial')
    
    if (rs && rs.length > 0) {
      // 建立原料料號到原料資料的映射表
      const materialsMap = new Map()
      rs.forEach((item) => {
        try {
          const parsedData = JSON.parse(item.datalist)
          if (parsedData.materialNumber) {
            materialsMap.set(parsedData.materialNumber, {
              snkey: item.snkey,
              ...parsedData
            })
          }
        } catch (error) {
          console.warn('解析原料資料時發生錯誤:', error)
        }
      })
      existingMaterials.value = materialsMap
    } else {
      existingMaterials.value = new Map()
    }
    
    // 進行比對
    compareMaterials()
  } catch (error) {
    console.error('查詢原料資料時發生錯誤:', error)
    errorMessage.value = `查詢原料資料時發生錯誤: ${error.message}`
  }
}

// 比對 Excel 資料與現有原料資料
const compareMaterials = () => {
  const results = []
  
  priceData.value.forEach((priceItem) => {
    const exists = existingMaterials.value.has(priceItem.prodId)
    const existingData = exists ? existingMaterials.value.get(priceItem.prodId) : null
    const hasValidPrice = priceItem.stdPrice !== null && priceItem.stdPrice !== ''
    const canUpdate = exists && hasValidPrice
    
    results.push({
      prodId: priceItem.prodId,
      stdPrice: priceItem.stdPrice,
      exists: exists,
      hasValidPrice: hasValidPrice,
      canUpdate: canUpdate,
      materialName: existingData ? existingData.materialName : null,
      currentPrice: existingData ? existingData.unitPrice : null,
      existingData: existingData
    })
  })
  
  comparisonResults.value = results
}

// 計算統計資訊
const statistics = computed(() => {
  const total = comparisonResults.value.length
  const canUpdate = comparisonResults.value.filter(r => r.canUpdate).length
  const notFound = comparisonResults.value.filter(r => !r.exists).length
  const noPrice = comparisonResults.value.filter(r => r.exists && !r.hasValidPrice).length
  
  return {
    total,
    canUpdate,
    notFound,
    noPrice
  }
})

// 處理匯入（更新現有原料的 unitPrice）
const processImport = async () => {
  // 確認是否繼續
  const shouldContinue = await proxy.$swal({
    title: '確認更新原料單價',
    html: `
      <div style="text-align: left;">
        <p><strong>將更新以下原料的單價資訊：</strong></p>
        <ul style="margin-top: 10px;">
          <li>更新原料數量：<strong>${statistics.value.canUpdate}</strong> 個</li>
        </ul>
        <p style="margin-top: 15px; color: #f44336;">
          <strong>注意：</strong>原料的單價資料將被<strong>完全替換</strong>為 Excel 中的資料。
        </p>
        <p style="color: #666;">
          料號不存在的 ${statistics.value.notFound} 筆資料及無單價的 ${statistics.value.noPrice} 筆資料將被跳過。
        </p>
      </div>
    `,
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  })
  
  if (!shouldContinue.isConfirmed) {
    return
  }
  
  loading.value = true
  
  try {
    // 過濾出可更新的原料
    const materialsToUpdate = comparisonResults.value.filter(result => result.canUpdate)
    
    if (materialsToUpdate.length === 0) {
      loading.value = false
      proxy.$swal({
        icon: 'info',
        title: '沒有需要更新的原料',
        text: '所有原料都無法更新（料號不存在或無單價）',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }
    
    // 構建更新資料
    const updatePayload = materialsToUpdate.map(material => {
      const existingData = material.existingData
      
      // 保留現有資料，只更新 unitPrice 欄位
      const updatedData = {
        ...existingData,
        unitPrice: material.stdPrice
      }
      
      // 更新 editInfo
      if (!updatedData.editInfo) {
        updatedData.editInfo = []
      }
      updatedData.editInfo.unshift({
        snkey: store.state.pData.snkey,
        name: store.state.pData.username,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      })
      
      return {
        snkey: existingData.snkey,
        materialNumber: material.prodId,
        datalist: JSON.stringify(updatedData),
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    })
    
    console.log('準備更新的資料:', updatePayload)
    
    // 使用 editMulti API 更新資料
    const rs = await api.options(`general/editMulti/${store.state.databaseName}/rawMaterial`, updatePayload)
    
    console.log('API 回應:', rs)
    
    loading.value = false
    
    // 檢查回應結果
    if (!rs) {
      proxy.$swal({
        icon: 'error',
        title: '更新失敗',
        text: '伺服器沒有返回回應，請檢查網路連線或稍後再試',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }
    
    // 檢查是否有錯誤
    const hasError = Array.isArray(rs) && rs.some((item) => item?.state === 0)
    
    if (hasError) {
      const errorItems = Array.isArray(rs) ? rs.filter((item) => item?.state === 0) : []
      console.error('更新錯誤的項目:', errorItems)
      proxy.$swal({
        icon: 'error',
        title: '更新過程發生錯誤',
        text: `部分原料可能未能成功更新。\n錯誤項目數: ${errorItems.length}`,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
    } else {
      proxy.$swal({
        icon: 'success',
        title: '更新成功',
        html: `
          <div style="text-align: left;">
            <p>已成功更新 <strong>${materialsToUpdate.length}</strong> 個原料的單價資料</p>
          </div>
        `,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      
      // 通知父組件重新載入資料
      emit('imported')
      
      // 關閉對話框
      closeDialog()
    }
  } catch (error) {
    loading.value = false
    console.error('更新錯誤:', error)
    proxy.$swal({
      icon: 'error',
      title: '更新失敗',
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
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(66, 165, 245, 0.85));
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

.preview-container {
  max-height: 600px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid rgba(123, 163, 184, 0.2);
}

.statistics-section {
  padding: 18px 20px;
  background-color: rgba(255, 255, 255, 0.86) !important;
  border: 1px solid rgba(33, 150, 243, 0.25);
  box-shadow: 0 8px 22px rgba(33, 150, 243, 0.12);
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  .stat-label {
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--daycare-primary);
  }
  
  &--success .stat-value {
    color: #4caf50;
  }
  
  &--error .stat-value {
    color: #f44336;
  }
  
  &--warning .stat-value {
    color: #ff9800;
  }
}

.comparison-table {
  background: white;
  width: 100%;
  
  th {
    background-color: rgba(33, 150, 243, 0.1);
    font-weight: 600;
    color: #1976d2;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  td, th {
    padding: 12px;
    border-bottom: 1px solid rgba(123, 163, 184, 0.2);
  }
  
  .row-can-update {
    background-color: rgba(76, 175, 80, 0.05);
    
    &:hover {
      background-color: rgba(76, 175, 80, 0.1);
    }
  }
  
  .row-not-found {
    background-color: rgba(244, 67, 54, 0.05);
    
    &:hover {
      background-color: rgba(244, 67, 54, 0.1);
    }
  }
  
  .row-no-price {
    background-color: rgba(255, 152, 0, 0.05);
    
    &:hover {
      background-color: rgba(255, 152, 0, 0.1);
    }
  }
}
</style>
