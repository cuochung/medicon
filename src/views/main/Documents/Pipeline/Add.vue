<template>
  <v-dialog v-model="dialog">
    <v-card rounded="xl" class="pipeline-add">
      <v-sheet
        class="pipeline-add__header px-6 py-4"
        :color="headerColor"
        variant="tonal"
        rounded="t-xl"
      >
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" color="white" variant="tonal" class="mr-4">
              <v-icon color="white" size="26">mdi-pipe-wrench</v-icon>
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-bold mb-1">{{ headerTitle }}</h2>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ headerSubtitle }}
              </p>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </div>
      </v-sheet>

      <v-card-text class="px-6 py-5">
        <v-form ref="formRef">
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="form.name"
                :items="pipelineItems"
                label="使用管路"
                variant="outlined"
                :rules="[rules.required]"
                density="comfortable"
                prepend-inner-icon="mdi-pipe"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="form.unit"
                label="單位(Fr)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-ruler"
                hint="例如：16、18、20"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="form.start_date"
                type="date"
                label="開始日期"
                variant="outlined"
                :rules="[rules.required]"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-start"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="form.end_date"
                type="date"
                label="結束日期（選填）"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-end"
                hint="留空表示目前仍在使用中"
                persistent-hint
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.note"
                label="備註"
                variant="outlined"
                auto-grow
                rows="3"
                prepend-inner-icon="mdi-note-edit"
                hint="可記錄更換原因、注意事項等資訊"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeDialog" :disabled="loading">
          取消
        </v-btn>
        <v-btn
          v-if="isAddMode"
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save"
          :loading="loading"
          :disabled="loading"
          @click="handleAdd"
        >
          確認新增
        </v-btn>
        <v-btn
          v-else
          color="success"
          variant="flat"
          prepend-icon="mdi-content-save"
          :loading="loading"
          :disabled="loading"
          @click="handleEdit"
        >
          確認修改
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, getCurrentInstance, reactive, ref } from 'vue'

import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'

const emit = defineEmits(['refresh'])

const store = useStore()
const { proxy } = getCurrentInstance()

const dialog = ref(false)
const formRef = ref(null)
const loading = ref(false)

const processType = ref('add')
const form = reactive(defaultForm())

const pipelineItems = [
  '一般鼻胃管',
  '矽質鼻胃管',
  '一般尿管',
  '矽質尿管',
  '三叉導尿管',
  '氣切',
  '胃造口',
  '腸造口',
  'Pig-tail',
  'PTGBD',
  '膀胱造瘻管',
  '雙腔導管',
  '胸管',
  'PCN',
]

const rules = {
  required: (value) => !!value || '不可空白',
}

const isAddMode = computed(() => processType.value === 'add')

const headerTitle = computed(() => (isAddMode.value ? '新增管路使用紀錄' : '修改管路使用紀錄'))
const headerSubtitle = computed(() =>
  isAddMode.value
    ? '記錄住民使用的管路類型、期間與相關資訊。'
    : '更新管路使用紀錄，保留完整照護歷程。'
)
const headerColor = computed(() => (isAddMode.value ? 'primary' : 'success'))

function defaultForm() {
  return {
    snkey: '',
    name: '',
    unit: '',
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: '',
    note: '',
  }
}

const resetForm = () => {
  Object.assign(form, defaultForm())
}

const closeDialog = () => {
  if (loading.value) return
  dialog.value = false
}

const validateForm = async () => {
  const result = await formRef.value?.validate()
  return result?.valid ?? false
}

const handleAdd = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    store.showToastMulti({
      type: 'warning',
      message: '資料輸入不完整，請檢查後再試',
      closeTime: 2,
    })
    return
  }

  loading.value = true
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const payload = {
    datalist: JSON.stringify({
      u_snkey: store.state?.uData?.snkey,
      name: form.name,
      unit: form.unit,
      start_date: form.start_date,
      end_date: form.end_date || '',
      note: form.note,
      createInfo: {
        snkey: store.state.pData.snkey,
        name: store.state.pData.username,
        time: timestamp,
      },
      editInfo: [],
    }),
  }

  const response = await api.add('pipeline_used', payload)
  loading.value = false

  if (response?.state == 1) {
    store.showToastMulti({
      type: 'success',
      message: '管路使用紀錄已新增',
      closeTime: 2,
    })
    resetForm()
    closeDialog()
    emit('refresh')
  } else {
    store.showToastMulti({
      type: 'error',
      message: '新增失敗，請稍後再試',
      closeTime: 3,
    })
  }
}

const handleEdit = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    store.showToastMulti({
      type: 'warning',
      message: '資料輸入不完整，請檢查後再試',
      closeTime: 2,
    })
    return
  }

  loading.value = true
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')

  
  form.editInfo.unshift({
    snkey: store.state?.pData?.snkey,
    name: store.state?.pData?.username,
    time: timestamp,
  });

  const payload = {
    snkey: form.snkey,
    datalist: JSON.stringify(form),
    updateTime: timestamp,
  }

  const response = await api.post('pipeline_used', payload)
  loading.value = false

  if (response?.state == 1) {
    store.showToastMulti({
      type: 'success',
      message: '管路使用紀錄已更新',
      closeTime: 2,
    })
    closeDialog()
    emit('refresh')
  } else {
    store.showToastMulti({
      type: 'error',
      message: '修改失敗，請稍後再試',
      closeTime: 3,
    })
  }
}

const openForAdd = () => {
  processType.value = 'add'
  resetForm()
  dialog.value = true
}

const openForEdit = (record) => {
  console.log('record', record);
  processType.value = 'edit'
  Object.assign(form, record)
  dialog.value = true
}

defineExpose({
  openForAdd,
  openForEdit,
  closeDialog,
})
</script>

<style scoped lang="scss">
.pipeline-add {
  &__header {
    background-image: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04));
  }
}
</style>