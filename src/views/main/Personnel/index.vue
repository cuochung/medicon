<template>
  <div class="personnel-list pa-6">
    <!-- 上傳file用的input -->
    <input type="file" accept="image/*" ref="fileInput" @change="onFileSelected" style="display: none" />

    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="personnel-hero" elevation="0" rounded="xl">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                  <v-icon color="primary">mdi-account-multiple</v-icon>
                </v-avatar>
                <div>
                  <h2 class="hero-title mb-1">人員管理面板</h2>
                  <p class="hero-subtitle mb-0">維護日間照護服務團隊，掌握權限與任職資訊。</p>
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
            <div class="summary-card__title">團隊總人數</div>
            <div class="summary-card__value">{{ totalCount }}</div>
            <div class="summary-card__caption">目前已建立的團隊成員數量</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="summary-card" variant="tonal" color="secondary">
            <div class="summary-card__title">啟用中</div>
            <div class="summary-card__value">{{ activeCount }}</div>
            <div class="summary-card__caption">未停職、可登入系統的人員</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="summary-card" variant="tonal" color="info">
            <div class="summary-card__title">停職 / 暫停</div>
            <div class="summary-card__value">{{ suspendedCount }}</div>
            <div class="summary-card__caption">勾選停職的團隊成員</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-sheet class="personnel-toolbar" elevation="0" rounded="xl">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="8">
                <v-text-field v-model="searchKey" label="搜尋人員關鍵字" density="comfortable" variant="outlined"
                  prepend-inner-icon="mdi-magnify" hide-details single-line></v-text-field>
              </v-col>
              <v-col cols="12" md="4" class="d-flex justify-end mt-3 mt-md-0">
                <popupadd v-if="auth.personnel_add_key" ref="childFn" :authKeys="authKeys" :personnelItems="items"
                  :usingDatabase="usingDatabase" class="ml-md-2" @getAllData="getAllData"></popupadd>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-card class="personnel-table-card">
        <v-card-text>
          <PaginatedIterator :items="searchfilter" v-model:page="currentPage" v-model:items-per-page="itemsPerPage"
            :items-per-page-options="itemsPerPageOptions">
            <template #default="{ items }">
              <v-table fixed-header class="text-no-wrap" hide-default-footer>
                <template #default>
                  <thead class="title text-h6">
                    <tr>
                      <th class="text-left"></th>
                      <th class="text-left">個人照</th>
                      <th class="text-left">登入帳號</th>
                      <th class="text-left">姓名</th>
                      <th class="text-left">停職</th>
                      <th class="text-left">可用權限</th>
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
                            <v-list-item @click="edit(item.raw)" v-if="auth.personnel_edit_key">
                              <v-list-item-title>修改</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="del(item.raw)" v-if="auth.personnel_del_key">
                              <v-list-item-title>刪除</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="uploadItem = item.raw; $refs.fileInput.click();">
                              <v-list-item-title>上傳圖片</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </td>
                      <td>
                        <div class="preview-avatar">
                          <showBigpic :item="item.raw.picInfo" :folder="usingDatabase" v-if="item.raw?.picInfo?.picName" style="width: 150px;" />
                        </div>
                      </td>
                      <td>{{ item.raw.account }}</td>
                      <td>{{ item.raw.username }}</td>
                      <td>
                        <v-checkbox hide-details v-model="item.raw.suspension" value="true"
                          @click.stop="suspensionSet(item.raw)"></v-checkbox>
                      </td>
                      <td>
                        <div class="d-flex flex-wrap gap-2">
                          <div v-for="authKey in authKeys" :key="authKey.label">
                            <v-chip :class="authKey.class" :color="authKey.color"
                              v-if="item.raw[`${authKey.keyName}_key`]">
                              {{ authKey.label }}
                            </v-chip>
                            <v-chip :class="authKey.class" :color="authKey.color"
                              v-if="item.raw[`${authKey.keyName}_add_key`]">
                              增
                            </v-chip>
                            <v-chip :class="authKey.class" :color="authKey.color"
                              v-if="item.raw[`${authKey.keyName}_edit_key`]">
                              修
                            </v-chip>
                            <v-chip :class="authKey.class" :color="authKey.color"
                              v-if="item.raw[`${authKey.keyName}_del_key`]">
                              刪
                            </v-chip>
                            <v-chip :class="authKey.class" :color="authKey.color"
                              v-if="item.raw[`${authKey.keyName}_search_key`]">
                              查
                            </v-chip>
                          </div>
                        </div>
                      </td>
                      <td>
                        {{ `${item.raw.createInfo.name}(${item.raw.createInfo.time})` }}
                      </td>
                      <td>
                        <div v-if="item.raw.editInfo" class="text-truncate" style="max-width: 400px">
                          <span v-for="(i, index) in item.raw.editInfo" :key="index">
                            {{ `${i.name}(${i.time})` }}
                          </span>
                        </div>
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
import showBigpic from "@/components/showBigpic.vue"
import popupadd from "./Add.vue"
// import personnelAdd from "./PersonnelAdd.vue"

import PaginatedIterator from '@/components/PaginatedIterator.vue'
import dayjs from "dayjs"
import api from '@/assets/js/api.js'

const { proxy } = getCurrentInstance()
const store = useStore()
const childFn = ref(null)
const fileInput = ref(null)

// 響應式數據
const items = ref([])
const usingDatabase = ref("personnel")
const searchKey = ref("")
const auth = ref("")
const picBaseUrl = ref(null)
const selectedFile = ref("")
const uploadItem = ref("") // 上傳圖片的資料內容暫存

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
const suspendedCount = computed(() => items.value.filter((item) => item?.suspension === "true").length)
const activeCount = computed(() => totalCount.value - suspendedCount.value)

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

        if (item.picInfo.picName && item.picInfo.picName != "lazypic.jpg") {
          console.log('del process run del pic')
          let delPicRs = await delExistPic(uploadItem.value.picInfo.picName)
          if (delPicRs.state == 1) {
            proxy.$swal({
              icon: "success",
              title: "刪除成功",
              confirmButtonText: '確定',
              confirmButtonColor: '#3085d6',
              allowEscapeKey: false
            })
          }
        }

        await getAllData();
      }
    }
  })
}

const suspensionSet = (item) => {
  proxy.$swal({
    title: '確認更動停權設定?',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then((result) => {
    if (result.isConfirmed) {
      if (item.edit_man == undefined) {
        item.edit_man = ""
      }
      item.edit_man = `${store.state.pData.name}(${dayjs().format("YYYY-MM-DD HH:mm:ss")})${item.edit_man}`

      const postData = {
        snkey: item.snkey,
        datalist: JSON.stringify(item),
      }

      api.post(usingDatabase.value, postData).then((rs) => {
        if (rs.state == 1) {
          proxy.$swal({
            icon: "success",
            title: "已修改,權限相關功能將在重新登入後生效",
          })
          getAllData()
        }
      })
    } else {
      if (item.suspension === null) {
        item.suspension = "true"
      } else {
        item.suspension = null
      }
    }
  })
}

const onFileSelected = async (event) => {
  selectedFile.value = event.target.files[0]
  const extension = selectedFile.value.name.split(".").pop().toLowerCase()
  const fitType = ["gif", "png", "jpg", "jpeg"]

  let errorMsg = ""
  if (fitType.indexOf(extension) == -1) {
    errorMsg = "檔案:" + selectedFile.value.name + "不是支持的影像檔案"
  }
  if (selectedFile.value.size > 1024 * 1024 * 5) {
    errorMsg = "檔案:" + selectedFile.value.name + "不能超過5M唷"
  }

  if (errorMsg == "") {
    //上傳前確認檔案是否存在，存在就刪除
    if (uploadItem.value.picInfo && uploadItem.value.picInfo.picName && uploadItem.value.picInfo.picName != "lazypic.jpg") {
      await delExistPic(uploadItem.value.picInfo.picName)
    }
    console.log('selectedFile', selectedFile.value)
    //執行上傳圖片，接受狀態
    const rs = await onUpload(`personnel`) // 上傳圖片到personnel資料庫
    console.log('upload rs', rs)

    if (rs.state != 1) {
      proxy.$swal({
        icon: "error",
        title: "上傳失敗，請聯絡系統服務商"
      })
      return
    } else {
      //更新圖片名稱到資料庫
      uploadItem.value.picInfo =
      {
        picName: rs.newName,
        picOriginalName: selectedFile.value.name
      }

      const postData = {
        snkey: uploadItem.value.snkey,
        datalist: JSON.stringify(uploadItem.value),
      }
      api.post(usingDatabase.value, postData)

      //更新畫面
      items.value.some((item) => {
        if (item.snkey == uploadItem.value.snkey) {
          item.picName = rs.picName
        }
      })

      // 清空input，否則無法上傳同一張圖片
      fileInput.value.value = ""
    }
  } else {
    proxy.$swal({
      icon: "error",
      title: errorMsg
    })
    selectedFile.value = ""
  }
}

//上傳圖片或檔案都適用
const onUpload = (tablename) => {
  const fd = new FormData()
  fd.append("file", selectedFile.value)
  return api.upload(tablename, fd)
}

const delExistPic = async (picName) => {
  const url = `general/delPic/${usingDatabase.value}/${picName}`
  const rs = await api.options(url)
  console.log('delExistPic rs', rs)

  if (rs.state == 1) {
    store.showToastMulti({
      type: 'success',
      message: '舊圖片刪除成功',
      closeTime: 2,
    })
  } else {
    store.showToastMulti({
      type: 'error',
      message: '舊圖片刪除失敗',
      closeTime: 2,
    })
  }
}

// 生命週期鉤子
onMounted(async () => {
  auth.value = store.state.pData
  await getAllData()
  picBaseUrl.value = `${store.state.base_url}/upload/${usingDatabase.value}/`
})
</script>

<style scoped lang="scss">
.personnel-list {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.18), rgba(123, 163, 184, 0.1));
}

.personnel-hero {
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

.personnel-toolbar {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--daycare-divider-light);
  padding: 18px 24px;
  box-shadow: 0 8px 24px var(--daycare-shadow-light);
}

.personnel-table-card {
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
</style>