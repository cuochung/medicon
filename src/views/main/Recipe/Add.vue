<template>
  <div class="recipe-add">
    <v-dialog v-model="dialog" max-width="1400" persistent scrollable fullscreen>
      <template #activator="{ props }">
        <v-btn v-bind="props" class="recipe-add-btn" color="primary" variant="elevated"
          prepend-icon="mdi-flask-plus" rounded="pill" elevation="6" @click="addProcess">
          新增配方
        </v-btn>
      </template>

      <v-card class="recipe-dialog" rounded="xl">
        <v-card-title class="d-flex" :class="titleStyle" primary-title>
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" class="ml-2" variant="text" color="white" @click="dialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="form">
            <!-- 基本資訊區 -->
            <v-sheet class="info-section" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-information-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">基本資料</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="配方編號"
                    prepend-icon="mdi-identifier"
                    v-model="list.recipeNumber"
                    :rules="emptyRules"
                    autofocus
                    density="comfortable"
                    variant="outlined"
                    hint="配方編號不可重複"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="產品名稱"
                    prepend-icon="mdi-package-variant"
                    v-model="list.productName"
                    :rules="emptyRules"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="版本"
                    prepend-icon="mdi-tag"
                    v-model="list.version"
                    density="comfortable"
                    variant="outlined"
                    hint="例如：v1.0"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="產品規格"
                    prepend-icon="mdi-ruler"
                    v-model="list.productSpec"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="組合數量"
                    prepend-icon="mdi-package-variant-closed"
                    v-model="list.combinationQuantity"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                    @input="recalculateAll"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="生產批量"
                    prepend-icon="mdi-factory"
                    v-model="list.productionBatch"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                    @input="recalculateAll"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    label="備註"
                    prepend-icon="mdi-note-text"
                    v-model="list.notes"
                    density="comfortable"
                    variant="outlined"
                    rows="2"
                    auto-grow
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-sheet>

            <!-- 配方明細區 -->
            <v-sheet class="info-section mt-4" color="success-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="success" size="24">mdi-format-list-bulleted</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-success ml-2">配方明細</span>
                <v-chip 
                  v-if="list.items && list.items.length > 0" 
                  size="small" 
                  color="success" 
                  variant="tonal"
                  class="ml-2"
                >
                  {{ list.items.length }} 項
                </v-chip>
                <v-spacer></v-spacer>
                <v-btn 
                  size="small" 
                  color="success" 
                  variant="flat"
                  class="text-white"
                  prepend-icon="mdi-plus"
                  @click="addNewItem"
                >
                  新增原料
                </v-btn>
              </div>
              
              <v-alert 
                v-if="!list.items || list.items.length === 0" 
                type="info" 
                variant="tonal" 
                density="compact"
                class="mt-3"
              >
                尚未新增任何原料，請點擊「新增原料」按鈕開始新增
              </v-alert>

              <div v-else class="mt-3">
                <!-- 成本資訊 -->
                <v-row dense class="mb-3">
                  <v-col cols="12" md="4">
                    <v-card variant="tonal" color="info">
                      <v-card-text>
                        <div class="text-caption">總生產量</div>
                        <div class="text-h6">{{ list.totalProduction }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-card variant="tonal" color="warning">
                      <v-card-text>
                        <div class="text-caption">總成本</div>
                        <div class="text-h6">{{ formatNumber(calculateTotalTTprs()) }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-card variant="tonal" color="success">
                      <v-card-text>
                        <div class="text-caption">單位成本</div>
                        <div class="text-h6">{{ formatNumber(list.unitCost) }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-table density="comfortable" class="recipe-items-table elevation-2">
                  <thead>
                    <tr>
                      <th class="text-center" style="width: 60px;">序號</th>
                      <th class="text-left" style="width: 120px;">項次</th>
                      <th class="text-left" style="width: 280px;">料號</th>
                      <th class="text-left">原料名稱</th>
                      <th class="text-left" style="width: 120px;">百分比(%)</th>
                      <th class="text-left" style="width: 100px;">quprs</th>
                      <th class="text-left" style="width: 100px;">TTprs</th>
                      <th class="text-left" style="width: 100px;">廠值</th>
                      <th class="text-left" style="width: 120px;">廠商</th>
                      <th class="text-center" style="width: 80px;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in list.items" :key="index" class="item-row">
                      <td class="text-center">
                        <v-chip size="small" color="success" variant="outlined">
                          {{ item.sequence }}
                        </v-chip>
                      </td>
                      <td>
                        <v-text-field
                          v-model="item.itemNumber"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="A-1"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-autocomplete
                          v-model="item.materialNumber"
                          :items="materialOptions"
                          item-title="materialNumber"
                          item-value="materialNumber"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="選擇或搜尋料號"
                          clearable
                          @update:model-value="loadMaterialData(item)"
                        >
                          <template v-slot:item="{ props, item: materialItem }">
                            <v-list-item v-bind="props">
                              <template v-slot:title>
                                <span class="font-weight-medium">{{ materialItem.raw.materialNumber }}</span>
                                <span class="text-grey ml-2">{{ materialItem.raw.materialName }}</span>
                              </template>
                              <template v-slot:subtitle>
                                單價: {{ materialItem.raw.unitPrice }} | 廠商: {{ materialItem.raw.supplier || '-' }}
                              </template>
                            </v-list-item>
                          </template>
                        </v-autocomplete>
                      </td>
                      <td>{{ item.materialName }}</td>
                      <td>
                        <v-text-field
                          v-model="item.percentage"
                          density="compact"
                          variant="outlined"
                          hide-details
                          type="number"
                          step="0.01"
                          placeholder="2.00"
                          @input="calculateItemValues(item)"
                        ></v-text-field>
                      </td>
                      <td>{{ formatInteger(item.quprs) }}</td>
                      <td>{{ formatNumber(item.ttprs) }}</td>
                      <td>{{ formatNumber(item.factoryValue) }}</td>
                      <td>{{ item.supplier || '-' }}</td>
                      <td class="text-center">
                        <v-tooltip text="刪除此原料" location="top">
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="small"
                              icon="mdi-delete-outline"
                              color="error"
                              variant="text"
                              @click="removeItem(index)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </td>
                    </tr>
                    <!-- 小計行 -->
                    <tr class="total-row">
                      <td colspan="4" class="text-right font-weight-bold">小計:</td>
                      <td class="font-weight-bold">
                        <v-chip 
                          size="small" 
                          :color="getTotalPercentageColor()" 
                          variant="tonal"
                        >
                          {{ calculateTotalPercentage() }}%
                        </v-chip>
                      </td>
                      <td>-</td>
                      <td class="font-weight-bold">{{ formatNumber(calculateTotalTTprs()) }}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-sheet>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" class="text-white" @click="addOK"
            v-if="processType == 'add'">確認新增</v-btn>
          <v-btn color="success" variant="flat" class="text-white" @click="editOK"
            v-if="processType == 'edit'">確認修改</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, nextTick, getCurrentInstance, onMounted, computed } from 'vue'
import { useStore } from '@/stores/useStore'
import dayjs from "dayjs"
import api from '@/assets/js/api'

const { proxy } = getCurrentInstance()
const store = useStore()

// Props
const props = defineProps({
  usingDatabase: String,
  recipeItems: Array
})

// Emits
const emit = defineEmits(['getAllData'])

// Refs
const dialog = ref(false)
const list = ref({
  recipeNumber: '',
  productName: '',
  productSpec: '1000',
  combinationQuantity: 1,
  productionBatch: 1000,
  totalProduction: 1000,
  unitCost: 0,
  version: '',
  notes: '',
  items: [],
  createInfo: {},
  editInfo: []
})
const processType = ref('')
const title = ref('')
const titleStyle = ref('')
const form = ref(null)

// 原料資料
const materialList = ref([])

// 原料選項（用於 autocomplete）
const materialOptions = computed(() => {
  return materialList.value.map(m => ({
    materialNumber: m.materialNumber,
    materialName: m.materialName,
    unitPrice: m.unitPrice,
    supplier: m.supplier,
    displayText: `${m.materialNumber} - ${m.materialName}`
  }))
})

// Validation rules
const emptyRules = [(v) => !!v || "不可空白"]

// Methods
const addProcess = () => {
  processType.value = "add"
  title.value = "新增配方資料"
  titleStyle.value = "dialog-title dialog-title--add"
  list.value = {
    recipeNumber: '',
    productName: '',
    productSpec: '1000',
    combinationQuantity: 1,
    productionBatch: 1000,
    totalProduction: 1000,
    unitCost: 0,
    version: '',
    notes: '',
    items: [],
    createInfo: {},
    editInfo: []
  }
  nextTick(() => {
    if (form.value) {
      form.value.resetValidation()
    }
  })
}

const editProcess = (item) => {
  processType.value = "edit"
  title.value = "修改配方資料"
  titleStyle.value = "dialog-title dialog-title--edit"
  list.value = { 
    recipeNumber: item.recipeNumber || '',
    productName: item.productName || '',
    productSpec: item.productSpec || '1000',
    combinationQuantity: item.combinationQuantity || 1,
    productionBatch: item.productionBatch || 1000,
    totalProduction: item.totalProduction || 1000,
    unitCost: item.unitCost || 0,
    version: item.version || '',
    notes: item.notes || '',
    items: item.items ? JSON.parse(JSON.stringify(item.items)) : [],
    snkey: item.snkey,
    createInfo: item.createInfo || {},
    editInfo: item.editInfo || []
  }
  dialog.value = true
}

// 載入原料列表
const loadMaterials = async () => {
  try {
    const rs = await api.get('raw_material')
    if (rs && rs.length > 0) {
      materialList.value = rs.map(item => {
        const data = JSON.parse(item.datalist)
        return {
          materialNumber: data.materialNumber || '',
          materialName: data.materialName || '',
          unitPrice: data.unitPrice || 0,
          supplier: data.supplier || ''
        }
      }).filter(item => item.materialNumber)
    }
  } catch (error) {
    console.error('載入原料列表失敗:', error)
  }
}

// 新增空白項目
const addNewItem = () => {
  const nextSequence = list.value.items.length + 1
  const newItem = {
    sequence: nextSequence,
    itemNumber: '',
    materialNumber: '',
    materialName: '',
    percentage: 0,
    quprs: 0,
    ttprs: 0,
    factoryValue: 0,
    supplier: ''
  }
  list.value.items.push(newItem)
}

// 根據料號載入原料資料
const loadMaterialData = async (item) => {
  if (!item.materialNumber || item.materialNumber.trim() === '') {
    return
  }
  
  const materialNumber = item.materialNumber.trim()
  const material = materialList.value.find(m => m.materialNumber === materialNumber)
  
  if (material) {
    item.materialName = material.materialName
    item.quprs = parseFloat(material.unitPrice) * 1000 || 0
    item.supplier = material.supplier
    
    // 如果已有百分比，重新計算
    if (item.percentage > 0) {
      calculateItemValues(item)
    }
    
    proxy.$swal({
      icon: 'success',
      title: '原料資料已載入',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500
    })
  } else {
    proxy.$swal({
      icon: 'error',
      title: `找不到料號：${materialNumber}`,
      text: '請確認料號是否正確',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    })
    // 清空相關資料
    item.materialName = ''
    item.quprs = 0
    item.supplier = ''
  }
}

// 計算單項數值
const calculateItemValues = (item) => {
  const percentage = parseFloat(item.percentage) || 0
  const productionBatch = parseFloat(list.value.productionBatch) || 1000
  const quprs = parseFloat(item.quprs) || 0
  
  // 廠值 = 生產批量 × 百分比 / 100
  item.factoryValue = (productionBatch * percentage / 100).toFixed(4)
  
  // TTprs = quprs × 廠值 / 1000
  item.ttprs = (quprs * item.factoryValue / 1000).toFixed(4)
  
  // 重新計算總成本和單位成本
  recalculateTotal()
}

// 重新計算所有項目
const recalculateAll = () => {
  // 計算總生產量
  const combinationQuantity = parseFloat(list.value.combinationQuantity) || 1
  const productionBatch = parseFloat(list.value.productionBatch) || 1000
  list.value.totalProduction = combinationQuantity * productionBatch
  
  // 重新計算所有項目的數值
  list.value.items.forEach(item => {
    calculateItemValues(item)
  })
}

// 計算總成本
const recalculateTotal = () => {
  const totalCost = calculateTotalTTprs()
  const totalProduction = parseFloat(list.value.totalProduction) || 1
  
  // 單位成本 = 總成本 / 總生產量
  list.value.unitCost = (totalCost / totalProduction).toFixed(4)
}

// 刪除原料
const removeItem = (index) => {
  proxy.$swal({
    title: '確認刪除此原料？',
    text: '此操作無法復原',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then((result) => {
    if (result.isConfirmed) {
      list.value.items.splice(index, 1)
      // 重新編號
      list.value.items.forEach((item, idx) => {
        item.sequence = idx + 1
      })
      // 重新計算總成本
      recalculateTotal()
    }
  })
}

// 格式化數字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return num.toFixed(4)
}

// 格式化整數
const formatInteger = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return Math.round(num).toString()
}

// 計算總百分比
const calculateTotalPercentage = () => {
  const total = list.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.percentage) || 0)
  }, 0)
  return total.toFixed(2)
}

// 計算總 TTprs
const calculateTotalTTprs = () => {
  return list.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.ttprs) || 0)
  }, 0)
}

// 取得總百分比顏色
const getTotalPercentageColor = () => {
  const total = parseFloat(calculateTotalPercentage())
  if (Math.abs(total - 100) < 0.01) return 'success'
  if (total > 100) return 'error'
  return 'warning'
}

const addOK = async () => {
  // 新增時配方編號不可重覆
  if (props.recipeItems && props.recipeItems.length > 0) {
    const match = props.recipeItems.find(i => i.recipeNumber == list.value.recipeNumber)
    if (match) {
      proxy.$swal({ icon: "error", title: "配方編號不可重覆!!" })
      return false
    }
  }

  // 檢查配方明細是否有空白料號
  if (list.value.items && list.value.items.length > 0) {
    const emptyMaterialNumber = list.value.items.find(item => !item.materialNumber || item.materialNumber.trim() === '')
    if (emptyMaterialNumber) {
      proxy.$swal({ 
        icon: "error", 
        title: "配方明細資料不完整", 
        text: "請確認所有原料都已選擇料號"
      })
      return false
    }
  }

  // 確認新增
  const { valid } = await form.value.validate()
  if (valid) {
    // 最後一次計算確保數據正確
    recalculateAll()
    
    list.value.createInfo = {
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    const postData = {
      recipeNumber: list.value.recipeNumber,
      datalist: JSON.stringify(list.value)
    }

    console.log('準備新增配方:', postData)

    try {
      const rs = await api.add(props.usingDatabase, postData)
      console.log('API 回應:', rs)
      
      if (rs && rs.state == 1) {
        proxy.$swal({ icon: "success", title: "已新增" })
        emit("getAllData")
        dialog.value = false
      } else {
        proxy.$swal({ 
          icon: "error", 
          title: "新增失敗", 
          text: rs?.message || "請確認資料庫連線是否正常"
        })
      }
    } catch (err) {
      console.error('新增配方錯誤:', err)
      proxy.$swal({ icon: "error", title: "資料存取錯誤", text: err.message || err })
    }
  } else {
    proxy.$swal({ icon: "error", title: "資料輸入不完整!!請再次確認!!" })
  }
}

const editOK = async () => {
  // 檢查配方明細是否有空白料號
  if (list.value.items && list.value.items.length > 0) {
    const emptyMaterialNumber = list.value.items.find(item => !item.materialNumber || item.materialNumber.trim() === '')
    if (emptyMaterialNumber) {
      proxy.$swal({ 
        icon: "error", 
        title: "配方明細資料不完整", 
        text: "請確認所有原料都已選擇料號"
      })
      return false
    }
  }

  // 確認修改
  const { valid } = await form.value.validate()
  if (valid) {
    // 檢查配方編號是否與其他配方重複（排除自己）
    if (props.recipeItems && props.recipeItems.length > 0) {
      const match = props.recipeItems.find(i => 
        i.recipeNumber == list.value.recipeNumber && i.snkey != list.value.snkey
      )
      if (match) {
        proxy.$swal({ icon: "error", title: "配方編號不可重覆!!" })
        return false
      }
    }

    // 最後一次計算確保數據正確
    recalculateAll()

    if (!list.value.editInfo) {
      list.value.editInfo = []
    }
    
    list.value.editInfo.unshift({
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss")
    })

    const postData = {
      snkey: list.value.snkey,
      recipeNumber: list.value.recipeNumber,
      datalist: JSON.stringify(list.value),
      updateTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    try {
      const rs = await api.post(props.usingDatabase, postData)
      if (rs.state == 1) {
        proxy.$swal({
          icon: "success",
          title: "已修改"
        })
        emit("getAllData")
        dialog.value = false
      }
    } catch (err) {
      proxy.$swal({ icon: "error", title: "資料存取錯誤!!內容:" + err })
    }
  } else {
    proxy.$swal({ icon: "error", title: "資料輸入不完整!!請再次確認!!" })
  }
}

// 初始化時載入原料列表
onMounted(() => {
  loadMaterials()
})

defineExpose({
  editProcess
})
</script>

<style scoped lang="scss">
.recipe-add-btn {
  padding-inline: 22px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: none;
  background: linear-gradient(135deg, rgba(74, 107, 95, 0.95), rgba(123, 163, 184, 0.92));
  color: #ffffff;

  &:hover {
    box-shadow: 0 10px 24px rgba(90, 122, 111, 0.32);
  }
}

.recipe-dialog {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 24px 60px rgba(74, 107, 95, 0.22);
}

.dialog-title {
  padding: 18px 24px;
  font-size: 1.15rem;
  color: #ffffff;

  &--add {
    background: linear-gradient(135deg, rgba(74, 107, 95, 0.95), rgba(123, 163, 184, 0.85));
  }

  &--edit {
    background: linear-gradient(135deg, rgba(107, 154, 138, 0.95), rgba(123, 163, 184, 0.85));
  }
}

.info-section {
  padding: 18px 20px;
  background-color: rgba(255, 255, 255, 0.86) !important;
  border: 1px solid rgba(123, 163, 184, 0.25);
  box-shadow: 0 8px 22px rgba(74, 107, 95, 0.12);
  margin-bottom: 20px;

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
}

.recipe-items-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(46, 125, 50, 0.2);
  
  thead {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(46, 125, 50, 0.08) 100%);
  }
  
  th {
    font-weight: 600;
    color: #2e7d32;
    padding: 12px 16px;
    font-size: 0.9rem;
    letter-spacing: 0.3px;
    border-bottom: 2px solid rgba(46, 125, 50, 0.2);
  }
  
  td {
    padding: 12px 16px;
    vertical-align: middle;
  }
  
  .item-row {
    border-bottom: 1px solid rgba(123, 163, 184, 0.15);
    transition: all 0.2s ease;
    
    &:hover {
      background-color: rgba(46, 125, 50, 0.04);
      box-shadow: inset 0 0 0 1px rgba(46, 125, 50, 0.1);
    }
  }

  .total-row {
    background-color: rgba(46, 125, 50, 0.08);
    font-weight: 600;
    border-top: 2px solid rgba(46, 125, 50, 0.3);
  }
}
</style>
