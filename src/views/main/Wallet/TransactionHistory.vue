<template>
  <div class="transaction-history-page pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="page-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-btn icon variant="text" @click="$router.push('/main/Wallet')" class="mr-3">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-avatar color="success" variant="tonal" size="48" class="mr-3">
                <v-icon color="success">mdi-history</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">交易記錄查詢</h2>
                <p class="hero-subtitle mb-0">查詢儲值與扣款記錄</p>
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
                <v-col cols="12" md="3">
                  <v-autocomplete
                    v-model="filterCustomer"
                    :items="customerOptions"
                    item-title="customerFullName"
                    item-value="snkey"
                    label="客戶名稱"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                    :custom-filter="customerFilter"
                    clearable
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :key="item.raw.snkey">
                        <template v-slot:prepend>
                          <v-avatar color="primary" size="32">
                            <v-icon>mdi-account</v-icon>
                          </v-avatar>
                        </template>
                        <!-- <v-list-item-title>{{ item.raw.customerFullName }}</v-list-item-title> -->
                        <v-list-item-subtitle>{{ item.raw.customerNumber }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      <span v-if="item.raw">
                        {{ item.raw.customerFullName }} ({{ item.raw.customerNumber }})
                      </span>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="filterTransactionType"
                    :items="transactionTypeOptions"
                    label="交易類型"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-swap-horizontal"
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="12" md="3">
                  <v-menu
                    v-model="startDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="290px"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        :model-value="formatDateDisplay(filterStartDate)"
                        label="開始日期"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar"
                        readonly
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="filterStartDate"
                      @update:model-value="startDateMenu = false"
                      locale="zh-TW"
                      :first-day-of-week="1"
                    ></v-date-picker>
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
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        :model-value="formatDateDisplay(filterEndDate)"
                        label="結束日期"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar"
                        readonly
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="filterEndDate"
                      @update:model-value="endDateMenu = false"
                      locale="zh-TW"
                      :first-day-of-week="1"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="filterDocumentNumber"
                    label="訂單編號"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-file-document"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3" class="d-flex align-center">
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
                  >
                    重置
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 統計資訊 -->
      <v-row class="mt-4" v-if="filteredTransactions.length > 0">
        <v-col cols="12" md="4">
          <v-card class="stat-card" variant="tonal" color="success">
            <v-card-text>
              <div class="stat-title">儲值總額</div>
              <div class="stat-value">{{ formatCurrency(totalRecharge) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card" variant="tonal" color="error">
            <v-card-text>
              <div class="stat-title">扣款總額</div>
              <div class="stat-value">{{ formatCurrency(totalDeduction) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card" variant="tonal" color="info">
            <v-card-text>
              <div class="stat-title">交易筆數</div>
              <div class="stat-value">{{ filteredTransactions.length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 交易記錄列表 -->
      <v-row class="mt-4" v-if="filteredTransactions.length > 0">
        <v-col cols="12">
          <v-card class="transactions-card" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>交易記錄 (共 {{ filteredTransactions.length }} 筆)</span>
            </v-card-title>
            <v-card-text>
              <PaginatedIterator 
                :items="filteredTransactions" 
                v-model:page="currentPage" 
                v-model:items-per-page="itemsPerPage"
                :items-per-page-options="itemsPerPageOptions"
              >
                <template #default="{ items }">
                  <v-table fixed-header class="text-no-wrap" hide-default-footer>
                    <thead>
                      <tr>
                        <th class="text-left">交易日期</th>
                        <th class="text-left">客戶編號</th>
                        <th class="text-left">客戶名稱</th>
                        <th class="text-left">交易類型</th>
                        <th class="text-left">交易金額</th>
                        <th class="text-left">交易前餘額</th>
                        <th class="text-left">交易後餘額</th>
                        <th class="text-left">訂單編號</th>
                        <th class="text-left">備註</th>
                        <th class="text-left">操作人員</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(transaction, index) in items" :key="index">
                        <td>{{ formatDateTime(transaction.raw.transactionDate) }}</td>
                        <td>{{ transaction.raw.customerNumber || '-' }}</td>
                        <td>{{ getCustomerName(transaction.raw.customerNumber) || '-' }}</td>
                        <td>
                          <v-chip
                            :color="transaction.raw.transactionType === 'recharge' ? 'success' : 'error'"
                            size="small"
                            variant="flat"
                          >
                            {{ transaction.raw.transactionType === 'recharge' ? '儲值' : '扣款' }}
                          </v-chip>
                        </td>
                        <td 
                          :class="transaction.raw.transactionType === 'recharge' ? 'text-success' : 'text-error'"
                          class="font-weight-bold"
                        >
                          {{ transaction.raw.transactionType === 'recharge' ? '+' : '' }}{{ formatCurrency(Math.abs(transaction.raw.amount)) }}
                        </td>
                        <td>{{ formatCurrency(transaction.raw.balanceBefore) }}</td>
                        <td>{{ formatCurrency(transaction.raw.balanceAfter) }}</td>
                        <td>{{ transaction.raw.documentNumber || '-' }}</td>
                        <td>
                          <div class="text-truncate" style="max-width: 200px" :title="transaction.raw.notes">
                            {{ transaction.raw.notes || '-' }}
                          </div>
                        </td>
                        <td>
                          <div v-if="transaction.raw.createInfo">
                            {{ transaction.raw.createInfo.name }}
                            <div class="text-caption text-grey">{{ formatDateTime(transaction.raw.createInfo.time) }}</div>
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
      <v-row v-if="!loading && filteredTransactions.length === 0 && hasSearched">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCurrentInstance } from 'vue'
import { useStore } from '@/stores/useStore'
import api from '@/assets/js/api.js'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import 'dayjs/locale/zh-tw'
import PaginatedIterator from '@/components/PaginatedIterator.vue'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.locale('zh-tw')

const { proxy } = getCurrentInstance()
const store = useStore()

// 響應式數據
const loading = ref(false)
const hasSearched = ref(false)
const customers = ref([])
const transactions = ref([])
const filteredTransactions = ref([])

// 分頁相關
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 20, title: '20' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
]

// 篩選條件
const filterCustomer = ref(null)
const filterTransactionType = ref(null)
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterDocumentNumber = ref('')
const startDateMenu = ref(false)
const endDateMenu = ref(false)

// 交易類型選項
const transactionTypeOptions = [
  { title: '儲值', value: 'recharge' },
  { title: '扣款', value: 'deduction' }
]

// 客戶選項
const customerOptions = computed(() => {
  return customers.value.map(c => ({
    snkey: c.snkey,
    customerNumber: c.customerNumber,
    customerFullName: c.customerFullName
  }))
})

// 客戶搜索過濾器（同時搜索客戶名稱和編號）
const customerFilter = (itemTitle, queryText, item) => {
  if (!queryText || !item || !item.raw) {
    return true
  }
  const searchText = queryText.toLowerCase()
  const customerName = (item.raw.customerFullName || '').toLowerCase()
  const customerNumber = (item.raw.customerNumber || '').toLowerCase()
  return customerName.includes(searchText) || customerNumber.includes(searchText)
}

// 統計數據
const totalRecharge = computed(() => {
  return filteredTransactions.value
    .filter(t => t.transactionType === 'recharge')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0)
})

const totalDeduction = computed(() => {
  return filteredTransactions.value
    .filter(t => t.transactionType === 'deduction')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0)
})

// 格式化貨幣
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount)
}

// 格式化日期時間
const formatDateTime = (dateValue) => {
  if (!dateValue) return '-'
  const date = dayjs(dateValue)
  if (date.isValid()) {
    return date.format('YYYY-MM-DD HH:mm:ss')
  }
  return dateValue || '-'
}

// 格式化日期顯示（用於日期選擇器顯示）
const formatDateDisplay = (dateValue) => {
  if (!dateValue) return ''
  const date = dayjs(dateValue)
  if (date.isValid()) {
    return date.format('YYYY-MM-DD')
  }
  return dateValue || ''
}

// 取得客戶名稱
const getCustomerName = (customerNumber) => {
  const customer = customers.value.find(c => c.customerNumber === customerNumber)
  return customer ? customer.customerFullName : null
}

// 載入客戶列表
const loadCustomers = async () => {
  try {
    const rs = await api.get('customer')
    if (rs && rs.length > 0) {
      customers.value = rs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
    }
  } catch (error) {
    console.error('載入客戶列表失敗:', error)
  }
}

// 載入交易記錄
const loadTransactions = async () => {
  try {
    const rs = await api.get('wallet_transactions')
    if (rs && rs.length > 0) {
      transactions.value = rs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
      
      // 按交易日期倒序排列
      transactions.value.sort((a, b) => {
        const dateA = dayjs(a.transactionDate)
        const dateB = dayjs(b.transactionDate)
        return dateB.isBefore(dateA) ? -1 : 1
      })
    }
  } catch (error) {
    console.error('載入交易記錄失敗:', error)
    proxy.$swal({
      icon: "error",
      title: "載入失敗",
      text: "無法載入交易記錄",
      confirmButtonText: '確定'
    })
  }
}

// 查詢交易記錄
const searchTransactions = async () => {
  loading.value = true
  hasSearched.value = true

  try {
    await loadTransactions()

    let filtered = [...transactions.value]

    // 客戶篩選
    if (filterCustomer.value) {
      const selectedCustomer = customers.value.find(c => c.snkey === filterCustomer.value)
      if (selectedCustomer) {
        filtered = filtered.filter(t => t.customerNumber === selectedCustomer.customerNumber)
      }
    }

    // 交易類型篩選
    if (filterTransactionType.value) {
      filtered = filtered.filter(t => t.transactionType === filterTransactionType.value)
    }

    // 日期篩選
    if (filterStartDate.value) {
      const startDate = dayjs(filterStartDate.value)
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.transactionDate)
        return transactionDate.isSameOrAfter(startDate, 'day')
      })
    }

    if (filterEndDate.value) {
      const endDate = dayjs(filterEndDate.value)
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.transactionDate)
        return transactionDate.isSameOrBefore(endDate, 'day')
      })
    }

    // 訂單編號篩選
    if (filterDocumentNumber.value) {
      const searchKey = filterDocumentNumber.value.toUpperCase()
      filtered = filtered.filter(t => {
        return t.documentNumber && t.documentNumber.toUpperCase().includes(searchKey)
      })
    }

    filteredTransactions.value = filtered
  } catch (error) {
    console.error('查詢交易記錄失敗:', error)
    proxy.$swal({
      icon: "error",
      title: "查詢失敗",
      text: "無法查詢交易記錄",
      confirmButtonText: '確定'
    })
  } finally {
    loading.value = false
  }
}

// 重置篩選
const resetFilter = () => {
  filterCustomer.value = null
  filterTransactionType.value = null
  filterStartDate.value = ''
  filterEndDate.value = ''
  filterDocumentNumber.value = ''
  filteredTransactions.value = []
  hasSearched.value = false
}

// 生命週期
onMounted(async () => {
  await loadCustomers()
})
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
    font-size: 2rem;
    font-weight: 700;
  }
}
</style>
