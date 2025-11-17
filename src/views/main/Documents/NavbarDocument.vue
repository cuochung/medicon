<template>
  <div class="document-navbar">
    <v-fab-transition>
      <div v-if="toolbarVisible" class="document-actions" id="selectBtn">
        <v-tooltip :text="actionsExpanded ? '收合快捷操作' : '展開快捷操作'" location="top">
          <template #activator="{ props }">
            <v-btn v-bind="props" color="primary" variant="flat" size="large"
              :icon="actionsExpanded ? 'mdi-close' : 'mdi-dots-grid'" class="document-actions__toggle"
              :class="{ 'document-actions__toggle--active': actionsExpanded }" @click.stop="toggleActions" />
          </template>
        </v-tooltip>

        <v-expand-transition>
          <div v-if="actionsExpanded" class="document-actions__group">
            <v-tooltip text="回病歷管理" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" color="primary" variant="flat" size="large" icon="mdi-arrow-left-circle"
                  @click.stop="handleGoUserList" />
              </template>
            </v-tooltip>

            <v-tooltip text="病歷選擇" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" color="primary" variant="flat" size="large" icon="mdi-format-list-bulleted"
                  @click.stop="handleToggleDrawerLeft" />
              </template>
            </v-tooltip>

            <v-tooltip text="病歷內容" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" color="primary" variant="flat" size="large" icon="mdi-badge-account-horizontal"
                  @click.stop="handleShowUser" />
              </template>
            </v-tooltip>

            <v-tooltip text="表單選擇" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" color="primary" variant="flat" size="large" icon="mdi-grid-large"
                  @click.stop="handleOpenSheet" />
              </template>
            </v-tooltip>
          </div>
        </v-expand-transition>
      </div>
    </v-fab-transition>

    <v-bottom-sheet v-model="sheetOpen" inset>
      <v-sheet class="sheet-content" rounded="xl">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center">
            <v-avatar size="36" color="primary" variant="tonal" class="mr-3">
              <v-icon color="primary">mdi-clipboard-text</v-icon>
            </v-avatar>
            <div>
              <h3 class="sheet-title mb-1">照護表單快速選單</h3>
              <p class="sheet-caption mb-0">依資料類型整理常用日照文件與衛福部表單</p>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="primary" @click="sheetOpen = false" />
        </div>

        <v-divider class="mb-4" />

        <section class="sheet-section">
          <header class="sheet-section__header">
            <span class="text-subtitle-2 font-weight-medium text-primary">一般照護文件</span>
            <v-chip color="primary" size="small" variant="flat">{{ documentButtons.length }}</v-chip>
          </header>
          <v-row dense>
            <v-col v-for="item in documentButtons" :key="item.route" cols="12" sm="6" md="4">
              <v-btn block rounded="lg" :color="item.color" variant="flat" class="document-sheet-btn"
                @click="handleNavigate(item.route)">
                <v-icon class="mr-2">{{ item.icon }}</v-icon>
                <span>{{ item.title }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </section>

        <section v-if="mohwButtons.length" class="sheet-section mt-6">
          <header class="sheet-section__header">
            <span class="text-subtitle-2 font-weight-medium text-primary">衛福部全人評估</span>
            <v-chip color="secondary" size="small" variant="flat">{{ mohwButtons.length }}</v-chip>
          </header>
          <v-row dense>
            <v-col v-for="item in mohwButtons" :key="item.route" cols="12" sm="6" md="4">
              <v-btn block rounded="lg" :color="item.color" variant="flat" class="document-sheet-btn"
                @click="handleNavigate(item.route)">
                <v-icon class="mr-2">{{ item.icon }}</v-icon>
                <span>{{ item.title }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </section>

        <section v-if="evaluationButtons.length" class="sheet-section mt-6">
          <header class="sheet-section__header">
            <span class="text-subtitle-2 font-weight-medium text-primary">評估指標紀錄</span>
            <v-chip color="info" size="small" variant="flat">{{ evaluationButtons.length }}</v-chip>
          </header>
          <v-row dense>
            <v-col v-for="item in evaluationButtons" :key="item.route" cols="12" sm="6" md="4">
              <v-btn block rounded="lg" :color="item.color" variant="flat" class="document-sheet-btn"
                @click="handleNavigate(item.route)">
                <v-icon class="mr-2">{{ item.icon }}</v-icon>
                <span>{{ item.title }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </section>
      </v-sheet>
    </v-bottom-sheet>

    <v-navigation-drawer v-model="drawerLeft" location="left" temporary width="360" class="document-drawer">
      <v-toolbar color="transparent" flat class="px-4 pt-4">
        <v-toolbar-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-account-multiple</v-icon>
          <span class="font-weight-medium text-primary">病歷選擇</span>
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="drawerLeft = false" />
      </v-toolbar>
      <v-divider />

      <v-card flat class="drawer-card">
        <v-card-text>
          <v-text-field v-model="searchKey" label="搜尋關鍵字" variant="outlined" density="comfortable"
            prepend-inner-icon="mdi-magnify" hide-details />
        </v-card-text>
        <v-divider />
        <div class="drawer-list-wrapper">
          <v-list v-if="filteredUsers.length" v-model:selected="selectedSnkey" select-strategy="single" lines="two"
            class="drawer-list">
            <v-list-item v-for="item in filteredUsers" :key="item.snkey" :value="item.snkey"
              @click="handleSelectUser(item)">
              <template #prepend>
                <v-avatar color="primary-lighten-5" size="40">
                  <v-icon color="primary">mdi-account</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium text-blue-lighten-4">
                {{ item.name || '未命名' }} 病歷號：{{ item.p_code || '--' }}
                <!-- ・床號 {{ item.bed_name ?? '--' }} -->
              </v-list-item-title>
              <!-- <v-list-item-subtitle class="text-white">
                病歷號：{{ item.p_code || '--' }}
              </v-list-item-subtitle> -->
            </v-list-item>
          </v-list>
          <div v-else class="drawer-empty">
            <v-icon color="primary" size="40" class="mb-3">mdi-database-search</v-icon>
            <p class="mb-0 text-medium-emphasis text-body-2">查無符合的住民資料</p>
          </div>
        </div>
      </v-card>
    </v-navigation-drawer>

    <UserAddDialog ref="userDialogRef" @getAllData="fetchAllUsers" :isHidden="true" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/useStore'
import api from '@/assets/js/api.js'
import UserAddDialog from '@/views/main/User/Add.vue'

const emit = defineEmits(['reloadPage'])

const router = useRouter()
const store = useStore()

const toolbarVisible = ref(false)
const sheetOpen = ref(false)
const drawerLeft = ref(false)
const userItems = ref([])
const userDialogRef = ref(null)
const searchKey = ref('')
const selectedSnkey = ref(null)
const actionsExpanded = ref(false)

const toggleActions = () => {
  actionsExpanded.value = !actionsExpanded.value
}

const collapseActions = () => {
  actionsExpanded.value = false
}

const isPharmacist = computed(() => {
  const key = store.state.pData?.pharmacist_key
  return key === true || key === 'true'
})

const keywordTokens = computed(() =>
  searchKey.value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.toUpperCase())
)

const filteredUsers = computed(() => {
  if (!keywordTokens.value.length) {
    return userItems.value
  }
  return userItems.value.filter((item) => {
    const str = JSON.stringify(item).toUpperCase()
    return keywordTokens.value.every((key) => str.includes(key))
  })
})

const documentItems = [
  { title: '就醫及藥品紀錄維護', route: '/main/Documents/medicinerecordlist', color: 'primary', authKey: 'pass', visable: true, icon: 'mdi-pill' },
  { title: '生命徵象紀錄單', route: '/main/Documents/Signlife', color: 'primary', authKey: 'pass', visable: true, icon: 'mdi-heart-pulse' },
  { title: '住民定期評估表', route: '/main/Documents/recordlist', color: 'primary', authKey: 'pass', visable: false, icon: 'mdi-calendar-clock' },
  { title: '柯氏/巴氏(ADL)量表', route: '/main/Documents/kblist', color: 'primary', authKey: 'pass', visable: false, icon: 'mdi-walk' },
  { title: '跌倒危險因子評估表', route: '/main/Documents/falllist', color: 'primary', authKey: 'pass', visable: false, icon: 'mdi-alert-decagram' },
  { title: 'Braden壓力性損傷風險評估表', route: '/main/Documents/bradenlist', color: 'primary', authKey: 'pass', visable: false, icon: 'mdi-bandage' },
  { title: '護理計畫單', route: '/main/Documents/Nursingplan', color: 'primary', authKey: 'pass', visable: true, icon: 'mdi-stethoscope' },
  // { title: '入院護理評估', route: '/main/Documents/nursingassessment', color: 'primary', authKey: 'pass', visable: true, icon: 'mdi-nurse' },
  { title: '護理紀錄', route: '/main/Documents/Nursingrecord', color: 'primary', authKey: 'pharmacist', visable: true, icon: 'mdi-notebook-edit' },
  { title: '計價單', route: '/main/Documents/PriceList', color: 'primary', authKey: 'pass', visable: true, icon: 'mdi-cash-register' },
  { title: '管路使用紀錄', route: '/main/Documents/Pipeline', color: 'primary', authKey: 'pass', visable: true, icon: 'mdi-needle' },
  { title: '檢驗報告單', route: '/main/Documents/inspectionreportlist', color: 'primary', authKey: 'pass', visable: true, icon: 'mdi-flask' },
  { title: '簡易心智狀態 SPMSQ', route: '/main/Documents/spmsqlist', color: 'warning', authKey: 'pass', visable: true, icon: 'mdi-brain' },
  { title: '72 小時適應評估紀錄表', route: '/main/Documents/hour72', color: 'warning', authKey: 'pass', visable: true, icon: 'mdi-clock-outline' },
  { title: '社會心理認知功能評估表', route: '/main/Documents/sociopsychologicallist', color: 'warning', authKey: 'pass', visable: true, icon: 'mdi-account-group' },
  { title: '個案服務紀錄表', route: '/main/Documents/servicerecordlist', color: 'warning', authKey: 'pass', visable: true, icon: 'mdi-file-document-edit-outline' },
  { title: '憂鬱量表 (GDS)', route: '/main/Documents/melancholylist', color: 'warning', authKey: 'pass', visable: false, icon: 'mdi-emoticon-sad' },
  { title: '適應性評估表', route: '/main/Documents/adaptabilitylist', color: 'warning', authKey: 'pass', visable: true, icon: 'mdi-account-switch' },
  { title: '個案服務處遇計畫表', route: '/main/Documents/treatmentlist', color: 'warning', authKey: 'pass', visable: true, icon: 'mdi-file-cog' },
  { title: '復健評估表', route: '/main/Documents/rehabilitationlist', color: 'success', authKey: 'pass', visable: true, icon: 'mdi-wheelchair' },
  { title: '72 小時營養篩檢表', route: '/main/Documents/hour72nutrition', color: 'pink', authKey: 'pass', visable: true, icon: 'mdi-food-apple' },
  { title: '營養評估單', route: '/main/Documents/nutritionlist', color: 'pink', authKey: 'pass', visable: true, icon: 'mdi-food-variant' },
  { title: '轉介照會單', route: '/main/Documents/consultationlist', color: 'pink', authKey: 'pass', visable: true, icon: 'mdi-account-arrow-right' },
  { title: '72 小時藥師評估表', route: '/main/Documents/pharmacistevaluationlist', color: 'grey', authKey: 'pharmacist', visable: true, icon: 'mdi-clipboard-list' },
  { title: '用藥評估紀錄表', route: '/main/Documents/medicationevaluationlist', color: 'grey', authKey: 'pharmacist', visable: true, icon: 'mdi-prescription' },
]

const mohwItems = [
  { title: '健康習慣', route: '/main/Documents/HealthyHabits', color: 'primary', authKey: 'pass', icon: 'mdi-run-fast' },
  { title: '疾病史', route: '/main/Documents/MedicalHistories', color: 'primary', authKey: 'pass', icon: 'mdi-medical-bag' },
  { title: '藥物安全性評估', route: '/main/Documents/DrugSafeties', color: 'primary', authKey: 'pass', icon: 'mdi-shield-check' },
  { title: '身體評估', route: '/main/Documents/BodyEvaluations', color: 'primary', authKey: 'pass', icon: 'mdi-human' },
  { title: '壓力性損傷危險評估', route: '/main/Documents/PressureInjuries', color: 'primary', authKey: 'pass', icon: 'mdi-bandage' },
  { title: '跌倒危險性評估', route: '/main/Documents/FallRisks', color: 'primary', authKey: 'pass', icon: 'mdi-alert-decagram' },
  { title: '日常生活功能評估', route: '/main/Documents/ADLs', color: 'primary', authKey: 'pass', icon: 'mdi-hand-back-right' },
  { title: '工具性日常生活活動評估', route: '/main/Documents/IADLs', color: 'primary', authKey: 'pass', icon: 'mdi-tools' },
  { title: '認知功能評估', route: '/main/Documents/Dementias', color: 'primary', authKey: 'pass', icon: 'mdi-brain' },
  { title: '簡式健康量表評估', route: '/main/Documents/BSRS5s', color: 'primary', authKey: 'pass', icon: 'mdi-chart-bubble' },
  { title: '情緒問題評估', route: '/main/Documents/GeriatricDepressionScales', color: 'primary', authKey: 'pass', icon: 'mdi-emoticon-sad' },
  { title: '簡易營養評估', route: '/main/Documents/MNASFs', color: 'primary', authKey: 'pass', icon: 'mdi-food' },
  { title: '疼痛評估', route: '/main/Documents/PainEvaluations', color: 'primary', authKey: 'pass', icon: 'mdi-head-flash' },
  { title: '衰弱評估', route: '/main/Documents/SOFs', color: 'primary', authKey: 'pass', icon: 'mdi-account-alert' },
  { title: '需求摘要與照護計畫', route: '/main/Documents/CaseSummaryPlan', color: 'success', authKey: 'pass', icon: 'mdi-file-tree' },
  { title: '照護紀錄', route: '/main/Documents/CareRecord', color: 'success', authKey: 'pass', icon: 'mdi-file-document' },
]

const evaluationMetricItems = [
  { title: '跌倒事件分析登記表', route: '/main/Documents/FallEvent', color: 'info', authKey: 'pass', icon: 'mdi-alert' },
  { title: '壓力性損傷登記表', route: '/main/Documents/PressureEvent', color: 'info', authKey: 'pass', icon: 'mdi-bandage' },
  { title: '感染登記表', route: '/main/Documents/InfectionEvent', color: 'info', authKey: 'pass', icon: 'mdi-virus' },
  { title: '約束登記表', route: '/main/Documents/ConstraintEvent', color: 'info', authKey: 'pass', icon: 'mdi-lock' },
  { title: '非計畫性轉急性住院登記表', route: '/main/Documents/UnplannedEvent', color: 'info', authKey: 'pass', icon: 'mdi-hospital' },
]

const documentButtons = computed(() => {
  const visible = documentItems.filter((item) => item.visable !== false)
  return isPharmacist.value ? visible.filter((item) => item.authKey === 'pharmacist') : visible
})

const mohwButtons = computed(() => (isPharmacist.value ? [] : mohwItems))
const evaluationButtons = computed(() => (isPharmacist.value ? [] : evaluationMetricItems))

const fetchAllUsers = async () => {
  const response = await api.get(`user`)
  userItems.value = response
    .map((item) => ({
      ...JSON.parse(item.datalist),
      snkey: item.snkey,
    }))
    .sort((a, b) => {
      const valA = a.bed_name
      const valB = b.bed_name
      if (valA === valB) return 0
      if (valA === null) return 1
      if (valB === null) return -1
      return valA > valB ? 1 : -1
    })
}

const getSessionUser = () => {
  const cached = sessionStorage.getItem('uData')
  if (!cached) return
  try {
    const parsed = JSON.parse(cached)
    store.state.uData = parsed
    selectedSnkey.value = parsed?.snkey ?? null
  } catch (error) {
    console.warn('Failed to parse cached uData', error)
  }
}

const handleSelectUser = (item) => {
  selectedSnkey.value = item.snkey
  sessionStorage.setItem('uData', JSON.stringify(item))
  store.state.uData = item
  emit('reloadPage')
  drawerLeft.value = false
}

const showUser = () => {
  if (!store.state.uData) {
    store.showToastMulti({
      type: 'warning',
      message: '請先選擇要檢視的住民病歷',
      closeTime: 2,
    })
    return
  }
  userDialogRef.value?.editProcess(store.state.uData)
}

const goUserList = () => {
  router.push({ name: 'User' })
}

const toggleDrawerLeft = () => {
  drawerLeft.value = !drawerLeft.value
}

const handleGoUserList = () => {
  collapseActions()
  goUserList()
}

const handleToggleDrawerLeft = () => {
  collapseActions()
  toggleDrawerLeft()
}

const handleShowUser = () => {
  collapseActions()
  showUser()
}

const handleOpenSheet = () => {
  collapseActions()
  sheetOpen.value = true
}

const handleNavigate = (route) => {
  console.log('handleNavigate route', route)
  if (route.startsWith('/main/Documentss/')) {
    handleOpenSheet()
  } else {
    router.push(route)
  }
  sheetOpen.value = false
}

watch(
  () => store.state.uData,
  (val) => {
    if (val?.snkey) {
      selectedSnkey.value = val.snkey
    }
  },
  { immediate: true },
)

watch(toolbarVisible, (visible) => {
  if (!visible) {
    collapseActions()
  }
})

watch(filteredUsers, (list) => {
  if (!list.length) {
    return
  }
  if (!list.some((item) => item.snkey === selectedSnkey.value)) {
    selectedSnkey.value = list[0].snkey
  }
})

onMounted(async () => {
  getSessionUser()
  await fetchAllUsers()
  setTimeout(() => {
    toolbarVisible.value = true
  }, 400)
})
</script>

<style scoped lang="scss">
.document-navbar {
  position: relative;
}

.document-actions {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.document-actions__toggle,
.document-actions__group .v-btn {
  box-shadow: 0 10px 24px rgba(74, 107, 95, 0.22);
  border-radius: 50%;
}

.document-actions__group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.document-actions__toggle {
  transition: transform 0.2s ease;
}

.document-actions__toggle--active {
  transform: rotate(90deg);
}

.sheet-content {
  padding: 28px;
  border-radius: 28px;
  box-shadow: 0 18px 46px rgba(74, 107, 95, 0.18);
}

.sheet-title {
  font-weight: 700;
  color: var(--daycare-primary);
}

.sheet-caption {
  font-size: 0.9rem;
  color: rgba(74, 107, 95, 0.7);
}

.sheet-section+.sheet-section {
  margin-top: 16px;
}

.sheet-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.document-sheet-btn {
  justify-content: flex-start;
  padding: 18px 20px;
  color: white !important;
  box-shadow: 0 10px 26px rgba(74, 107, 95, 0.18);
  text-transform: none;
  font-weight: 600;
}

.document-sheet-btn .v-icon {
  font-size: 18px;
}

.document-drawer {
  background: linear-gradient(135deg, rgba(168, 197, 181, 1), rgba(0, 0, 0, 1));
  border-right: 1px solid var(--daycare-divider-light);
}

.drawer-card {
  background: transparent;
  box-shadow: none;
}

.drawer-list-wrapper {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.drawer-list {
  padding: 0 16px 16px;
}

.drawer-empty {
  padding: 48px 16px;
  text-align: center;
}

@media (max-width: 600px) {
  .document-actions {
    left: 12px;
    bottom: 12px;
    flex-direction: row;
    align-items: center;
  }

  .document-actions__group {
    flex-direction: row;
    margin-top: 0;
    margin-left: 12px;
  }

  .document-sheet-btn {
    padding: 16px;
  }
}
</style>