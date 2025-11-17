<template>
  <v-dialog v-model="dialog" max-width="960" persistent>
    <v-card rounded="xl">
      <v-sheet :color="headerColor" class="d-flex align-center justify-space-between px-6 py-4" rounded="t-xl">
        <div class="d-flex align-center">
          <v-avatar size="48" color="white" variant="tonal" class="mr-4">
            <v-icon :color="headerIconColor" size="28">mdi-heart-pulse</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold mb-1">{{ headerTitle }}</h2>
            <p class="text-body-2 mb-0">{{ headerSubtitle }}</p>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-sheet>

      <v-card-text class="px-6 py-5">
        <v-form ref="formRef">
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <v-text-field v-model="record.date" type="date" label="評估日期" variant="outlined" density="comfortable"
                prepend-inner-icon="mdi-calendar" :rules="requiredDateRules" />
            </v-col>
            <v-col cols="12" md="8">
              <v-alert type="info" variant="tonal" border="start" color="primary">
                請依照評估流程逐項填寫數據。若項目未測量，可留空。
              </v-alert>
            </v-col>
          </v-row>

          <v-divider class="mb-6" />

          <v-row v-for="field in vitalFields" :key="field.key" class="align-center mb-3">
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-chip color="primary" variant="tonal" class="mr-3" size="small">
                {{ field.order }}
              </v-chip>
              <div class="text-body-1 font-weight-medium">{{ field.label }}</div>
            </v-col>
            <v-col cols="12" md="8">
              <v-text-field v-if="field.key !== 'note'" v-model="record[field.key]" :type="field.type ?? 'text'"
                :label="field.label" variant="outlined" density="comfortable" :prepend-inner-icon="field.icon"
                :autofocus="field.key === 'time'"
                hide-details />
              <v-textarea v-else v-model="record.note" :label="field.label" variant="outlined" auto-grow rows="2"
                prepend-inner-icon="mdi-note-text-outline" density="comfortable" />
            </v-col>
          </v-row>
          </v-form>
        </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn variant="tonal" color="secondary" @click="closeDialog">
          取消
        </v-btn>
        <v-btn v-if="processType === 'add'" color="primary" variant="flat" :loading="loading" @click="handleAdd">
          確認新增
        </v-btn>
        <v-btn v-else color="primary" variant="flat" :loading="loading" @click="handleEdit">
          確認修改
        </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, onMounted, getCurrentInstance } from 'vue'
import dayjs from 'dayjs'
import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'

const emit = defineEmits(['refresh'])

const store = useStore()
const { proxy } = getCurrentInstance()

const dialog = ref(false)
const processType = ref('add')
const loading = ref(false)
const formRef = ref(null)
const feeItems = ref([])
const originalRecord = ref(null)

const vitalFields = [
  { key: 'time', label: '評估時間', icon: 'mdi-clock-outline', type: 'time', order: 1 },
  { key: 'result', label: '檢查結果', icon: 'mdi-stethoscope', order: 2 },
  { key: 'weight', label: '體重', icon: 'mdi-weight-kilogram', order: 3 },
  { key: 'bp_h', label: '血壓(H)', icon: 'mdi-water-pump', order: 4 },
  { key: 'bp_l', label: '血壓(L)', icon: 'mdi-water-pump', order: 5 },
  { key: 'pulse', label: '脈搏', icon: 'mdi-heart-flash', order: 6 },
  { key: 'temperature', label: '體溫', icon: 'mdi-thermometer', order: 7 },
  { key: 'breath', label: '呼吸', icon: 'mdi-lungs', order: 8 },
  { key: 'blood_sugar', label: '血糖', icon: 'mdi-flask-outline', order: 9 },
  { key: 'blood_oxygen', label: '血氧濃度', icon: 'mdi-heart-pulse', order: 10 },
  { key: 'pain', label: '疼痛指數', icon: 'mdi-clipboard-pulse-outline', order: 11 },
  { key: 'gcs_e', label: 'GCS-E', icon: 'mdi-brain', order: 12 },
  { key: 'gcs_v', label: 'GCS-V', icon: 'mdi-brain', order: 13 },
  { key: 'gcs_m', label: 'GCS-M', icon: 'mdi-brain', order: 14 },
  { key: 'stool', label: '大便次數', icon: 'mdi-emoticon-poop', order: 15 },
  { key: 'note', label: '備註', icon: 'mdi-note-text-outline', order: 16 },
]

const requiredDateRules = [(v) => !!v || '請選擇評估日期']

const createDefaultRecord = () => ({
  snkey: '',
  u_snkey: '',
  date: dayjs().format('YYYY-MM-DD'),
  time: '',
  result: '',
  weight: '',
  bp_h: '',
  bp_l: '',
  pulse: '',
  temperature: '',
  breath: '',
  blood_sugar: '',
  blood_oxygen: '',
  pain: '',
  gcs_e: '',
  gcs_v: '',
  gcs_m: '',
  stool: '',
  note: '',
  createInfo: {},
  editInfo: [],
})

const record = reactive(createDefaultRecord())

const headerTitle = computed(() => (processType.value === 'add' ? '新增生命徵象紀錄' : '修改生命徵象紀錄'))
const headerSubtitle = computed(() =>
  processType.value === 'add'
    ? '填寫住民本次評估的生理監測結果，促進跨團隊資訊共享。'
    : '更新既有紀錄，維持數據正確性與一致性。'
)
const headerColor = computed(() => (processType.value === 'add' ? 'primary-lighten-4' : 'teal-lighten-4'))
const headerIconColor = computed(() => (processType.value === 'add' ? 'primary' : 'teal-darken-2'))

const resetRecord = () => {
  Object.assign(record, createDefaultRecord())
  originalRecord.value = null
}

const closeDialog = () => {
  dialog.value = false
  loading.value = false
}

const openForAdd = () => {
  resetRecord()
  processType.value = 'add'
  dialog.value = true
}

const openForEdit = (item) => {
  resetRecord()
  processType.value = 'edit'
  originalRecord.value = { ...item }
  Object.assign(record, item)
  dialog.value = true
}

const validateForm = async () => {
  const result = await formRef.value?.validate()
  return result?.valid ?? false
}

const handleAdd = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    proxy.$swal({ icon: 'warning', title: '資料輸入不完整，請檢查欄位內容。' })
    return
  }

  loading.value = true

  const timeNow = dayjs().format('YYYY-MM-DD HH:mm:ss')
  record.u_snkey = store.state.uData?.snkey ?? ''
  record.createInfo = {
    snkey: store.state.pData.snkey,
    name: store.state.pData.username,
    time: timeNow
  }

  let postData = {
    datalist: JSON.stringify(record)
  }

  const response = await api.add('signlife', postData)
  loading.value = false

  if (response?.state == 1) {
    proxy.$swal({ icon: 'success', title: '新增成功' })
    dialog.value = false
    emit('refresh')
    if (record.blood_sugar) {
      await checkBloodSugar()
    }
  } else {
    proxy.$swal({ icon: 'error', title: '新增失敗，請稍後再試。' })
  }
}

const handleEdit = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    proxy.$swal({ icon: 'warning', title: '資料輸入不完整，請檢查欄位內容。' })
    return
  }

  loading.value = true

  const timeNow = dayjs().format('YYYY-MM-DD HH:mm:ss')
  record.editInfo.unshift({
    snkey: store.state.pData.snkey,
    name: store.state.pData.username,
    time: timeNow
  })

  let postData = {
    snkey: record.snkey,
    datalist: JSON.stringify(record),
    updateTime: timeNow
  }

  const response = await api.post('signlife', postData)
  loading.value = false
  console.log('response',response)

  if (response?.state == 1) {
    proxy.$swal({ icon: 'success', title: '修改成功' })
    dialog.value = false
    emit('refresh')
      } else {
    proxy.$swal({ icon: 'error', title: '修改失敗，請稍後再試。' })
  }
}

const checkBloodSugar = async () => {
  const feeData = feeItems.value.find((item) => item.name?.includes('驗血糖/次'))
      if (!feeData) {
    store.showToastMulti({
      type: 'warning',
      message: '未找到 [驗血糖/次] 費用項目，請通知管理人員設定。',
      closeTime: 4,
    })
    return
  }

  const formDate = dayjs(record.date)
  const accountingDate = formDate.date() >= 26 ? formDate.add(1, 'month').startOf('month') : formDate

  const payload = {
    user_snkey: store.state.uData?.snkey,
        fee_snkey: feeData.snkey,
    date: accountingDate.format('YYYY-MM-DD'),
    start_day: record.date,
    end_day: record.date,
        quantity: 1,
        price: feeData.price,
    note: '(A)single',
    createInfo: {
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: dayjs().format('YYYY-MM-DD HH:mm:ss')
    },
  }

  await api.add('accounting', payload)
}

const getFeeItems = async () => {
  const response = await api.get('fee')
  feeItems.value = Array.isArray(response) ? response : []
}

onMounted(() => {
  getFeeItems()
})

defineExpose({
  openForAdd,
  openForEdit,
})
</script>

<style scoped>
</style>