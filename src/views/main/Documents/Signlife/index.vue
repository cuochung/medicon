<template>
  <div class="signlife">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="signlife__hero" rounded="xl" elevation="0">
            <div class="d-flex flex-column flex-md-row justify-space-between align-start">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar size="56" color="primary" variant="tonal" class="mr-4">
                  <v-icon color="primary" size="32">mdi-heart-pulse</v-icon>
                </v-avatar>
                <div>
                  <h2 class="signlife__title mb-1">生命徵象紀錄</h2>
                  <p class="signlife__subtitle mb-0">
                    快速掌握評估歷程，支援臨床決策與照護追蹤。
                  </p>
                </div>
              </div>
              <div class="d-flex align-center gap-3">
                <v-chip class="signlife__tag" prepend-icon="mdi-theme-light-dark" variant="outlined" size="small">
                  Daycare Style
                </v-chip>
                <v-btn variant="outlined" color="primary" prepend-icon="mdi-refresh" size="small" @click="fetchRecords">
                  重新整理
                </v-btn>
              </div>
            </div>
            <v-divider class="my-4" />
            <div class="signlife__meta d-flex flex-wrap gap-3">
              <v-chip variant="tonal" color="primary">
                住民：{{ residentName }}
              </v-chip>
              <v-chip variant="tonal" color="secondary">
                住編：{{ residentCode }}
              </v-chip>
              <v-chip variant="text" color="primary" prepend-icon="mdi-account-heart">
                記錄筆數：{{ totalCount }}
              </v-chip>
              <v-chip v-if="latestRecord" variant="text" color="teal" prepend-icon="mdi-calendar-clock">
                最新評估：{{ latestRecord.date }} {{ latestRecord.time }}
              </v-chip>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" dense>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="primary" rounded="xl" class="signlife__summary-card">
            <v-icon size="28" class="mb-2">mdi-format-list-numbered</v-icon>
            <div class="summary-title">總紀錄筆數</div>
            <div class="summary-value">{{ totalCount }}</div>
            <div class="summary-caption">目前載入的生命徵象資料</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="info" rounded="xl" class="signlife__summary-card">
            <v-icon size="28" class="mb-2">mdi-magnify</v-icon>
            <div class="summary-title">搜尋結果</div>
            <div class="summary-value">{{ filteredCount }}</div>
            <div class="summary-caption">符合條件的顯示筆數</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="success" rounded="xl" class="signlife__summary-card">
            <v-icon size="28" class="mb-2">mdi-note-text-outline</v-icon>
            <div class="summary-title">最新備註</div>
            <div class="summary-value summary-value--note">
              {{ latestRecord?.note || '尚無備註內容' }}
            </div>
            <div class="summary-caption">最近一次紀錄的備註</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="signlife__toolbar" rounded="xl" elevation="0">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="6">
                <v-text-field v-model="searchKey" variant="outlined" density="comfortable" class="pr-md-4"
                  prepend-inner-icon="mdi-magnify" label="搜尋關鍵字" hide-details inset />
              </v-col>
              <v-col cols="12" md="6" class="d-flex justify-end gap-2 mt-3 mt-md-0">
                <v-btn color="tertiary" variant="tonal" prepend-icon="mdi-printer" @click="printRecords">
                  匯出列印
                </v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-plus-circle" @click="openAdd">
                  新增紀錄
                </v-btn>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-alert v-if="!hasUser" type="warning" variant="tonal" border="start" color="warning" class="mb-4">
            尚未選擇住民，請先至左側住民清單選擇後再進行紀錄查閱。
          </v-alert>

          <v-alert v-else-if="!filteredCount" type="info" variant="tonal" border="start" color="primary" class="mb-4">
            目前沒有符合搜尋條件的資料，可調整搜尋關鍵字或新增紀錄。
          </v-alert>

          <PaginatedIterator v-if="filteredCount" :items="filteredItems" v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions">
            <template #default="{ items }">
              <v-card class="signlife__table-card" rounded="xl" variant="outlined">
                <v-card-title class="d-flex align-center">
                  <div class="text-subtitle-1 font-weight-bold">顯示筆數：{{ filteredCount }}</div>
                  <v-spacer></v-spacer>
                  <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar">
                    依日期時間由新到舊排序
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0">
                  <v-table class="signlife__table" fixed-header>
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 80px;">操作</th>
                        <th>評估日期</th>
                        <th>評估時間</th>
                        <th>檢查結果</th>
                        <th>體重</th>
                        <th>血壓(H)</th>
                        <th>血壓(L)</th>
                        <th>脈搏</th>
                        <th>體溫</th>
                        <th>呼吸</th>
                        <th>血糖</th>
                        <th>血氧濃度</th>
                        <th>疼痛指數</th>
                        <th>GCS-E</th>
                        <th>GCS-V</th>
                        <th>GCS-M</th>
                        <th>大便次數</th>
                        <th>備註</th>
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
                            </v-list>
                          </v-menu>
                        </td>
                        <td>{{ raw?.date }}</td>
                        <td>{{ raw?.time }}</td>
                        <td>{{ raw?.result }}</td>
                        <td>{{ raw?.weight }}</td>
                        <td>{{ raw?.bp_h }}</td>
                        <td>{{ raw?.bp_l }}</td>
                        <td>{{ raw?.pulse }}</td>
                        <td>{{ raw?.temperature }}</td>
                        <td>{{ raw?.breath }}</td>
                        <td>{{ raw?.blood_sugar }}</td>
                        <td>{{ raw?.blood_oxygen }}</td>
                        <td>{{ raw?.pain }}</td>
                        <td>{{ raw?.gcs_e }}</td>
                        <td>{{ raw?.gcs_v }}</td>
                        <td>{{ raw?.gcs_m }}</td>
                        <td>{{ raw?.stool }}</td>
                        <td class="text-truncate" style="max-width: 220px;">{{ raw?.note }}</td>
                        <td v-if="showCreateName">{{ (raw?.createInfo?.name || '').split('(')[0] }}</td>
                        <td v-if="showCreateInfo">{{ raw?.createInfo?.name }} ({{ raw?.createInfo?.time }})</td>
                        <td v-if="showEditInfo" class="text-truncate" style="max-width: 240px;">
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

    <SignlifeAdd ref="addDialogRef" @refresh="fetchRecords" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, getCurrentInstance } from 'vue'
import dayjs from 'dayjs'
import api from '@/assets/js/api.js'
import PaginatedIterator from '@/components/PaginatedIterator.vue'
import SignlifeAdd from './Add.vue'
import { useStore } from '@/stores/useStore'

const store = useStore()
const { proxy } = getCurrentInstance()

const allRecords = ref([])
const searchKey = ref('')
const itemsPerPage = ref(10)
const itemsPerPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 20, title: '20' },
  { value: 30, title: '30' },
]

const addDialogRef = ref(null)

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

const filteredItems = computed(() => {
  if (!keywordTokens.value.length) return allRecords.value

  return allRecords.value.filter((record) => {
    const content = JSON.stringify(record).toUpperCase()
    return keywordTokens.value.every((token) => content.includes(token.toUpperCase()))
  })
})

const totalCount = computed(() => allRecords.value.length)
const filteredCount = computed(() => filteredItems.value.length)
const latestRecord = computed(() => allRecords.value[0] ?? null)

const showCreateName = computed(() => store.state.cData?.isShowCreaterName)
const showCreateInfo = computed(() => store.state.cData?.isShowCreaterInfo)
const showEditInfo = computed(() => store.state.cData?.isShowEditerInfo)

const sortRecords = (data) => {
  if (!Array.isArray(data)) return []

  return [...data]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .sort((a, b) => {
      if (a.date === b.date) {
        return a.time < b.time ? 1 : -1
      }
      return 0
    })
}

const fetchRecords = async () => {
  if (!hasUser.value) {
    allRecords.value = []
    return
  }

  const postData = {
    key: 'u_snkey',
    value: store.state.uData.snkey,
  }
console.log('postData',postData)
  const url = `byjson/searchByKeyValue/${store.state.databaseName}/signlife`
  const response = await api.options(url, postData)
  let data = response.map((i) => ({...JSON.parse(i.datalist), snkey: i.snkey}))
  allRecords.value = sortRecords(data ?? [])
}

const openAdd = () => {
  addDialogRef.value?.openForAdd()
}

const openEdit = (record) => {
  addDialogRef.value?.openForEdit(record)
}

const askDelete = (record) => {
  proxy.$swal({
    title: '確認要刪除這筆紀錄嗎？?',
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
      snkey: record.snkey,
      tablename: 'signlife',
      datalist: JSON.stringify({
        ...record,
        delman: `${store.state.pData?.username ?? ''} (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`,
      }),
    }

    const rs = await api.delete('signlife', postData)
    if (rs?.state == 1) {
      store.showToastMulti({
        type: 'success',
        message: '紀錄已刪除',
        closeTime: 2,
      })
      fetchRecords()
    } else {
      store.showToastMulti({
        type: 'error',
        message: '刪除失敗，請稍後再試',
        closeTime: 3,
      })
    }
  })
}

const printRecords = () => {
  if (!filteredCount.value) {
    store.showToastMulti({
      type: 'warning',
      message: '目前沒有可列印的資料。',
      closeTime: 2,
    })
    return
  }

  const printTarget = filteredItems.value
  const resident = store.state.uData ?? {}

  const tableRows = printTarget
    .map((item) => {
      return `
        <tr>
          <td>${item.date || ''}</td>
          <td>${item.time || ''}</td>
          <td>${item.result || ''}</td>
          <td>${item.weight || ''}</td>
          <td>${item.bp_h || ''}</td>
          <td>${item.bp_l || ''}</td>
          <td>${item.pulse || ''}</td>
          <td>${item.temperature || ''}</td>
          <td>${item.breath || ''}</td>
          <td>${item.blood_sugar || ''}</td>
          <td>${item.blood_oxygen || ''}</td>
          <td>${item.pain || ''}</td>
          <td>${item.gcs_e || ''}</td>
          <td>${item.gcs_v || ''}</td>
          <td>${item.gcs_m || ''}</td>
          <td>${item.stool || ''}</td>
          <td>${item.note || ''}</td>
        </tr>
      `
    })
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
      <head>
        <meta charset="utf-8" />
        <title>生命徵象紀錄 - 列印</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #2d3a3a; }
          h1 { margin-bottom: 4px; color: #3f6a64; }
          h2 { margin-top: 0; font-size: 16px; color: #647f7d; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #cddbd6; padding: 6px 8px; font-size: 13px; }
          th { background-color: #e4efe8; text-align: left; }
          tr:nth-child(even) td { background-color: #f7faf8; }
        </style>
      </head>
      <body>
        <h1>生命徵象紀錄</h1>
        <h2>${resident.p_code ?? '--'} ${resident.name ?? ''}</h2>
        <table>
          <thead>
            <tr>
              <th>評估日期</th>
              <th>評估時間</th>
              <th>檢查結果</th>
              <th>體重</th>
              <th>血壓(H)</th>
              <th>血壓(L)</th>
              <th>脈搏</th>
              <th>體溫</th>
              <th>呼吸</th>
              <th>血糖</th>
              <th>血氧濃度</th>
              <th>疼痛指數</th>
              <th>GCS-E</th>
              <th>GCS-V</th>
              <th>GCS-M</th>
              <th>大便次數</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    store.showToastMulti({
      type: 'error',
      message: '瀏覽器阻擋了列印視窗，請允許彈出視窗後再試一次。',
      closeTime: 4,
    })
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped lang="scss">
.signlife__hero {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.16), rgba(91, 143, 163, 0.12));
  border: 1px solid rgba(91, 143, 163, 0.12);
}

.signlife__title {
  font-size: 1.6rem;
  color: rgba(53, 88, 80, 0.92);
}

.signlife__subtitle {
  color: rgba(53, 88, 80, 0.7);
}

.signlife__tag {
  border-color: rgba(91, 143, 163, 0.35);
  color: rgba(53, 88, 80, 0.8);
}

.signlife__meta {
  gap: 12px;
}

.signlife__summary-card {
  padding: 20px;
  text-align: center;
  color: rgba(53, 88, 80, 0.9);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  .summary-title {
    font-size: 0.95rem;
    margin-bottom: 8px;
    color: rgba(53, 88, 80, 0.78);
  }

  .summary-value {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 6px;

    &--note {
      font-size: 1.1rem;
      font-weight: 600;
      min-height: 40px;
    }
  }

  .summary-caption {
    font-size: 0.8rem;
    color: rgba(53, 88, 80, 0.6);
  }
}

.signlife__toolbar {
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 16px 32px rgba(74, 107, 95, 0.12);
}

.signlife__table-card {
  border-color: var(--daycare-divider);
  box-shadow: 0 20px 40px rgba(74, 107, 95, 0.16);
}

.signlife__table {
  thead {
    background-color: rgba(168, 197, 181, 0.18);

    th {
      font-weight: 600;
      color: rgba(53, 88, 80, 0.85);
      white-space: nowrap;
    }
  }

  tbody tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.6);
  }

  tbody tr:hover {
    background-color: rgba(168, 197, 181, 0.12);
  }
}
</style>