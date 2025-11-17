<template>
  <v-dialog v-model="dialog" fullscreen persistent>
    <v-card rounded="xl">
      <v-sheet :color="headerColor" class="d-flex align-center justify-space-between px-6 py-4" rounded="t-xl">
        <div class="d-flex align-center">
          <v-avatar size="48" color="white" variant="tonal" class="mr-4">
            <v-icon :color="headerIconColor" size="28">mdi-stethoscope</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold mb-1">{{ headerTitle }}</h2>
            <p class="text-body-2 mb-0">{{ headerSubtitle }}</p>
          </div>
        </div>
        <div class="d-flex align-center gap-2">
          <!-- <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-sync" @click="loadTemplates">
            更新範本
          </v-btn> -->
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </div>
      </v-sheet>

      <v-card-text class="px-6 py-5">
        <v-form ref="formRef">
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="record.date"
                type="date"
                label="評值日期"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
                :rules="requiredDateRules"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="record.stop_date"
                type="date"
                label="停止日期（選填）"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-remove"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-btn
                size="large"
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-cog-outline"
                class="w-100"
                @click="openTemplateManager"
              >
                管理護理計畫範本
              </v-btn>
            </v-col>
          </v-row>

          <v-row class="mb-6">
            <v-col cols="12" md="7">
              <v-select
                v-model="selectedExistingQuestion"
                :items="questionOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                label="已建立護理診斷（帶入最近一次內容）"
                prepend-inner-icon="mdi-history"
                hide-details
                @update:model-value="setQuestionFromExisting"
              />
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="questionKeyword"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-magnify"
                label="範本快搜（輸入關鍵字快速定位）"
                hide-details
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="7">
              <v-sheet class="nursingplan-add__form" rounded="lg" variant="outlined">
                <div class="nursingplan-add__fieldset">
                        <v-text-field
                    v-model="record.question"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-clipboard-text"
                          label="護理診斷"
                    :rules="requiredTextRules"
                    @update:model-value="handleQuestionInput"
                  />
                </div>

                <template v-if="hasSelectedDiagnosis">
                  <div class="nursingplan-add__fieldset">
                        <v-textarea
                      v-model="record.relevant"
                      variant="outlined"
                      auto-grow
                      rows="2"
                      prepend-inner-icon="mdi-source-branch"
                          label="可能導因"
                    />
                  </div>

                  <div class="nursingplan-add__fieldset">
                        <v-textarea
                      v-model="record.target"
                      variant="outlined"
                      auto-grow
                      rows="2"
                      prepend-inner-icon="mdi-bullseye-arrow"
                          label="護理目標"
                    />
                  </div>

                  <div class="nursingplan-add__fieldset">
                        <v-textarea
                      v-model="record.measures"
                      variant="outlined"
                      auto-grow
                      rows="2"
                      prepend-inner-icon="mdi-hospital-box-outline"
                          label="護理措施"
                    />
                  </div>

                  <div class="nursingplan-add__fieldset">
                        <v-textarea
                      v-model="record.plan"
                      variant="outlined"
                      auto-grow
                      rows="3"
                      prepend-inner-icon="mdi-text-box-check-outline"
                          label="評值說明"
                    />
                  </div>
                </template>

                <div v-else class="nursingplan-add__placeholder">
                  <v-icon size="36" color="primary" class="mb-2">mdi-bullhorn-outline</v-icon>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    請先選擇或輸入護理診斷後，再編輯關聯的計畫內容。
                  </p>
                </div>
              </v-sheet>
            </v-col>

            <v-col cols="12" md="5">
              <v-sheet class="nursingplan-add__library" rounded="lg" variant="outlined">
                <div class="library-section">
                  <div class="library-section__header">
                    <span class="title">護理診斷範本</span>
                    <v-chip size="small" variant="tonal" color="primary">{{ questionLibrary.length }}</v-chip>
                  </div>
                  <v-list lines="two" density="compact" class="library-section__list">
                    <v-list-item
                      v-for="item in filteredQuestionLibrary"
                      :key="item.snkey"
                      :active="item.unit === record.question"
                      color="primary"
                      @click="applyQuestionFromLibrary(item)"
                    >
                      <template #prepend>
                        <v-icon color="primary">mdi-star-circle</v-icon>
                      </template>
                      <v-list-item-title>{{ item.unit }}</v-list-item-title>
                      <v-list-item-subtitle>快速帶入護理診斷內容</v-list-item-subtitle>
                      </v-list-item>
                    <div
                      v-if="!questionLibrary.length"
                      class="text-body-2 text-medium-emphasis text-center py-4"
                    >
                      目前尚無護理診斷範本，可先透過「管理護理計畫範本」建立。
                    </div>
                  </v-list>
                </div>

                <v-divider class="my-4" />

                <div class="library-section">
                  <div class="library-section__header">
                    <span class="title">關聯範本</span>
                    <v-chip size="small" variant="tonal" color="teal">
                      {{ hasSelectedDiagnosis ? relatedTemplateCount : 0 }}
                    </v-chip>
                  </div>

                  <div v-if="hasSelectedDiagnosis">
                    <v-expansion-panels variant="accordion">
                      <v-expansion-panel>
                        <v-expansion-panel-title expand-icon="mdi-chevron-down" collapse-icon="mdi-chevron-up">
                          可能導因
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-list density="compact">
                            <v-list-item
                              v-for="item in relatedTemplates.relevant"
                              :key="item.snkey"
                              @click="appendTemplate('relevant', item.unit)"
                            >
                              <template #prepend>
                                <v-icon color="teal-darken-2">mdi-plus-circle</v-icon>
                              </template>
                              <v-list-item-title>{{ item.unit }}</v-list-item-title>
                      </v-list-item>
                            <div v-if="!relatedTemplates.relevant.length" class="library-empty">
                              尚未建立可能導因範本。
                            </div>
                  </v-list>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                      <v-expansion-panel>
                        <v-expansion-panel-title expand-icon="mdi-chevron-down" collapse-icon="mdi-chevron-up">
                          護理目標
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-list density="compact">
                            <v-list-item
                              v-for="item in relatedTemplates.target"
                              :key="item.snkey"
                              @click="appendTemplate('target', item.unit)"
                            >
                              <template #prepend>
                                <v-icon color="amber-darken-2">mdi-plus-circle</v-icon>
                              </template>
                              <v-list-item-title>{{ item.unit }}</v-list-item-title>
                      </v-list-item>
                            <div v-if="!relatedTemplates.target.length" class="library-empty">
                              尚未建立護理目標範本。
                            </div>
                  </v-list>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                      <v-expansion-panel>
                        <v-expansion-panel-title expand-icon="mdi-chevron-down" collapse-icon="mdi-chevron-up">
                          護理措施
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-list density="compact">
                            <v-list-item
                              v-for="item in relatedTemplates.measures"
                              :key="item.snkey"
                              @click="appendTemplate('measures', item.unit)"
                            >
                              <template #prepend>
                                <v-icon color="purple-darken-2">mdi-plus-circle</v-icon>
                              </template>
                              <v-list-item-title>{{ item.unit }}</v-list-item-title>
                      </v-list-item>
                            <div v-if="!relatedTemplates.measures.length" class="library-empty">
                              尚未建立護理措施範本。
                            </div>
                  </v-list>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                  <div v-else class="library-empty text-center py-6">
                    <v-icon size="32" color="primary" class="mb-2">mdi-format-list-bulleted-square</v-icon>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      請先於左側選擇護理診斷後，即可查看對應範本。
                    </p>
                  </div>
                </div>
              </v-sheet>
            </v-col>
          </v-row>
        </v-form>
        </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn variant="tonal" color="secondary" @click="closeDialog">
          取消
        </v-btn>
        <v-btn v-if="processType === 'add'" color="primary" variant="flat" :loading="loading" @click="handleAdd">
          確認新增
        </v-btn>
        <v-btn v-else color="primary" variant="flat" :loading="loading" @click="handleEdit">
          確認修改
        </v-btn>
        </v-card-actions>
      </v-card>

    <NursingrecordlistdataList
      ref="templateManagerRef"
      :items="templateItems"
      @refresh="loadTemplates"
    />
    </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch, getCurrentInstance, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'
import NursingrecordlistdataList from './NursingrecordlistdataList.vue'

const emit = defineEmits(['refresh'])

const props = defineProps({
  existingPlans: {
    type: Array,
    default: () => [],
  },
})

const store = useStore()
const { proxy } = getCurrentInstance()

const dialog = ref(false)
const processType = ref('add')
const loading = ref(false)
const formRef = ref(null)
const templateManagerRef = ref(null)
const templateItems = ref([])
const originalRecord = ref(null)
const selectedExistingQuestion = ref(null)
const questionKeyword = ref('')

const createDefaultRecord = () => ({
  snkey: '',
  u_snkey: '',
  date: dayjs().format('YYYY-MM-DD'),
  stop_date: '',
  question: '',
  relevant: '',
  target: '',
  measures: '',
  plan: '',
  createInfo: {},
  editInfo: [],
})

const record = reactive(createDefaultRecord())

const headerTitle = computed(() => (processType.value === 'add' ? '新增護理計畫' : '修改護理計畫'))
const headerSubtitle = computed(() =>
  processType.value === 'add'
    ? '請依據評估結果填寫護理計畫內容，支援跨團隊協同照護。'
    : '更新護理計畫資訊，確保照護記錄的一致性與完整性。'
)
const headerColor = computed(() => (processType.value === 'add' ? 'primary-lighten-5' : 'teal-lighten-5'))
const headerIconColor = computed(() => (processType.value === 'add' ? 'primary' : 'teal-darken-2'))

const requiredDateRules = [(v) => !!v || '請選擇評值日期']
const requiredTextRules = [(v) => !!v || '此欄位不可空白']

const questionOptions = computed(() => {
  const set = new Set()
  const options = []
  ;(props.existingPlans ?? []).forEach((plan) => {
    if (plan?.question && !set.has(plan.question)) {
      set.add(plan.question)
      options.push({
        label: plan.question,
        value: plan.question,
      })
    }
  })
  return options
})

const questionLibrary = computed(() =>
  (templateItems.value ?? []).filter((item) => item.state === 'question')
)

const sortTemplates = (list) => {
  if (!Array.isArray(list)) return []
  return [...list].sort((a, b) => {
    const [noA] = (a.unit || '').split('.')
    const [noB] = (b.unit || '').split('.')
    const intA = parseInt(noA, 10)
    const intB = parseInt(noB, 10)
    if (!Number.isNaN(intA) && !Number.isNaN(intB) && intA !== intB) {
      return intA - intB
    }
    return (a.unit || '').localeCompare(b.unit || '')
  })
}

const sortedQuestionLibrary = computed(() => sortTemplates(questionLibrary.value))

const filteredQuestionLibrary = computed(() => {
  if (!questionKeyword.value) return sortedQuestionLibrary.value
  return sortedQuestionLibrary.value.filter((item) =>
    item.unit.toUpperCase().includes(questionKeyword.value.toUpperCase())
  )
})

const selectedQuestionTemplate = computed(() => {
  if (!record.question) return null
  return questionLibrary.value.find((item) => item.unit === record.question) ?? null
})

const relatedTemplates = computed(() => {
  const current = selectedQuestionTemplate.value
  if (!current) {
    return {
      relevant: [],
      target: [],
      measures: [],
    }
  }

  const base = templateItems.value.filter((item) => item.p_snkey === current.snkey)
  return {
    relevant: base.filter((item) => item.state === 'relevant'),
    target: base.filter((item) => item.state === 'target'),
    measures: base.filter((item) => item.state === 'measures'),
  }
})

const relatedTemplateCount = computed(
  () =>
    relatedTemplates.value.relevant.length +
    relatedTemplates.value.target.length +
    relatedTemplates.value.measures.length
)

const hasSelectedDiagnosis = computed(() => Boolean(record.question && record.question.trim().length))

const resetRecord = () => {
  Object.assign(record, createDefaultRecord())
  selectedExistingQuestion.value = null
  questionKeyword.value = ''
  originalRecord.value = null
}

const normalizeStopDate = (date) => {
  if (!date || date === '0000-00-00' || date === '1970-01-01') return ''
  return date
}

const normalizeStopDateForSave = (date) => {
  if (!date) return '0000-00-00'
  return date
}

const closeDialog = () => {
  dialog.value = false
  loading.value = false
}

const openTemplateManager = () => {
  templateManagerRef.value?.open()
}

const loadTemplates = async () => {
  const response = await api.get('nursing_record_list_data')
  templateItems.value = Array.isArray(response) ? response : []
}

const setQuestionFromExisting = (value) => {
  if (!value) return
  const matched = [...(props.existingPlans ?? [])]
    .filter((plan) => plan.question === value)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  if (!matched.length) {
    record.question = value
    return
  }

  const latest = matched[0]
  record.question = latest.question ?? value
  record.relevant = latest.relevant ?? ''
  record.target = latest.target ?? ''
  record.measures = latest.measures ?? ''
  record.plan = latest.plan ?? ''
}

const applyQuestionFromLibrary = (item) => {
  if (!item) return
  record.question = item.unit
  selectedExistingQuestion.value = item.unit
  questionKeyword.value = ''
}

const appendTemplate = (field, value) => {
  if (!value) return
  if (!record[field]) {
    record[field] = value
    return
  }
  record[field] = `${record[field]}\n${value}`
}

const sanitizeRecordForSave = (mode = 'add') => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const payload = {
    ...record,
    u_snkey: store.state.uData?.snkey ?? '',
    stop_date: normalizeStopDateForSave(record.stop_date),
  }

  if (mode === 'add') {
    payload.createInfo = {
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: now
    }
  } else {
    payload.editInfo.unshift({
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: now
    })
  }

  return payload
}

const handleQuestionInput = (value) => {
  if (!value?.trim()) {
    record.relevant = ''
    record.target = ''
    record.measures = ''
    record.plan = ''
    selectedExistingQuestion.value = null
  }
}

const validateForm = async () => {
  const result = await formRef.value?.validate()
  return result?.valid ?? false
}

const handleAdd = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    proxy.$swal({ icon: 'warning', title: '資料輸入不完整，請檢查後再試。' })
    return
  }

  loading.value = true

  const payload = sanitizeRecordForSave('add')
  const response = await api.add('nursingplan', { datalist: JSON.stringify(payload) })

  loading.value = false

  if (response?.state == 1) {
    proxy.$swal({ icon: 'success', title: '新增成功' })
    closeDialog()
    emit('refresh')
  } else {
    proxy.$swal({ icon: 'error', title: '新增失敗，請稍後再試。' })
  }
}

const handleEdit = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    proxy.$swal({ icon: 'warning', title: '資料輸入不完整，請檢查後再試。' })
    return
  }

  loading.value = true

  const payload = sanitizeRecordForSave('edit')

  const response = await api.post('nursingplan', {
    snkey: record.snkey,
    datalist: JSON.stringify(payload),
    updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  })

  loading.value = false

  if (response?.state == 1) {
    proxy.$swal({ icon: 'success', title: '修改成功' })
    closeDialog()
    emit('refresh')
      } else {
    proxy.$swal({ icon: 'error', title: '修改失敗，請稍後再試。' })
  }
}

const openForAdd = async () => {
  resetRecord()
  processType.value = 'add'
  await loadTemplates()
  dialog.value = true
}

const openForEdit = async (plan) => {
  resetRecord()
  processType.value = 'edit'
  await loadTemplates()
  originalRecord.value = { ...plan }
  Object.assign(record, {
    ...plan,
    stop_date: normalizeStopDate(plan?.stop_date),
  })
  dialog.value = true
}

watch(
  () => record.question,
  (newVal) => {
    if (!newVal?.trim()) {
      selectedExistingQuestion.value = null
      return
    }
    const matched = questionLibrary.value.find((item) => item.unit === newVal)
    if (matched) {
      questionKeyword.value = ''
      selectedExistingQuestion.value = matched.unit
    }
  }
)

watch(hasSelectedDiagnosis, (val) => {
  if (!val) {
    record.relevant = ''
    record.target = ''
    record.measures = ''
    record.plan = ''
  }
})

defineExpose({
  openForAdd,
  openForEdit,
})

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped lang="scss">
.nursingplan-add__library {
  padding: 20px;
  background: rgba(248, 252, 250, 0.92);
  border: 1px solid rgba(91, 143, 163, 0.12);
  max-height: 540px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.library-section__list {
  max-height: 220px;
  overflow-y: auto;
}

.library-empty {
  color: rgba(53, 88, 80, 0.65);
}

.nursingplan-add__placeholder {
  padding: 48px 24px;
  border: 1px dashed rgba(91, 143, 163, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
</style>

