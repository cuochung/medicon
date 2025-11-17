<template>
  <v-dialog v-model="dialog">
    <v-card rounded="xl">
      <v-sheet class="px-6 py-4 d-flex align-center justify-space-between" color="primary-lighten-5" rounded="t-xl">
        <div class="d-flex align-center">
          <v-avatar size="44" color="primary" variant="tonal" class="mr-3">
            <v-icon color="primary">mdi-cog-outline</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-subtitle-1 font-weight-bold mb-1">護理計畫範本管理</h2>
            <p class="text-body-2 mb-0">調整護理診斷與相關範本，支援快速建置護理計畫。</p>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-sheet>

      <v-card-text class="px-6 py-5">
          <v-row>
            <v-col cols="12" md="3">
            <v-sheet class="template-panel" rounded="lg" variant="outlined">
              <div class="template-panel__header">
                <span class="title">護理診斷</span>
                <v-chip size="small" variant="tonal" color="primary">{{ questionList.length }}</v-chip>
              </div>
              <v-text-field
                v-model="form.question"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-plus"
                label="新增護理診斷"
                hide-details
              />
              <v-btn class="mt-2" color="primary" variant="flat" block @click="handleAddQuestion">
                新增診斷
              </v-btn>
              <v-divider class="my-4" />
                    <v-text-field
                v-model="questionSearch"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                label="搜尋診斷"
                hide-details
              />
              <v-list class="template-list mt-3" density="compact">
                      <v-list-item
                  v-for="item in filteredQuestions"
                        :key="item.snkey"
                  :active="item.snkey === selectedQuestionSnkey"
                  color="primary"
                  @click="selectedQuestionSnkey = item.snkey"
                >
                  <v-list-item-title>{{ item.unit }}</v-list-item-title>
                  <template #append>
                    <v-btn
                      icon="mdi-delete-outline"
                      color="error"
                      variant="text"
                      @click.stop="handleDeleteQuestion(item)"
                    />
                  </template>
                      </v-list-item>
                  </v-list>
            </v-sheet>
            </v-col>

            <v-col cols="12" md="3">
            <v-sheet class="template-panel" rounded="lg" variant="outlined">
              <div class="template-panel__header">
                <span class="title">可能導因</span>
                <v-chip size="small" variant="tonal" color="teal">{{ relevantList.length }}</v-chip>
              </div>
                    <v-text-field
                v-model="form.relevant"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-plus"
                label="新增可能導因"
                hide-details
              />
              <v-btn class="mt-2" color="teal" variant="flat" block @click="handleAddDetail('relevant')">
                新增內容
              </v-btn>
              <v-divider class="my-4" />
              <v-list class="template-list" density="compact">
                <v-list-item v-for="item in relevantList" :key="item.snkey">
                  <v-list-item-title>{{ item.unit }}</v-list-item-title>
                  <template #append>
                    <v-btn icon="mdi-delete-outline" color="error" variant="text" @click="handleDeleteDetail(item)" />
                  </template>
                      </v-list-item>
                <div v-if="!relevantList.length" class="text-body-2 text-medium-emphasis text-center py-4">
                  尚無內容，請先新增。
                </div>
                  </v-list>
            </v-sheet>
            </v-col>

            <v-col cols="12" md="3">
            <v-sheet class="template-panel" rounded="lg" variant="outlined">
              <div class="template-panel__header">
                <span class="title">護理目標</span>
                <v-chip size="small" variant="tonal" color="amber">{{ targetList.length }}</v-chip>
              </div>
                    <v-text-field
                v-model="form.target"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-plus"
                label="新增護理目標"
                hide-details
              />
              <v-btn class="mt-2" color="amber" variant="flat" block @click="handleAddDetail('target')">
                新增內容
              </v-btn>
              <v-divider class="my-4" />
              <v-list class="template-list" density="compact">
                <v-list-item v-for="item in targetList" :key="item.snkey">
                  <v-list-item-title>{{ item.unit }}</v-list-item-title>
                  <template #append>
                    <v-btn icon="mdi-delete-outline" color="error" variant="text" @click="handleDeleteDetail(item)" />
                  </template>
                      </v-list-item>
                <div v-if="!targetList.length" class="text-body-2 text-medium-emphasis text-center py-4">
                  尚無內容，請先新增。
                </div>
                  </v-list>
            </v-sheet>
            </v-col>

            <v-col cols="12" md="3">
            <v-sheet class="template-panel" rounded="lg" variant="outlined">
              <div class="template-panel__header">
                <span class="title">護理措施</span>
                <v-chip size="small" variant="tonal" color="purple">{{ measuresList.length }}</v-chip>
              </div>
                    <v-text-field
                v-model="form.measures"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-plus"
                label="新增護理措施"
                hide-details
              />
              <v-btn class="mt-2" color="purple" variant="flat" block @click="handleAddDetail('measures')">
                新增內容
              </v-btn>
              <v-divider class="my-4" />
              <v-list class="template-list" density="compact">
                <v-list-item v-for="item in measuresList" :key="item.snkey">
                  <v-list-item-title>{{ item.unit }}</v-list-item-title>
                  <template #append>
                    <v-btn icon="mdi-delete-outline" color="error" variant="text" @click="handleDeleteDetail(item)" />
                  </template>
                      </v-list-item>
                <div v-if="!measuresList.length" class="text-body-2 text-medium-emphasis text-center py-4">
                  尚無內容，請先新增。
                </div>
                  </v-list>
            </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, getCurrentInstance } from 'vue'
import dayjs from 'dayjs'
import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['refresh'])

const store = useStore()
const { proxy } = getCurrentInstance()

const dialog = ref(false)
const selectedQuestionSnkey = ref(null)
const questionSearch = ref('')

const form = reactive({
  question: '',
  relevant: '',
  target: '',
  measures: '',
})

const questionList = computed(() => (props.items ?? []).filter((item) => item.state === 'question'))

const filteredQuestions = computed(() => {
  if (!questionSearch.value) return questionList.value
  return questionList.value.filter((item) =>
    item.unit.toUpperCase().includes(questionSearch.value.toUpperCase())
  )
})

const selectedQuestion = computed(() => {
  if (!selectedQuestionSnkey.value) return null
  return questionList.value.find((item) => item.snkey === selectedQuestionSnkey.value) ?? null
})

const filterByState = (state) =>
  (props.items ?? []).filter((item) => item.state === state && item.p_snkey === selectedQuestionSnkey.value)

const relevantList = computed(() => filterByState('relevant'))
const targetList = computed(() => filterByState('target'))
const measuresList = computed(() => filterByState('measures'))

const ensureQuestionSelected = () => {
  if (selectedQuestion.value) return true
  proxy.$swal({ icon: 'warning', title: '請先選擇護理診斷範本。' })
  return false
}

const resetDetailInput = (state) => {
  form[state] = ''
}

const handleAddQuestion = async () => {
  if (!form.question.trim()) {
    proxy.$swal({ icon: 'warning', title: '請輸入護理診斷內容。' })
    return
  }

  const payload = {
    unit: form.question.trim(),
    p_snkey: 0,
    state: 'question',
    create_man: `${store.state.pData?.username ?? ''} (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`,
  }

  const rs = await api.add('nursing_record_list_data', payload)
  if (rs?.state == 1) {
    proxy.$swal({ icon: 'success', title: '護理診斷已新增' })
    form.question = ''
    emit('refresh')
  } else {
    proxy.$swal({ icon: 'error', title: '新增失敗，請稍後再試。' })
  }
}

const handleAddDetail = async (state) => {
  if (!ensureQuestionSelected()) return
  if (!form[state].trim()) {
    proxy.$swal({ icon: 'warning', title: '請先輸入內容後再新增。' })
    return
  }

  const payload = {
    unit: form[state].trim(),
    p_snkey: selectedQuestionSnkey.value,
    state,
    create_man: `${store.state.pData?.username ?? ''} (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`,
  }

  const rs = await api.add('nursing_record_list_data', payload)
  if (rs?.state == 1) {
    proxy.$swal({ icon: 'success', title: '範本內容已新增' })
    resetDetailInput(state)
    emit('refresh')
        } else {
    proxy.$swal({ icon: 'error', title: '新增失敗，請稍後再試。' })
  }
}

const handleDeleteQuestion = async (item) => {
  console.log('handleDeleteQuestion item', item)
  

  proxy.$swal({
    title: '確認要刪除這筆護理診斷範本嗎？',
    text: '相關的導因、目標、措施都會一起刪除。',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then(async (result) => {
    if (!result.isConfirmed) return

    let matchItems = await api.options(`general/getByKey/${store.state.databaseName}/nursing_record_list_data`, {
      key: 'p_snkey',
      value: item.snkey,
    })

    matchItems.push({...item});
    console.log('matchItems', matchItems)
    
    let postData = [];
    matchItems.forEach((i) => {
      i.delman = `${store.state.pData.username}(${dayjs().format("YYYY-MM-DD HH:mm:ss")})`;
      postData.push({
        snkey: i.snkey,
        tablename: "nursing_record_list_data",
        datalist: JSON.stringify(i),
      });
    });

    let rs = await api.options(`general/delMultiv3/${store.state.databaseName}/nursing_record_list_data`, postData)
    console.log('rs', rs)
    let isAllTrue = rs.every(i => i.del_state === true);

    if (isAllTrue) {
      proxy.$swal({ icon: 'success', title: '護理診斷已刪除' })
      if (selectedQuestionSnkey.value === item.snkey) {
        selectedQuestionSnkey.value = null
      }
      emit('refresh')
    } else {
      proxy.$swal({ icon: 'error', title: '刪除失敗，請稍後再試。' })
    }
    
  })
}

const handleDeleteDetail = (item) => {
  proxy.$swal({
    title: '確認要刪除這筆範本內容嗎？',
    text: '此操作無法復原，請再次確認。',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  }).then(async (result) => {
    if (!result.isConfirmed) return

    const payload = {
      snkey: item.snkey,
      tablename: 'nursing_record_list_data',
      datalist: JSON.stringify({
        ...item,
        delman: `${store.state.pData?.username ?? ''} (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`,
      }),
    }

    const rs = await api.delete('nursing_record_list_data', payload)
    if (rs?.state == 1) {
      proxy.$swal({ icon: 'success', title: '範本內容已刪除' })
      emit('refresh')
    } else {
      proxy.$swal({ icon: 'error', title: '刪除失敗，請稍後再試。' })
    }
  })
}

const open = () => {
  if (!questionList.value.length) {
    selectedQuestionSnkey.value = null
  } else {
    selectedQuestionSnkey.value = questionList.value[0].snkey
  }
  questionSearch.value = ''
  form.question = ''
  form.relevant = ''
  form.target = ''
  form.measures = ''
  dialog.value = true
}

defineExpose({
  open,
})
</script>

<style scoped lang="scss">
.template-panel {
  padding: 18px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(91, 143, 163, 0.12);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .title {
      font-weight: 600;
      color: rgba(53, 88, 80, 0.85);
    }
  }
}

.template-list {
  flex: 1 1 auto;
  max-height: 320px;
  overflow-y: auto;
}
</style>