<template>
  <div class="raw-material-add">
    <v-dialog v-model="dialog" max-width="96vw" persistent>
      <template #activator="{ props }">
        <v-btn v-bind="props" class="raw-material-add-btn" color="primary" variant="elevated"
          prepend-icon="mdi-flask-plus" rounded="pill" elevation="6" @click="addProcess">
          新增原料
        </v-btn>
      </template>

      <v-card class="raw-material-dialog" rounded="xl">
        <v-card-title class="d-flex" :class="titleStyle" primary-title>
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" class="ml-2" variant="text" color="white" @click="dialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="form">
            <v-sheet class="info-section" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-flask-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">基本資料</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="原料料號"
                    prepend-icon="mdi-identifier"
                    v-model="list.materialNumber"
                    :rules="emptyRules"
                    autofocus
                    density="comfortable"
                    variant="outlined"
                    hint="原料料號不可重複"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="商品名"
                    prepend-icon="mdi-label"
                    v-model="list.productName"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="原料名稱"
                    prepend-icon="mdi-flask"
                    v-model="list.materialName"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="類別"
                    prepend-icon="mdi-tag"
                    v-model="list.category"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="項次"
                    prepend-icon="mdi-numeric"
                    v-model="list.itemNumber"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-atom</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">化學資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="INCI NAME"
                    prepend-icon="mdi-text"
                    v-model="list.inciName"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="中文名"
                    prepend-icon="mdi-translate"
                    v-model="list.chineseName"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="CAS#"
                    prepend-icon="mdi-barcode"
                    v-model="list.casNumber"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="pH"
                    prepend-icon="mdi-ph"
                    v-model="list.ph"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-store-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">商業資訊</span>
              </div>
              <v-row dense class="mt-2">
                <!-- 供應商選擇區塊 -->
                <v-col cols="12">
                  <div class="supplier-selection-section">
                    <div class="text-subtitle-2 mb-2 d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-1">mdi-account-multiple</v-icon>
                      供應商選擇
                    </div>
                    <v-autocomplete
                      v-model="selectedSuppliers"
                      :items="supplierList"
                      item-title="displayName"
                      item-value="supplierNumber"
                      label="選擇供應商（可多選）"
                      prepend-inner-icon="mdi-magnify"
                      density="comfortable"
                      variant="outlined"
                      multiple
                      chips
                      closable-chips
                      clearable
                      no-data-text="無符合的供應商"
                      @update:model-value="updateSuppliers"
                    >
                      <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template v-slot:prepend>
                            <v-icon>mdi-store</v-icon>
                          </template>
                          <template v-slot:title>
                            <span class="font-weight-medium">{{ item.raw.supplierNumber }}</span>
                          </template>
                          <template v-slot:subtitle>
                            {{ item.raw.supplierFullName }}
                          </template>
                        </v-list-item>
                      </template>
                      <template v-slot:chip="{ item }">
                        <v-chip
                          color="primary"
                          variant="tonal"
                        >
                          <v-icon start size="small">mdi-store</v-icon>
                          {{ item.title }}
                        </v-chip>
                      </template>
                    </v-autocomplete>
                  </div>
                  <v-divider class="my-4"></v-divider>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    label="提供廠商"
                    prepend-icon="mdi-factory"
                    v-model="list.supplier"
                    density="comfortable"
                    variant="outlined"
                    hint="手動輸入廠商名稱（可選）"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="廠牌"
                    prepend-icon="mdi-trademark"
                    v-model="list.brand"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="MOQ(Kg)"
                    prepend-icon="mdi-weight-kilogram"
                    v-model="list.moq"
                    density="comfortable"
                    variant="outlined"
                    type="number"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="單價"
                    prepend-icon="mdi-currency-usd"
                    v-model="list.unitPrice"
                    density="comfortable"
                    variant="outlined"
                    type="number"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-note-text-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">其他資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12">
                  <v-textarea
                    label="功效"
                    prepend-icon="mdi-star-outline"
                    v-model="list.efficacy"
                    density="comfortable"
                    variant="outlined"
                    rows="3"
                    auto-grow
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="success-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="success" size="24">mdi-flask-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-success ml-2">成分組成 (Compositions)</span>
                <v-chip 
                  v-if="list.compositions && list.compositions.length > 0" 
                  size="small" 
                  color="success" 
                  variant="tonal"
                  class="ml-2"
                >
                  {{ list.compositions.length }} 項
                </v-chip>
                <v-spacer></v-spacer>
                <v-btn 
                  size="small" 
                  color="success" 
                  variant="flat"
                  class="text-white"
                  prepend-icon="mdi-plus"
                  @click="addComposition"
                >
                  新增成分
                </v-btn>
              </div>
              
              <v-alert 
                v-if="!list.compositions || list.compositions.length === 0" 
                type="info" 
                variant="tonal" 
                density="compact"
                class="mt-3"
              >
                尚未新增任何成分組成資料，請點擊「新增成分」按鈕開始新增
              </v-alert>

              <div v-else class="mt-3 compositions-table-wrap">
                <v-table density="comfortable" class="compositions-table elevation-2">
                  <thead>
                    <tr>
                      <th class="text-center" style="width: 90px;">項次</th>
                      <th class="text-left" style="width: 220px;">Composition</th>
                      <th class="text-left" style="width: 90px;">Breakdown INCI Name</th>
                      <th class="text-left" style="width: 170px;">CAS NO.</th>
                      <th class="text-left" style="width: 180px;">Function</th>
                      <th class="text-left" style="width: 120px;">wt%</th>
                      <th class="text-center" style="width: 100px;">字體顏色</th>
                      <th class="text-center" style="width: 80px;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(comp, index) in list.compositions" :key="index" class="composition-row">
                      <td class="text-center">
                        <v-chip size="small" color="success" variant="outlined">
                          {{ index + 1 }}
                        </v-chip>
                      </td>
                      <td>
                        <v-text-field
                          v-model="comp.composition"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="Composition"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model="comp.breakdownInciName"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="Breakdown INCI Name"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model="comp.casNo"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="CAS 編號"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model="comp.ingredientFunction"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="功能"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model="comp.wtPercent"
                          density="compact"
                          variant="outlined"
                          hide-details
                          placeholder="100%"
                        ></v-text-field>
                      </td>
                      <td class="text-center">
                        <v-menu location="bottom" :close-on-content-click="false">
                          <template v-slot:activator="{ props: menuProps }">
                            <v-btn
                              v-bind="menuProps"
                              size="small"
                              variant="outlined"
                              :style="comp.color ? { color: comp.color, borderColor: comp.color } : {}"
                              icon="mdi-format-color-text"
                            ></v-btn>
                          </template>
                          <v-sheet class="pa-3" min-width="200">
                            <div class="text-caption mb-2">選擇字體顏色</div>
                            <v-color-picker
                              :model-value="comp.color"
                              hide-inputs
                              mode="hex"
                              show-swatches
                              :swatches="colorSwatches"
                              @update:model-value="comp.color = (typeof $event === 'string' ? $event : ($event && $event.hex)) || ''"
                            ></v-color-picker>
                            <v-text-field
                              v-model="comp.color"
                              density="compact"
                              placeholder="#000000"
                              class="mt-2"
                              hide-details
                            ></v-text-field>
                            <v-btn size="small" variant="text" block class="mt-2" @click="comp.color = ''">清除顏色</v-btn>
                          </v-sheet>
                        </v-menu>
                      </td>
                      <td class="text-center">
                        <v-tooltip text="刪除此成分" location="top">
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="small"
                              icon="mdi-delete-outline"
                              color="error"
                              variant="text"
                              @click="removeComposition(index)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </td>
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
import { ref, nextTick, getCurrentInstance, onMounted } from 'vue'
import { useStore } from '@/stores/useStore'
import dayjs from "dayjs"
import api from '@/assets/js/api'

const { proxy } = getCurrentInstance()
const store = useStore()

// Props
const props = defineProps({
  usingDatabase: String,
  materialItems: Array,
  authKeys: Array
})

// Emits
const emit = defineEmits(['getAllData'])

// Refs
const dialog = ref(false)
const list = ref({
  itemNumber: '',
  category: '',
  materialNumber: '',
  productName: '',
  materialName: '',
  inciName: '',
  chineseName: '',
  efficacy: '',
  supplier: '',
  suppliers: [], // 新增：供應商陣列
  brand: '',
  moq: '',
  unitPrice: '',
  casNumber: '',
  ph: '',
  compositions: [],
  createInfo: {},
  editInfo: []
})
const processType = ref('')
const title = ref('')
const titleStyle = ref('')
const form = ref(null)
const supplierList = ref([]) // 供應商列表
const selectedSuppliers = ref([]) // 當前選擇的供應商（多選）
// 字體顏色預設色票（成分組成用）
const colorSwatches = [
  ['#000000', '#424242', '#757575', '#BDBDBD'],
  ['#F44336', '#E91E63', '#9C27B0', '#673AB7'],
  ['#3F51B5', '#2196F3', '#03A9F4', '#00BCD4'],
  ['#009688', '#4CAF50', '#8BC34A', '#CDDC39'],
  ['#FFEB3B', '#FFC107', '#FF9800', '#FF5722']
]

// Validation rules
const emptyRules = [(v) => !!v || "不可空白"]

// Methods
const addProcess = () => {
  processType.value = "add"
  title.value = "新增原料資料"
  titleStyle.value = "dialog-title dialog-title--add"
  list.value = {
    itemNumber: '',
    category: '',
    materialNumber: '',
    productName: '',
    materialName: '',
    inciName: '',
    chineseName: '',
    efficacy: '',
    supplier: '',
    suppliers: [],
    brand: '',
    moq: '',
    unitPrice: '',
    casNumber: '',
    ph: '',
    compositions: [],
    createInfo: {},
    editInfo: []
  }
  selectedSuppliers.value = []
  nextTick(() => {
    if (form.value) {
      form.value.resetValidation()
    }
  })
}

const editProcess = (item) => {
  console.log(item)
  processType.value = "edit"
  title.value = "修改原料資料"
  titleStyle.value = "dialog-title dialog-title--edit"
  list.value = { 
    itemNumber: item.itemNumber || '',
    category: item.category || '',
    materialNumber: item.materialNumber || '',
    productName: item.productName || '',
    materialName: item.materialName || '',
    inciName: item.inciName || '',
    chineseName: item.chineseName || '',
    efficacy: item.efficacy || '',
    supplier: item.supplier || '',
    suppliers: item.suppliers ? JSON.parse(JSON.stringify(item.suppliers)) : [],
    brand: item.brand || '',
    moq: item.moq || '',
    unitPrice: item.unitPrice || '',
    casNumber: item.casNumber || '',
    ph: item.ph || '',
    compositions: item.compositions ? JSON.parse(JSON.stringify(item.compositions)).map(c => ({ breakdownInciName: '', composition: '', ...c })) : [],
    snkey: item.snkey,
    createInfo: item.createInfo || {},
    editInfo: item.editInfo || []
  }
  // 同步已選擇的供應商到選擇器
  if (item.suppliers && item.suppliers.length > 0) {
    selectedSuppliers.value = item.suppliers.map(s => s.supplierNumber)
  } else {
    selectedSuppliers.value = []
  }
  dialog.value = true
}

// 供應商管理函數
const updateSuppliers = (supplierNumbers) => {
  if (!supplierNumbers || !Array.isArray(supplierNumbers)) {
    list.value.suppliers = []
    return
  }
  
  // 根據選擇的供應商料號，建立完整的供應商資料陣列
  list.value.suppliers = supplierNumbers.map(supplierNumber => {
    const supplier = supplierList.value.find(s => s.supplierNumber === supplierNumber)
    return {
      supplierNumber: supplier?.supplierNumber || supplierNumber,
      supplierFullName: supplier?.supplierFullName || ''
    }
  }).filter(s => s.supplierNumber) // 過濾掉無效的項目
}

// Compositions 管理函數
const addComposition = () => {
  if (!list.value.compositions) {
    list.value.compositions = []
  }
  const nextItemNumber = list.value.compositions.length + 1
  list.value.compositions.push({
    itemNumber: nextItemNumber.toString(),
    breakdownInciName: '',
    composition: '',
    wtPercent: '',
    casNo: '',
    ingredientFunction: '',
    color: ''
  })
}

const removeComposition = (index) => {
  proxy.$swal({
    title: '確認刪除此成分？',
    text: '此操作無法復原',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then((result) => {
    if (result.isConfirmed) {
      list.value.compositions.splice(index, 1)
      // 重新編號
      list.value.compositions.forEach((comp, idx) => {
        comp.itemNumber = (idx + 1).toString()
      })
    }
  })
}

const addOK = async () => {
  // 新增時原料料號不可重覆
  if (props.materialItems && props.materialItems.length > 0) {
    const match = props.materialItems.find(i => i.materialNumber == list.value.materialNumber)
    if (match) {
      proxy.$swal({ icon: "error", title: "原料料號不可重覆!!" })
      return false
    }
  }

  // 確認新增
  const { valid } = await form.value.validate()
  if (valid) {
    list.value.createInfo = {
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    const postData = {
      materialNumber: list.value.materialNumber,
      datalist: JSON.stringify(list.value)
    }

    try {
      const rs = await api.add(props.usingDatabase, postData)
      if (rs.state == 1) {
        proxy.$swal({ icon: "success", title: "已新增" })
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

const editOK = async () => {
  // 確認修改
  const { valid } = await form.value.validate()
  if (valid) {
    // 檢查原料料號是否與其他原料重複（排除自己）
    if (props.materialItems && props.materialItems.length > 0) {
      const match = props.materialItems.find(i => 
        i.materialNumber == list.value.materialNumber && i.snkey != list.value.snkey
      )
      if (match) {
        proxy.$swal({ icon: "error", title: "原料料號不可重覆!!" })
        return false
      }
    }

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
      materialNumber: list.value.materialNumber,
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

// 載入供應商列表
const loadSuppliers = async () => {
  try {
    const rs = await api.get('supplier')
    if (rs && rs.length > 0) {
      supplierList.value = rs.map(item => {
        const data = JSON.parse(item.datalist)
        return {
          supplierNumber: data.supplierNumber || '',
          supplierFullName: data.supplierFullName || '',
          displayName: `${data.supplierNumber} - ${data.supplierFullName}`
        }
      }).filter(item => item.supplierNumber) // 過濾掉沒有料號的
    }
  } catch (error) {
    console.error('載入供應商列表失敗:', error)
  }
}

// 初始化時載入供應商列表
onMounted(() => {
  loadSuppliers()
})

defineExpose({
  editProcess
})
</script>

<style scoped lang="scss">
.raw-material-add-btn {
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

.raw-material-dialog {
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

.compositions-table-wrap {
  max-height: 320px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.compositions-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: none;
  
  thead {
    background: linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(46, 125, 50, 0.08) 100%);
    position: sticky;
    top: 0;
    z-index: 1;
    box-shadow: 0 1px 0 rgba(46, 125, 50, 0.2);
  }
  
  th {
    font-weight: 600;
    color: #2e7d32;
    padding: 12px 16px;
    font-size: 0.9rem;
    letter-spacing: 0.3px;
    border-bottom: 2px solid rgba(46, 125, 50, 0.2);
    white-space: nowrap;
  }
  
  td {
    padding: 12px 16px;
    vertical-align: middle;
    white-space: nowrap;
  }
  
  .composition-row {
    border-bottom: 1px solid rgba(123, 163, 184, 0.15);
    transition: all 0.2s ease;
    
    &:hover {
      background-color: rgba(46, 125, 50, 0.04);
      box-shadow: inset 0 0 0 1px rgba(46, 125, 50, 0.1);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
