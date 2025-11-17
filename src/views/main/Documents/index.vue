<template>
  <div class="document-page" id="create">
    <NavbarDocument @reloadPage="reloadPage" />

    <v-container fluid class="document-wrapper py-6">
      <v-row>
        <v-col cols="12">
          <v-sheet class="document-hero" elevation="0" rounded="xl">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar size="48" color="primary" variant="tonal" class="mr-3">
                  <v-icon color="primary">mdi-file-document-edit</v-icon>
                </v-avatar>
                <div>
                  <h2 class="hero-title mb-1">文件與評估中心</h2>
                  <p class="hero-subtitle mb-0">
                    整合日照文件流程，快速存取、檢視與簽核長者照護紀錄。
                  </p>
                </div>
              </div>
              <div class="d-flex align-center gap-3">
                <v-chip class="hero-chip" prepend-icon="mdi-theme-light-dark" size="small" variant="outlined">
                  Daycare Style
                </v-chip>
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-autorenew" class="ml-2" @click="reloadPage">
                  重新整理內容
                </v-btn>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" dense>
        <v-col cols="12" md="4">
          <v-sheet class="document-summary" rounded="xl" elevation="2" color="primary-lighten-5">
            <v-icon color="primary" class="mb-2">mdi-account-heart</v-icon>
            <h3 class="summary-title">住民基本資訊</h3>
            <p class="summary-caption">
              目前檢視的住民資料，供表單簽核時快速參照。
            </p>
            <v-divider class="my-3" />
            <div class="summary-user">
              <div class="summary-user__row">
                <span class="label">姓名</span>
                <span class="value">{{ currentUser.name || '尚未選擇' }}</span>
              </div>
              <div class="summary-user__row">
                <span class="label">性別</span>
                <span class="value">{{ currentUser.sex || '未知' }}</span>
              </div>
              <div class="summary-user__row">
                <span class="label">年齡</span>
                <span class="value">{{ ageDisplay }}</span>
              </div>
            </div>
          </v-sheet>
        </v-col>
        <v-col cols="12" md="4">
          <v-sheet class="document-summary document-summary--photo" rounded="xl" elevation="2"
            color="primary-lighten-5">
            <v-icon color="primary" class="mb-2">mdi-camera-account</v-icon>
            <h3 class="summary-title">住民照片</h3>
            <!-- <p class="summary-caption">
              最新的住民照片預覽，便於核對身分與表單內容。
            </p> -->
            <v-divider class="my-3" />
            <div class="summary-photo">
              <v-avatar size="120" class="summary-photo__avatar" color="primary-lighten-4" variant="tonal"
                v-if="photoSrc">
                <v-img :src="photoSrc" :alt="currentUser.name || 'resident photo'" cover />
              </v-avatar>
              <v-avatar size="120" class="summary-photo__avatar" color="primary-lighten-4" variant="tonal" v-else>
                <v-icon color="primary" size="56">mdi-account-circle</v-icon>
              </v-avatar>
              <!-- <span class="summary-photo__hint" v-if="!photoSrc">尚未上傳照片</span> -->
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card class="document-content" rounded="xl" elevation="4">
            <v-card-text>
              <router-view v-slot="{ Component }">
                <v-fade-transition mode="out-in">
                  <component :is="Component" :key="routeKey" />
                </v-fade-transition>
              </router-view>
              <div v-if="loadingIndicator"
                class="d-flex flex-column align-center justify-center py-12 text-medium-emphasis">
                <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
                <span class="text-subtitle-2">更新文件內容中，請稍候...</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, getCurrentInstance, watch, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import NavbarDocument from './NavbarDocument.vue'


import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'
const store = useStore()

const routeKey = ref(0)
const loadingIndicator = ref(false)
const { proxy } = getCurrentInstance()
const currentUser = ref(store.state.uData ?? {})

const ageDisplay = computed(() => {
  const birthday = currentUser.value?.birthday
  if (!birthday || birthday === '0000-00-00') return '--'
  const years = dayjs().diff(dayjs(birthday), 'year')
  return `${years} 歲`
})

const baseUrl = computed(() => store.state.base_url || '')
const photoSrc = computed(() => {
  const picName = currentUser.value?.picInfo?.picName || currentUser.value?.pic_url
  if (!picName || picName === 'lazypic.jpg') return ''
  return `${baseUrl.value}/upload/user/${picName}`
})

// const fetchPersonnel = async () => {
//   const rs = await api.get('personnel')

//   const data = rs.map((item) => ({
//     ...JSON.parse(item.datalist),
//     snkey: item.snkey,
//   }))

//   proxy.$store.commit('setData', {
//     tableName: 'personnel',
//     data,
//   })
// }

const reloadPage = () => {
  loadingIndicator.value = true
  setTimeout(() => {
    routeKey.value += 1
    loadingIndicator.value = false
  }, 600)
}

const syncCurrentUser = () => {
  const cached = sessionStorage.getItem('uData')
  if (!cached) {
    currentUser.value = store.state.uData ?? {}
    return
  }
  try {
    const parsed = JSON.parse(cached)
    currentUser.value = parsed ?? store.state.uData ?? {}
  } catch (error) {
    currentUser.value = store.state.uData ?? {}
  }
}

onMounted(() => {
  syncCurrentUser()
  window.addEventListener('storage', syncCurrentUser)
  watch(
    () => store.state.uData,
    (val) => {
      if (val) {
        currentUser.value = val
      }
    },
    { deep: true }
  )
  // fetchPersonnel()
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', syncCurrentUser)
})
</script>

<style scoped lang="scss">
.document-page {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.18), rgba(123, 163, 184, 0.12));
}

.document-wrapper {
  padding: 0 100px;
  // max-width: 1320px;
  // max-width: 1320px;
  margin: 0 auto;
}

.document-hero {
  padding: 24px;
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 12px 32px rgba(74, 107, 95, 0.14);
  background: linear-gradient(135deg, rgba(74, 107, 95, 0.18), rgba(123, 163, 184, 0.2));
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

.document-summary {
  padding: 24px;
  text-align: left;
  border: 1px solid rgba(91, 143, 163, 0.16);
  box-shadow: 0 10px 26px rgba(74, 107, 95, 0.12);

  .summary-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--daycare-primary);
    margin-bottom: 6px;
  }

  .summary-caption {
    font-size: 0.9rem;
    color: rgba(74, 107, 95, 0.75);
    line-height: 1.5;
  }

  .summary-user {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
      color: var(--daycare-primary);

      .label {
        font-weight: 600;
        color: rgba(74, 107, 95, 0.8);
      }

      .value {
        font-weight: 700;
      }
    }
  }
}

.document-summary--photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &__avatar {
    box-shadow: 0 12px 32px rgba(74, 107, 95, 0.2);
  }

  &__hint {
    font-size: 0.85rem;
    color: rgba(74, 107, 95, 0.6);
  }
}

.document-content {
  border: 1px solid var(--daycare-divider-light);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 38px rgba(74, 107, 95, 0.16);
}
</style>