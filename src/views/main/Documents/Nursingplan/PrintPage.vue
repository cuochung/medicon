<template>
  <div class="NursingplanPrint">
    <div v-for="(group, index) in groupedPlans" :key="index">
      <table class="form_title" border="2px #000000 solid" width="100%">
        <thead>
          <tr>
            <td colspan="18">
              <v-row>
                <v-col cols="3">
                  <h3>{{ cData.company_name || '護理機構' }}</h3>
                </v-col>
                <v-col cols="6" class="text-center">
                  <h1 class="mb-0">
                    <strong>護理計畫單</strong>
                  </h1>
                </v-col>
                <v-col cols="3"></v-col>
              </v-row>
            </td>
          </tr>
          <tr>
            <th colspan="4" class="pa-2">
              <v-row>
                <v-col cols="2">病歷號：{{ uData.p_code || '--' }}</v-col>
                <v-col cols="2">床號：{{ uData.bed_name || '--' }}</v-col>
                <v-col cols="2">姓名：{{ uData.name || '--' }}</v-col>
                <v-col cols="2">性別：{{ uData.sex || '--' }}</v-col>
                <v-col cols="4">開始～停止：{{ formatPlanPeriod(group) }}</v-col>
              </v-row>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <th colspan="4" class="text-center pa-2">護理診斷</th>
          </tr>
          <tr>
            <td colspan="4">{{ group[0]?.question || '-' }}</td>
          </tr>

          <tr>
            <th colspan="4" class="text-center pa-2">可能導因</th>
          </tr>
          <tr>
            <td colspan="4">
              <div v-for="(items, idx) in groupByContent(group, 'relevant')" :key="idx">
                <v-sheet color="grey-lighten-3" class="mb-1 pa-1">
                  【{{ formatDateSpan(items) }}】
                </v-sheet>
                <div class="whitespace">{{ items[0]?.relevant }}</div>
              </div>
            </td>
          </tr>

          <tr>
            <th colspan="4" class="text-center pa-2">護理措施</th>
          </tr>
          <tr>
            <td colspan="4">
              <div v-for="(items, idx) in groupByContent(group, 'measures')" :key="idx">
                <v-sheet color="grey-lighten-3" class="mb-1 pa-1">
                  【{{ formatDateSpan(items) }}】
                </v-sheet>
                <div class="whitespace">{{ items[0]?.measures }}</div>
              </div>
            </td>
          </tr>

          <tr>
            <th colspan="4" class="text-center pa-2">護理目標</th>
          </tr>
          <tr>
            <td colspan="4">
              <div v-for="(items, idx) in groupByContent(group, 'target')" :key="idx">
                <v-sheet color="grey-lighten-3" class="mb-1 pa-1">
                  【{{ formatDateSpan(items) }}】
                </v-sheet>
                <div class="whitespace">{{ items[0]?.target }}</div>
              </div>
            </td>
          </tr>

          <tr>
            <th colspan="4" class="text-center pa-2">評值歷程</th>
          </tr>
          <tr class="text-center font-weight-bold">
            <th width="12%">評值日期</th>
            <th>評值說明</th>
            <th width="15%">紀錄人</th>
            <th width="8%">簽章</th>
          </tr>
          <tr v-for="(item, idx) in group" :key="idx">
            <td class="text-center text-nowrap">{{ item.date }}</td>
            <td class="whitespace">{{ item.plan }}</td>
            <td class="text-nowrap">{{ formatCreator(item.create_man) }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <p style="page-break-after: always"></p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'

const cData = ref({})
const pData = ref({})
const uData = ref({})
const records = ref([])

const groupedPlans = computed(() => {
  if (!records.value.length) return []
  const groups = {}
  records.value.forEach((plan) => {
    const key = plan.question || '未命名診斷'
    if (!groups[key]) groups[key] = []
    groups[key].push(plan)
  })
  return Object.values(groups)
})

const formatCreator = (value) => {
  if (!value) return ''
  return value.split('(')[0]
}

const groupByContent = (plans, field) => {
  const groups = {}
  plans.forEach((plan) => {
    const key = plan[field] || '-'
    if (!groups[key]) groups[key] = []
    groups[key].push(plan)
  })
  return Object.values(groups)
}

const formatDateSpan = (items) => {
  if (!items?.length) return ''
  const sorted = [...items].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
  const start = sorted[0]?.date ?? ''
  const end = sorted[sorted.length - 1]?.date ?? ''
  return start === end ? start : `${start} ~ ${end}`
}

const formatPlanPeriod = (plans) => {
  if (!plans?.length) return ''
  const sorted = [...plans].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
  const start = sorted[0]?.date ?? ''
  const end = sorted[sorted.length - 1]?.stop_date ?? ''
  return start === end ? start : `${start} ~ ${end}`
}

onMounted(() => {
  cData.value = JSON.parse(sessionStorage.getItem('cData') || '{}')
  pData.value = JSON.parse(sessionStorage.getItem('pData') || '{}')
  uData.value = JSON.parse(sessionStorage.getItem('uData') || '{}')
  records.value = JSON.parse(sessionStorage.getItem('printData') || '[]')
})
</script>

<style scoped lang="scss">
.NursingplanPrint {
  padding: 10px;

  .form_title {
    font-size: 1.1rem;
    font-family: "Microsoft JhengHei", sans-serif;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  th,
  td {
    padding: 6px;
    vertical-align: top;
    border: 1px solid #000;
  }

  .whitespace {
    white-space: pre-wrap;
  }
}

@media print {
  .NursingplanPrint {
    padding: 10px;

    .form_title {
      font-size: 0.85rem;
    }
  }

  @page {
    size: A4 portrait;
    margin: 1cm;
  }
}
</style>