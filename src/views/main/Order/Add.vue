<template>
  <div class="customer-add">
    <v-dialog v-model="dialog" max-width="1200" persistent>
      <template #activator="{ props }">
        <v-btn v-bind="props" class="customer-add-btn" color="primary" variant="elevated"
          prepend-icon="mdi-file-document-plus" rounded="pill" elevation="6" @click="addProcess">
          新增訂單
        </v-btn>
      </template>

      <v-card class="customer-dialog" rounded="xl">
        <v-card-title class="d-flex" :class="titleStyle" primary-title>
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" class="ml-2" variant="text" color="white" @click="dialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="form">
            <v-sheet class="info-section" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-file-document-edit-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">訂單基本資料</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="單據號碼"
                    prepend-icon="mdi-identifier"
                    v-model="list.documentNumber"
                    :rules="emptyRules"
                    autofocus
                    density="comfortable"
                    variant="outlined"
                    hint="單據號碼不可重複"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="客戶全稱"
                    prepend-icon="mdi-office-building"
                    v-model="list.customerFullName"
                    :rules="emptyRules"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="客戶編號"
                    prepend-icon="mdi-account-outline"
                    v-model="list.customerNumber"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="品名規格"
                    prepend-icon="mdi-package-variant"
                    v-model="list.productName"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-cash-multiple</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">訂單金額資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="4">
                  <v-text-field
                    label="單價"
                    prepend-icon="mdi-currency-twd"
                    v-model="list.unitPrice"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="數量"
                    prepend-icon="mdi-numeric"
                    v-model="list.quantity"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="金額"
                    prepend-icon="mdi-cash"
                    v-model="list.amount"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="稅額"
                    prepend-icon="mdi-receipt"
                    v-model="list.taxAmount"
                    type="number"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="訂購日期"
                    prepend-icon="mdi-calendar"
                    v-model="list.orderDate"
                    type="date"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
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
import { ref, nextTick, getCurrentInstance } from 'vue'
import { useStore } from '@/stores/useStore'
import dayjs from "dayjs"
import api from '@/assets/js/api'

const { proxy } = getCurrentInstance()
const store = useStore()

// Props
const props = defineProps({
  usingDatabase: String,
  customerItems: Array,
  authKeys: Array
})

// Emits
const emit = defineEmits(['getAllData'])

// Refs
const dialog = ref(false)
const list = ref({
  documentNumber: '',
  customerFullName: '',
  productName: '',
  unitPrice: '',
  quantity: '',
  amount: '',
  taxAmount: '',
  orderDate: '',
  customerNumber: '',
  createInfo: {},
  editInfo: []
})
const processType = ref('')
const title = ref('')
const titleStyle = ref('')
const form = ref(null)

// Validation rules
const emptyRules = [(v) => !!v || "不可空白"]

// Methods
const addProcess = () => {
  processType.value = "add"
  title.value = "新增訂單資料"
  titleStyle.value = "dialog-title dialog-title--add"
  list.value = {
    documentNumber: '',
    customerFullName: '',
    productName: '',
    unitPrice: '',
    quantity: '',
    amount: '',
    taxAmount: '',
    orderDate: '',
    customerNumber: '',
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
  console.log(item)
  processType.value = "edit"
  title.value = "修改訂單資料"
  titleStyle.value = "dialog-title dialog-title--edit"
  list.value = { 
    documentNumber: item.documentNumber || '',
    customerFullName: item.customerFullName || '',
    productName: item.productName || '',
    unitPrice: item.unitPrice || '',
    quantity: item.quantity || '',
    amount: item.amount || '',
    taxAmount: item.taxAmount || '',
    orderDate: item.orderDate || '',
    customerNumber: item.customerNumber || '',
    snkey: item.snkey,
    createInfo: item.createInfo || {},
    editInfo: item.editInfo || []
  }
  dialog.value = true
}

const addOK = async () => {
  // 新增時單據號碼不可重覆
  if (props.customerItems && props.customerItems.length > 0) {
    const match = props.customerItems.find(i => i.documentNumber == list.value.documentNumber)
    if (match) {
      proxy.$swal({ icon: "error", title: "單據號碼不可重覆!!" })
      return false
    }
  }

  // 確認新增
  const { valid } = await form.value.validate()
  if (valid) {
    // 格式化日期為 YYYY-MM-DD
    if (list.value.orderDate) {
      const date = dayjs(list.value.orderDate)
      if (date.isValid()) {
        list.value.orderDate = date.format('YYYY-MM-DD')
      }
    }
    
    list.value.createInfo = {
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    const postData = {
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
    // 檢查單據號碼是否與其他訂單重複（排除自己）
    if (props.customerItems && props.customerItems.length > 0) {
      const match = props.customerItems.find(i => 
        i.documentNumber == list.value.documentNumber && i.snkey != list.value.snkey
      )
      if (match) {
        proxy.$swal({ icon: "error", title: "單據號碼不可重覆!!" })
        return false
      }
    }

    // 格式化日期為 YYYY-MM-DD
    if (list.value.orderDate) {
      const date = dayjs(list.value.orderDate)
      if (date.isValid()) {
        list.value.orderDate = date.format('YYYY-MM-DD')
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

defineExpose({
  editProcess
})
</script>

<style scoped lang="scss">
.customer-add-btn {
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

.customer-dialog {
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
</style>