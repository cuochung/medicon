<template>
  <div class="pipeline">
    <PipelineAddDialog ref="addDialogRef" @refresh="fetchRecords" />

    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="pipeline__hero" rounded="xl" elevation="0">
            <div class="d-flex flex-column flex-md-row justify-space-between align-start">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar size="56" color="primary" variant="tonal" class="mr-4">
                  <v-icon color="primary" size="32">mdi-pipe-wrench</v-icon>
                </v-avatar>
                <div>
                  <h2 class="pipeline__title mb-1">管路使用紀錄</h2>
                  <p class="pipeline__subtitle mb-0">
                    追蹤住民各類管路的使用期間與更換紀錄。
                  </p>
                </div>
              </div>

              <div class="d-flex align-center gap-2 flex-wrap">
                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-plus-circle"
                  :disabled="!hasUser"
                  @click="openAddDialog"
                >
                  新增管路紀錄
                </v-btn>
              </div>
            </div>

            <v-divider class="my-4" />

            <div class="pipeline__meta d-flex flex-wrap gap-3">
              <v-chip variant="tonal" color="primary">
                住民：{{ residentName }}
              </v-chip>
              <v-chip variant="tonal" color="secondary">
                住編：{{ residentCode }}
              </v-chip>
              <v-chip variant="text" color="primary" prepend-icon="mdi-format-list-bulleted-type">
                總筆數：{{ totalCount }}
              </v-chip>
              <v-chip variant="text" color="info" prepend-icon="mdi-clock-alert-outline">
                使用中：{{ activeCount }}
              </v-chip>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" dense>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="primary" rounded="xl" class="pipeline__summary-card">
            <v-icon size="28" class="mb-2">mdi-format-list-numbered</v-icon>
            <div class="summary-title">總紀錄筆數</div>
            <div class="summary-value">{{ totalCount }}</div>
            <div class="summary-caption">目前載入的管路使用紀錄</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="info" rounded="xl" class="pipeline__summary-card">
            <v-icon size="28" class="mb-2">mdi-clock-alert-outline</v-icon>
            <div class="summary-title">使用中管路</div>
            <div class="summary-value">{{ activeCount }}</div>
            <div class="summary-caption">尚未設定結束日期的紀錄</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="success" rounded="xl" class="pipeline__summary-card">
            <v-icon size="28" class="mb-2">mdi-magnify</v-icon>
            <div class="summary-title">搜尋結果</div>
            <div class="summary-value">{{ filteredCount }}</div>
            <div class="summary-caption">符合搜尋條件的顯示筆數</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="pipeline__toolbar" rounded="xl" elevation="0">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="searchKey"
                  variant="outlined"
                  density="comfortable"
                  class="pr-md-4"
                  prepend-inner-icon="mdi-magnify"
                  label="搜尋關鍵字（管路名稱、日期、備註等）"
                  hide-details
                  inset
                />
              </v-col>
              <v-col cols="12" md="6" class="d-flex justify-end gap-2 mt-3 mt-md-0 flex-wrap">
                <v-chip
                  v-for="token in searchTokens"
                  :key="token"
                  color="primary"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-pound"
                >
                  {{ token }}
                </v-chip>
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
            尚未選擇住民，請先至住民清單選擇後再維護管路使用紀錄。
          </v-alert>

          <v-alert
            v-else-if="hasUser && !filteredCount"
            type="info"
            variant="tonal"
            border="start"
            color="primary"
            class="mb-4"
            icon="mdi-information-outline"
          >
            目前沒有符合搜尋條件的資料，可調整搜尋條件或新增管路紀錄。
          </v-alert>

          <v-progress-linear
            v-if="loading"
            indeterminate
            color="primary"
            class="mb-4"
          />

          <PaginatedIterator
            v-if="filteredCount"
            :items="filteredItems"
            v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions"
          >
            <template #default="{ items }">
              <v-card class="pipeline__table-card" rounded="xl" variant="outlined">
                <v-card-title class="d-flex align-center">
                  <div class="text-subtitle-1 font-weight-bold">顯示筆數：{{ filteredCount }}</div>
                  <v-spacer />
                  <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar-range">
                    依開始日期由新到舊排序
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0">
                  <v-table class="pipeline__table" fixed-header>
                    <thead>
                      <tr>
                        <th style="width: 60px;" class="text-center">操作</th>
                        <th style="width: 180px;">使用管路</th>
                        <th style="width: 120px;">單位(Fr)</th>
                        <th style="width: 140px;">開始日期</th>
                        <th style="width: 140px;">結束日期</th>
                        <th>備註</th>
                        <th v-if="canShowCreatorName" style="width: 160px;">紀錄人姓名</th>
                        <th v-if="canShowCreatorInfo" style="width: 220px;">紀錄人紀錄</th>
                        <th v-if="canShowEditorInfo" style="width: 220px;">修改紀錄</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(record, index) in items"
                        :key="record.snkey || record.raw?.snkey || `pipeline-${index}`"
                        :class="{ 'pipeline__row--active': isActive(record.raw) }"
                      >
                        <td class="text-center">
                          <v-menu v-if="hasUser" location="bottom">
                            <template #activator="{ props }">
                              <v-btn
                                v-bind="props"
                                variant="text"
                                icon="mdi-dots-vertical"
                                color="primary"
                              />
                            </template>
                            <v-list density="compact">
                              <v-list-item @click="openEdit(record.raw)">
                                <v-list-item-title>修改</v-list-item-title>
                              </v-list-item>
                              <v-list-item @click="askDelete(record.raw)">
                                <v-list-item-title>刪除</v-list-item-title>
                              </v-list-item>
                            </v-list>
                          </v-menu>
                        </td>
                        <td>
                          <div class="d-flex align-center gap-2">
                            <span class="text-body-2 font-weight-medium">{{ record.raw.name || '—' }}</span>
                            <v-chip
                              v-if="isActive(record.raw)"
                              color="success"
                              variant="tonal"
                              size="x-small"
                              prepend-icon="mdi-check-circle"
                            >
                              使用中
                            </v-chip>
                          </div>
                        </td>
                        <td>
                          <div class="text-body-2">{{ record.raw.unit || '—' }}</div>
                        </td>
                        <td>
                          <div class="text-body-2 font-weight-medium">
                            {{ formatDate(record.raw.start_date) }}
                          </div>
                        </td>
                        <td>
                          <div class="text-body-2">
                            {{ record.raw.end_date ? formatDate(record.raw.end_date) : '進行中' }}
                          </div>
                        </td>
                        <td>
                          <div class="pipeline__content text-body-2">
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
                          <div class="text-body-2 text-truncate pipeline__edit-info">
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

import PipelineAddDialog from './Add.vue'

const store = useStore()
const { proxy } = getCurrentInstance()

const addDialogRef = ref(null)

const records = ref([])
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
const activeCount = computed(() =>
  records.value.filter(
    (item) =>
      !item.end_date ||
      item.end_date === '' ||
      !item.raw?.end_date ||
      item.raw.end_date === '' ||
      item.raw.end_date === '0000-00-00'
  ).length
)

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

const formatDate = (date) => {
  const parsed = dayjs(date)
  return parsed.isValid() ? parsed.format('YYYY/MM/DD') : date ?? ''
}

const parseAction = (value) => {
  if (!value) return null
  const parts = value.split('(')
  return {
    name: parts[0] ?? '',
    time: parts[1] ? parts[1].replace(')', '') : '',
  }
}

const parseEditInfo = (value) => {
  if (!value) return []
  return value.split(';').map((item) => parseAction(item)).filter(Boolean)
}

const normalizeRecord = (row) => {
  const parsed = JSON.parse(row.datalist || '{}')
  return {
    ...parsed,
    snkey: row.snkey,
    createInfo: parseAction(row.create_man),
    editInfo: parseEditInfo(row.edit_man),
    raw: {
      ...parsed,
      snkey: row.snkey,
      create_man: row.create_man,
      edit_man: row.edit_man,
    },
  }
}

const sortRecords = (list) => {
  return [...list].sort((a, b) => {
    const dateA = a.start_date || a.raw?.start_date || ''
    const dateB = b.start_date || b.raw?.start_date || ''
    const dateCompare = dayjs(dateB).diff(dayjs(dateA))
    if (dateCompare !== 0) return dateCompare
    const snkeyA = a.snkey || a.raw?.snkey || ''
    const snkeyB = b.snkey || b.raw?.snkey || ''
    return snkeyB?.localeCompare?.(snkeyA ?? '') ?? 0
  })
}

const isActive = (record) => {
  return !record.end_date || record.end_date === '' || record.end_date === '0000-00-00'
}

const fetchRecords = async () => {
  if (!hasUser.value) {
    records.value = []
    return
  }

  loading.value = true
  const payload = {
    key: 'u_snkey',
    value: store.state.uData.snkey,
  }
  const url = `byjson/searchByKeyValue/${store.state.databaseName}/pipeline_used`
  const response = await api.options(url, payload)

  records.value = sortRecords((response ?? []).map(i=>({
    ...JSON.parse(i.datalist),
    snkey: i.snkey
  })))
  loading.value = false
}

const openAddDialog = () => {
  if (!hasUser.value) {
    proxy?.$swal?.({ icon: 'warning', title: '請先選擇住民，再新增管路使用紀錄。' })
    return
  }
  addDialogRef.value?.openForAdd()
}

const openEdit = (record) => {
  addDialogRef.value?.openForEdit(record)
}

const askDelete = (record) => {
  proxy?.$swal?.({
    title: '確認要刪除這筆管路使用紀錄嗎？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    confirmButtonColor: '#d32f2f',
  }).then(async (result) => {
    if (!result?.isConfirmed) return

    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const snkey = record.snkey || record.raw?.snkey
    const payload = {
      snkey,
      tablename: 'pipeline_used',
      info: JSON.stringify({
        ...(record.raw || record),
        delman: `${store.state?.pData?.username ?? ''} (${timestamp})`,
      }),
    }

    const response = await api.delete('pipeline_used', payload)
    if (response?.state == 1) {
      store.showToastMulti({
        type: 'success',
        message: '管路使用紀錄已刪除',
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

watch(
  () => store.state?.uData?.snkey,
  () => {
    fetchRecords()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.pipeline {
  &__hero {
    padding: 28px;
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04));
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.87);
  }

  &__subtitle {
    font-size: 0.95rem;
    color: rgba(0, 0, 0, 0.6);
  }

  &__meta {
    margin-top: 12px;
  }

  &__summary-card {
    padding: 24px;
    text-align: center;

    .summary-title {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }

    .summary-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .summary-caption {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.5);
    }
  }

  &__toolbar {
    padding: 20px;
    background: rgba(255, 255, 255, 0.8);
  }

  &__table-card {
    overflow: hidden;
  }

  &__table {
    thead th {
      background: rgba(33, 150, 243, 0.08);
      font-weight: 600;
      font-size: 0.95rem;
    }

    tbody tr {
      transition: background-color 0.2s;

      &:hover {
        background: rgba(33, 150, 243, 0.04);
      }
    }

    .pipeline__row--active {
      background: rgba(76, 175, 80, 0.08);
    }
  }

  &__content {
    max-width: 300px;
  }

  &__edit-info {
    max-width: 400px;
  }
}
</style>