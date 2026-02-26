<template>
  <div class="import-cost-composition">
    <v-dialog v-model="dialog" max-width="1200" persistent>
      <template #activator="{ props }">
        <v-btn 
          v-bind="props" 
          color="success" 
          variant="elevated"
          prepend-icon="mdi-file-excel"
          rounded="pill"
          elevation="6"
          @click="openDialog"
        >
          匯入成分組成
        </v-btn>
      </template>

      <v-card class="import-dialog" rounded="xl">
        <v-card-title class="d-flex dialog-title dialog-title--import" primary-title>
          <div class="text-h6 font-weight-bold">匯入成分組成 Excel</div>
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
              label="選擇成本組成 Excel 檔案"
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
                  <div class="stat-label">總原料數</div>
                  <div class="stat-value">{{ statistics.total }}</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <v-tooltip location="top" :disabled="statistics.existing === 0">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="stat-item stat-item--success" :style="statistics.existing > 0 ? 'cursor: help;' : ''">
                      <div class="stat-label">存在於資料庫</div>
                      <div class="stat-value">{{ statistics.existing }}</div>
                    </div>
                  </template>
                  <div style="max-width: 400px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">存在的原料料號：</div>
                    <div style="max-height: 300px; overflow-y: auto;">
                      <div v-for="result in comparisonResults.filter(r => r.exists)" :key="result.materialNumber" style="margin-bottom: 4px;">
                        <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">
                          {{ result.materialNumber }}
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
                      <div class="stat-label">不存在於資料庫</div>
                      <div class="stat-value">{{ statistics.notFound }}</div>
                    </div>
                  </template>
                  <div style="max-width: 400px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">不存在的原料料號：</div>
                    <div style="max-height: 300px; overflow-y: auto;">
                      <div v-for="result in comparisonResults.filter(r => !r.exists)" :key="result.materialNumber" style="margin-bottom: 4px;">
                        <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">
                          {{ result.materialNumber }}
                        </span>
                        <span style="margin-left: 8px; opacity: 0.9;">{{ result.materialName }}</span>
                      </div>
                    </div>
                  </div>
                </v-tooltip>
              </v-col>
              <v-col cols="6" md="3">
                <div class="stat-item stat-item--info">
                  <div class="stat-label">總 Composition 數</div>
                  <div class="stat-value">{{ statistics.totalCompositions }}</div>
                </div>
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
                比對結果預覽 (共 {{ comparisonResults.length }} 個原料)
              </span>
            </div>
            
            <v-alert type="info" variant="tonal" class="mb-4" density="compact">
              <div class="text-caption">
                <strong>說明：</strong>以下顯示 Excel 中每個原料料號的比對結果。
                <strong class="text-success">綠色</strong>表示原料存在於資料庫中，
                <strong class="text-error">紅色</strong>表示原料不存在於資料庫中。
              </div>
            </v-alert>

            <div class="preview-container">
              <v-table density="compact" class="comparison-table" fixed-header>
                <thead>
                  <tr>
                    <th class="text-left">原料料號</th>
                    <th class="text-left">狀態</th>
                    <th class="text-left">Excel 中的原料名稱</th>
                    <th class="text-left">資料庫中的原料名稱</th>
                    <th class="text-left">Composition 數量</th>
                    <th class="text-left">Composition 預覽</th>
                    <th class="text-left">Breakdown INCI Name 預覽</th>
                    <th class="text-center">展開</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(result, index) in comparisonResults" :key="index">
                    <tr :class="{ 'row-exists': result.exists, 'row-not-found': !result.exists }">
                      <td class="text-left">
                        <strong>{{ result.materialNumber }}</strong>
                      </td>
                      <td class="text-left">
                        <v-chip 
                          :color="result.exists ? 'success' : 'error'" 
                          size="small" 
                          variant="flat"
                        >
                          {{ result.exists ? '存在' : '不存在' }}
                        </v-chip>
                      </td>
                      <td class="text-left">{{ result.materialName || '-' }}</td>
                      <td class="text-left">
                        <span :class="{ 'text-success': result.exists }">
                          {{ result.existingMaterialName || '-' }}
                        </span>
                      </td>
                      <td class="text-left">
                        <v-chip size="small" variant="outlined">
                          {{ result.compositionCount }}
                        </v-chip>
                      </td>
                      <td class="text-left">
                        <div class="composition-preview">
                          {{ result.compositions.slice(0, 2).map(c => c.composition || '-').join(', ') }}
                          <span v-if="result.compositions.length > 2">...</span>
                        </div>
                      </td>
                      <td class="text-left">
                        <div class="composition-preview">
                          {{ result.compositions.slice(0, 2).map(c => c.breakdownInciName || '-').join(', ') }}
                          <span v-if="result.compositions.length > 2">...</span>
                        </div>
                      </td>
                      <td class="text-center">
                        <v-btn 
                          size="small" 
                          variant="text" 
                          icon="mdi-chevron-down"
                          @click="toggleExpand(index)"
                        ></v-btn>
                      </td>
                    </tr>
                    <tr v-if="expandedRows.has(index)" class="expanded-row">
                      <td colspan="8">
                        <div class="compositions-detail pa-4">
                          <div class="text-subtitle-2 mb-2">Composition 詳細資訊：</div>
                          <v-table density="compact" class="detail-table">
                            <thead>
                              <tr>
                                <th class="text-left">項次</th>
                                <th class="text-left">Breakdown INCI Name</th>
                                <th class="text-left">Composition</th>
                                <th class="text-left">wt%</th>
                                <th class="text-left">CAS NO.</th>
                                <th class="text-left">Function</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(comp, compIndex) in result.compositions" :key="compIndex">
                                <td class="text-left">{{ comp.itemNumber }}</td>
                                <td class="text-left">{{ comp.breakdownInciName || '-' }}</td>
                                <td class="text-left">{{ comp.composition || '-' }}</td>
                                <td class="text-left">{{ comp.wtPercent }}</td>
                                <td class="text-left">{{ comp.casNo || '-' }}</td>
                                <td class="text-left">{{ comp.ingredientFunction || '-' }}</td>
                              </tr>
                            </tbody>
                          </v-table>
                        </div>
                      </td>
                    </tr>
                  </template>
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
            v-if="comparisonResults.length > 0 && statistics.existing > 0"
            color="primary" 
            variant="flat" 
            class="text-white"
            :loading="loading"
            :disabled="loading"
            @click="processImport"
          >
            確認匯入 ({{ statistics.existing }} 個原料)
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
const rawHeaders = ref([])
const loading = ref(false)

// 新增的 refs 用於存儲分組和比對結果
const groupedMaterials = ref([]) // 分組後的原料資料：[{ materialNumber, materialName, compositions: [...] }]
const existingMaterials = ref(new Map()) // 現有原料資料映射表：Map<materialNumber, rawMaterialData>
const comparisonResults = ref([]) // 比對結果
const expandedRows = ref(new Set()) // 展開的行索引集合

// 欄位映射：中文欄位名 -> 英文欄位名（成分欄位優先使用 Breakdown INCI Name）
const fieldMapping = {
  '項次': 'itemNumber',
  '分類': 'category',
  '原料料號': 'materialNumber',
  '原料名稱': 'materialName',
  'Composition': 'composition',
  'wt%': 'wtPercent',
  'Breakdown INCI Name': 'breakdownInciName',
  'Function': 'ingredientFunction',
  '功能': 'ingredientFunction'
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
  rawHeaders.value = []
  errorMessage.value = ''
  groupedMaterials.value = []
  existingMaterials.value = new Map()
  comparisonResults.value = []
  expandedRows.value = new Set()
}

const onFileSelected = async (file) => {
  if (!file) {
    selectedFileName.value = ''
    rawHeaders.value = []
    errorMessage.value = ''
    groupedMaterials.value = []
    existingMaterials.value = new Map()
    comparisonResults.value = []
    expandedRows.value = new Set()
    return
  }

  selectedFileName.value = file.name
  errorMessage.value = ''
  rawHeaders.value = []
  groupedMaterials.value = []
  existingMaterials.value = new Map()
  comparisonResults.value = []
  expandedRows.value = new Set()

  try {
    await parseExcelFile(file)
  } catch (error) {
    console.error('Excel parsing error:', error)
    errorMessage.value = `解析 Excel 檔案時發生錯誤: ${error.message}`
    groupedMaterials.value = []
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
        
        // 檢查是否有「成分組成」工作表
        const targetSheetName = '成分組成'
        if (!workbook.SheetNames.includes(targetSheetName)) {
          reject(new Error(`找不到名為「${targetSheetName}」的工作表。可用的工作表: ${workbook.SheetNames.join(', ')}`))
          return
        }
        
        // 讀取「成分組成」工作表
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
          const trimmed = header ? String(header).trim() : ''
          if (fieldMapping[trimmed]) {
            headerIndexMap[fieldMapping[trimmed]] = index
          } else {
            if (trimmed.includes('Breakdown INCI Name')) {
              if (headerIndexMap['breakdownInciName'] === undefined) {
                headerIndexMap['breakdownInciName'] = index
              }
            } else if (trimmed.includes('CAS NO') || trimmed.includes('CAS NO.') || trimmed === 'CAS#') {
              if (headerIndexMap['casNo'] === undefined) {
                headerIndexMap['casNo'] = index
              }
            } else if (trimmed.includes('Function') || trimmed === '功能') {
              if (headerIndexMap['ingredientFunction'] === undefined) {
                headerIndexMap['ingredientFunction'] = index
              }
            }
          }
        })
        
        // 檢查必要欄位：需有「項次」「原料料號」「wt%」；「Breakdown INCI Name」與「Composition」各別獨立讀取，至少需其一存在
        const hasBreakdownInci = cleanedHeaders.some(h => String(h || '').trim().includes('Breakdown INCI Name'))
        const hasComposition = cleanedHeaders.some(h => String(h || '').trim() === 'Composition')
        const hasIngredientColumn = hasBreakdownInci || hasComposition
        const missingFields = []
        if (!hasIngredientColumn) missingFields.push('Breakdown INCI Name 或 Composition（至少需其一）')
        if (!cleanedHeaders.some(h => String(h || '').trim() === '項次')) missingFields.push('項次')
        if (!cleanedHeaders.some(h => String(h || '').trim() === '原料料號')) missingFields.push('原料料號')
        if (!cleanedHeaders.some(h => String(h || '').trim() === 'wt%')) missingFields.push('wt%')
        
        if (missingFields.length > 0) {
          const actualHeaders = cleanedHeaders.filter(h => h).join(', ')
          reject(new Error(`缺少必要欄位: ${missingFields.join(', ')}\n\n實際讀取到的欄位名: ${actualHeaders}`))
          return
        }
        
        rawHeaders.value = cleanedHeaders.filter(h => h && h.trim() !== '')
        
        // 按原料料號分組
        const materialGroups = new Map()
        let currentMaterialNumber = null
        let currentMaterialName = null
        let currentCategory = null
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          // 跳過空行
          if (row.every(cell => cell == null || cell === '' || String(cell).trim() === '')) {
            continue
          }
          
          // 抓取到的內容一律視為文字：將儲存格轉成字串並 trim
          const toText = (val) => (val == null || val === '') ? '' : String(val).trim()
          
          // 讀取欄位值：Breakdown INCI Name 與 Composition 各別獨立讀取，不合併
          const itemNumberIndex = headerIndexMap['itemNumber']
          const materialNumberIndex = headerIndexMap['materialNumber']
          const materialNameIndex = headerIndexMap['materialName']
          const categoryIndex = headerIndexMap['category']
          const breakdownInciIndex = headerIndexMap['breakdownInciName']
          const compositionIndex = headerIndexMap['composition']
          const wtPercentIndex = headerIndexMap['wtPercent']
          const casNoIndex = headerIndexMap['casNo']
          const functionIndex = headerIndexMap['ingredientFunction']
          
          const itemNumber = toText(row[itemNumberIndex])
          let materialNumber = toText(row[materialNumberIndex])
          // 原料料號正規化：若為純數字（如 30004），補上前綴 SC 以對應資料庫 SC30004
          if (materialNumber && /^\d{5}$/.test(materialNumber)) {
            materialNumber = 'SC' + materialNumber
          }
          const materialName = toText(row[materialNameIndex])
          const category = toText(row[categoryIndex])
          const breakdownInciName = breakdownInciIndex !== undefined ? toText(row[breakdownInciIndex]) : ''
          let composition = compositionIndex !== undefined ? toText(row[compositionIndex]) : ''
          // Composition 若為 Excel 百分比數字（如 1→100%、0.625→62.5%），轉成百分比文字以正確顯示
          if (composition && !isNaN(parseFloat(composition))) {
            const n = parseFloat(composition)
            if (n >= 0 && n <= 1) {
              composition = (n * 100).toString() + '%'
            } else if (n > 1 && n <= 100 && !composition.includes('%')) {
              composition = n.toString() + '%'
            }
          }
          const casNo = casNoIndex !== undefined ? toText(row[casNoIndex]) : ''
          const ingredientFunction = functionIndex !== undefined ? toText(row[functionIndex]) : ''
          let wtPercent = toText(row[wtPercentIndex])
          
          // 處理 wt% - Excel 百分比格式轉換
          if (wtPercent) {
            // 移除可能存在的 % 符號
            wtPercent = wtPercent.replace('%', '').trim()
            
            // 如果是數字
            if (!isNaN(parseFloat(wtPercent))) {
              let numValue = parseFloat(wtPercent)
              
              // 如果數值小於等於 1，很可能是 Excel 的百分比格式
              // （例如 0.625 代表 62.5%，1 代表 100%）
              // 需要乘以 100 轉換回實際百分比數值
              if (numValue > 0 && numValue <= 1) {
                numValue = numValue * 100
              }
              
              // 移除尾部多餘的 0
              wtPercent = numValue.toString()
            }
          }
          
          // 沒有項次時：若該列有原料料號且有成分內容（Breakdown INCI Name 或 Composition），自動給項次 1，否則略過
          let effectiveItemNumber = itemNumber
          if (!effectiveItemNumber) {
            if (!materialNumber || (!breakdownInciName && !composition)) {
              continue
            }
            effectiveItemNumber = '1'
          }
          
          // 如果有原料料號，開始新的分組或更新當前分組
          if (materialNumber) {
            currentMaterialNumber = materialNumber
            currentMaterialName = materialName
            currentCategory = category
            
            if (!materialGroups.has(materialNumber)) {
              materialGroups.set(materialNumber, {
                materialNumber: materialNumber,
                materialName: materialName,
                category: category,
                compositions: []
              })
            }
          }
          
          // 如果沒有原料料號但有項次，檢查是否有當前分組
          if (!materialNumber && !currentMaterialNumber) {
            reject(new Error(`第 ${i + 1} 行：原料料號為空但項次有值，且前面沒有有效的原料料號`))
            return
          }
          
          // 建立 Composition 物件（Breakdown INCI Name 與 Composition 各別儲存；顏色由表單後續選擇）
          const compositionData = {
            itemNumber: effectiveItemNumber,
            breakdownInciName: breakdownInciName,
            composition: composition,
            wtPercent: wtPercent,
            casNo: casNo,
            ingredientFunction: ingredientFunction,
            color: ''
          }
          
          // 加入到當前原料分組
          if (currentMaterialNumber && materialGroups.has(currentMaterialNumber)) {
            materialGroups.get(currentMaterialNumber).compositions.push(compositionData)
          }
        }
        
        if (materialGroups.size === 0) {
          reject(new Error('Excel 檔案中沒有有效的原料資料'))
          return
        }
        
        // 轉換為陣列
        const groupedData = Array.from(materialGroups.values())
        groupedMaterials.value = groupedData
        
        // 查詢現有原料資料並進行比對
        await queryAndCompareMaterials()
        
        resolve(groupedData)
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
    const rs = await api.get('raw_material')
    
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
  
  groupedMaterials.value.forEach((material) => {
    const exists = existingMaterials.value.has(material.materialNumber)
    const existingData = exists ? existingMaterials.value.get(material.materialNumber) : null
    
    results.push({
      materialNumber: material.materialNumber,
      materialName: material.materialName,
      category: material.category,
      compositionCount: material.compositions.length,
      compositions: material.compositions,
      exists: exists,
      existingMaterialName: existingData ? existingData.materialName : null,
      existingData: existingData
    })
  })
  
  comparisonResults.value = results
}

// 計算統計資訊
const statistics = computed(() => {
  const total = comparisonResults.value.length
  const existing = comparisonResults.value.filter(r => r.exists).length
  const notFound = total - existing
  const totalCompositions = comparisonResults.value.reduce((sum, r) => sum + r.compositionCount, 0)
  
  return {
    total,
    existing,
    notFound,
    totalCompositions
  }
})

// 切換展開/收合
const toggleExpand = (index) => {
  if (expandedRows.value.has(index)) {
    expandedRows.value.delete(index)
  } else {
    expandedRows.value.add(index)
  }
  // 觸發響應式更新
  expandedRows.value = new Set(expandedRows.value)
}

// 處理匯入（更新現有原料的 compositions）
const processImport = async () => {
  // 確認是否繼續
  const shouldContinue = await proxy.$swal({
    title: '確認更新原料資料',
    html: `
      <div style="text-align: left;">
        <p><strong>將更新以下原料的成分組成資訊：</strong></p>
        <ul style="margin-top: 10px;">
          <li>更新原料數量：<strong>${statistics.value.existing}</strong> 個</li>
          <li>總 Composition 數：<strong>${statistics.value.totalCompositions}</strong> 個</li>
        </ul>
        <p style="margin-top: 15px; color: #f44336;">
          <strong>注意：</strong>原料的成分組成資料將被<strong>完全替換</strong>為 Excel 中的資料。
        </p>
        <p style="color: #666;">
          不存在於資料庫的 ${statistics.value.notFound} 個原料將被跳過。
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
    // 過濾出存在於資料庫中的原料
    const materialsToUpdate = comparisonResults.value.filter(result => result.exists)
    
    if (materialsToUpdate.length === 0) {
      loading.value = false
      proxy.$swal({
        icon: 'info',
        title: '沒有需要更新的原料',
        text: '所有原料都不存在於資料庫中',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })
      return
    }
    
    // 構建更新資料
    const updatePayload = materialsToUpdate.map(material => {
      const existingData = material.existingData
      
      // 保留現有資料，只更新 compositions 欄位
      const updatedData = {
        ...existingData,
        compositions: material.compositions
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
        materialNumber: material.materialNumber,
        datalist: JSON.stringify(updatedData),
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    })
    
    console.log('準備更新的資料:', updatePayload)
    
    // 使用 editMulti API 更新資料
    const rs = await api.editMulti(`raw_material`, updatePayload)
    
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
            <p>已成功更新 <strong>${materialsToUpdate.length}</strong> 個原料的成分組成資料</p>
            <p style="margin-top: 10px; color: #666;">
              總共更新了 <strong>${statistics.value.totalCompositions}</strong> 個 Composition
            </p>
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
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.95), rgba(76, 175, 80, 0.85));
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

.preview-table {
  background: white;
  width: 100%;

  th {
    background-color: rgba(46, 125, 50, 0.1);
    font-weight: 600;
    color: var(--daycare-primary);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td, th {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(123, 163, 184, 0.2);
  }

  td {
    white-space: normal;
    word-break: break-word;
    max-width: 200px;
  }

  .cell-content {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  tbody tr:hover {
    background-color: rgba(46, 125, 50, 0.05);
  }

  tbody tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .limited-ingredient {
    color: #d32f2f !important;
    font-weight: 600;
  }
}

.limited-ingredient-text {
  color: #d32f2f;
  font-weight: 600;
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
  
  &--info .stat-value {
    color: #2196f3;
  }
}

.comparison-table {
  background: white;
  width: 100%;
  
  th {
    background-color: rgba(46, 125, 50, 0.1);
    font-weight: 600;
    color: var(--daycare-primary);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  td, th {
    padding: 12px;
    border-bottom: 1px solid rgba(123, 163, 184, 0.2);
  }
  
  .row-exists {
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
  
  .expanded-row {
    background-color: rgba(33, 150, 243, 0.05);
    
    td {
      padding: 0;
    }
  }
  
  .composition-preview {
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.compositions-detail {
  background: rgba(255, 255, 255, 0.5);
}

.detail-table {
  background: white;
  border-radius: 4px;
  
  th {
    background-color: rgba(33, 150, 243, 0.1);
    font-weight: 600;
    color: #1976d2;
  }
  
  td, th {
    padding: 8px 12px;
  }
}
</style>
