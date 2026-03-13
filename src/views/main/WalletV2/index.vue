<template>
  <div class="wallet-v2 pa-6">
    <v-container fluid class="pa-0">
      <!-- 標題列 -->
      <v-row>
        <v-col cols="12">
          <v-sheet class="wallet-hero" elevation="0" rounded="xl">
            <div class="d-flex align-center mb-4">
              <v-avatar color="success" variant="tonal" size="48" class="mr-3">
                <v-icon color="success">mdi-wallet</v-icon>
              </v-avatar>
              <div>
                <h2 class="hero-title mb-1">會員儲值版本二</h2>
                <p class="hero-subtitle mb-0">會員儲金一覽、匯入與基準日設定。</p>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 統計卡片 -->
      <v-row class="summary-row" dense>
        <v-col cols="12" sm="6" md="4">
          <v-card class="summary-card" variant="tonal" color="primary">
            <div class="summary-card__title">儲金筆數</div>
            <div class="summary-card__value">{{ totalCount }}</div>
            <div class="summary-card__caption">已匯入的客戶儲金筆數</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="summary-card" variant="tonal" color="secondary">
            <div class="summary-card__title">總儲金餘額</div>
            <div class="summary-card__value">{{ totalBalance }}</div>
            <div class="summary-card__caption">所有客戶儲金餘額合計</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- 功能選項（與會員儲值相同呈現方式） -->
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
              <v-btn :color="item.color" variant="elevated" block class="mt-2">
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

// 功能選項（後續可在此追加更多功能）
const functionItems = ref([
  {
    title: '會員儲金一覽表',
    subtitle: '檢視儲金餘額、匯入 Excel、設定基準日',
    icon: 'mdi-format-list-bulleted',
    color: 'primary',
    route: '/main/WalletV2/BalanceList',
    buttonText: '前往一覽表'
  },
  {
    title: '交易記錄查詢',
    subtitle: '依客戶與日期區間查詢訂單並試算儲值餘額',
    icon: 'mdi-history',
    color: 'success',
    route: '/main/WalletV2/TransactionHistory',
    buttonText: '查詢交易記錄'
  },
])

// 統計數據（來自 walletdatav2）
const walletData = ref([])
const totalCount = computed(() => walletData.value.length)
const totalBalance = computed(() => {
  const sum = walletData.value.reduce((acc, item) => {
    const balance = parseFloat(item.balance) || 0
    return acc + balance
  }, 0)
  return sum.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
})

const navigateTo = (route) => {
  router.push(route)
}

const loadWalletData = async () => {
  try {
    const rs = await api.get('walletdatav2')
    if (rs && Array.isArray(rs)) {
      walletData.value = rs.map((i) => {
        let data = {}
        try {
          data = typeof i.datalist === 'string' ? JSON.parse(i.datalist) : (i.datalist || {})
        } catch (_) {}
        return { snkey: i.snkey, ...data }
      })
    } else {
      walletData.value = []
    }
  } catch (err) {
    console.error('載入儲值數據失敗:', err)
    walletData.value = []
  }
}

onMounted(() => {
  loadWalletData()
})
</script>

<style scoped lang="scss">
.wallet-v2 {
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

:deep(.v-btn) {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 107, 95, 0.25);
  }
}
</style>
