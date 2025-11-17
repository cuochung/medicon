<template>
  <v-dialog v-model="dialog" max-width="520">
    <v-card rounded="xl">
      <v-sheet color="primary-lighten-5" class="px-6 py-4" rounded="t-xl">
        <h2 class="text-h6 font-weight-bold mb-1">列印護理計畫單</h2>
        <p class="text-body-2 mb-0 text-primary">
          可指定日期區間或直接列印全部護理計畫。
        </p>
      </v-sheet>

      <v-card-text class="px-6 py-5">
        <v-form ref="formRef">
          <v-alert type="info" variant="tonal" border="start" color="primary" class="mb-6">
            <div class="text-body-2">
              如需列印部分資料，請設定「起始日期」與「結束日期」；若留空則以系統預設值填入。
            </div>
          </v-alert>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="range.start" type="date" label="起始日期" variant="outlined"
                density="comfortable" :rules="dateRules" prepend-inner-icon="mdi-calendar-start" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="range.end" type="date" label="結束日期" variant="outlined"
                density="comfortable" :rules="dateRules" prepend-inner-icon="mdi-calendar-end" />
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
        <v-btn color="primary" variant="flat" @click="printRange">
          指定區間列印
        </v-btn>
        <v-btn color="primary" variant="flat" @click="printAll" class="ml-2">
          全部列印
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const router = useRouter()

const dialog = ref(false)
const records = ref([])
const range = ref({ start: '', end: '' })
const formRef = ref(null)

const dateRules = [(v) => !!v || '請選擇日期']

const emit = defineEmits(['afterPrint'])

const sortRecords = (items) =>
  [...items].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))

const defaultRange = computed(() => {
  if (!records.value.length) return { start: '', end: '' }
  const sorted = sortRecords(records.value)
  return {
    start: sorted[0].date ?? '',
    end: sorted[sorted.length - 1].date ?? '',
  }
})

const closeDialog = () => {
  dialog.value = false
}

const openPrint = (data) => {
  sessionStorage.setItem('printData', JSON.stringify(sortRecords(data)))
  const routeData = router.resolve({ path: '/NursingplanPrint' })
  window.open(routeData.href, '_blank')
  emit('afterPrint')
  dialog.value = false
}

const validateForm = async () => {
  const result = await formRef.value?.validate()
  return result?.valid ?? false
}

const printRange = async () => {
  if (!(await validateForm())) return
  const start = dayjs(range.value.start)
  const end = dayjs(range.value.end)
  if (end.isBefore(start)) {
    alert('結束日期需大於等於起始日期')
    return
  }
  const filtered = sortRecords(
    records.value.filter((item) => {
      const date = dayjs(item.date)
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
    }),
  )

  if (!filtered.length) {
    alert('指定區間內沒有護理計畫資料')
    return
  }

  openPrint(filtered)
}

const printAll = () => {
  if (!records.value.length) {
    alert('目前沒有可列印的護理計畫資料')
    return
  }
  openPrint(records.value)
}

const open = (data) => {
  records.value = Array.isArray(data) ? data : []
  const def = defaultRange.value
  range.value.start = def.start || dayjs().format('YYYY-MM-DD')
  range.value.end = def.end || dayjs().format('YYYY-MM-DD')
  formRef.value?.resetValidation?.()
  dialog.value = true
}

defineExpose({ open })
</script>

