<template>
  <div class="nursingplan">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="nursingplan__hero" rounded="xl" elevation="0">
            <div class="d-flex flex-column flex-md-row justify-space-between align-start">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar size="56" color="primary" variant="tonal" class="mr-4">
                  <v-icon color="primary" size="32">mdi-stethoscope</v-icon>
                </v-avatar>
                <div>
                  <h2 class="nursingplan__title mb-1">護理計畫單</h2>
                  <p class="nursingplan__subtitle mb-0">
                    建立跨專業護理策略，串聯住民的照護歷程與評估結果。
                  </p>
                </div>
              </div>
              <div class="d-flex align-center gap-3">
                <v-chip class="nursingplan__tag" prepend-icon="mdi-theme-light-dark" variant="outlined" size="small">
                  Daycare Style
                </v-chip>
                <v-btn variant="outlined" color="primary" prepend-icon="mdi-refresh" size="small" @click="fetchPlans">
                  重新整理
                </v-btn>
              </div>
            </div>
            <v-divider class="my-4" />
            <div class="nursingplan__meta d-flex flex-wrap gap-3">
              <v-chip variant="tonal" color="primary">
                住民：{{ residentName }}
              </v-chip>
              <v-chip variant="tonal" color="secondary">
                住編：{{ residentCode }}
              </v-chip>
              <v-chip variant="text" color="primary" prepend-icon="mdi-view-list-outline">
                計畫筆數：{{ totalCount }}
              </v-chip>
              <v-chip v-if="latestPlan" variant="text" color="teal" prepend-icon="mdi-calendar-clock">
                最新評值：{{ latestPlan.date }}{{ latestPlan.stop_date ? ` ~ ${displayRawStopDate(latestPlan.stop_date)}` : '' }}
              </v-chip>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" dense>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="primary" rounded="xl" class="nursingplan__summary-card">
            <v-icon size="28" class="mb-2">mdi-format-list-numbered</v-icon>
            <div class="summary-title">總計畫筆數</div>
            <div class="summary-value">{{ totalCount }}</div>
            <div class="summary-caption">目前載入的護理計畫資料</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="info" rounded="xl" class="nursingplan__summary-card">
            <v-icon size="28" class="mb-2">mdi-magnify</v-icon>
            <div class="summary-title">搜尋結果</div>
            <div class="summary-value">{{ filteredCount }}</div>
            <div class="summary-caption">符合條件的顯示筆數</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="success" rounded="xl" class="nursingplan__summary-card">
            <v-icon size="28" class="mb-2">mdi-timer-cog-outline</v-icon>
            <div class="summary-title">進行中計畫</div>
            <div class="summary-value">{{ activePlanCount }}</div>
            <div class="summary-caption">尚未設定停止日期的護理計畫</div>
          </v-card>
        </v-col>
        
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="nursingplan__toolbar" rounded="xl" elevation="0">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="searchKey"
                  variant="outlined"
                  density="comfortable"
                  class="pr-md-4"
                  prepend-inner-icon="mdi-magnify"
                  label="搜尋關鍵字"
                  hide-details
                  inset
                />
              </v-col>
              <v-col cols="12" md="6" class="d-flex justify-end gap-2 mt-3 mt-md-0">
                <v-btn
                  color="tertiary"
                  variant="tonal"
                  prepend-icon="mdi-printer"
                  :disabled="!filteredCount"
                  @click="openPrintOptions"
                >
                  匯出列印
                </v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-plus-circle" @click="openAdd">
                  新增護理計畫
                </v-btn>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-alert
            v-if="!hasUser"
            type="warning"
            variant="tonal"
            border="start"
            color="warning"
            class="mb-4"
            icon="mdi-account-search"
          >
            尚未選擇住民，請先至左側住民清單選擇後再進行護理計畫管理。
          </v-alert>

          <v-alert
            v-else-if="hasUser && !filteredCount"
            type="info"
            variant="tonal"
            border="start"
            color="primary"
            class="mb-4"
            icon="mdi-clipboard-text-clock"
          >
            目前沒有符合搜尋條件的資料，可調整搜尋條件或新增護理計畫。
          </v-alert>

          <PaginatedIterator
            v-if="filteredCount"
            :items="filteredPlans"
            v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions"
          >
            <template #default="{ items }">
              <v-card class="nursingplan__table-card" rounded="xl" variant="outlined">
                <v-card-title class="d-flex align-center">
                  <div class="text-subtitle-1 font-weight-bold">顯示筆數：{{ filteredCount }}</div>
                  <v-spacer></v-spacer>
                  <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar-range">
                    依評值日期由新到舊排序
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0">
                  <v-table class="nursingplan__table" fixed-header>
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 80px;">操作</th>
                        <th>評值日期</th>
                        <th>停止日期</th>
                        <th>護理診斷</th>
                        <th>可能導因</th>
                        <th>護理目標</th>
                        <th>護理措施</th>
                        <th>評值說明</th>
                        <th v-if="showCreateName">紀錄人姓名</th>
                        <th v-if="showCreateInfo">紀錄人紀錄</th>
                        <th v-if="showEditInfo">修改紀錄</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="({ raw }, index) in items" :key="raw?.snkey ?? index">
                        <td class="text-center">
                          <v-menu location="bottom">
                            <template #activator="{ props }">
                              <v-btn v-bind="props" variant="text" icon="mdi-dots-vertical" color="primary" />
                            </template>
                            <v-list>
                              <v-list-item @click="openEdit(raw)">
                                <template #prepend>
                                  <v-icon color="primary">mdi-square-edit-outline</v-icon>
                                </template>
                                <v-list-item-title>修改</v-list-item-title>
                              </v-list-item>
                              <v-list-item @click="askDelete(raw)">
                                <template #prepend>
                                  <v-icon color="error">mdi-delete-outline</v-icon>
                                </template>
                                <v-list-item-title>刪除</v-list-item-title>
                              </v-list-item>
                              <!-- <v-list-item @click="enterNursingRecord(raw)">
                                <template #prepend>
                                  <v-icon color="teal-darken-1">mdi-notebook-arrow-up</v-icon>
                                </template>
                                <v-list-item-title>轉入護理紀錄</v-list-item-title>
                              </v-list-item> -->
                            </v-list>
                          </v-menu>
                        </td>
                        <td>{{ raw?.date }}</td>
                        <td>{{ displayStopDate(raw?.stop_date) }}</td>
                        <td class="text-wrap">{{ raw?.question }}</td>
                        <td class="text-wrap">{{ raw?.relevant }}</td>
                        <td class="text-wrap">{{ raw?.target }}</td>
                        <td class="text-wrap">{{ raw?.measures }}</td>
                        <td class="text-wrap">{{ raw?.plan }}</td>
                        <td v-if="showCreateName">{{ (raw?.createInfo?.name || '').split('(')[0] }}</td>
                        <td v-if="showCreateInfo">{{ raw?.createInfo?.name }} ({{ raw?.createInfo?.time }})</td>
                        <td
                          v-if="showEditInfo"
                          class="text-truncate"
                          style="max-width: 260px;"
                        >
                          <div v-if="item.raw.editInfo" class="text-truncate" style="max-width: 400px">
                            <span v-for="(i, index) in item.raw.editInfo" :key="index">
                              {{ `${i.name}(${i.time})` }}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </template>
          </PaginatedIterator>
        </v-col>
      </v-row>
    </v-container>

    <NursingplanAdd ref="addDialogRef" @refresh="fetchPlans" :existing-plans="plans" />
    <NursingplanPrintOption ref="printDialogRef" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, getCurrentInstance } from 'vue'
import dayjs from 'dayjs'
import api from '@/assets/js/api.js'
import PaginatedIterator from '@/components/PaginatedIterator.vue'
import NursingplanAdd from './Add.vue'
import NursingplanPrintOption from './PrintOption.vue'
import { useStore } from '@/stores/useStore'

const store = useStore()
const { proxy } = getCurrentInstance()

const plans = ref([])
const searchKey = ref('')
const itemsPerPage = ref(10)
const itemsPerPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 20, title: '20' },
  { value: 30, title: '30' },
]

const addDialogRef = ref(null)
const printDialogRef = ref(null)

const hasUser = computed(() => Boolean(store.state.uData?.snkey))
const residentName = computed(() => store.state.uData?.name ?? '尚未選擇')
const residentCode = computed(() => store.state.uData?.p_code ?? '--')

const keywordTokens = computed(() => {
  if (!searchKey.value) return []
  return searchKey.value
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
})

const filteredPlans = computed(() => {
  if (!keywordTokens.value.length) return plans.value

  return plans.value.filter((plan) => {
    const content = JSON.stringify(plan).toUpperCase()
    return keywordTokens.value.every((token) => content.includes(token.toUpperCase()))
  })
})

const totalCount = computed(() => plans.value.length)
const filteredCount = computed(() => filteredPlans.value.length)
const latestPlan = computed(() => plans.value[0] ?? null)
const activePlanCount = computed(() =>
  filteredPlans.value.filter(
    (plan) => !plan.stop_date || plan.stop_date === '0000-00-00' || plan.stop_date === '1970-01-01'
  ).length
)

const showCreateName = computed(() => store.state.cData?.isShowCreaterName)
const showCreateInfo = computed(() => store.state.cData?.isShowCreaterInfo)
const showEditInfo = computed(() => store.state.cData?.isShowEditerInfo)

const sortPlans = (data) => {
  if (!Array.isArray(data)) return []
  return [...data].sort((a, b) => {
    if (a.date === b.date) {
      const stopA = a.stop_date ?? ''
      const stopB = b.stop_date ?? ''
      return stopA < stopB ? 1 : -1
    }
    return a.date < b.date ? 1 : -1
  })
}

const normalizeStopDate = (date) => {
  if (!date || date === '0000-00-00' || date === '1970-01-01') return ''
  return date
}

const displayStopDate = (date) => normalizeStopDate(date) || '進行中'
const displayRawStopDate = (date) => normalizeStopDate(date)

const fetchPlans = async () => {
  if (!hasUser.value) {
    plans.value = []
    return
  }

  const postData = {
    key: 'u_snkey',
    value: store.state.uData.snkey,
  }

  const url = `byjson/searchByKeyValue/${store.state.databaseName}/nursingplan`
  const response = await api.options(url, postData)

  plans.value = sortPlans(
    (response ?? []).map((row) => {
      return {
        ...JSON.parse(row.datalist),
        snkey: row.snkey,
      }
    })
  )
}

const openAdd = () => {
  addDialogRef.value?.openForAdd()
}

const openEdit = (plan) => {
  addDialogRef.value?.openForEdit(plan)
}

const openPrintOptions = () => {
  if (!filteredCount.value) return
  printDialogRef.value?.open(filteredPlans.value)
}

const askDelete = (plan) => {
  proxy.$swal({
    title: '確認要刪除這筆護理計畫嗎？',
    text: '此操作無法復原，請再次確認。',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then(async (result) => {
    if (!result.isConfirmed) return

    const postData = {
      snkey: plan.snkey,
      tablename: 'nursingplan',
      datalist: JSON.stringify({
        ...plan,
        delman: `${store.state.pData?.username ?? ''} (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`,
      }),
    }

    const rs = await api.delete('nursingplan', postData)
    if (rs?.state == 1) {
      store.showToastMulti({
        type: 'success',
        message: '護理計畫已刪除',
        closeTime: 2,
      })
      fetchPlans()
    } else {
      store.showToastMulti({
        type: 'error',
        message: '刪除失敗，請稍後再試',
        closeTime: 3,
      })
    }
  })
}

const enterNursingRecord = async (plan) => {
  if (!hasUser.value) return

  const content = [
    '[護理計畫單內容]',
    '',
    '護理診斷:',
    plan.question ?? '',
    '',
    '可能導因:',
    plan.relevant ?? '',
    '',
    '護理目標:',
    plan.target ?? '',
    '',
    '護理措施:',
    plan.measures ?? '',
    '',
    '評值說明:',
    plan.plan ?? '',
  ].join('\n')

  const payload = {
    key: 'u_snkey',
    value: store.state.uData.snkey,
  }

  const url = `byjson/searchByKeyValue/${store.state.databaseName}/nursingrecord`
  const records = await api.options(url, payload)
  const match = (records ?? []).find((item) => item.date === plan.date)

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const operator = `${store.state.pData?.username ?? ''} (${now})`

  if (!match) {
    const addPayload = {
      u_snkey: store.state.uData.snkey,
      date: plan.date,
      nursingrecord_content: content,
      create_man: operator,
    }
    const rs = await api.add('nursingrecord', addPayload)
    if (rs?.state == 1) {
      store.showToastMulti({
        type: 'success',
        message: '已轉入護理紀錄 (新增)',
        closeTime: 2,
      })
    } else {
      store.showToastMulti({
        type: 'error',
        message: '轉入失敗，請稍後再試',
        closeTime: 3,
      })
    }
    return
  }

  const editPayload = {
    snkey: match.snkey,
    nursingrecord_content: `${match.nursingrecord_content ?? ''}\n\n${content}`,
    edit_man: operator,
  }

  const rs = await api.post('nursingrecord', editPayload)
  if (rs?.state == 1) {
    store.showToastMulti({
      type: 'success',
      message: '已轉入護理紀錄 (追加)',
      closeTime: 2,
    })
  } else {
    store.showToastMulti({
      type: 'error',
      message: '轉入失敗，請稍後再試',
      closeTime: 3,
    })
  }
}

onMounted(() => {
  fetchPlans()
})
</script>

<style scoped lang="scss">
.nursingplan__hero {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.16), rgba(91, 143, 163, 0.12));
  border: 1px solid rgba(91, 143, 163, 0.12);
}

.nursingplan__title {
  font-size: 1.6rem;
  color: rgba(53, 88, 80, 0.92);
}

.nursingplan__subtitle {
  color: rgba(53, 88, 80, 0.7);
}

.nursingplan__tag {
  border-color: rgba(91, 143, 163, 0.35);
  color: rgba(53, 88, 80, 0.8);
}

.nursingplan__meta {
  gap: 12px;
}

.nursingplan__summary-card {
  padding: 20px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  .summary-title {
    font-size: 0.9rem;
    color: rgba(53, 88, 80, 0.7);
    margin-bottom: 8px;
  }

  .summary-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: rgba(53, 88, 80, 0.9);
    margin-bottom: 8px;
  }

  .summary-caption {
    font-size: 0.75rem;
    color: rgba(53, 88, 80, 0.5);
  }

  .summary-value--note {
    font-style: italic;
    color: rgba(53, 88, 80, 0.8);
  }
}

.nursingplan__toolbar {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  padding: 16px 20px;
  margin-top: 20px;
  margin-bottom: 20px;

  .v-row {
    align-items: center;
  }

  .v-col {
    padding: 0;
  }

  .v-text-field {
    max-width: 400px;
  }

  .v-btn {
    min-width: 120px;
  }
}

.nursingplan__table-card {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  // &:hover {
  //   transform: translateY(-5px);
  //   box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  // }

  .v-card-title {
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(5px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px 12px 0 0;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .v-chip {
      background-color: rgba(91, 143, 163, 0.1);
      color: rgba(53, 88, 80, 0.8);
      font-weight: bold;
      font-size: 0.85rem;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(91, 143, 163, 0.2);
    }
  }

  .v-card-text {
    padding: 0;
  }

  .v-table {
    border-collapse: collapse;
    width: 100%;

    th,
    td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 0.9rem;
      color: rgba(53, 88, 80, 0.9);
    }

    th {
      background-color: rgba(240, 240, 240, 0.8);
      backdrop-filter: blur(5px);
      font-weight: bold;
      color: rgba(53, 88, 80, 0.9);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
      border-bottom: 2px solid rgba(91, 143, 163, 0.3);
    }

    tr:last-child td {
      border-bottom: none;
    }

    .text-center {
      text-align: center;
    }

    .text-wrap {
      word-break: break-word;
    }

    .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
