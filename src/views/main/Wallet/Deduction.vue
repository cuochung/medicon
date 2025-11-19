<template>
  <div class="deduction-page pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="page-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-btn icon variant="text" @click="$router.push('/main/Wallet')" class="mr-3">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-avatar color="error" variant="tonal" size="48" class="mr-3">
                <v-icon color="error">mdi-cash-minus</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">訂單手動扣款</h2>
                <p class="hero-subtitle mb-0">選擇訂單進行扣款操作</p>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 篩選條件 -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card class="filter-card" elevation="2">
            <v-card-title class="card-title">篩選條件</v-card-title>
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
              <span>訂單列表</span>
              <v-chip color="info" size="small">
                啟動日期: {{ walletActivationDate }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-table fixed-header class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-left" style="width: 50px">
                      <v-checkbox
                        v-model="selectAll"
                        @change="toggleSelectAll"
                        hide-details
                      ></v-checkbox>
                    </th>
                    <th class="text-left">單據號碼</th>
                    <th class="text-left">客戶編號</th>
                    <th class="text-left">客戶全稱</th>
                    <th class="text-left">品名規格</th>
                    <th class="text-left">單價</th>
                    <th class="text-left">數量</th>
                    <th class="text-left">金額</th>
                    <th class="text-left">稅額</th>
                    <th class="text-left">訂購日期</th>
                    <th class="text-left">扣款狀態</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(order, index) in filteredOrders" :key="index">
                    <td>
                      <v-checkbox
                        v-model="selectedOrders"
                        :value="order"
                        hide-details
                        :disabled="order.isDeducted"
                      ></v-checkbox>
                    </td>
                    <td>{{ order.documentNumber || '-' }}</td>
                    <td>{{ order.customerNumber || '-' }}</td>
                    <td>{{ order.customerFullName || '-' }}</td>
                    <td>{{ order.productName || '-' }}</td>
                    <td>{{ order.unitPrice ? formatCurrency(order.unitPrice) : '-' }}</td>
                    <td>{{ order.quantity || '-' }}</td>
                    <td>{{ formatCurrency(order.amount) }}</td>
                    <td>{{ order.taxAmount ? formatCurrency(order.taxAmount) : '-' }}</td>
                    <td>{{ formatDate(order.orderDate) }}</td>
                    <td>
                      <v-chip
                        :color="order.isDeducted ? 'success' : 'warning'"
                        size="small"
                        variant="flat"
                      >
                        {{ order.isDeducted ? '已扣款' : '未扣款' }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 扣款預覽 -->
      <v-row class="mt-4" v-if="selectedOrders.length > 0">
        <v-col cols="12">
          <v-card class="preview-card" elevation="2">
            <v-card-title class="card-title">扣款預覽</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="text-h6 mb-2">選中訂單總數: {{ selectedOrders.length }} 筆</div>
                <div class="text-h6 mb-2">總金額: {{ formatCurrency(selectedTotalAmount) }}</div>
              </div>

              <v-divider class="my-4"></v-divider>

              <div v-for="(order, index) in selectedOrders" :key="index" class="mb-4">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">{{ order.customerFullName }}</div>
                        <div class="text-caption">客戶編號: {{ order.customerNumber }}</div>
                        <div class="text-caption">單據號碼: {{ order.documentNumber }}</div>
                      </div>
                      <div class="text-right">
                        <div class="text-h6 text-primary">{{ formatCurrency(order.amount) }}</div>
                      </div>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div class="d-flex justify-space-between">
                      <span>當前餘額:</span>
                      <span class="font-weight-bold">{{ formatCurrency(getCustomerBalance(order.customerNumber)) }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span>扣款金額:</span>
                      <span class="font-weight-bold text-error">{{ formatCurrency(order.amount) }}</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div class="d-flex justify-space-between">
                      <span class="text-h6">扣款後餘額:</span>
                      <span 
                        class="text-h6 font-weight-bold"
                        :class="getNewBalance(order) >= 0 ? 'text-success' : 'text-error'"
                      >
                        {{ formatCurrency(getNewBalance(order)) }}
                      </span>
                    </div>
                    <v-alert
                      v-if="getNewBalance(order) < 0"
                      type="error"
                      variant="tonal"
                      density="compact"
                      class="mt-2"
                    >
                      餘額不足，無法扣款
                    </v-alert>
                  </v-card-text>
                </v-card>
              </div>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn variant="outlined" @click="clearSelection">取消選擇</v-btn>
              <v-btn
                color="error"
                variant="elevated"
                @click="submitDeduction"
                :disabled="!canDeduct"
                :loading="deducting"
              >
                確認扣款
              </v-btn>
            </v-card-actions>
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
              <div class="text-caption mt-2">請調整篩選條件後重新查詢</div>
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

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.locale('zh-tw')

const { proxy } = getCurrentInstance()
const store = useStore()

// 響應式數據
const loading = ref(false)
const deducting = ref(false)
const hasSearched = ref(false)
const walletActivationDate = ref('')
const customers = ref([])
const orders = ref([])
const filteredOrders = ref([])
const walletData = ref([])
const transactions = ref([])

// 篩選條件
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterCustomer = ref(null)
const filterDocumentNumber = ref('')
const startDateMenu = ref(false)
const endDateMenu = ref(false)

// 選擇的訂單
const selectedOrders = ref([])
const selectAll = ref(false)

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

// 選中訂單總金額
const selectedTotalAmount = computed(() => {
  return selectedOrders.value.reduce((sum, order) => {
    return sum + parseFloat(order.amount || 0)
  }, 0)
})

// 是否可以扣款
const canDeduct = computed(() => {
  if (selectedOrders.value.length === 0) return false
  
  // 檢查是否有餘額不足的訂單
  return selectedOrders.value.every(order => {
    const balance = getCustomerBalance(order.customerNumber)
    return balance >= parseFloat(order.amount || 0)
  })
})

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

// 取得客戶餘額
const getCustomerBalance = (customerNumber) => {
  const wallet = walletData.value.find(w => w.customerNumber === customerNumber)
  return wallet ? parseFloat(wallet.balance || 0) : 0
}

// 計算新餘額
const getNewBalance = (order) => {
  const balance = getCustomerBalance(order.customerNumber)
  return balance - parseFloat(order.amount || 0)
}

// 全選/取消全選
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedOrders.value = filteredOrders.value.filter(o => !o.isDeducted)
  } else {
    selectedOrders.value = []
  }
}

// 清除選擇
const clearSelection = () => {
  selectedOrders.value = []
  selectAll.value = false
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

// 載入儲值數據
const loadWalletData = async () => {
  try {
    const rs = await api.get('walletdata')
    if (rs && rs.length > 0) {
      walletData.value = rs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
    }
  } catch (error) {
    console.error('載入儲值數據失敗:', error)
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

    // 僅顯示啟動日期之後的訂單
    if (walletActivationDate.value) {
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.orderDate)
        const activationDate = dayjs(walletActivationDate.value)
        return orderDate.isSameOrAfter(activationDate, 'day')
      })
    }

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

    // 合併客戶資訊到訂單數據
    filtered = filtered.map(order => {
      const customer = customers.value.find(c => c.customerNumber === order.customerNumber)
      return {
        ...order,
        customerFullName: customer ? customer.customerFullName : (order.customerFullName || '-')
      }
    })

    // 標記已扣款狀態
    filtered = filtered.map(order => {
      const isDeducted = transactions.value.some(t => 
        t.transactionType === 'deduction' && 
        t.documentNumber === order.documentNumber
      )
      return { ...order, isDeducted }
    })

    filteredOrders.value = filtered
    clearSelection()
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
  clearSelection()
  hasSearched.value = false
}

// 提交扣款
const submitDeduction = async () => {
  if (selectedOrders.value.length === 0) {
    return
  }

  // 檢查餘額
  const insufficientOrders = selectedOrders.value.filter(order => {
    const balance = getCustomerBalance(order.customerNumber)
    return balance < parseFloat(order.amount || 0)
  })

  if (insufficientOrders.length > 0) {
    proxy.$swal({
      icon: "warning",
      title: "餘額不足",
      text: `有 ${insufficientOrders.length} 筆訂單餘額不足，無法扣款`,
      confirmButtonText: '確定'
    })
    return
  }

  // 確認對話框
  const confirmResult = await proxy.$swal({
    title: '確認扣款？',
    html: `
      <div style="text-align: left; padding: 10px;">
        <p><strong>選中訂單數:</strong> ${selectedOrders.value.length} 筆</p>
        <p><strong>總金額:</strong> ${formatCurrency(selectedTotalAmount.value)}</p>
      </div>
    `,
    icon: 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: '確認扣款',
    cancelButtonText: '取消',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    toast: false,
    timer: null,
    position: 'center'
  })

  if (!confirmResult.isConfirmed) {
    return
  }

  deducting.value = true

  try {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const results = {
      success: [],
      failed: []
    }

    // 按客戶分組處理
    const ordersByCustomer = {}
    selectedOrders.value.forEach(order => {
      if (!ordersByCustomer[order.customerNumber]) {
        ordersByCustomer[order.customerNumber] = []
      }
      ordersByCustomer[order.customerNumber].push(order)
    })

    // 處理每個客戶的訂單
    for (const customerNumber of Object.keys(ordersByCustomer)) {
      const customerOrders = ordersByCustomer[customerNumber]
      
      // 取得客戶儲值記錄
      let wallet = walletData.value.find(w => w.customerNumber === customerNumber)
      
      // 如果不存在，建立新記錄
      if (!wallet) {
        const newWalletData = {
          customerNumber: customerNumber,
          balance: 0,
          totalRecharge: 0,
          totalDeduction: 0,
          lastTransactionDate: now,
          createInfo: {
            snkey: store.state.pData.snkey,
            name: store.state.pData.username,
            time: now
          },
          editInfo: []
        }
        
        const postData = {
          datalist: JSON.stringify(newWalletData)
        }
        
        const addResult = await api.add('walletdata', postData)
        if (addResult && addResult.state == 1) {
          // 重新載入儲值數據
          await loadWalletData()
          wallet = walletData.value.find(w => w.customerNumber === customerNumber)
        }
      }

      if (!wallet) {
        customerOrders.forEach(order => {
          results.failed.push({ order, reason: '無法建立或取得儲值記錄' })
        })
        continue
      }

      // 處理每筆訂單
      for (const order of customerOrders) {
        try {
          // 檢查是否已扣款
          const alreadyDeducted = transactions.value.some(t => 
            t.transactionType === 'deduction' && 
            t.documentNumber === order.documentNumber
          )

          if (alreadyDeducted) {
            results.failed.push({ order, reason: '訂單已扣款' })
            continue
          }

          const amount = parseFloat(order.amount || 0)
          const balanceBefore = parseFloat(wallet.balance || 0)
          
          if (balanceBefore < amount) {
            results.failed.push({ order, reason: '餘額不足' })
            continue
          }

          const balanceAfter = balanceBefore - amount

          // 更新儲值記錄
          wallet.balance = balanceAfter
          wallet.totalDeduction = (parseFloat(wallet.totalDeduction || 0) + amount)
          wallet.lastTransactionDate = now
          wallet.editInfo = wallet.editInfo || []
          wallet.editInfo.push({
            snkey: store.state.pData.snkey,
            name: store.state.pData.username,
            time: now
          })

          const updateData = {
            snkey: wallet.snkey,
            datalist: JSON.stringify(wallet)
          }

          const updateResult = await api.post('walletdata', updateData)

          if (updateResult && updateResult.state == 1) {
            // 記錄交易明細
            const transactionData = {
              customerNumber: customerNumber,
              transactionType: 'deduction',
              amount: -amount,
              balanceBefore: balanceBefore,
              balanceAfter: balanceAfter,
              orderNumber: null,
              documentNumber: order.documentNumber,
              transactionDate: now,
              createInfo: {
                snkey: store.state.pData.snkey,
                name: store.state.pData.username,
                time: now
              },
              notes: `訂單扣款: ${order.documentNumber}`
            }

            const transactionPostData = {
              datalist: JSON.stringify(transactionData)
            }

            await api.add('wallet_transactions', transactionPostData)

            results.success.push(order)
          } else {
            results.failed.push({ order, reason: '更新儲值記錄失敗' })
          }
        } catch (error) {
          console.error('扣款失敗:', error)
          results.failed.push({ order, reason: error.message || '扣款操作失敗' })
        }
      }
    }

    // 顯示結果
    if (results.success.length > 0) {
      proxy.$swal({
        icon: "success",
        title: "扣款完成",
        html: `
          <div style="text-align: left; padding: 10px;">
            <p><strong>成功:</strong> ${results.success.length} 筆</p>
            ${results.failed.length > 0 ? `<p><strong>失敗:</strong> ${results.failed.length} 筆</p>` : ''}
          </div>
        `,
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6'
      })

      // 重新載入數據
      await loadWalletData()
      await loadTransactions()
      await searchOrders()
      clearSelection()
    } else {
      proxy.$swal({
        icon: "error",
        title: "扣款失敗",
        text: `所有訂單扣款失敗`,
        confirmButtonText: '確定'
      })
    }
  } catch (error) {
    console.error('扣款操作失敗:', error)
    proxy.$swal({
      icon: "error",
      title: "扣款失敗",
      text: error.message || "扣款操作失敗，請稍後再試",
      confirmButtonText: '確定'
    })
  } finally {
    deducting.value = false
  }
}

// 生命週期
onMounted(async () => {
  await loadActivationDate()
  await loadCustomers()
  await loadWalletData()
  await loadTransactions()
})
</script>

<style scoped lang="scss">
.deduction-page {
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
.orders-card,
.preview-card {
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
