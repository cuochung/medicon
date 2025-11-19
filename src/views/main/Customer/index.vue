<template>
  <div class="customer-list pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="customer-hero" elevation="0" rounded="xl">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                  <v-icon color="primary">mdi-account-multiple</v-icon>
                </v-avatar>
                <div>
                  <h2 class="hero-title mb-1">客戶管理面板</h2>
                  <p class="hero-subtitle mb-0">維護客戶資料，掌握客戶資訊。</p>
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
        <v-col cols="12" sm="6" md="4">
          <v-card class="summary-card" variant="tonal" color="primary">
            <div class="summary-card__title">客戶總人數</div>
            <div class="summary-card__value">{{ totalCount }}</div>
            <div class="summary-card__caption">目前已建立的客戶數量</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="summary-card" variant="tonal" color="secondary">
            <div class="summary-card__title">有聯絡電話</div>
            <div class="summary-card__value">{{ withContactPhoneCount }}</div>
            <div class="summary-card__caption">已填寫聯絡電話的客戶</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="summary-card" variant="tonal" color="info">
            <div class="summary-card__title">有送貨地址</div>
            <div class="summary-card__value">{{ withDeliveryAddressCount }}</div>
            <div class="summary-card__caption">已填寫送貨地址的客戶</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="customer-toolbar" elevation="0" rounded="xl">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="8">
                <v-text-field v-model="searchKey" label="搜尋客戶關鍵字" density="comfortable" variant="outlined"
                  prepend-inner-icon="mdi-magnify" hide-details single-line></v-text-field>
              </v-col>
              <v-col cols="12" md="4" class="d-flex justify-end mt-3 mt-md-0">
                <importCustomer class="mr-md-2" @getAllData="getAllData"></importCustomer>
                <!-- <popupadd v-if="auth.customer_add_key" ref="childFn" :authKeys="authKeys" :customerItems="items"
                  :usingDatabase="usingDatabase" class="ml-md-2" @getAllData="getAllData"></popupadd> -->
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-card class="customer-table-card">
        <v-card-text>
          <PaginatedIterator :items="searchfilter" v-model:page="currentPage" v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions">
            <template #default="{ items }">
              <v-table fixed-header class="text-no-wrap" hide-default-footer>
                <template #default>
                  <thead class="title text-h6">
                    <tr>
                      <th class="text-left"></th>
                      <th class="text-left">客戶編號</th>
                      <th class="text-left">客戶全稱</th>
                      <th class="text-left">業務人員</th>
                      <th class="text-left">聯絡人</th>
                      <th class="text-left">聯絡電話</th>
                      <th class="text-left">聯絡電話一</th>
                      <th class="text-left">地址</th>
                      <th class="text-left">送貨地址</th>
                      <th class="text-left">郵遞區號</th>
                      <th class="text-left">傳真號碼</th>
                      <th class="text-left">行走路線</th>
                      <th class="text-left">備註</th>
                      <th class="text-left">創建紀錄</th>
                      <th class="text-left">修改紀錄</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in items" :key="index">
                      <td>
                        <!-- <v-menu transition="scale-transition" offset-y>
                          <template v-slot:activator="{ props }">
                            <v-btn icon v-bind="props">
                              <img src="@/assets/gear.svg" alt="" />
                            </v-btn>
                          </template>
                          <v-list>
                            <v-list-item @click="edit(item.raw)" v-if="auth.customer_edit_key">
                              <v-list-item-title>修改</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="del(item.raw)" v-if="auth.customer_del_key">
                              <v-list-item-title>刪除</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu> -->
                      </td>
                      <td>{{ item.raw.customerNumber || '-' }}</td>
                      <td>{{ item.raw.customerFullName || '-' }}</td>
                      <td>{{ item.raw.salesPerson || '-' }}</td>
                      <td>{{ item.raw.contactPerson || '-' }}</td>
                      <td>{{ item.raw.contactPhone || '-' }}</td>
                      <td>{{ item.raw.contactPhone1 || '-' }}</td>
                      <td>{{ item.raw.address || '-' }}</td>
                      <td>{{ item.raw.deliveryAddress || '-' }}</td>
                      <td>{{ item.raw.postalCode || '-' }}</td>
                      <td>{{ item.raw.faxNumber || '-' }}</td>
                      <td>{{ item.raw.route || '-' }}</td>
                      <td>
                        <div class="text-truncate" style="max-width: 200px" :title="item.raw.notes">
                          {{ item.raw.notes || '-' }}
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
import importCustomer from "./importCustomer.vue"

import PaginatedIterator from '@/components/PaginatedIterator.vue'
import dayjs from "dayjs"
import api from '@/assets/js/api.js'

const { proxy } = getCurrentInstance()
const store = useStore()
const childFn = ref(null)

// 響應式數據
const items = ref([])
const usingDatabase = ref("customer")
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
const withContactPhoneCount = computed(() => 
  items.value.filter((item) => item?.contactPhone || item?.contactPhone1).length
)
const withDeliveryAddressCount = computed(() => 
  items.value.filter((item) => item?.deliveryAddress).length
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
        // picName: i.picName ? i.picName : "lazypic.jpg",
      }))
      
      // 按客戶編號從小到大排序
      items.value.sort((a, b) => {
        const numA = a.customerNumber || ''
        const numB = b.customerNumber || ''
        
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
.customer-list {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.18), rgba(123, 163, 184, 0.1));
}

.customer-hero {
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

.customer-toolbar {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--daycare-divider-light);
  padding: 18px 24px;
  box-shadow: 0 8px 24px var(--daycare-shadow-light);
}

.customer-table-card {
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
.customer-hero :deep(.v-btn) {
  &:hover {
    background-color: rgba(74, 107, 95, 0.15) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(74, 107, 95, 0.3);
  }
}

// 工具列按鈕 hover
.customer-toolbar :deep(.v-btn) {
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 107, 95, 0.3);
  }
}

// 表格操作按鈕 hover
.customer-table-card :deep(.v-btn) {
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