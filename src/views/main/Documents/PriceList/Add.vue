<template>
  <v-dialog v-model="dialog" max-width="960">
    <v-card rounded="xl" class="pricelist-add">
      <v-sheet class="pricelist-add__header px-6 py-4" :color="headerColor" variant="tonal" rounded="t-xl">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" color="white" variant="tonal" class="mr-4">
              <v-icon :color="headerIconColor" size="26">mdi-cash-register</v-icon>
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-bold mb-1">{{ headerTitle }}</h2>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ headerSubtitle }}
              </p>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </div>
      </v-sheet>

      <v-card-text class="px-6 py-5">
        <v-form ref="formRef">
          <v-row class="align-center">
            <v-col cols="12" md="4">
              <v-text-field v-model="form.date" type="date" label="建檔日期" variant="outlined" :rules="[rules.required]" />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field v-model.number="form.quantity" type="number" min="1" label="數量" variant="outlined"
                :rules="[rules.required, rules.positive]" />
            </v-col>
            <v-col cols="12" md="5" v-if="isAddMode">
              <v-autocomplete v-model="form.fee" :items="feeItems" item-title="text" return-object label="計價項目"
                variant="outlined" :rules="[rules.required]" density="comfortable" prepend-inner-icon="mdi-store" />
            </v-col>
            <v-col cols="12" md="5" v-else>
              <v-text-field :model-value="`${form.fee?.text ?? ''}`" label="計價項目" readonly variant="outlined" />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-textarea v-model="form.note" label="備註" variant="outlined" auto-grow rows="3"
                prepend-inner-icon="mdi-note-edit" hint="如需調整日期或備註付款資訊，可於此欄補充。" persistent-hint />
            </v-col>
          </v-row>
        </v-form>

        <v-alert v-if="isAddMode" class="mt-5" color="primary" variant="tonal" border="start">
          <div class="d-flex align-center mb-3">
            <div class="text-subtitle-1 font-weight-medium">待新增項目列表</div>
            <v-spacer />
            <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="handleAddToTemp">
              加入清單
            </v-btn>
            <v-btn class="ml-2" color="success" variant="flat" prepend-icon="mdi-check-decagram"
              :disabled="!tempData.length || loading" :loading="loading" @click="finishAdd">
              完成新增
            </v-btn>
          </div>

          <v-table class="pricelist-add__table" density="comfortable">
            <thead>
              <tr>
                <th style="width: 80px;">#</th>
                <th style="width: 140px;">建檔日期</th>
                <th style="width: 220px;">收費項目</th>
                <th style="width: 100px;" class="text-right">單價</th>
                <th style="width: 80px;" class="text-right">數量</th>
                <th style="width: 120px;" class="text-right">小計</th>
                <th>備註</th>
                <th style="width: 80px;" class="text-center">移除</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in tempData" :key="`${item.fee?.snkey}-${index}`">
                <td>{{ index + 1 }}</td>
                <td>{{ item.date }}</td>
                <td>{{ item.fee?.text ?? '—' }}</td>
                <td class="text-right">{{ formatCurrency(item.fee?.price) }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ formatCurrency(item.fee?.price * item.quantity) }}</td>
                <td>{{ item.note || '—' }}</td>
                <td class="text-center">
                  <v-btn icon="mdi-close" size="small" variant="text" color="error" @click="removeTemp(index)" />
                </td>
              </tr>
              <tr v-if="!tempData.length">
                <td colspan="8" class="text-center text-medium-emphasis py-6">
                  尚未加入任何項目。
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeDialog" :disabled="loading">
          取消
        </v-btn>
        <v-btn v-if="!isAddMode" color="success" variant="flat" prepend-icon="mdi-content-save" :loading="loading"
          :disabled="loading" @click="handleEdit">
          確認修改
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, getCurrentInstance, reactive, ref } from 'vue'

import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'

const emit = defineEmits(['refresh'])

const store = useStore()
const { proxy } = getCurrentInstance()

const dialog = ref(false)
const formRef = ref(null)
const loading = ref(false)

const processType = ref('add')
const form = reactive(defaultForm())
const tempData = ref([])
const feeItems = ref([])

const rules = {
  required: (value) => !!value || '不可空白',
  positive: (value) => Number(value) > 0 || '需大於 0',
}

const isAddMode = computed(() => processType.value === 'add')

const headerTitle = computed(() => (isAddMode.value ? '新增計價項目' : '修改計價項目'))
const headerSubtitle = computed(() =>
  isAddMode.value ? '依需求一次加入多筆項目，減少重複輸入。' : '更新項目內容，保留完整紀錄。'
)
const headerColor = computed(() => (isAddMode.value ? 'primary' : 'success'))
const headerIconColor = computed(() => (isAddMode.value ? 'primary' : 'success'))

const defaultNoteForAdjustment = (originalDate, adjustedDate) => {
  return `${originalDate} 調整為 ${adjustedDate}`
}

function defaultForm() {
  return {
    snkey: '',
    date: dayjs().format('YYYY-MM-DD'),
    quantity: 1,
    fee: null,
    note: '',
  }
}

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('zh-TW', { minimumFractionDigits: 0 })
}

const adjustDateIfNeeded = (payload) => {
  const today = dayjs(payload.date)
  if (!today.isValid()) return payload
  if (Number(today.format('DD')) >= 26) {
    const adjusted = today.add(1, 'month').startOf('month')
    return {
      ...payload,
      date: adjusted.format('YYYY-MM-DD'),
      note: payload.note || defaultNoteForAdjustment(today.format('YYYY-MM-DD'), adjusted.format('YYYY-MM-DD')),
    }
  }
  return payload
}

const resetForm = () => {
  Object.assign(form, adjustDateIfNeeded(defaultForm()))
}

const closeDialog = () => {
  if (loading.value) return
  dialog.value = false
}

const validateForm = async () => {
  const result = await formRef.value?.validate()
  return result?.valid ?? false
}

const safeClone = (payload) => JSON.parse(JSON.stringify(payload))

const handleAddToTemp = async () => {
  const isValid = await validateForm()
  if (!isValid) return

  if (!form.fee?.snkey) {
    store.showToastMulti({
      type: 'warning',
      message: '請選擇計價項目',
      closeTime: 2,
    })
    return
  }

  tempData.value.push(safeClone(form))
  resetForm()
}

const removeTemp = (index) => {
  tempData.value.splice(index, 1)
}

const buildAddPayload = () => {
  return tempData.value.map((item) => {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return {
      datalist: JSON.stringify({
        u_snkey: store.state?.uData?.snkey,
        fee_snkey: item.fee.snkey,
        date: item.date,
        start_day: item.date,
        end_day: item.date,
        quantity: item.quantity,
        price: item.fee.price,
        note: item.note,
        createInfo: {
          snkey: store.state?.pData?.snkey,
          name: store.state?.pData?.username,
          time: timestamp,
        },
        editInfo: [],
      })
    }
  })
}

const finishAdd = async () => {
  if (!tempData.value.length) {
    store.showToastMulti({
      type: 'warning',
      message: '尚未加入任何項目',
      closeTime: 2,
    })
    return
  }

  loading.value = true
  const payload = buildAddPayload()
  const response = await api.options(`general/addMulti/${store.state.databaseName}/accounting`, payload)
  loading.value = false

  const hasError = Array.isArray(response) && response.some((item) => item?.state === 0)
  if (hasError) {
    store.showToastMulti({
      type: 'error',
      message: '新增過程發生錯誤，請稍後再試',
      closeTime: 3,
    })
    return
  }

  store.showToastMulti({
    type: 'success',
    message: '計價項目已新增',
    closeTime: 2,
  })

  tempData.value = []
  closeDialog()
  emit('refresh')
}

const handleEdit = async () => {
  const isValid = await validateForm()
  if (!isValid) return

  if (!form.fee?.snkey) {
    proxy?.$swal?.({ icon: 'warning', title: '此筆資料缺少計價項目資訊，請重新選擇。' })
    return
  }

  loading.value = true
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const payload = {
    snkey: form.snkey,
    user_snkey: store.state?.uData?.snkey,
    fee_snkey: form.fee.snkey,
    date: form.date,
    start_day: form.date,
    end_day: form.date,
    quantity: form.quantity,
    price: form.fee.price,
    note: form.note,
    edit_man: `${store.state?.pData?.username ?? ''} (${timestamp})`,
  }

  const response = await api.post('accounting', payload)
  loading.value = false

  if (response?.state == 1) {
    store.showToastMulti({
      type: 'success',
      message: '計價項目已更新',
      closeTime: 2,
    })
    closeDialog()
    emit('refresh')
  } else {
    store.showToastMulti({
      type: 'error',
      message: '修改失敗，請稍後再試',
      closeTime: 3,
    })
  }
}

const fetchFeeItems = async () => {
  const response = await api.get('fee')
  const excludeKinds = ['固定費類', '車資類']
  feeItems.value = (response ?? [])
    .filter((item) => !excludeKinds.includes(item.kind) && !item.name.includes('(月)'))
    .map((item) => ({
      snkey: item.snkey,
      text: `${item.name}｜${item.kind}`,
      price: Number(item.price) || 0,
    }))
}

const openForAdd = () => {
  processType.value = 'add'
  resetForm()
  tempData.value = []
  dialog.value = true
}

const openForEdit = (record) => {
  processType.value = 'edit'
  tempData.value = []

  const feePayload = (() => {
    if (record?.fee) return record.fee
    if (record?.feeInfo) {
      return {
        snkey: record.feeInfo.snkey ?? '',
        text: `${record.feeInfo.name ?? ''}｜${record.feeInfo.kind ?? ''}`,
        price: Number(record.price ?? record.feeInfo.price ?? 0),
      }
    }
    return {
      snkey: record?.fee_snkey ?? '',
      text: record?.project ? `${record.project}｜${record.kind ?? ''}` : '',
      price: Number(record?.price ?? record?.unitPrice ?? 0),
    }
  })()

  Object.assign(form, {
    snkey: record.snkey,
    date: record.date,
    quantity: record.quantity,
    note: record.note,
    fee: feePayload,
  })
  dialog.value = true
}

defineExpose({
  openForAdd,
  openForEdit,
  closeDialog,
})

fetchFeeItems()
</script>

<style scoped lang="scss">
.pricelist-add {
  &__header {
    background-image: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04));
  }

  &__table {
    border: 1px solid rgba(33, 150, 243, 0.2);

    thead th {
      background: rgba(33, 150, 243, 0.08);
      font-weight: 600;
    }
  }
}
</style>