<template>
  <div class="wallet-list pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="wallet-hero" elevation="0" rounded="xl">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                  <v-icon color="primary">mdi-wallet</v-icon>
                </v-avatar>
                <div>
                  <h2 class="hero-title mb-1">會員儲值系統</h2>
                  <p class="hero-subtitle mb-0">管理會員儲值、扣款與交易記錄。</p>
                </div>
              </div>
              <div class="d-flex align-center gap-3">
                <v-chip class="hero-chip" prepend-icon="mdi-theme-light-dark" size="small" variant="outlined">
                  Daycare Style
                </v-chip>
                <v-btn class="ml-2" color="primary" variant="tonal" size="small" prepend-icon="mdi-refresh"
                  @click="refreshData">
                  重新整理
                </v-btn>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="summary-row" dense>
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" variant="tonal" color="primary">
            <div class="summary-card__title">總會員數</div>
            <div class="summary-card__value">{{ totalMembers }}</div>
            <div class="summary-card__caption">已建立儲值記錄的會員</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" variant="tonal" color="secondary">
            <div class="summary-card__title">總餘額</div>
            <div class="summary-card__value">{{ totalBalance }}</div>
            <div class="summary-card__caption">所有會員的總儲值餘額</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" variant="tonal" color="info">
            <div class="summary-card__title">累計儲值</div>
            <div class="summary-card__value">{{ totalRecharge }}</div>
            <div class="summary-card__caption">系統累計儲值總額</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" variant="tonal" color="success">
            <div class="summary-card__title">累計扣款</div>
            <div class="summary-card__value">{{ totalDeduction }}</div>
            <div class="summary-card__caption">系統累計扣款總額</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6" lg="4" v-for="(item, index) in functionItems" :key="index">
          <v-card 
            class="function-card" 
            :class="item.color"
            @click="navigateTo(item.route)"
            hover
          >
            <v-card-text class="pa-6">
              <div class="d-flex align-center mb-4">
                <v-avatar :color="item.color" variant="tonal" size="56">
                  <v-icon :color="item.color" size="32">{{ item.icon }}</v-icon>
                </v-avatar>
                <div class="ml-4">
                  <h3 class="function-title">{{ item.title }}</h3>
                  <p class="function-subtitle">{{ item.subtitle }}</p>
                </div>
              </div>
              <v-btn 
                :color="item.color" 
                variant="elevated" 
                block 
                class="mt-2"
              >
                {{ item.buttonText }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/useStore'
import api from '@/assets/js/api.js'

const router = useRouter()
const store = useStore()

// 功能選項
const functionItems = ref([
  {
    title: '會員儲值',
    subtitle: '為會員進行儲值操作',
    icon: 'mdi-wallet-plus',
    color: 'primary',
    route: '/main/Wallet/Recharge',
    buttonText: '前往儲值'
  },
  {
    title: '交易記錄',
    subtitle: '查詢儲值與扣款記錄',
    icon: 'mdi-history',
    color: 'success',
    route: '/main/Wallet/TransactionHistory',
    buttonText: '查看記錄'
  },
  {
    title: '餘額查詢',
    subtitle: '查詢會員儲值餘額',
    icon: 'mdi-account-cash',
    color: 'warning',
    route: '/main/Wallet/BalanceQuery',
    buttonText: '查詢餘額'
  },

  {
    title: '訂單扣款',
    subtitle: '手動選擇訂單進行扣款',
    icon: 'mdi-cash-minus',
    color: 'error',
    route: '/main/Wallet/Deduction',
    buttonText: '前往扣款'
  },
  {
    title: '訂單查詢',
    subtitle: '查詢所有訂單及扣款狀態',
    icon: 'mdi-file-search',
    color: 'info',
    route: '/main/Wallet/OrderQuery',
    buttonText: '查詢訂單'
  },
])

// 統計數據
const walletData = ref([])
const totalMembers = computed(() => walletData.value.length)
const totalBalance = computed(() => {
  return walletData.value.reduce((sum, item) => {
    const balance = parseFloat(item.balance) || 0
    return sum + balance
  }, 0).toLocaleString('zh-TW')
})
const totalRecharge = computed(() => {
  return walletData.value.reduce((sum, item) => {
    const recharge = parseFloat(item.totalRecharge) || 0
    return sum + recharge
  }, 0).toLocaleString('zh-TW')
})
const totalDeduction = computed(() => {
  return walletData.value.reduce((sum, item) => {
    const deduction = parseFloat(item.totalDeduction) || 0
    return sum + deduction
  }, 0).toLocaleString('zh-TW')
})

// 導航到功能頁面
const navigateTo = (route) => {
  router.push(route)
}

// 重新整理數據
const refreshData = async () => {
  await loadWalletData()
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
    } else {
      walletData.value = []
    }
  } catch (error) {
    console.error('載入儲值數據失敗:', error)
    walletData.value = []
  }
}

// 生命週期
onMounted(async () => {
  await loadWalletData()
})
</script>

<style scoped lang="scss">
.wallet-list {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.18), rgba(123, 163, 184, 0.1));
}

.wallet-hero {
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

.hero-chip {
  border-color: rgba(90, 122, 111, 0.35) !important;
  color: var(--daycare-primary) !important;
  background-color: rgba(90, 122, 111, 0.1);
}

.summary-row {
  margin-top: 16px;
}

.summary-card {
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: 0 12px 30px rgba(74, 107, 95, 0.12);
  border: 1px solid rgba(91, 143, 163, 0.18);
  color: var(--daycare-primary);

  &__title {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 1px;
  }

  &__value {
    font-size: 2rem;
    font-weight: 700;
    margin: 8px 0;
  }

  &__caption {
    font-size: 0.85rem;
    color: rgba(74, 107, 95, 0.65);
  }
}

.function-card {
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(74, 107, 95, 0.14);
  border: 1px solid rgba(91, 143, 163, 0.16);
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(74, 107, 95, 0.25);
  }
}

.function-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.function-subtitle {
  font-size: 0.9rem;
  color: rgba(74, 107, 95, 0.7);
  margin: 0;
}

// 按鈕 hover 樣式
:deep(.v-btn) {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 107, 95, 0.25);
  }
}
</style>
