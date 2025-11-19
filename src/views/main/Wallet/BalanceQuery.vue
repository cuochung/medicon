<template>
  <div class="balance-query-page pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="page-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-btn icon variant="text" @click="$router.push('/main/Wallet')" class="mr-3">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-avatar color="warning" variant="tonal" size="48" class="mr-3">
                <v-icon color="warning">mdi-account-cash</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">會員餘額查詢</h2>
                <p class="hero-subtitle mb-0">查詢會員儲值餘額資訊</p>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 查詢條件 -->
      <v-row class="mt-4">
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="query-card" elevation="2">
            <v-card-title class="card-title">查詢條件</v-card-title>
            <v-card-text>
              <v-autocomplete
                v-model="selectedCustomer"
                :items="customerOptions"
                item-title="customerFullName"
                item-value="snkey"
                label="選擇客戶 *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-account"
                :custom-filter="customerFilter"
                @update:model-value="onCustomerSelected"
                class="mb-4"
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
              </v-autocomplete>

              <v-btn
                color="primary"
                variant="elevated"
                block
                @click="queryBalance"
                :loading="loading"
                :disabled="!selectedCustomer"
              >
                查詢餘額
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 餘額資訊 -->
      <v-row class="mt-4" v-if="walletInfo">
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="balance-card" elevation="2">
            <v-card-title class="card-title">餘額資訊</v-card-title>
            <v-card-text>
              <!-- 客戶資訊 -->
              <v-card variant="tonal" color="info" class="mb-4">
                <v-card-text>
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-h6">{{ customerInfo?.customerFullName || '-' }}</div>
                      <div class="text-caption">客戶編號: {{ customerInfo?.customerNumber || '-' }}</div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <!-- 餘額卡片 -->
              <v-card 
                variant="tonal" 
                :color="walletInfo.balance >= 0 ? 'success' : 'error'" 
                class="mb-4"
              >
                <v-card-text>
                  <div class="text-center">
                    <div class="text-caption mb-2">當前餘額</div>
                    <div class="text-h3 font-weight-bold mb-4">
                      {{ formatCurrency(walletInfo.balance) }}
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <v-row class="mt-4">
                      <v-col cols="6">
                        <div class="text-caption">最後交易日期</div>
                        <div class="text-body-1 font-weight-medium">
                          {{ walletInfo.lastTransactionDate ? formatDateTime(walletInfo.lastTransactionDate) : '無' }}
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-caption">累計儲值</div>
                        <div class="text-body-1 font-weight-medium text-success">
                          {{ formatCurrency(walletInfo.totalRecharge || 0) }}
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-caption">累計扣款</div>
                        <div class="text-body-1 font-weight-medium text-error">
                          {{ formatCurrency(walletInfo.totalDeduction || 0) }}
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-caption">建立日期</div>
                        <div class="text-body-1 font-weight-medium">
                          {{ walletInfo.createInfo ? formatDateTime(walletInfo.createInfo.time) : '無' }}
                        </div>
                      </v-col>
                    </v-row>
                  </div>
                </v-card-text>
              </v-card>

              <!-- 最近交易記錄 -->
              <v-card variant="outlined" class="mt-4">
                <v-card-title class="text-subtitle-1">最近交易記錄 (最近 10 筆)</v-card-title>
                <v-card-text>
                  <v-table v-if="recentTransactions.length > 0" class="text-no-wrap">
                    <thead>
                      <tr>
                        <th class="text-left">交易日期</th>
                        <th class="text-left">交易類型</th>
                        <th class="text-left">交易金額</th>
                        <th class="text-left">交易後餘額</th>
                        <th class="text-left">備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(transaction, index) in recentTransactions" :key="index">
                        <td>{{ formatDateTime(transaction.transactionDate) }}</td>
                        <td>
                          <v-chip
                            :color="transaction.transactionType === 'recharge' ? 'success' : 'error'"
                            size="small"
                            variant="flat"
                          >
                            {{ transaction.transactionType === 'recharge' ? '儲值' : '扣款' }}
                          </v-chip>
                        </td>
                        <td 
                          :class="transaction.transactionType === 'recharge' ? 'text-success' : 'text-error'"
                          class="font-weight-bold"
                        >
                          {{ transaction.transactionType === 'recharge' ? '+' : '' }}{{ formatCurrency(Math.abs(transaction.amount)) }}
                        </td>
                        <td>{{ formatCurrency(transaction.balanceAfter) }}</td>
                        <td>
                          <div class="text-truncate" style="max-width: 200px" :title="transaction.notes">
                            {{ transaction.notes || '-' }}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                  <div v-else class="text-center py-4 text-grey">
                    無交易記錄
                  </div>
                </v-card-text>
              </v-card>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 無記錄提示 -->
      <v-row v-if="!loading && !walletInfo && hasSearched">
        <v-col cols="12" md="8" offset-md="2">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-icon size="64" color="grey">mdi-information-outline</v-icon>
              <div class="text-h6 mt-4">此客戶尚未建立儲值記錄</div>
              <div class="text-caption mt-2">當前餘額: {{ formatCurrency(0) }}</div>
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

const { proxy } = getCurrentInstance()
const store = useStore()

// 響應式數據
const loading = ref(false)
const hasSearched = ref(false)
const customers = ref([])
const selectedCustomer = ref(null)
const customerInfo = ref(null)
const walletInfo = ref(null)
const transactions = ref([])
const recentTransactions = ref([])

// 客戶選項
const customerOptions = computed(() => {
  return customers.value.map(c => ({
    snkey: c.snkey,
    customerNumber: c.customerNumber,
    customerFullName: c.customerFullName
  }))
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

// 客戶選擇事件
const onCustomerSelected = (snkey) => {
  if (!snkey) {
    customerInfo.value = null
    walletInfo.value = null
    recentTransactions.value = []
    return
  }

  customerInfo.value = customers.value.find(c => c.snkey === snkey)
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
    proxy.$swal({
      icon: "error",
      title: "載入失敗",
      text: "無法載入客戶列表",
      confirmButtonText: '確定'
    })
  }
}

// 查詢餘額
const queryBalance = async () => {
  if (!selectedCustomer.value) {
    return
  }

  loading.value = true
  hasSearched.value = true

  try {
    // 載入儲值資訊
    const walletRs = await api.get('walletdata')
    if (walletRs && walletRs.length > 0) {
      const walletRecords = walletRs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
      
      walletInfo.value = walletRecords.find(w => w.customerNumber === customerInfo.value?.customerNumber)
    } else {
      walletInfo.value = null
    }

    // 載入交易記錄
    const transactionRs = await api.get('wallet_transactions')
    if (transactionRs && transactionRs.length > 0) {
      transactions.value = transactionRs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
      
      // 取得該客戶的交易記錄，按日期倒序
      const customerTransactions = transactions.value
        .filter(t => t.customerNumber === customerInfo.value?.customerNumber)
        .sort((a, b) => {
          const dateA = dayjs(a.transactionDate)
          const dateB = dayjs(b.transactionDate)
          return dateB.isBefore(dateA) ? -1 : 1
        })
        .slice(0, 10) // 最近 10 筆
      
      recentTransactions.value = customerTransactions
    } else {
      recentTransactions.value = []
    }
  } catch (error) {
    console.error('查詢餘額失敗:', error)
    proxy.$swal({
      icon: "error",
      title: "查詢失敗",
      text: "無法查詢餘額資訊",
      confirmButtonText: '確定'
    })
  } finally {
    loading.value = false
  }
}

// 生命週期
onMounted(async () => {
  await loadCustomers()
})
</script>

<style scoped lang="scss">
.balance-query-page {
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

.query-card,
.balance-card {
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
