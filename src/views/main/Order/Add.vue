<template>
  <div class="customer-add">
    <v-dialog v-model="dialog" max-width="1200" persistent>
      <template #activator="{ props }">
        <v-btn v-bind="props" class="customer-add-btn" color="primary" variant="elevated"
          prepend-icon="mdi-account-plus" rounded="pill" elevation="6" @click="addProcess">
          新增客戶
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
                <v-icon color="primary" size="24">mdi-account-details-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">基本資料</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="客戶編號"
                    prepend-icon="mdi-identifier"
                    v-model="list.customerNumber"
                    :rules="emptyRules"
                    autofocus
                    density="comfortable"
                    variant="outlined"
                    hint="客戶編號不可重複"
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
                    label="業務人員"
                    prepend-icon="mdi-account-tie"
                    v-model="list.salesPerson"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="聯絡人"
                    prepend-icon="mdi-account-outline"
                    v-model="list.contactPerson"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-phone-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">聯絡資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="聯絡電話"
                    prepend-icon="mdi-phone"
                    v-model="list.contactPhone"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="聯絡電話一"
                    prepend-icon="mdi-phone-outline"
                    v-model="list.contactPhone1"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="傳真號碼"
                    prepend-icon="mdi-fax"
                    v-model="list.faxNumber"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-map-marker-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">地址資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12">
                  <v-text-field
                    label="地址"
                    prepend-icon="mdi-home-city"
                    v-model="list.address"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="8">
                  <v-text-field
                    label="送貨地址"
                    prepend-icon="mdi-truck-delivery"
                    v-model="list.deliveryAddress"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="郵遞區號"
                    prepend-icon="mdi-postage-stamp"
                    v-model="list.postalCode"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="行走路線"
                    prepend-icon="mdi-map-outline"
                    v-model="list.route"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-note-text-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">備註資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12">
                  <v-textarea
                    label="備註"
                    prepend-icon="mdi-note-outline"
                    v-model="list.notes"
                    density="comfortable"
                    variant="outlined"
                    rows="3"
                    auto-grow
                  ></v-textarea>
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
  customerNumber: '',
  customerFullName: '',
  salesPerson: '',
  contactPerson: '',
  contactPhone: '',
  contactPhone1: '',
  address: '',
  deliveryAddress: '',
  postalCode: '',
  faxNumber: '',
  route: '',
  notes: '',
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
  title.value = "新增客戶資料"
  titleStyle.value = "dialog-title dialog-title--add"
  list.value = {
    customerNumber: '',
    customerFullName: '',
    salesPerson: '',
    contactPerson: '',
    contactPhone: '',
    contactPhone1: '',
    address: '',
    deliveryAddress: '',
    postalCode: '',
    faxNumber: '',
    route: '',
    notes: '',
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
  title.value = "修改客戶資料"
  titleStyle.value = "dialog-title dialog-title--edit"
  list.value = { 
    customerNumber: item.customerNumber || '',
    customerFullName: item.customerFullName || '',
    salesPerson: item.salesPerson || '',
    contactPerson: item.contactPerson || '',
    contactPhone: item.contactPhone || '',
    contactPhone1: item.contactPhone1 || '',
    address: item.address || '',
    deliveryAddress: item.deliveryAddress || '',
    postalCode: item.postalCode || '',
    faxNumber: item.faxNumber || '',
    route: item.route || '',
    notes: item.notes || '',
    snkey: item.snkey,
    createInfo: item.createInfo || {},
    editInfo: item.editInfo || []
  }
  dialog.value = true
}

const addOK = async () => {
  // 新增時客戶編號不可重覆
  if (props.customerItems && props.customerItems.length > 0) {
    const match = props.customerItems.find(i => i.customerNumber == list.value.customerNumber)
    if (match) {
      proxy.$swal({ icon: "error", title: "客戶編號不可重覆!!" })
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
    // 檢查客戶編號是否與其他客戶重複（排除自己）
    if (props.customerItems && props.customerItems.length > 0) {
      const match = props.customerItems.find(i => 
        i.customerNumber == list.value.customerNumber && i.snkey != list.value.snkey
      )
      if (match) {
        proxy.$swal({ icon: "error", title: "客戶編號不可重覆!!" })
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