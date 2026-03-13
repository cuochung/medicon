<template>
  <div class="wallet-v2-balance-list pa-6">
    <v-container fluid class="pa-0">
      <!-- 標題列 -->
      <v-row>
        <v-col cols="12">
          <v-sheet class="page-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-btn icon variant="text" @click="goBackToWalletV2" class="mr-3">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                <v-icon color="primary">mdi-format-list-bulleted</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">會員儲金一覽表</h2>
                <p class="hero-subtitle mb-0">檢視儲金餘額、匯入 Excel、設定基準日。</p>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 基準日設定 -->
      <v-row class="mt-4">
        <v-col cols="12" md="7" lg="6">
          <v-card class="baseline-card" variant="tonal" color="primary" rounded="xl">
            <v-card-text class="py-4">
              <div class="d-flex flex-column flex-md-row align-center justify-space-between">
                <div class="d-flex align-center mb-3 mb-md-0">
                  <v-avatar color="primary" variant="tonal" size="40" class="mr-3">
                    <v-icon color="primary">mdi-calendar</v-icon>
                  </v-avatar>
                  <div>
                    <div class="baseline-title">基準日</div>
                    <div class="baseline-current">
                      目前基準日：
                      <span class="baseline-current-value">
                        {{ walletActivationDate || '未設定' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="d-flex align-center flex-wrap baseline-actions">
                  <v-text-field
                    v-model="baselineDateInput"
                    type="date"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    class="baseline-date-field"
                  />
                  <v-btn
                    color="primary"
                    variant="flat"
                    :loading="savingBaseline"
                    :disabled="!baselineDateInput"
                    class="ml-md-2 mt-2 mt-md-0"
                    @click="saveBaselineDate"
                  >
                    儲存
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 工具列：搜尋 + 匯入 -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="balance-toolbar" elevation="0" rounded="xl">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="searchKey"
                  label="搜尋客戶關鍵字"
                  density="comfortable"
                  variant="outlined"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  single-line
                  clearable
                />
              </v-col>
              <v-col cols="12" md="4" class="d-flex justify-end mt-3 mt-md-0">
                <ImportExcelDialog @imported="loadWalletData" />
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 會員儲金一覽表（分頁） -->
      <v-card class="balance-table-card">
        <v-card-text>
          <div class="d-flex justify-space-between align-center mb-3">
            <div class="text-subtitle-2 text-medium-emphasis">
              目前客戶數：<span class="font-weight-bold">{{ totalCustomers }}</span>
            </div>
          </div>
          <template v-if="loading">
            <div class="text-center py-12">
              <v-progress-circular indeterminate color="primary" size="48" />
              <p class="text-medium-emphasis mt-3">載入中...</p>
            </div>
          </template>
          <template v-else-if="list.length === 0">
            <div class="text-center text-medium-emphasis py-12">尚無資料，請使用「匯入 Excel」匯入客戶與餘額。</div>
          </template>
          <template v-else-if="searchfilter.length === 0">
            <div class="text-center text-medium-emphasis py-12">查無符合「{{ searchKey }}」的資料，請調整關鍵字。</div>
          </template>
          <PaginatedIterator
            v-else
            :items="searchfilter"
            v-model:page="currentPage"
            v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions"
          >
            <template #default="{ items }">
              <v-table fixed-header class="balance-table text-no-wrap" hide-default-footer>
                <thead class="title text-h6">
                  <tr>
                    <th class="text-left">客戶名稱</th>
                    <th class="text-end">儲金剩餘金額</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in items" :key="rowKey(item, index)">
                    <td>{{ rowData(item).customerName || '—' }}</td>
                    <td class="text-end">{{ formatBalance(rowData(item).balance) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </PaginatedIterator>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/useStore'
import api from '@/assets/js/api.js'
import { getCurrentInstance } from 'vue'
import ImportExcelDialog from './ImportExcelDialog.vue'
import PaginatedIterator from '@/components/PaginatedIterator.vue'

const router = useRouter()
const store = useStore()
const { proxy } = getCurrentInstance()

const list = ref([])
const loading = ref(false)
const walletActivationDate = ref('')
const baselineDateInput = ref('')
const savingBaseline = ref(false)
const searchKey = ref('')

// 分頁（與 Customer 一致）
const currentPage = ref(1)
const itemsPerPage = ref(10)
const itemsPerPageOptions = [
  { value: 12, title: '12' },
  { value: 24, title: '24' },
  { value: 36, title: '36' },
]

// 總客戶數（依目前匯入的 walletdatav2 筆數）
const totalCustomers = computed(() => list.value.length)

// 搜尋篩選：依關鍵字搜尋客戶名稱或餘額（多關鍵字以空白分隔，皆需符合）
const searchfilter = computed(() => {
  const keys = (searchKey.value || '').trim().split(/\s+/).filter(Boolean)
  if (keys.length === 0) return list.value
  const str = (obj) => JSON.stringify(obj).toUpperCase()
  return keys.reduce((prev, key) => {
    const k = key.toUpperCase()
    return prev.filter((item) => str(item).includes(k))
  }, list.value)
})

function formatBalance (val) {
  const n = parseFloat(val)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// 相容 v-data-iterator 的 item / item.raw
function rowData (item) {
  return item && item.raw ? item.raw : item
}
function rowKey (item, index) {
  const row = rowData(item)
  return row?.snkey ?? index
}

async function loadWalletData () {
  loading.value = true
  try {
    const rs = await api.get('walletdatav2')
    if (rs && Array.isArray(rs)) {
      list.value = rs.map((i) => {
        let data = {}
        try {
          data = typeof i.datalist === 'string' ? JSON.parse(i.datalist) : (i.datalist || {})
        } catch (_) {}
        return { snkey: i.snkey, ...data }
      })
    } else {
      list.value = []
    }
  } catch (err) {
    console.error('載入儲金一覽失敗:', err)
    list.value = []
  } finally {
    loading.value = false
  }
}

async function loadActivationDate () {
  try {
    const rs = await api.get('other_data')
    if (rs && rs.length > 0) {
      const first = rs[0]
      let dateVal = ''
      if (first.walletActivationDate) {
        dateVal = first.walletActivationDate
      } else if (first.datalist) {
        const data = typeof first.datalist === 'string' ? JSON.parse(first.datalist) : first.datalist
        dateVal = data?.walletActivationDate || ''
      }
      walletActivationDate.value = dateVal || ''
      if (dateVal) baselineDateInput.value = dateVal
    }
  } catch (err) {
    console.error('載入基準日失敗:', err)
  }
}

async function loadAll () {
  await Promise.all([loadWalletData(), loadActivationDate()])
}

function goBackToWalletV2 () {
  router.push('/main/WalletV2')
}

async function saveBaselineDate () {
  if (!baselineDateInput.value) return
  savingBaseline.value = true
  try {
    const rs = await api.get('other_data')
    if (!rs || rs.length === 0) {
      proxy.$swal({
        icon: 'warning',
        title: '無法儲存',
        text: '找不到 other_data 第一筆資料',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6',
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: false,
        position: 'center'
      })
      return
    }
    const first = rs[0]
    await api.post('other_data', {
      snkey: first.snkey,
      walletActivationDate: baselineDateInput.value
    })
    walletActivationDate.value = baselineDateInput.value
    proxy.$swal({
      icon: 'success',
      title: '儲存成功',
      text: '基準日已更新',
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center'
    })
  } catch (err) {
    console.error('儲存基準日失敗:', err)
    proxy.$swal({
      icon: 'error',
      title: '儲存失敗',
      text: err?.message || '更新基準日時發生錯誤',
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center'
    })
  } finally {
    savingBaseline.value = false
  }
}

onMounted(() => {
  loadAll()
})
</script>

<style scoped lang="scss">
.wallet-v2-balance-list {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.18), rgba(123, 163, 184, 0.1));
}

.page-hero {
  background: linear-gradient(135deg, rgba(74, 107, 95, 0.18), rgba(123, 163, 184, 0.2));
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 10px 24px rgba(74, 107, 95, 0.18);
  padding: 24px;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--daycare-primary);
}

.hero-subtitle {
  color: rgba(74, 107, 95, 0.78);
}

.baseline-card {
  border: 1px solid rgba(91, 143, 163, 0.18);
  box-shadow: 0 8px 24px rgba(74, 107, 95, 0.12);
}

.baseline-date-field {
  max-width: 200px;
}

.baseline-title {
  font-size: 1rem;
  font-weight: 600;
}

.baseline-current {
  font-size: 0.9rem;
  color: rgba(74, 107, 95, 0.78);
}

.baseline-current-value {
  font-weight: 600;
  color: var(--daycare-primary);
}

.baseline-actions {
  gap: 8px;
}

.balance-toolbar {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--daycare-divider-light);
  padding: 18px 24px;
  box-shadow: 0 8px 24px var(--daycare-shadow-light, rgba(74, 107, 95, 0.12));
}

.balance-table-card {
  border-radius: 24px;
  box-shadow: 0 14px 40px rgba(74, 107, 95, 0.14);
  border: 1px solid rgba(91, 143, 163, 0.16);
  margin-top: 24px;
}

.balance-table {
  th {
    background-color: rgba(74, 107, 95, 0.1);
    font-weight: 600;
    color: var(--daycare-primary);
  }
  td, th {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(123, 163, 184, 0.2);
  }
}
</style>
