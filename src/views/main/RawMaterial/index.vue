<template>
  <div class="raw-material-list pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="raw-material-hero" elevation="0" rounded="xl">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                  <v-icon color="primary">mdi-flask</v-icon>
                </v-avatar>
                <div>
                  <h2 class="hero-title mb-1">原料管理</h2>
                  <p class="hero-subtitle mb-0">維護原料資料，掌握原料資訊。</p>
                </div>
              </div>
              <div class="d-flex align-center gap-3">
                <v-chip class="hero-chip" prepend-icon="mdi-theme-light-dark" size="small" variant="outlined">
                  Daycare Style
                </v-chip>
                <v-btn class="ml-2" color="primary" variant="tonal" size="small" prepend-icon="mdi-refresh"
                  @click="getAllData">
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
            <div class="summary-card__title">原料總數</div>
            <div class="summary-card__value">{{ totalCount }}</div>
            <div class="summary-card__caption">目前已建立的原料數量</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" variant="tonal" color="secondary">
            <div class="summary-card__title">有提供廠商</div>
            <div class="summary-card__value">{{ withSupplierCount }}</div>
            <div class="summary-card__caption">已填寫提供廠商的原料</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" variant="tonal" color="info">
            <div class="summary-card__title">有 CAS#</div>
            <div class="summary-card__value">{{ withCasNumberCount }}</div>
            <div class="summary-card__caption">已填寫 CAS# 的原料</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="summary-card" variant="tonal" color="warning">
            <div class="summary-card__title">無庫存</div>
            <div class="summary-card__value">{{ noStockCount }}</div>
            <div class="summary-card__caption">項次中無庫存的原料總數</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="raw-material-toolbar" elevation="0" rounded="xl">
            <v-row align="center" no-gutters class="toolbar-row">
              <v-col cols="12" md="8" lg="7" class="search-col">
                <v-text-field 
                  v-model="searchKey" 
                  label="搜尋原料關鍵字" 
                  density="comfortable" 
                  variant="outlined"
                  prepend-inner-icon="mdi-magnify" 
                  hide-details 
                  single-line
                  class="search-field"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4" lg="5" class="button-col">
                <div class="button-group">
                  <importRawMaterial class="toolbar-btn" @getAllData="getAllData"></importRawMaterial>
                  <importCostComposition class="toolbar-btn" @imported="getAllData"></importCostComposition>
                  <importUnitPrice class="toolbar-btn" @imported="getAllData"></importUnitPrice>
                  <popupadd 
                    ref="childFn" 
                    :authKeys="authKeys" 
                    :materialItems="items"
                    :usingDatabase="usingDatabase" 
                    class="toolbar-btn" 
                    @getAllData="getAllData"
                  ></popupadd>
                </div>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-card class="raw-material-table-card">
        <v-card-text>
          <PaginatedIterator :items="searchfilter" v-model:page="currentPage" v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions">
            <template #default="{ items }">
              <v-table fixed-header class="text-no-wrap" hide-default-footer>
                <template #default>
                  <thead class="title text-h6">
                    <tr>
                      <th class="text-left"></th>
                      <th class="text-left">項次</th>
                      <th class="text-left">原料料號</th>
                      <th class="text-left">商品名</th>
                      <th class="text-left">原料名稱</th>
                      <th class="text-left">類別</th>
                      <th class="text-left">INCI NAME</th>
                      <th class="text-left">中文名</th>
                      <th class="text-left">成分</th>
                      <th class="text-left">CAS#</th>
                      <th class="text-left">提供廠商</th>
                      <th class="text-left">廠牌</th>
                      <th class="text-left">MOQ(Kg)</th>
                      <th class="text-left">單價</th>
                      <th class="text-left">pH</th>
                      <th class="text-left">功效</th>
                      <th class="text-left">創建紀錄</th>
                      <th class="text-left">修改紀錄</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in items" :key="index">
                      <td>
                        <v-menu transition="scale-transition" offset-y>
                          <template v-slot:activator="{ props }">
                            <v-btn icon v-bind="props">
                              <img src="@/assets/gear.svg" alt="" />
                            </v-btn>
                          </template>
                          <v-list>
                            <v-list-item @click="edit(item.raw)">
                              <v-list-item-title>修改</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="del(item.raw)">
                              <v-list-item-title>刪除</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </td>
                      <td>{{ item.raw.itemNumber || '-' }}</td>
                      <td>{{ item.raw.materialNumber || '-' }}</td>
                      <td>{{ item.raw.productName || '-' }}</td>
                      <td>{{ item.raw.materialName || '-' }}</td>
                      <td>{{ item.raw.category || '-' }}</td>
                      <td>{{ item.raw.inciName || '-' }}</td>
                      <td>{{ item.raw.chineseName || '-' }}</td>
                  <td>
                    <div v-if="item.raw.compositions && item.raw.compositions.length > 0" class="text-truncate" style="max-width: 200px">
                      <v-tooltip location="top">
                        <template v-slot:activator="{ props }">
                          <span v-bind="props" style="cursor: help;">
                            {{ item.raw.compositions.map(c => c.composition).join(', ') }}
                            <v-chip size="x-small" variant="outlined" class="ml-1">
                              {{ item.raw.compositions.length }}
                            </v-chip>
                          </span>
                        </template>
                        <div style="max-width: 480px;">
                          <div v-for="(comp, idx) in item.raw.compositions" :key="idx" class="mb-1" :style="comp.color ? { color: comp.color } : {}">
                            <strong>{{ comp.itemNumber }}.</strong> {{ comp.composition }}
                            <span v-if="comp.wtPercent"> ({{ formatWtPercent(comp.wtPercent) }})</span>
                            <span v-if="comp.casNo" class="text-caption ml-1">CAS: {{ comp.casNo }}</span>
                            <span v-if="comp.ingredientFunction" class="text-caption ml-1">｜{{ comp.ingredientFunction }}</span>
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                    <span v-else>-</span>
                  </td>
                      <td>{{ item.raw.casNumber || '-' }}</td>
                      <td>{{ item.raw.supplier || '-' }}</td>
                      <td>{{ item.raw.brand || '-' }}</td>
                      <td>{{ item.raw.moq || '-' }}</td>
                      <td>{{ item.raw.unitPrice || '-' }}</td>
                      <td>{{ item.raw.ph || '-' }}</td>
                      <td>
                        <div class="text-truncate" style="max-width: 200px" :title="item.raw.efficacy">
                          {{ item.raw.efficacy || '-' }}
                        </div>
                      </td>
                      <td>
                        <div v-if="item.raw.createInfo">
                          {{ `${item.raw.createInfo.name}(${item.raw.createInfo.time})` }}
                        </div>
                        <span v-else>-</span>
                      </td>
                      <td>
                        <div v-if="item.raw.editInfo && item.raw.editInfo.length > 0" class="text-truncate" style="max-width: 400px">
                          <span v-for="(i, idx) in item.raw.editInfo" :key="idx">
                            {{ `${i.name}(${i.time})` }}
                            <span v-if="idx < item.raw.editInfo.length - 1">; </span>
                          </span>
                        </div>
                        <span v-else>-</span>
                      </td>
                    </tr>
                  </tbody>
                </template>
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
import { useStore } from '@/stores/useStore'
import { getCurrentInstance } from 'vue'
import popupadd from "./Add.vue"
import importRawMaterial from "./importRawMaterial.vue"
import importCostComposition from "./importCostComposition.vue"
import importUnitPrice from "./importUnitPrice.vue"

import PaginatedIterator from '@/components/PaginatedIterator.vue'
import dayjs from "dayjs"
import api from '@/assets/js/api.js'

const { proxy } = getCurrentInstance()
const store = useStore()
const childFn = ref(null)

// 響應式數據
const items = ref([])
const usingDatabase = ref("raw_material")
const searchKey = ref("")
const auth = ref("")

// 分頁相關
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [
  { value: 12, title: '12' },
  { value: 24, title: '24' },
  { value: 36, title: '36' },
];

const authKeys = computed(() => {
  return store.state.authKeys.filter((i) => i.authKey != "exit_key")
})

const totalCount = computed(() => items.value.length)
const withSupplierCount = computed(() => 
  items.value.filter((item) => item?.supplier).length
)
const withCasNumberCount = computed(() => 
  items.value.filter((item) => item?.casNumber).length
)
const noStockCount = computed(() => 
  items.value.filter((item) => {
    const itemNumber = item?.itemNumber
    return !itemNumber || (typeof itemNumber === 'string' && itemNumber.trim() === '') || itemNumber === null || itemNumber === undefined
  }).length
)

const searchfilter = computed(() => {
  const keys = searchKey.value.split(" ")
  let str = ""

  return keys.reduce((prev, element) => {
    return prev.filter((item) => {
      str = JSON.stringify(item).toUpperCase()
      if (str.includes(element.toUpperCase())) {
        return item
      }
    })
  }, items.value)
})

// 方法
const getAllData = async () => {
  await api.get(usingDatabase.value).then((rs) => {
    if (rs.length > 0) {
      items.value = rs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey,
      }))
      
      // 按原料料號從小到大排序
      items.value.sort((a, b) => {
        const numA = a.materialNumber || ''
        const numB = b.materialNumber || ''
        
        // 嘗試轉換為數字進行比較
        const numAInt = parseInt(numA)
        const numBInt = parseInt(numB)
        
        // 如果兩個都是有效數字，按數字排序
        if (!isNaN(numAInt) && !isNaN(numBInt)) {
          return numAInt - numBInt
        }
        
        // 否則按字符串排序
        return String(numA).localeCompare(String(numB), 'zh-TW', { numeric: true })
      })
    }
  })

}

const edit = (item) => {
  childFn.value.editProcess(item)
}

const formatWtPercent = (wtPercent) => {
  if (!wtPercent) return ''
  const value = wtPercent.toString().trim()
  // 如果已經包含 % 符號，直接返回
  if (value.includes('%')) return value
  // 否則加上 % 符號
  return value + '%'
}

const del = async (item) => {
  proxy.$swal({
    title: '確認要刪除嗎?',
    text: '此操作無法復原',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then(async (result) => {
    if (result.isConfirmed) {

      item.delInfo = {
        name: store.state.pData.username,
        time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      }

      const postData = {
        snkey: item.snkey,
        tablename: usingDatabase.value,
        datalist: JSON.stringify(item),
      }

      const rs = await api.delete(usingDatabase.value, postData)
      if (rs.state == 1) {
        proxy.$swal({
          icon: "success",
          title: "刪除成功",
          confirmButtonText: '確定',
          confirmButtonColor: '#3085d6',
          allowEscapeKey: false
        })
        await getAllData();
      }
    }
  })
}


// 生命週期鉤子
onMounted(async () => {
  auth.value = store.state.pData
  await getAllData()
})
</script>

<style scoped lang="scss">
.raw-material-list {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.18), rgba(123, 163, 184, 0.1));
}

.raw-material-hero {
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

.raw-material-toolbar {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--daycare-divider-light);
  padding: 18px 24px;
  box-shadow: 0 8px 24px var(--daycare-shadow-light);

  @media (max-width: 599px) {
    padding: 12px 16px;
  }

  @media (min-width: 600px) and (max-width: 959px) {
    padding: 16px 20px;
  }

  .toolbar-row {
    gap: 0;
  }

  .search-col {
    padding-right: 12px;
    
    @media (max-width: 959px) {
      padding-right: 0;
      margin-bottom: 12px;
    }

    @media (max-width: 599px) {
      margin-bottom: 16px;
    }
  }

  .button-col {
    padding-left: 12px;
    
    @media (max-width: 959px) {
      padding-left: 0;
    }
  }

  .search-field {
    width: 100%;
  }

  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;

    @media (max-width: 959px) {
      justify-content: stretch;
      flex-direction: column;
      width: 100%;
    }

    @media (min-width: 960px) and (max-width: 1263px) {
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    @media (min-width: 1264px) {
      flex-wrap: nowrap;
      justify-content: flex-end;
    }
  }

  .toolbar-btn {
    flex: 0 0 auto;
    
    @media (max-width: 959px) {
      width: 100%;
      
      :deep(.v-btn) {
        width: 100%;
        justify-content: center;
      }
    }

    @media (min-width: 960px) and (max-width: 1263px) {
      flex: 1 1 auto;
      min-width: 0;
      
      :deep(.v-btn) {
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.raw-material-table-card {
  border-radius: 24px;
  box-shadow: 0 14px 40px rgba(74, 107, 95, 0.14);
  border: 1px solid rgba(91, 143, 163, 0.16);
  margin-top: 24px;
}

.preview-avatar {
  position: relative;
  display: inline-flex;
  border-radius: 50%;
  box-shadow: 0 6px 16px rgba(74, 107, 95, 0.16);
}

// 按鈕 hover 樣式
:deep(.v-btn) {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 107, 95, 0.25);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 重新整理按鈕 hover
.raw-material-hero :deep(.v-btn) {
  &:hover {
    background-color: rgba(74, 107, 95, 0.15) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(74, 107, 95, 0.3);
  }
}

// 工具列按鈕 hover
.raw-material-toolbar :deep(.v-btn) {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 107, 95, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }

  // 響應式字體大小
  @media (max-width: 599px) {
    font-size: 0.875rem;
    padding: 8px 16px;
  }

  @media (min-width: 600px) and (max-width: 959px) {
    font-size: 0.9rem;
  }
}

// 表格操作按鈕 hover
.raw-material-table-card :deep(.v-btn) {
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(74, 107, 95, 0.1) !important;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(74, 107, 95, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 圖標按鈕 hover
:deep(.v-btn--icon) {
  &:hover {
    background-color: rgba(74, 107, 95, 0.1) !important;
  }
}
</style>
