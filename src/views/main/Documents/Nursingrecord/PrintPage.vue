<template>
  <div class="nursingrecord-print">
    <v-container fluid class="pa-6">
      <v-sheet class="nursingrecord-print__header mb-6" color="primary" variant="tonal" rounded="lg">
        <v-row class="pa-4" align="center">
          <v-col cols="12" md="4">
            <h3 class="text-h5 font-weight-bold mb-1">{{ companyName }}</h3>
            <p class="text-body-2 mb-0">日間照護護理紀錄列印</p>
          </v-col>
          <v-col cols="12" md="4" class="text-center">
            <h1 class="text-h4 font-weight-black mb-0">護理紀錄</h1>
            <p class="text-caption text-medium-emphasis mt-1">Nursing Record</p>
          </v-col>
          <v-col cols="12" md="4" class="text-right">
            <div class="text-body-2">
              列印日期：{{ today }}
            </div>
          </v-col>
        </v-row>
        <v-divider />
        <v-row class="pa-4 pb-5 text-body-2 nursingrecord-print__resident-info">
          <v-col cols="12" sm="6" md="2">病歷號：{{ resident.p_code || '—' }}</v-col>
          <v-col cols="12" sm="6" md="2">床號：{{ resident.bed_name || '—' }}</v-col>
          <v-col cols="12" sm="6" md="2">姓名：{{ resident.name || '—' }}</v-col>
          <v-col cols="12" sm="6" md="2">性別：{{ resident.sex || '—' }}</v-col>
          <v-col cols="12" sm="6" md="2">生日：{{ resident.birthday || '—' }}</v-col>
          <v-col cols="12" sm="6" md="2">年齡：{{ age }}</v-col>
        </v-row>
      </v-sheet>

      <v-table class="nursingrecord-print__table" density="comfortable">
        <thead>
          <tr>
            <th class="text-center" style="width: 140px;">日期時間</th>
            <th class="text-center" style="width: 160px;">項目</th>
            <th>護理紀錄內容</th>
            <th class="text-center" style="width: 160px;">紀錄人</th>
            <th class="text-center" style="width: 80px;">蓋章</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in printableItems" :key="item.snkey ?? index">
            <td class="text-center text-nowrap">
              {{ formatDateTime(item.date, item.time) }}
            </td>
            <td class="text-nowrap text-center">
              {{ item.project || '—' }}
            </td>
            <td class="text-pre-wrap">
              {{ item.nursingrecord_content }}
            </td>
            <td class="text-center text-nowrap">
              {{ extractName(item.create_man) }}
            </td>
            <td></td>
          </tr>
          <tr v-if="!printableItems.length">
            <td colspan="5" class="text-center text-medium-emphasis py-8">
              目前沒有列印資料。
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-container>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'

const cData = ref({})
const resident = ref({})
const items = ref([])

const today = computed(() => dayjs().format('YYYY/MM/DD'))

const companyName = computed(() => cData.value?.company_name ?? '日間照護中心')

const age = computed(() => {
  const birthday = resident.value?.birthday
  if (!birthday) return '—'
  const birth = dayjs(birthday)
  if (!birth.isValid()) return '—'
  return Math.max(0, dayjs().diff(birth, 'year'))
})

const printableItems = computed(() => items.value ?? [])

const safeParse = (value) => {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch (error) {
    console.warn('Parse session storage failed', error)
    return {}
  }
}

const formatDateTime = (date, time) => {
  const parsed = dayjs(date)
  const dateText = parsed.isValid() ? parsed.format('YYYY/MM/DD') : date ?? ''
  return [dateText, time ?? ''].filter(Boolean).join(' ')
}

const extractName = (value) => {
  if (!value) return ''
  return value.split('(')[0]
}

onMounted(() => {
  cData.value = safeParse(sessionStorage.getItem('cData'))
  resident.value = safeParse(sessionStorage.getItem('uData'))
  items.value = safeParse(sessionStorage.getItem('printData')) || []
})
</script>

<style scoped lang="scss">
.nursingrecord-print {
  background: #fff;
  color: #000;

  &__header {
    background-image: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04));
  }

  &__resident-info > * {
    font-weight: 500;
  }

  &__table {
    border: 1px solid #000;

    thead th {
      background: rgba(33, 150, 243, 0.08);
      font-weight: 600;
      font-size: 1rem;
      border: 1px solid #000;
      padding: 8px;
    }

    tbody td {
      border: 1px solid #000;
      padding: 8px;
      vertical-align: top;
      font-size: 0.95rem;
    }
  }
}

@media print {
  .nursingrecord-print {
    padding: 0 !important;

    .v-container {
      padding: 24px;
    }

    @page {
      size: A4 portrait;
      margin: 1.5cm;
    }
  }
}
</style>