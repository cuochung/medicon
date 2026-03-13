<template>
  <div class="transaction-history-page pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="page-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-btn icon variant="text" @click="$router.push('/main/WalletV2')" class="mr-3">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-avatar color="success" variant="tonal" size="48" class="mr-3">
                <v-icon color="success">mdi-history</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">會員儲值版本二 - 交易記錄查詢</h2>
                <p class="hero-subtitle mb-0">依客戶與日期區間查詢訂單，並試算儲值餘額。</p>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 查詢條件 -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card class="filter-card" elevation="2">
            <v-card-title class="card-title">查詢條件</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-autocomplete
                    v-model="filterCustomerName"
                    :items="customerOptions"
                    item-title="customerName"
                    item-value="customerName"
                    label="客戶名稱"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                    clearable
                  >
                    <template #selection="{ item }">
                      <span v-if="item?.raw">{{ item.raw.customerName }}</span>
                    </template>
                  </v-autocomplete>
                </v-col>

                <v-col cols="12" md="3">
                  <v-menu
                    v-model="startDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="290px"
                  >
                    <template #activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        :model-value="formatDateDisplay(filterStartDate)"
                        label="開始日期"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar"
                        readonly
                      />
                    </template>
                    <v-date-picker
                      v-model="filterStartDate"
                      @update:model-value="startDateMenu = false"
                      locale="zh-TW"
                      :first-day-of-week="1"
                    />
                  </v-menu>
                </v-col>

                <v-col cols="12" md="3">
                  <v-menu
                    v-model="endDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="290px"
                  >
                    <template #activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        :model-value="formatDateDisplay(filterEndDate)"
                        label="結束日期"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar"
                        readonly
                      />
                    </template>
                    <v-date-picker
                      v-model="filterEndDate"
                      @update:model-value="endDateMenu = false"
                      locale="zh-TW"
                      :first-day-of-week="1"
                    />
                  </v-menu>
                </v-col>

                <v-col cols="12" md="2">
                  <v-text-field
                    v-model="filterOrderNo"
                    label="訂單編號"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-file-document"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="4" class="d-flex align-center">
                  <v-btn
                    color="primary"
                    variant="elevated"
                    @click="searchTransactions"
                    :loading="loading"
                    class="mr-2"
                  >
                    查詢記錄
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    @click="resetFilter"
                    :disabled="loading"
                  >
                    重置
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 錢包試算資訊 -->
      <v-row class="mt-4" v-if="walletInfo">
        <v-col cols="12" md="4">
          <v-card class="stat-card" variant="tonal" color="info">
            <v-card-text>
              <div class="stat-title">基準日</div>
              <div class="stat-value">
                {{ walletInfo.baseDate || '未設定' }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card" variant="tonal" color="success">
            <v-card-text>
              <div class="stat-title">目前儲值餘額（walletdatav2）</div>
              <div class="stat-value">
                {{ formatCurrency(walletInfo.baseAmount) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card" variant="tonal" color="error">
            <v-card-text>
              <div class="stat-title">本次查詢扣款金額（基準日後）</div>
              <div class="stat-value">
                {{ formatCurrency(walletInfo.usedAmount) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card" variant="tonal" color="primary">
            <v-card-text>
              <div class="stat-title">扣除本次查詢後預估餘額</div>
              <div class="stat-value">
                {{ formatCurrency(walletInfo.remainAmount) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 交易記錄列表 -->
      <v-row class="mt-4" v-if="orders.length > 0">
        <v-col cols="12">
          <v-card class="transactions-card" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>交易記錄 (共 {{ orders.length }} 筆)</span>
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-printer"
                @click="handleExport"
                :disabled="orders.length === 0"
              >
                輸出交易記錄
              </v-btn>
            </v-card-title>
            <v-card-text>
              <PaginatedIterator
                :items="orders"
                v-model:page="currentPage"
                v-model:items-per-page="itemsPerPage"
                :items-per-page-options="itemsPerPageOptions"
              >
                <template #default="{ items }">
                  <v-table fixed-header class="text-no-wrap" hide-default-footer>
                    <thead>
                      <tr>
                        <th class="text-left">訂購日期</th>
                        <th class="text-left">訂單編號</th>
                        <th class="text-left">客戶名稱</th>
                        <th class="text-left">產品名稱</th>
                        <th class="text-right">交易金額(含稅額)</th>
                        <th class="text-left">操作人員</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in items"
                        :key="rowKey(item, index)"
                      >
                        <td>{{ formatDateDisplay(rowData(item).orderDate) }}</td>
                        <td>{{ rowData(item).documentNumber }}</td>
                        <td>{{ rowData(item).customerFullName }}</td>
                        <td>{{ rowData(item).productName }}</td>
                        <td class="text-right font-weight-bold">
                          {{ formatCurrency(rowData(item).amountWithTax) }}
                        </td>
                        <td>
                          <div v-if="rowData(item).createInfo">
                            {{ rowData(item).createInfo.name }}
                            <div class="text-caption text-grey">
                              {{ formatDateTime(rowData(item).createInfo.time) }}
                            </div>
                          </div>
                          <span v-else>-</span>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </template>
              </PaginatedIterator>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 無記錄提示 -->
      <v-row v-if="!loading && orders.length === 0 && hasSearched">
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-icon size="64" color="grey">mdi-information-outline</v-icon>
              <div class="text-h6 mt-4">沒有找到符合條件的交易記錄</div>
              <div class="text-caption mt-2">請調整查詢條件後重新查詢</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- 交易記錄輸出組件 -->
    <PrintOrderHistory
      ref="printOrderHistoryRef"
      :orders="orders"
      :wallet-info="walletInfo"
      :customer-name="filterCustomerName || ''"
      :filter-start-date="filterStartDate"
      :filter-end-date="filterEndDate"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getCurrentInstance } from 'vue'
import { useStore } from '@/stores/useStore'
import api from '@/assets/js/api.js'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import 'dayjs/locale/zh-tw'
import PaginatedIterator from '@/components/PaginatedIterator.vue'
import PrintOrderHistory from './PrintOrderHistory.vue'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.locale('zh-tw')

const { proxy } = getCurrentInstance()
const store = useStore()

const loading = ref(false)
const hasSearched = ref(false)
const walletInfo = ref(null)
const orders = ref([])
const printOrderHistoryRef = ref(null)

const filterCustomerName = ref(null)
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterOrderNo = ref('')
const startDateMenu = ref(false)
const endDateMenu = ref(false)

const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 20, title: '20' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
]

const walletCustomers = ref([])

const customerOptions = computed(() =>
  walletCustomers.value.map((c) => ({
    customerName: c.customerName,
  })),
)

// 相容 PaginatedIterator 的 item / item.raw 結構
function rowData (item) {
  return item && item.raw ? item.raw : item
}

function rowKey (item, index) {
  const row = rowData(item)
  return row?.snkey ?? index
}

const handleExport = () => {
  if (!printOrderHistoryRef.value || orders.value.length === 0) return
  printOrderHistoryRef.value.exportTransactions()
}

const formatCurrency = (amount) => {
  const n = Number.isFinite(Number(amount)) ? Number(amount) : 0
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(n)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const d = dayjs(value)
  if (!d.isValid()) return value || '-'
  return d.format('YYYY-MM-DD HH:mm:ss')
}

const formatDateDisplay = (value) => {
  if (!value) return ''
  const d = dayjs(value)
  if (!d.isValid()) return value || ''
  return d.format('YYYY-MM-DD')
}

const loadWalletCustomers = async () => {
  try {
    const rs = await api.get('walletdatav2')
    if (rs && Array.isArray(rs)) {
      walletCustomers.value = rs.map((i) => {
        let data = {}
        try {
          data = typeof i.datalist === 'string' ? JSON.parse(i.datalist) : i.datalist || {}
        } catch (_) {}
        return {
          snkey: i.snkey,
          customerName: data.customerName || '',
        }
      })
    } else {
      walletCustomers.value = []
    }
  } catch (err) {
    console.error('載入 wallet 客戶清單失敗:', err)
    walletCustomers.value = []
  }
}

const validateFilter = () => {
  if (!filterCustomerName.value) {
    proxy.$swal({
      icon: 'info',
      title: '請選擇客戶',
      text: '請先選擇要查詢的客戶名稱',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center',
    })
    return false
  }

  if (filterStartDate.value && filterEndDate.value) {
    const s = dayjs(filterStartDate.value)
    const e = dayjs(filterEndDate.value)
    if (s.isAfter(e, 'day')) {
      proxy.$swal({
        icon: 'warning',
        title: '日期區間有誤',
        text: '開始日期不可大於結束日期',
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: false,
        position: 'center',
      })
      return false
    }
  }

  return true
}

const searchTransactions = async () => {
  if (!validateFilter()) return

  loading.value = true
  hasSearched.value = true

  try {
    const db = store.state.databaseName || 'medicon'
    const payload = {
      customerName: filterCustomerName.value,
    }
    if (filterStartDate.value) {
      payload.startDate = formatDateDisplay(filterStartDate.value)
    }
    if (filterEndDate.value) {
      payload.endDate = formatDateDisplay(filterEndDate.value)
    }
    if (filterOrderNo.value) {
      payload.orderNo = filterOrderNo.value
    }

    const rs = await api.options(`general/walletV2TransactionQuery/${db}`, payload)

    if (!rs || rs.state !== 1) {
      throw new Error(rs?.msg || '查詢失敗')
    }

    walletInfo.value = rs.walletInfo || null
    orders.value = Array.isArray(rs.orders) ? rs.orders : []
    currentPage.value = 1
  } catch (err) {
    console.error('查詢交易記錄失敗:', err)
    proxy.$swal({
      icon: 'error',
      title: '查詢失敗',
      text: err?.message || '無法查詢交易記錄',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center',
    })
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterCustomerName.value = null
  filterStartDate.value = ''
  filterEndDate.value = ''
  filterOrderNo.value = ''
  walletInfo.value = null
  orders.value = []
  hasSearched.value = false
  currentPage.value = 1
}

loadWalletCustomers()
</script>

<style scoped lang="scss">
.transaction-history-page {
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

.filter-card,
.transactions-card {
  border-radius: 24px;
  box-shadow: 0 14px 40px rgba(74, 107, 95, 0.14);
  border: 1px solid rgba(91, 143, 163, 0.16);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--daycare-primary);
  padding: 20px 24px;
  border-bottom: 1px solid rgba(91, 143, 163, 0.16);
}

.stat-card {
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: 0 12px 30px rgba(74, 107, 95, 0.12);
  border: 1px solid rgba(91, 143, 163, 0.18);

  .stat-title {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.6rem;
    font-weight: 700;
  }
}
</style>

