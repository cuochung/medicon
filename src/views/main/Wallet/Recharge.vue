<template>
  <div class="recharge-page pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="page-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-btn icon variant="text" @click="$router.push('/main/Wallet')" class="mr-3">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                <v-icon color="primary">mdi-wallet-plus</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">會員儲值</h2>
                <p class="hero-subtitle mb-0">為會員進行儲值操作</p>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="recharge-card" elevation="2">
            <v-card-title class="card-title">儲值資訊</v-card-title>
            <v-card-text>
              <v-form ref="formRef">
                <!-- 選擇客戶 -->
                <v-autocomplete
                  v-model="selectedCustomer"
                  :items="customerOptions"
                  item-title="customerFullName"
                  item-value="snkey"
                  label="選擇客戶 *"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  :rules="[v => !!v || '請選擇客戶']"
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

                <!-- 顯示客戶資訊 -->
                <v-card v-if="selectedCustomer && customerInfo" variant="tonal" color="info" class="mb-4">
                  <v-card-text>
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="text-h6">{{ customerInfo.customerFullName }}</div>
                        <div class="text-caption">客戶編號: {{ customerInfo.customerNumber }}</div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- 當前餘額資訊 -->
                <v-card v-if="walletInfo" variant="tonal" :color="walletInfo.balance >= 0 ? 'success' : 'error'" class="mb-4">
                  <v-card-text>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-body-1 font-weight-medium">當前餘額</span>
                      <span class="text-h5 font-weight-bold">{{ formatCurrency(walletInfo.balance) }}</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div class="d-flex justify-space-between text-caption">
                      <span>最後交易日期:</span>
                      <span>{{ walletInfo.lastTransactionDate ? formatDate(walletInfo.lastTransactionDate) : '無' }}</span>
                    </div>
                    <div class="d-flex justify-space-between text-caption mt-1">
                      <span>累計儲值:</span>
                      <span>{{ formatCurrency(walletInfo.totalRecharge || 0) }}</span>
                    </div>
                    <div class="d-flex justify-space-between text-caption mt-1">
                      <span>累計扣款:</span>
                      <span>{{ formatCurrency(walletInfo.totalDeduction || 0) }}</span>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card v-else-if="selectedCustomer" variant="tonal" color="warning" class="mb-4">
                  <v-card-text>
                    <div class="text-body-1">此客戶尚未建立儲值記錄，將建立新記錄</div>
                    <div class="text-caption mt-2">當前餘額: {{ formatCurrency(0) }}</div>
                  </v-card-text>
                </v-card>

                <!-- 輸入儲值金額 -->
                <v-text-field
                  v-model.number="rechargeAmount"
                  label="儲值金額 *"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-currency-twd"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[
                    v => !!v || '請輸入儲值金額',
                    v => (v && v > 0) || '儲值金額必須大於 0',
                    v => (v && /^\d+(\.\d{1,2})?$/.test(v)) || '金額格式不正確'
                  ]"
                  @input="calculateNewBalance"
                  class="mb-4"
                ></v-text-field>

                <!-- 儲值預覽 -->
                <v-card v-if="rechargeAmount > 0 && selectedCustomer" variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1">儲值預覽</v-card-title>
                  <v-card-text>
                    <div class="d-flex justify-space-between mb-2">
                      <span>當前餘額:</span>
                      <span class="font-weight-bold">{{ formatCurrency(currentBalance) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>儲值金額:</span>
                      <span class="font-weight-bold text-primary">{{ formatCurrency(rechargeAmount) }}</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div class="d-flex justify-space-between">
                      <span class="text-h6">儲值後餘額:</span>
                      <span class="text-h6 font-weight-bold text-success">{{ formatCurrency(newBalance) }}</span>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- 備註 -->
                <v-textarea
                  v-model="notes"
                  label="備註說明"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  class="mb-4"
                ></v-textarea>
              </v-form>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn variant="outlined" @click="resetForm">重置</v-btn>
              <v-btn 
                color="primary" 
                variant="elevated" 
                @click="submitRecharge"
                :disabled="!canSubmit"
                :loading="loading"
              >
                確認儲值
              </v-btn>
            </v-card-actions>
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

// 表單引用
const formRef = ref(null)

// 響應式數據
const customers = ref([])
const selectedCustomer = ref(null)
const customerInfo = ref(null)
const walletInfo = ref(null)
const rechargeAmount = ref(0)
const notes = ref('')
const loading = ref(false)

// 客戶選項
const customerOptions = computed(() => {
  return customers.value.map(c => ({
    snkey: c.snkey,
    customerNumber: c.customerNumber,
    customerFullName: c.customerFullName
  }))
})

// 當前餘額
const currentBalance = computed(() => {
  return walletInfo.value ? parseFloat(walletInfo.value.balance || 0) : 0
})

// 新餘額
const newBalance = computed(() => {
  return currentBalance.value + parseFloat(rechargeAmount.value || 0)
})

// 是否可以提交
const canSubmit = computed(() => {
  return selectedCustomer.value && rechargeAmount.value > 0 && !loading.value
})

// 格式化貨幣
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount)
}

// 格式化日期
const formatDate = (dateValue) => {
  if (!dateValue) return '-'
  const date = dayjs(dateValue)
  if (date.isValid()) {
    return date.format('YYYY-MM-DD HH:mm:ss')
  }
  return dateValue || '-'
}

// 計算新餘額
const calculateNewBalance = () => {
  // 觸發計算
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
const onCustomerSelected = async (snkey) => {
  if (!snkey) {
    customerInfo.value = null
    walletInfo.value = null
    return
  }

  // 取得客戶資訊
  customerInfo.value = customers.value.find(c => c.snkey === snkey)

  if (!customerInfo.value) {
    return
  }

  // 查詢儲值記錄
  await loadWalletInfo(customerInfo.value.customerNumber)
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

// 載入儲值資訊
const loadWalletInfo = async (customerNumber) => {
  try {
    const rs = await api.get('walletdata')
    if (rs && rs.length > 0) {
      const walletRecords = rs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
      
      walletInfo.value = walletRecords.find(w => w.customerNumber === customerNumber)
      
      if (!walletInfo.value) {
        walletInfo.value = null
      }
    } else {
      walletInfo.value = null
    }
  } catch (error) {
    console.error('載入儲值資訊失敗:', error)
    walletInfo.value = null
  }
}

// 提交儲值
const submitRecharge = async () => {
  // 驗證表單
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  if (!canSubmit.value) {
    return
  }

  // 確認對話框
  const confirmResult = await proxy.$swal({
    title: '確認儲值？',
    html: `
      <div style="text-align: left; padding: 10px;">
        <p><strong>客戶:</strong> ${customerInfo.value.customerFullName}</p>
        <p><strong>當前餘額:</strong> ${formatCurrency(currentBalance.value)}</p>
        <p><strong>儲值金額:</strong> ${formatCurrency(rechargeAmount.value)}</p>
        <p><strong>儲值後餘額:</strong> ${formatCurrency(newBalance.value)}</p>
      </div>
    `,
    icon: 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: '確認',
    cancelButtonText: '取消',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    toast: false,
    timer: null,
    position: 'center'
  })

  if (!confirmResult.isConfirmed) {
    return
  }

  loading.value = true

  try {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const balanceBefore = currentBalance.value
    const balanceAfter = newBalance.value

    // 準備 walletdata 資料
    let walletData = {
      customerNumber: customerInfo.value.customerNumber,
      balance: balanceAfter,
      totalRecharge: (walletInfo.value?.totalRecharge || 0) + parseFloat(rechargeAmount.value),
      totalDeduction: walletInfo.value?.totalDeduction || 0,
      lastTransactionDate: now,
      createInfo: walletInfo.value?.createInfo || {
        snkey: store.state.pData.snkey,
        name: store.state.pData.username,
        time: now
      },
      editInfo: walletInfo.value?.editInfo || []
    }

    // 新增編輯記錄
    walletData.editInfo.push({
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: now
    })

    // 如果不存在，建立新記錄；如果存在，更新記錄
    let walletResult
    if (walletInfo.value && walletInfo.value.snkey) {
      // 更新現有記錄
      const postData = {
        snkey: walletInfo.value.snkey,
        datalist: JSON.stringify(walletData)
      }
      walletResult = await api.post('walletdata', postData)
    } else {
      // 建立新記錄
      const postData = {
        datalist: JSON.stringify(walletData)
      }
      walletResult = await api.add('walletdata', postData)
    }

    if (walletResult && walletResult.state == 1) {
      // 記錄交易明細
      const transactionData = {
        customerNumber: customerInfo.value.customerNumber,
        transactionType: 'recharge',
        amount: parseFloat(rechargeAmount.value),
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        orderNumber: null,
        documentNumber: null,
        transactionDate: now,
        createInfo: {
          snkey: store.state.pData.snkey,
          name: store.state.pData.username,
          time: now
        },
        notes: notes.value || '手動儲值'
      }

      const transactionPostData = {
        datalist: JSON.stringify(transactionData)
      }

      const transactionResult = await api.add('wallet_transactions', transactionPostData)

      if (transactionResult && transactionResult.state == 1) {
        proxy.$swal({
          icon: "success",
          title: "儲值成功",
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>儲值金額:</strong> ${formatCurrency(rechargeAmount.value)}</p>
              <p><strong>新餘額:</strong> ${formatCurrency(balanceAfter)}</p>
            </div>
          `,
          confirmButtonText: '確定',
          confirmButtonColor: '#3085d6'
        })

        // 重新載入儲值資訊
        await loadWalletInfo(customerInfo.value.customerNumber)
        
        // 重置表單
        resetForm()
      } else {
        throw new Error('記錄交易明細失敗')
      }
    } else {
      throw new Error('儲值操作失敗')
    }
  } catch (error) {
    console.error('儲值失敗:', error)
    proxy.$swal({
      icon: "error",
      title: "儲值失敗",
      text: error.message || "儲值操作失敗，請稍後再試",
      confirmButtonText: '確定'
    })
  } finally {
    loading.value = false
  }
}

// 重置表單
const resetForm = () => {
  selectedCustomer.value = null
  customerInfo.value = null
  walletInfo.value = null
  rechargeAmount.value = 0
  notes.value = ''
  formRef.value?.resetValidation()
}

// 生命週期
onMounted(async () => {
  await loadCustomers()
})
</script>

<style scoped lang="scss">
.recharge-page {
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

.recharge-card {
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
