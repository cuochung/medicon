<template>
  <div class="nursingrecord">
    <NursingrecordAddDialog ref="addDialogRef" @refresh="fetchRecords" />
    <NursingrecordPrintOption ref="printDialogRef" />

    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="nursingrecord__hero" rounded="xl" elevation="0">
            <div class="d-flex flex-column flex-md-row justify-space-between align-start">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar size="56" color="primary" variant="tonal" class="mr-4">
                  <v-icon color="primary" size="32">mdi-notebook-heart</v-icon>
                </v-avatar>
                <div>
                  <h2 class="nursingrecord__title mb-1">護理紀錄</h2>
                  <p class="nursingrecord__subtitle mb-0">
                    追蹤住民照護歷程，讓交班資訊一目了然。
                  </p>
                </div>
              </div>
              <div class="d-flex align-center gap-2 flex-wrap">
                <v-btn color="tertiary" variant="tonal" prepend-icon="mdi-printer"
                  :disabled="!hasUser || !filteredCount" @click="openPrintOptions">
                  匯出列印
                </v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-plus-circle"
                  :disabled="!hasUser || disableActions" @click="openAddDialog">
                  新增紀錄
                </v-btn>
              </div>
            </div>

            <v-divider class="my-4" />

            <div class="nursingrecord__meta d-flex flex-wrap gap-3">
              <v-chip variant="tonal" color="primary">
                住民：{{ residentName }}
              </v-chip>
              <v-chip variant="tonal" color="secondary">
                住編：{{ residentCode }}
              </v-chip>
              <v-chip variant="text" color="primary" prepend-icon="mdi-format-list-bulleted-type">
                總筆數：{{ totalCount }}
              </v-chip>
              <v-chip v-if="latestRecord" variant="text" color="teal" prepend-icon="mdi-clock-check-outline">
                最新紀錄：{{ latestRecord.date }} {{ latestRecord.time }}
              </v-chip>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" dense>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="primary" rounded="xl" class="nursingrecord__summary-card">
            <v-icon size="28" class="mb-2">mdi-format-list-numbered</v-icon>
            <div class="summary-title">總紀錄筆數</div>
            <div class="summary-value">{{ totalCount }}</div>
            <div class="summary-caption">目前載入的護理紀錄資料</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="info" rounded="xl" class="nursingrecord__summary-card">
            <v-icon size="28" class="mb-2">mdi-magnify</v-icon>
            <div class="summary-title">搜尋結果</div>
            <div class="summary-value">{{ filteredCount }}</div>
            <div class="summary-caption">符合條件的顯示筆數</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="error" rounded="xl" class="nursingrecord__summary-card">
            <v-icon size="28" class="mb-2">mdi-alarm-light</v-icon>
            <div class="summary-title">重點交班</div>
            <div class="summary-value">{{ focusCount }}</div>
            <div class="summary-caption">設定為重點交班的紀錄筆數</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="nursingrecord__toolbar" rounded="xl" elevation="0">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="6">
                <v-text-field v-model="searchKey" variant="outlined" density="comfortable" class="pr-md-4"
                  prepend-inner-icon="mdi-magnify" label="搜尋關鍵字（日期、項目、護理內容等）" hide-details inset />
              </v-col>
              <v-col cols="12" md="6" class="d-flex justify-end gap-2 mt-3 mt-md-0">
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
            尚未選擇住民，請先至住民清單選擇後再進行護理紀錄管理。
          </v-alert>

          <v-alert v-else-if="hasUser && !filteredCount" type="info" variant="tonal" border="start" color="primary"
            class="mb-4" icon="mdi-eye-off-outline">
            目前沒有符合搜尋條件的資料，可調整搜尋條件或新增護理紀錄。
          </v-alert>

          <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

          <PaginatedIterator v-if="filteredCount" :items="filteredRecords" v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions">
            <template #default="{ items }">
              <v-card class="nursingrecord__table-card" rounded="xl" variant="outlined">
                <v-card-title class="d-flex align-center">
                  <div class="text-subtitle-1 font-weight-bold">顯示筆數：{{ filteredCount }}</div>
                  <v-spacer></v-spacer>
                  <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar-range">
                    依日期時間由新到舊排序
                  </v-chip>
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-0">
                  <v-table class="nursingrecord__table" fixed-header>
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 80px;">操作</th>
                        <th style="width: 120px;">日期</th>
                        <th style="width: 100px;">時間</th>
                        <th style="width: 140px;">項目</th>
                        <th>護理紀錄內容</th>
                        <th v-if="canShowCreatorName" style="width: 160px;">紀錄人姓名</th>
                        <th v-if="canShowCreatorInfo" style="width: 220px;">紀錄人紀錄</th>
                        <th v-if="canShowEditorInfo" style="width: 220px;">修改紀錄</th>
                      </tr>
                    </thead>
                    <tbody class="text-no-wrap">
                      <tr v-for="record,index in items" :key="index"
                        :class="{ 'nursingrecord__row--focus': record.focus === 'true' }">
                        <td class="text-center">
                          <v-menu v-if="!disableActions" location="bottom">
                            <template #activator="{ props }">
                              <v-btn v-bind="props" variant="text" icon="mdi-dots-vertical" color="primary" />
                            </template>
                            <v-list density="compact">
                              <v-list-item @click="openEdit(record.raw)" :disabled="!canEdit(record.raw)">
                                <v-list-item-title>修改</v-list-item-title>
                              </v-list-item>
                              <v-list-item @click="askDelete(record.raw)" :disabled="!canEdit(record.raw)">
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
                          <div class="text-body-2">
                            {{ record.raw.time }}
                          </div>
                        </td>
                        <td>
                          <div class="d-flex align-center gap-2">
                            <span>{{ record.raw.project || '—' }}</span>
                            <v-chip v-if="record.raw.focus === 'true'" color="error" variant="tonal" size="x-small"
                              prepend-icon="mdi-alarm-light">
                              重點
                            </v-chip>
                          </div>
                        </td>
                        <td>
                          <div class="nursingrecord__content text-body-2 text-truncate" style="max-width: 500px;">
                            {{ record.raw.nursingrecord_content }}
                          </div>
                        </td>
                        <td v-if="canShowCreatorName">
                          {{ record.raw.createInfo.name }}
                        </td>
                        <td v-if="canShowCreatorInfo">
                          <div class="text-body-2">{{ record.raw.createInfo.name }} ({{ record.raw.createInfo.time }})
                          </div>
                        </td>
                        <td v-if="canShowEditorInfo">
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
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, getCurrentInstance, ref, watch } from 'vue'

import PaginatedIterator from '@/components/PaginatedIterator.vue'
import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'

import NursingrecordAddDialog from './Add.vue'
import NursingrecordPrintOption from './PrintOption.vue'

const store = useStore()
const { proxy } = getCurrentInstance()

const addDialogRef = ref(null)
const printDialogRef = ref(null)

const records = ref([])
const searchKey = ref('')
const itemsPerPage = ref(10)
const itemsPerPageOptions = [10, 20, 30]
const loading = ref(false)

const hasUser = computed(() => Boolean(store.state?.uData?.snkey))
const residentName = computed(() => store.state?.uData?.name ?? '未選擇住民')
const residentCode = computed(() => store.state?.uData?.p_code ?? '---')

const totalCount = computed(() => records.value.length)
const focusCount = computed(() => records.value.filter((item) => item.focus === 'true').length)
const latestRecord = computed(() => records.value[0] ?? null)

const searchTokens = computed(() => searchKey.value.split(/\s+/).filter(Boolean))

const filteredRecords = computed(() => {
  if (!searchTokens.value.length) return records.value
  return records.value.filter((item) => {
    const str = JSON.stringify(item).toUpperCase()
    return searchTokens.value.every((token) => str.includes(token.toUpperCase()))
  })
})

const filteredCount = computed(() => filteredRecords.value.length)

const canShowCreatorName = computed(() => Boolean(store.state?.cData?.isShowCreaterName))
const canShowCreatorInfo = computed(() => Boolean(store.state?.cData?.isShowCreaterInfo))
const canShowEditorInfo = computed(() => Boolean(store.state?.cData?.isShowEditerInfo))

const disableActions = computed(() => Boolean(store.state?.pData?.pharmacist_key))

const sortRecords = (list) => {
  return [...list].sort((a, b) => {
    const dateCompare = dayjs(b.date).diff(dayjs(a.date))
    if (dateCompare !== 0) return dateCompare
    return (b.time ?? '').localeCompare(a.time ?? '')
  })
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
  const url = `byjson/searchByKeyValue/${store.state.databaseName}/nursingrecord`
  const response = await api.options(url, payload)
  records.value = sortRecords((response ?? []).map(i=>({
    ...JSON.parse(i.datalist),
    snkey: i.snkey,    
  })))

  loading.value = false
}

const openAddDialog = () => {
  if (!hasUser.value) {
    proxy?.$swal?.({ icon: 'warning', title: '請先選擇住民，再新增護理紀錄。' })
    return
  }
  addDialogRef.value?.openForAdd()
}

const canEdit = (record) => {
  if (store.state?.pData?.master_key === 'true') return true
  const username = store.state?.pData?.username ?? ''
  return record?.createInfo?.name?.includes?.(username)
}

const openEdit = (record) => {
  if (!canEdit(record)) {
    store.showToastMulti({
      type: 'warning',
      message: '非紀錄人無法修改或刪除',
      closeTime: 2,
    })
    return
  }
  addDialogRef.value?.openForEdit(record)
}

const openPrintOptions = () => {
  if (!filteredRecords.value.length) {
    store.showToastMulti({
      type: 'warning',
      message: '目前沒有可列印的資料',
      closeTime: 2,
    })
    return
  }
  printDialogRef.value?.open(filteredRecords.value)
}

const askDelete = (record) => {
  if (!canEdit(record)) {
    store.showToastMulti({
      type: 'warning',
      message: '非紀錄人無法修改或刪除',
      closeTime: 2,
    })
    return
  }

  proxy.$swal({
    title: '確認要刪除這筆護理紀錄嗎？',
    text: '此操作無法復原，請再次確認。',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then(async (result) => {
    if (!result?.isConfirmed) return

    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const payload = {
      snkey: record.snkey,
      tablename: 'nursingrecord',
      info: JSON.stringify({
        ...record,
        delman: `${store.state?.pData?.username ?? ''} (${timestamp})`,
      }),
    }

    const response = await api.delete('nursingrecord', payload)
    if (response?.state == 1) {
      store.showToastMulti({
        type: 'success',
        message: '護理紀錄已刪除',
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
.nursingrecord {
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

  &__row--focus {
    background-color: rgba(229, 57, 53, 0.08);
  }

  &__content {
    white-space: pre-line;
  }

  &__edit-info {
    max-width: 220px;
  }
}
</style>