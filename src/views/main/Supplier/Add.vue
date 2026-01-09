<template>
  <div class="supplier-add">
    <v-dialog v-model="dialog" max-width="1200" persistent>
      <template #activator="{ props }">
        <v-btn v-bind="props" class="supplier-add-btn" color="primary" variant="elevated"
          prepend-icon="mdi-store-plus" rounded="pill" elevation="6" @click="addProcess">
          新增廠商
        </v-btn>
      </template>

      <v-card class="supplier-dialog" rounded="xl">
        <v-card-title class="d-flex" :class="titleStyle" primary-title>
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" class="ml-2" variant="text" color="white" @click="dialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="form">
            <v-sheet class="info-section" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-store-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">基本資料</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="廠商編號"
                    prepend-icon="mdi-identifier"
                    v-model="list.supplierNumber"
                    :rules="emptyRules"
                    autofocus
                    density="comfortable"
                    variant="outlined"
                    hint="廠商編號不可重複"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="廠商全稱"
                    prepend-icon="mdi-office-building"
                    v-model="list.supplierFullName"
                    :rules="emptyRules"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="統一編號"
                    prepend-icon="mdi-card-account-details"
                    v-model="list.unifiedNumber"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="負責人"
                    prepend-icon="mdi-account-tie"
                    v-model="list.personInCharge"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="採購員"
                    prepend-icon="mdi-account-supervisor"
                    v-model="list.purchaser"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch
                    label="外商"
                    v-model="list.isForeignSupplier"
                    color="primary"
                    density="comfortable"
                  ></v-switch>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-account-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">聯絡資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="聯絡人"
                    prepend-icon="mdi-account"
                    v-model="list.contactPerson"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="聯絡人職稱"
                    prepend-icon="mdi-briefcase"
                    v-model="list.contactPersonTitle"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="聯絡電話一"
                    prepend-icon="mdi-phone"
                    v-model="list.contactPhone1"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="聯絡電話二"
                    prepend-icon="mdi-phone-outline"
                    v-model="list.contactPhone2"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="行動電話"
                    prepend-icon="mdi-cellphone"
                    v-model="list.mobilePhone"
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
                <v-col cols="12" md="6">
                  <v-text-field
                    label="電子郵件"
                    prepend-icon="mdi-email"
                    v-model="list.email"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    label="網址"
                    prepend-icon="mdi-web"
                    v-model="list.website"
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
                <v-col cols="12">
                  <v-text-field
                    label="發票地址"
                    prepend-icon="mdi-file-document-outline"
                    v-model="list.invoiceAddress"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="收貨地址郵遞區號"
                    prepend-icon="mdi-postage-stamp"
                    v-model="list.shippingAddressPostalCode"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="8">
                  <v-text-field
                    label="收貨地址"
                    prepend-icon="mdi-truck-delivery"
                    v-model="list.shippingAddress"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-bank-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">銀行資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="銀行名稱"
                    prepend-icon="mdi-bank"
                    v-model="list.bankName"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="銀行帳號"
                    prepend-icon="mdi-credit-card"
                    v-model="list.bankAccountNumber"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-cash-multiple</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">付款資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="4">
                  <v-text-field
                    label="每月結帳日"
                    prepend-icon="mdi-calendar"
                    v-model="list.monthlyBillingDate"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="月結付款日"
                    prepend-icon="mdi-calendar-check"
                    v-model="list.monthlyPaymentDate"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="貨到付款天"
                    prepend-icon="mdi-calendar-clock"
                    v-model="list.codDays"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="交易條件"
                    prepend-icon="mdi-file-document-edit"
                    v-model="list.paymentTerms"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="其他付款方式"
                    prepend-icon="mdi-cash"
                    v-model="list.otherPaymentMethods"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-sheet class="info-section mt-4" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-tag-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">分類資訊</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="類別名稱"
                    prepend-icon="mdi-tag"
                    v-model="list.categoryName"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="行業類別"
                    prepend-icon="mdi-briefcase-outline"
                    v-model="list.industryCategory"
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
  supplierItems: Array,
  authKeys: Array
})

// Emits
const emit = defineEmits(['getAllData'])

// Refs
const dialog = ref(false)
const list = ref({
  supplierNumber: '',
  supplierFullName: '',
  unifiedNumber: '',
  personInCharge: '',
  contactPerson: '',
  contactPersonTitle: '',
  contactPhone1: '',
  contactPhone2: '',
  mobilePhone: '',
  faxNumber: '',
  email: '',
  website: '',
  address: '',
  bankName: '',
  bankAccountNumber: '',
  monthlyBillingDate: '',
  codDays: '',
  invoiceAddress: '',
  shippingAddressPostalCode: '',
  shippingAddress: '',
  categoryName: '',
  industryCategory: '',
  notes: '',
  isForeignSupplier: false,
  purchaser: '',
  otherPaymentMethods: '',
  paymentTerms: '',
  monthlyPaymentDate: '',
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
  title.value = "新增廠商資料"
  titleStyle.value = "dialog-title dialog-title--add"
  list.value = {
    supplierNumber: '',
    supplierFullName: '',
    unifiedNumber: '',
    personInCharge: '',
    contactPerson: '',
    contactPersonTitle: '',
    contactPhone1: '',
    contactPhone2: '',
    mobilePhone: '',
    faxNumber: '',
    email: '',
    website: '',
    address: '',
    bankName: '',
    bankAccountNumber: '',
    monthlyBillingDate: '',
    codDays: '',
    invoiceAddress: '',
    shippingAddressPostalCode: '',
    shippingAddress: '',
    categoryName: '',
    industryCategory: '',
    notes: '',
    isForeignSupplier: false,
    purchaser: '',
    otherPaymentMethods: '',
    paymentTerms: '',
    monthlyPaymentDate: '',
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
  title.value = "修改廠商資料"
  titleStyle.value = "dialog-title dialog-title--edit"
  list.value = { 
    supplierNumber: item.supplierNumber || '',
    supplierFullName: item.supplierFullName || '',
    unifiedNumber: item.unifiedNumber || '',
    personInCharge: item.personInCharge || '',
    contactPerson: item.contactPerson || '',
    contactPersonTitle: item.contactPersonTitle || '',
    contactPhone1: item.contactPhone1 || '',
    contactPhone2: item.contactPhone2 || '',
    mobilePhone: item.mobilePhone || '',
    faxNumber: item.faxNumber || '',
    email: item.email || '',
    website: item.website || '',
    address: item.address || '',
    bankName: item.bankName || '',
    bankAccountNumber: item.bankAccountNumber || '',
    monthlyBillingDate: item.monthlyBillingDate || '',
    codDays: item.codDays || '',
    invoiceAddress: item.invoiceAddress || '',
    shippingAddressPostalCode: item.shippingAddressPostalCode || '',
    shippingAddress: item.shippingAddress || '',
    categoryName: item.categoryName || '',
    industryCategory: item.industryCategory || '',
    notes: item.notes || '',
    isForeignSupplier: item.isForeignSupplier || false,
    purchaser: item.purchaser || '',
    otherPaymentMethods: item.otherPaymentMethods || '',
    paymentTerms: item.paymentTerms || '',
    monthlyPaymentDate: item.monthlyPaymentDate || '',
    snkey: item.snkey,
    createInfo: item.createInfo || {},
    editInfo: item.editInfo || []
  }
  dialog.value = true
}

const addOK = async () => {
  // 新增時廠商編號不可重覆
  if (props.supplierItems && props.supplierItems.length > 0) {
    const match = props.supplierItems.find(i => i.supplierNumber == list.value.supplierNumber)
    if (match) {
      proxy.$swal({ icon: "error", title: "廠商編號不可重覆!!" })
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
    // 檢查廠商編號是否與其他廠商重複（排除自己）
    if (props.supplierItems && props.supplierItems.length > 0) {
      const match = props.supplierItems.find(i => 
        i.supplierNumber == list.value.supplierNumber && i.snkey != list.value.snkey
      )
      if (match) {
        proxy.$swal({ icon: "error", title: "廠商編號不可重覆!!" })
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
.supplier-add-btn {
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

.supplier-dialog {
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
