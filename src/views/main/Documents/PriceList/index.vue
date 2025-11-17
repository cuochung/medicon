<template>
  <div class="pricelist">
    <PriceListAddDialog ref="addDialogRef" @refresh="fetchRecords" />

    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="pricelist__hero" rounded="xl" elevation="0">
            <div class="d-flex flex-column flex-md-row justify-space-between align-start">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar size="56" color="primary" variant="tonal" class="mr-4">
                  <v-icon color="primary" size="32">mdi-cash-multiple</v-icon>
                </v-avatar>
                <div>
                  <h2 class="pricelist__title mb-1">計價單</h2>
                  <p class="pricelist__subtitle mb-0">
                    快速檢視與維護住民的個別收費項目。
                  </p>
                </div>
              </div>

              <div class="d-flex align-center gap-2 flex-wrap">
                <!-- <v-chip variant="tonal" color="primary">
                  住民：{{ residentName }}
                </v-chip>
                <v-chip variant="tonal" color="secondary">
                  住編：{{ residentCode }}
                </v-chip> -->
                <v-btn color="primary" variant="flat" prepend-icon="mdi-plus-circle" :disabled="!hasUser"
                  @click="openAddDialog">
                  新增計價項目
                </v-btn>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" dense>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="primary" rounded="xl" class="pricelist__summary-card">
            <v-icon size="28" class="mb-2">mdi-format-list-numbered</v-icon>
            <div class="summary-title">總項目數</div>
            <div class="summary-value">{{ totalCount }}</div>
            <div class="summary-caption">目前載入的計價項目筆數</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="info" rounded="xl" class="pricelist__summary-card">
            <v-icon size="28" class="mb-2">mdi-cash-plus</v-icon>
            <div class="summary-title">總計金額</div>
            <div class="summary-value">{{ formattedTotalAmount }}</div>
            <div class="summary-caption">依單價與數量加總之金額（元）</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="success" rounded="xl" class="pricelist__summary-card">
            <v-icon size="28" class="mb-2">mdi-check-decagram</v-icon>
            <div class="summary-title">搜尋結果</div>
            <div class="summary-value">{{ filteredCount }}</div>
            <div class="summary-caption">符合搜尋條件的顯示筆數</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="pricelist__toolbar" rounded="xl" elevation="0">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="6">
                <v-text-field v-model="searchKey" variant="outlined" density="comfortable" class="pr-md-4"
                  prepend-inner-icon="mdi-magnify" label="搜尋關鍵字（日期、項目、備註等）" hide-details inset />
              </v-col>
              <v-col cols="12" md="6" class="d-flex justify-end gap-2 mt-3 mt-md-0 flex-wrap">
                <v-chip v-for="token in searchTokens" :key="token" color="primary" variant="tonal" size="small"
                  prepend-icon="mdi-pound">
                  {{ token }}
                </v-chip>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-alert v-if="!hasUser" type="warning" variant="tonal" border="start" color="warning" class="mb-4"
            icon="mdi-account-search">
            尚未選擇住民，請先至住民清單選擇後再維護計價單資料。
          </v-alert>

          <v-alert v-else-if="hasUser && !filteredCount" type="info" variant="tonal" border="start" color="primary"
            class="mb-4" icon="mdi-information-outline">
            目前沒有符合搜尋條件的資料，可調整搜尋條件或新增項目。
          </v-alert>

          <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

          <PaginatedIterator v-if="filteredCount" :items="filteredItems" v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions">
            <template #default="{ items }">
              <v-card class="pricelist__table-card" rounded="xl" variant="outlined">
                <v-card-title class="d-flex align-center">
                  <div class="text-subtitle-1 font-weight-bold">顯示筆數：{{ filteredCount }}</div>
                  <v-spacer />
                  <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar-range">
                    依建檔日期由新到舊排序
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0">
                  <v-table class="pricelist__table" fixed-header>
                    <thead>
                      <tr>
                        <th style="width: 60px;" class="text-center">操作</th>
                        <th style="width: 120px;">建檔日期</th>
                        <th style="width: 200px;">收費項目</th>
                        <th style="width: 120px;">類別</th>
                        <th style="width: 100px;" class="text-right">單價</th>
                        <th style="width: 100px;" class="text-right">數量</th>
                        <th style="width: 120px;" class="text-right">小計</th>
                        <th>備註</th>
                        <th v-if="canShowCreatorName" style="width: 160px;">紀錄人姓名</th>
                        <th v-if="canShowCreatorInfo" style="width: 220px;">紀錄人紀錄</th>
                        <th v-if="canShowEditorInfo" style="width: 220px;">修改紀錄</th>
                      </tr>
                    </thead>
                    <tbody class="text-no-wrap">
                      <tr v-for="record in items" :key="record.snkey">
                        <td class="text-center">
                          <v-menu v-if="hasUser" location="bottom">
                            <template #activator="{ props }">
                              <v-btn v-bind="props" variant="text" icon="mdi-dots-vertical" color="primary" />
                            </template>
                            <v-list density="compact">
                              <v-list-item @click="openEdit(record)">
                                <v-list-item-title>修改</v-list-item-title>
                              </v-list-item>
                              <v-list-item @click="askDelete(record)">
                                <v-list-item-title>刪除</v-list-item-title>
                              </v-list-item>
                            </v-list>
                          </v-menu>
                        </td>
                        <td>
                          <div class="text-body-2 font-weight-medium">
                            {{ record.raw.date }}
                          </div>
                        </td>
                        <td>
                          <div class="text-body-2 font-weight-medium">
                            {{ record.raw.feeInfo?.name ?? '—' }}
                          </div>
                        </td>
                        <td>{{ record.raw.feeInfo?.kind || '—' }}</td>
                        <td class="text-right">{{ formatCurrency(record.raw.price) }}</td>
                        <td class="text-right">{{ record.raw.quantity }}</td>
                        <td class="text-right font-weight-medium">{{ formatCurrency(record.raw.subtotal) }}</td>
                        <td>
                          <div class="pricelist__content text-body-2">
                            {{ record.raw.note || '—' }}
                          </div>
                        </td>
                        <td v-if="canShowCreatorName">
                          {{ record.raw.createInfo?.name ?? '' }}
                        </td>
                        <td v-if="canShowCreatorInfo">
                          <div class="text-body-2">
                            {{ record.raw.createInfo ? `${record.raw.createInfo.name} (${record.raw.createInfo.time})` : '' }}
                          </div>
                        </td>
                        <td v-if="canShowEditorInfo">
                          <div class="text-body-2 text-truncate pricelist__edit-info">
                            {{
                              Array.isArray(record.raw.editInfo)
                                ? record.raw.editInfo.map((i) => `${i.name} (${i.time})`).join('，')
                                : ''
                            }}
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
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, getCurrentInstance, ref, watch, onMounted } from 'vue'

import PaginatedIterator from '@/components/PaginatedIterator.vue'
import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'

import PriceListAddDialog from './Add.vue'

const store = useStore()
const { proxy } = getCurrentInstance()

const addDialogRef = ref(null)

const records = ref([])
const feeItems = ref([])

const searchKey = ref('')
const itemsPerPage = ref(10)
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 20, title: '20' },
  { value: 30, title: '30' },
]
const loading = ref(false)

const hasUser = computed(() => Boolean(store.state?.uData?.snkey))
const residentName = computed(() => store.state?.uData?.name ?? '未選擇住民')
const residentCode = computed(() => store.state?.uData?.p_code ?? '---')

const totalCount = computed(() => records.value.length)

const totalAmount = computed(() =>
  records.value.reduce((sum, record) => sum + (record.subtotal || 0), 0)
)

const formattedTotalAmount = computed(() => formatCurrency(totalAmount.value))

const searchTokens = computed(() => searchKey.value.split(/\s+/).filter(Boolean))

const filteredItems = computed(() => {
  if (!searchTokens.value.length) return records.value
  return records.value.filter((item) => {
    const str = JSON.stringify(item).toUpperCase()
    return searchTokens.value.every((token) => str.includes(token.toUpperCase()))
  })
})

const filteredCount = computed(() => filteredItems.value.length)

const canShowCreatorName = computed(() => Boolean(store.state?.cData?.isShowCreaterName))
const canShowCreatorInfo = computed(() => Boolean(store.state?.cData?.isShowCreaterInfo))
const canShowEditorInfo = computed(() => Boolean(store.state?.cData?.isShowEditerInfo))

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('zh-TW', { minimumFractionDigits: 0 })
}

const parseLegacyActor = (value) => {
  if (!value) return null
  if (typeof value === 'object') {
    if (!value.name && value.username) {
      return { name: value.username, time: value.time ?? '' }
    }
    return {
      name: value.name ?? value.label ?? '',
      time: value.time ?? '',
    }
  }
  const [name = '', time = ''] = String(value).split('(')
  return {
    name: name.trim(),
    time: time ? time.replace(')', '').trim() : '',
  }
}

const parseLegacyEditors = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value)
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseLegacyActor(item))
    .filter(Boolean)
}

const normalizeRecord = (row, feeItemsMap) => {
  if (!row) return null
  const parsed = (() => {
    try {
      return JSON.parse(row.datalist ?? '{}')
    } catch (error) {
      console.warn('parse accounting datalist failed', error)
      return {}
    }
  })()

  const feeSnkey = parsed.fee_snkey ?? row.fee_snkey
  const feeInfo = feeItemsMap.get(feeSnkey ?? '')
  if (!feeInfo) return null

  const quantity = Number(parsed.quantity ?? row.quantity ?? 0) || 0
  const price = Number(parsed.price ?? row.price ?? feeInfo.price ?? 0) || 0
  const subtotal = quantity * price

  const createInfo =
    parsed.createInfo ??
    parseLegacyActor(parsed.create_man ?? row.create_man) ??
    parseLegacyActor(row.create_man)

  const editInfo = Array.isArray(parsed.editInfo) && parsed.editInfo.length
    ? parsed.editInfo
    : parseLegacyEditors(parsed.edit_man ?? row.edit_man)

  return {
    snkey: row.snkey,
    date: parsed.date ?? row.date ?? '',
    quantity,
    price,
    subtotal,
    note: parsed.note ?? row.note ?? '',
    feeInfo: {
      snkey: feeInfo.snkey,
      name: feeInfo.name,
      kind: feeInfo.kind,
      unit: feeInfo.unit,
    },
    createInfo,
    editInfo,
    raw: {
      ...parsed,
      snkey: row.snkey,
      fee_snkey: feeInfo.snkey,
      date: parsed.date ?? row.date ?? '',
      quantity,
      price,
      subtotal,
      note: parsed.note ?? row.note ?? '',
      createInfo,
      editInfo,
    },
  }
}

const sortRecords = (list) => {
  return [...list].sort((a, b) => {
    const dateCompare = dayjs(b.date).diff(dayjs(a.date))
    if (dateCompare !== 0) return dateCompare
    return b.snkey?.localeCompare?.(a.snkey ?? '') ?? 0
  })
}

const fetchFeeItems = async () => {
  const response = await api.get('fee')
  feeItems.value = response ?? []
}

const fetchRecords = async () => {
  if (!hasUser.value) {
    records.value = []
    return
  }

  if (!feeItems.value.length) {
    await fetchFeeItems()
  }

  loading.value = true
  const payload = {
    key: 'u_snkey',
    value: store.state.uData.snkey,
  }
  const url = `byjson/searchByKeyValue/${store.state.databaseName}/accounting`
  const response = await api.options(url, payload)

  const feeItemsMap = new Map(
    feeItems.value.map((item) => [
      item.snkey,
      {
        snkey: item.snkey,
        name: item.name,
        kind: item.kind,
        unit: item.unit,
        price: Number(item.price) || 0,
      },
    ])
  )

  const data = (response ?? [])
    .map((row) => normalizeRecord(row, feeItemsMap))
    .filter((item) => item !== null)

  const excludeKinds = ['固定費類', '車資類']
  records.value = sortRecords(data.filter((row) => !excludeKinds.includes(row.feeInfo?.kind ?? '')))

  loading.value = false
}

const openAddDialog = () => {
  if (!hasUser.value) {
    proxy?.$swal?.({ icon: 'warning', title: '請先選擇住民，再新增計價項目。' })
    return
  }
  addDialogRef.value?.openForAdd()
}

const openEdit = (record) => {
  const fee = {
    snkey: record.feeInfo?.snkey ?? '',
    text: `${record.feeInfo?.name ?? ''}｜${record.feeInfo?.kind ?? ''}`,
    price: record.price,
  }

  addDialogRef.value?.openForEdit({
    ...record.raw,
    snkey: record.snkey,
    date: record.date,
    quantity: record.quantity,
    note: record.note,
    fee,
  })
}

const askDelete = (record) => {
  proxy?.$swal?.({
    title: '確認要刪除這筆計價項目嗎？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    confirmButtonColor: '#d32f2f',
  }).then(async (result) => {
    if (!result?.isConfirmed) return

    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const payload = {
      snkey: record.snkey,
      tablename: 'accounting',
      info: JSON.stringify({
        ...(record.raw ?? {}),
        delman: `${store.state?.pData?.username ?? ''} (${timestamp})`,
      }),
    }

    const response = await api.delete('accounting', payload)
    if (response?.state == 1) {
      store.showToastMulti({
        type: 'success',
        message: '計價項目已刪除',
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

onMounted(async () => {
  await fetchFeeItems()
  await fetchRecords()
})

watch(
  () => store.state?.uData?.snkey,
  async () => {
    await fetchRecords()
  }
)
</script>

<style scoped lang="scss">
.pricelist {
  &__hero {
    padding: 28px;
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04));
  }

  &__title {
    font-weight: 700;
  }

  &__subtitle {
    color: rgba(0, 0, 0, 0.6);
  }

  &__summary-card {
    padding: 24px;
    text-align: center;

    .summary-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .summary-caption {
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.6);
    }
  }

  &__toolbar {
    padding: 16px 24px;
    background: #fff;
  }

  &__table-card {
    overflow: hidden;
  }

  &__table {
    tbody tr {
      transition: background-color 0.2s ease;
    }
  }

  &__content {
    white-space: pre-line;
  }

  &__edit-info {
    max-width: 240px;
  }
}
</style>