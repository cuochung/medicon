<template>
  <v-dialog v-model="dialog" max-width="720">
    <v-card rounded="xl" class="nursingrecord-print">
      <v-sheet color="primary" variant="tonal" class="px-6 py-4 nursingrecord-print__header" rounded="t-xl">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h6 font-weight-bold mb-1">列印護理紀錄設定</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              選擇列印時間區間或直接列印全部紀錄。
            </p>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </v-sheet>

      <v-card-text class="px-6 py-6">
        <v-form ref="formRef">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="range.startDay" type="date" label="護理紀錄起始日期" variant="outlined"
                prepend-inner-icon="mdi-calendar-start" :rules="[rules.required]" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="range.endDay" type="date" label="護理紀錄結束日期" variant="outlined"
                prepend-inner-icon="mdi-calendar-end" :rules="[rules.required, rules.afterStart(range.startDay)]" />
            </v-col>
          </v-row>

          <v-alert variant="tonal" color="info" border="start" class="mt-4" icon="mdi-information-outline">
            建議先設定日期區間，可快速列印交班需要的護理紀錄內容。
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-printer-outline" @click="handlePrintRange">
          指定日期列印
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-printer" class="ml-3" @click="handlePrintAll">
          全部列印
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, getCurrentInstance, reactive, ref } from 'vue'

const dialog = ref(false)
const formRef = ref(null)
const records = ref([])

const defaultRange = () => ({
  startDay: '',
  endDay: '',
})

const range = reactive(defaultRange())

const { proxy } = getCurrentInstance()

const rules = {
  required: (value) => !!value || '不可空白',
  afterStart: (start) => (value) => {
    if (!start || !value) return true
    if (dayjs(value).isBefore(dayjs(start))) {
      return '結束日期需晚於起始日期'
    }
    return true
  },
}

const sortedRecords = computed(() => {
  return [...records.value].sort((a, b) => {
    const dateCompare = dayjs(b.date).diff(dayjs(a.date))
    if (dateCompare !== 0) return dateCompare
    return (b.time ?? '').localeCompare(a.time ?? '')
  })
})

const open = (items) => {
  records.value = Array.isArray(items) ? items : []

  if (records.value.length) {
    const sorted = sortedRecords.value
    range.startDay = sorted[sorted.length - 1]?.date ?? dayjs().format('YYYY-MM-DD')
    range.endDay = sorted[0]?.date ?? dayjs().format('YYYY-MM-DD')
  } else {
    Object.assign(range, defaultRange())
  }

  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const openPrintWindow = (data) => {
  sessionStorage.setItem('printData', JSON.stringify(data))
  const routeData = proxy?.$router?.resolve({ path: '/NursingrecordPrint' })
  if (routeData?.href) {
    window.open(routeData.href, '_blank')
  }
}

const confirmPrint = async (payload) => {

  const result = await
    proxy.$swal({
      title: '確認顯示列印畫面？',
      text: '列印畫面將在新的分頁中顯示，請再次確認。',
      icon: 'question',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: true,
      position: 'center'
    })

  if (result?.isConfirmed) {
    openPrintWindow(payload)
  }
}

const handlePrintRange = async () => {
  const form = formRef.value
  if (!form) return

  const { valid } = await form.validate()
  if (!valid) return

  const filtered = sortedRecords.value.filter((item) => {
    const day = dayjs(item.date).format('YYYY-MM-DD')
    return day >= range.startDay && day <= range.endDay
  })

  await confirmPrint(filtered)
}

const handlePrintAll = async () => {
  await confirmPrint(sortedRecords.value)
}

defineExpose({
  open,
  close,
})
</script>

<style scoped lang="scss">
.nursingrecord-print {
  &__header {
    background-image: linear-gradient(135deg, rgba(25, 118, 210, 0.16), rgba(25, 118, 210, 0.04));
  }
}
</style>
