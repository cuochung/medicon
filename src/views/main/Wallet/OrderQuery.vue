<template>
  <div class="order-query-page pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="page-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-btn icon variant="text" @click="$router.push('/main/Wallet')" class="mr-3">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-avatar color="info" variant="tonal" size="48" class="mr-3">
                <v-icon color="info">mdi-file-search</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">訂單查詢</h2>
                <p class="hero-subtitle mb-0">查詢所有訂單及扣款狀態</p>
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
                <v-col cols="12" md="4">
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
                <v-col cols="12" md="4">
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
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="filterDocumentNumber"
                    label="訂單編號"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-file-document"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center">
                  <v-btn
                    color="primary"
                    variant="elevated"
                    @click="searchOrders"
                    :loading="loading"
                    class="mr-2"
                  >
                    查詢訂單
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

      <!-- 訂單列表 -->
      <v-row class="mt-4" v-if="filteredOrders.length > 0">
        <v-col cols="12">
          <v-card class="orders-card" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>訂單列表 (共 {{ filteredOrders.length }} 筆)</span>
              <v-chip color="info" size="small">
                啟動日期: {{ walletActivationDate }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <PaginatedIterator 
                :items="filteredOrders" 
                v-model:page="currentPage" 
                v-model:items-per-page="itemsPerPage"
                :items-per-page-options="itemsPerPageOptions"
              >
                <template #default="{ items }">
                  <v-table fixed-header class="text-no-wrap" hide-default-footer>
                    <thead>
                      <tr>
                        <th class="text-left">單據號碼</th>
                        <th class="text-left">客戶編號</th>
                        <th class="text-left">客戶全稱</th>
                        <th class="text-left">品名規格</th>
                        <th class="text-left">單價</th>
                        <th class="text-left">數量</th>
                        <th class="text-left">金額</th>
                        <th class="text-left">稅額</th>
                        <th class="text-left">訂購日期</th>
                        <th class="text-left">可扣款</th>
                        <th class="text-left">扣款狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(order, index) in items" :key="index">
                        <td>{{ order.raw.documentNumber || '-' }}</td>
                        <td>{{ order.raw.customerNumber || '-' }}</td>
                        <td>{{ order.raw.customerFullName || '-' }}</td>
                        <td>{{ order.raw.productName || '-' }}</td>
                        <td>{{ order.raw.unitPrice ? formatCurrency(order.raw.unitPrice) : '-' }}</td>
                        <td>{{ order.raw.quantity || '-' }}</td>
                        <td>{{ formatCurrency(order.raw.amount) }}</td>
                        <td>{{ order.raw.taxAmount ? formatCurrency(order.raw.taxAmount) : '-' }}</td>
                        <td>{{ formatDate(order.raw.orderDate) }}</td>
                        <td>
                          <v-chip
                            :color="order.raw.canDeduct ? 'success' : 'grey'"
                            size="small"
                            variant="flat"
                          >
                            {{ order.raw.canDeduct ? '可扣款' : '不可扣款' }}
                          </v-chip>
                        </td>
                        <td>
                          <v-chip
                            v-if="order.raw.canDeduct"
                            :color="order.raw.isDeducted ? 'success' : 'warning'"
                            size="small"
                            variant="flat"
                          >
                            {{ order.raw.isDeducted ? '已扣款' : '未扣款' }}
                          </v-chip>
                          <span v-else class="text-grey">-</span>
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

      <!-- 無訂單提示 -->
      <v-row v-if="!loading && filteredOrders.length === 0 && hasSearched">
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-icon size="64" color="grey">mdi-information-outline</v-icon>
              <div class="text-h6 mt-4">沒有找到符合條件的訂單</div>
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
const walletActivationDate = ref('')
const customers = ref([])
const orders = ref([])
const filteredOrders = ref([])
const transactions = ref([])

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
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterCustomer = ref(null)
const filterDocumentNumber = ref('')
const startDateMenu = ref(false)
const endDateMenu = ref(false)

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

// 格式化貨幣
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount)
}

// 格式化日期（用於顯示）
const formatDate = (dateValue) => {
  if (!dateValue) return '-'
  const date = dayjs(dateValue)
  if (date.isValid()) {
    return date.format('YYYY-MM-DD')
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

// 載入啟動日期
const loadActivationDate = async () => {
  try {
    const rs = await api.get('other_data')
    if (rs && rs.length > 0) {
      const otherData = rs[0]
      if (otherData && otherData.datalist) {
        const data = typeof otherData.datalist === 'string' 
          ? JSON.parse(otherData.datalist) 
          : otherData.datalist
        if (data && data.walletActivationDate) {
          walletActivationDate.value = data.walletActivationDate
        } else {
          walletActivationDate.value = '2025-01-01'
        }
      } else {
        walletActivationDate.value = '2025-01-01'
      }
    } else {
      walletActivationDate.value = '2025-01-01'
    }
  } catch (error) {
    console.error('載入啟動日期失敗:', error)
    walletActivationDate.value = '2025-01-01'
  }
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

// 載入訂單數據
const loadOrders = async () => {
  try {
    const rs = await api.get('orderdata')
    if (rs && rs.length > 0) {
      orders.value = rs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
    }
  } catch (error) {
    console.error('載入訂單數據失敗:', error)
    proxy.$swal({
      icon: "error",
      title: "載入失敗",
      text: "無法載入訂單數據",
      confirmButtonText: '確定'
    })
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
    }
  } catch (error) {
    console.error('載入交易記錄失敗:', error)
  }
}

// 查詢訂單
const searchOrders = async () => {
  loading.value = true
  hasSearched.value = true

  try {
    await loadOrders()
    await loadTransactions()

    let filtered = [...orders.value]

    // 日期篩選
    if (filterStartDate.value) {
      const startDate = dayjs(filterStartDate.value)
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.orderDate)
        return orderDate.isSameOrAfter(startDate, 'day')
      })
    }

    if (filterEndDate.value) {
      const endDate = dayjs(filterEndDate.value)
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.orderDate)
        return orderDate.isSameOrBefore(endDate, 'day')
      })
    }

    // 客戶篩選
    if (filterCustomer.value) {
      const selectedCustomer = customers.value.find(c => c.snkey === filterCustomer.value)
      if (selectedCustomer) {
        filtered = filtered.filter(order => order.customerNumber === selectedCustomer.customerNumber)
      }
    }

    // 訂單編號篩選
    if (filterDocumentNumber.value) {
      const searchKey = filterDocumentNumber.value.toUpperCase()
      filtered = filtered.filter(order => {
        return order.documentNumber && order.documentNumber.toUpperCase().includes(searchKey)
      })
    }

    // 標記可扣款狀態和已扣款狀態
    const activationDate = dayjs(walletActivationDate.value)
    filtered = filtered.map(order => {
      const orderDate = dayjs(order.orderDate)
      const canDeduct = orderDate.isSameOrAfter(activationDate, 'day')
      const isDeducted = canDeduct && transactions.value.some(t => 
        t.transactionType === 'deduction' && 
        t.documentNumber === order.documentNumber
      )
      return { ...order, canDeduct, isDeducted }
    })

    // 按訂購日期倒序排列
    filtered.sort((a, b) => {
      const dateA = dayjs(a.orderDate)
      const dateB = dayjs(b.orderDate)
      return dateB.isBefore(dateA) ? -1 : 1
    })

    filteredOrders.value = filtered
  } catch (error) {
    console.error('查詢訂單失敗:', error)
    proxy.$swal({
      icon: "error",
      title: "查詢失敗",
      text: "無法查詢訂單數據",
      confirmButtonText: '確定'
    })
  } finally {
    loading.value = false
  }
}

// 重置篩選
const resetFilter = () => {
  filterStartDate.value = ''
  filterEndDate.value = ''
  filterCustomer.value = null
  filterDocumentNumber.value = ''
  filteredOrders.value = []
  hasSearched.value = false
}

// 生命週期
onMounted(async () => {
  await loadActivationDate()
  await loadCustomers()
  await loadTransactions()
})
</script>

<style scoped lang="scss">
.order-query-page {
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
.orders-card {
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
</style>
