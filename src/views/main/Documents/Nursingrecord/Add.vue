<template>
  <SelectList ref="selectListRef" @select="handleSelectFromList" />

  <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition" persistent>
    <v-card class="nursingrecord-add" rounded="0">
      <v-sheet class="nursingrecord-add__header px-6 py-4" :color="headerColor" variant="tonal">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="56" color="white" variant="tonal" class="mr-4">
              <v-icon color="white" size="30">mdi-notebook-heart</v-icon>
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-bold mb-1">{{ headerTitle }}</h2>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ headerSubtitle }}
              </p>
            </div>
          </div>
          <div class="d-flex align-center gap-3">
            <v-chip variant="tonal" color="white" size="small" prepend-icon="mdi-account-heart">
              {{ residentCode }}｜{{ residentName }}
            </v-chip>
            <v-chip variant="text" color="white" size="small" prepend-icon="mdi-clock-time-eight-outline">
              {{ today }}
            </v-chip>
            <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
          </div>
        </div>
      </v-sheet>

      <v-card-text class="px-6 py-6">
        <v-form ref="formRef">
          <v-row class="mb-4" density="comfortable">
            <v-col cols="12" md="3">
              <v-text-field v-model="record.date" type="date" label="紀錄日期" variant="outlined"
                prepend-inner-icon="mdi-calendar" :rules="[rules.required]" />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field v-model="record.time" type="time" label="紀錄時間" variant="outlined"
                prepend-inner-icon="mdi-clock-outline" :rules="[rules.required]" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="record.project" :items="projectItems" label="紀錄項目" variant="outlined"
                prepend-inner-icon="mdi-view-list" hide-details />
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-switch v-model="focusFlag" color="error" inset label="重點交班" hide-details>
                <template #prepend>
                  <v-icon color="error">mdi-alarm-light</v-icon>
                </template>
              </v-switch>
            </v-col>
          </v-row>

          <v-sheet class="nursingrecord-add__shortcut px-4 py-4 mb-5" rounded="lg" border>
            <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
              <div class="text-subtitle-2 font-weight-medium text-medium-emphasis">
                快速載入既有資料，縮短整理時間
              </div>
              <v-chip variant="tonal" color="primary" size="small" prepend-icon="mdi-lightbulb-on-outline">
                依紀錄日期自動比對
              </v-chip>
            </div>
            <v-btn-toggle class="nursingrecord-add__toggle" color="primary" variant="outlined" divided
              density="comfortable">
              <v-btn @click="openSelectList('medicalRecord')" prepend-icon="mdi-note-text">
                載入就診紀錄
              </v-btn>
              <v-btn @click="openSelectList('signLife')" prepend-icon="mdi-heart-pulse">
                載入生命徵象
              </v-btn>
              <v-btn @click="openSelectList('nursingPlan')" prepend-icon="mdi-clipboard-text-outline">
                載入護理計畫
              </v-btn>
              <v-btn @click="openSelectList('inspectionreport')" prepend-icon="mdi-flask-outline">
                載入檢驗報告
              </v-btn>
              <v-btn @click="openSelectList('pipeline_used')" prepend-icon="mdi-pipe">
                載入管路使用
              </v-btn>
              <v-btn @click="openSelectList('consultation')" prepend-icon="mdi-account-group">
                載入轉介照會
              </v-btn>
            </v-btn-toggle>
          </v-sheet>

          <v-row>
            <v-col cols="12">
              <v-sheet class="nursingrecord-add__editor" rounded="lg" variant="outlined">
                <div class="d-flex align-center justify-space-between mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">護理紀錄內容</div>
                    <div class="text-body-2 text-medium-emphasis">
                      詳實描述照護評估、處置與跨班交接的重要資訊。
                    </div>
                  </div>
                  <v-chip variant="tonal" color="primary" size="small" prepend-icon="mdi-text">
                    自動儲存字數：{{ contentLength }}
                  </v-chip>
                </div>
                <v-textarea v-model="record.nursingrecord_content" variant="outlined" rows="20" auto-grow
                  hint="可透過「快速載入」帶入就診、護理計畫等資料後再進一步補充。" persistent-hint :rules="requiredTextRules" />
              </v-sheet>
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
        <v-btn v-if="processType === 'add'" color="primary" variant="flat" prepend-icon="mdi-check-circle"
          :loading="loading" :disabled="loading" @click="handleAdd">
          確認新增
        </v-btn>
        <v-btn v-else color="success" variant="flat" prepend-icon="mdi-content-save-edit" :loading="loading"
          :disabled="loading" @click="handleEdit">
          確認修改
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue'

import api from '@/assets/js/api.js'
import { useStore } from '@/stores/useStore'

import SelectList from './SelectList.vue'

const emit = defineEmits(['refresh'])

const store = useStore()
const { proxy } = getCurrentInstance()

const dialog = ref(false)
const loading = ref(false)
const processType = ref('add')
const formRef = ref(null)
const selectListRef = ref(null)

const requiredTextRules = [(v) => !!v || '此欄位不可空白']

const projectItems = [
  '',
  '跌倒',
  '住院出院紀錄',
  '護理評值',
  '入住紀錄',
  '住院後返本家',
  '移除紀錄',
  '聯繫紀錄',
  '照護計畫',
]

// const defaultRecord = () => ({
//   createInfo: {},
//   editInfo: [],
//   u_snkey: store.state.uData.snkey,
//   date: dayjs().format('YYYY-MM-DD'),
//   time: dayjs().format('HH:mm'),
//   project: '',
//   focus: 'false',
//   nursingrecord_content: '',
// })

const record = reactive({})

const rules = {
  required: (value) => !!value || '不可空白',
}

const medicalRecordItems = ref([])
const signLifeItems = ref([])
const nursingPlanItems = ref([])
const inspectionReportItems = ref([])
const pipelineUsedItems = ref([])
const consultationItems = ref([])

const today = computed(() => dayjs().format('YYYY/MM/DD'))
const residentName = computed(() => store.state?.uData?.name ?? '未選擇住民')
const residentCode = computed(() => store.state?.uData?.p_code ?? '---')

const focusFlag = computed({
  get: () => record.focus === 'true',
  set: (value) => {
    record.focus = value ? 'true' : 'false'
  },
})

const headerTitle = computed(() => (processType.value === 'add' ? '新增護理紀錄' : '修改護理紀錄'))
const headerSubtitle = computed(() =>
  processType.value === 'add'
    ? '記錄今日照護重點，讓交班更順暢。'
    : '更新既有護理紀錄，保留完整追蹤軌跡。'
)
const headerColor = computed(() => (processType.value === 'add' ? 'primary' : 'success'))
const headerIconColor = computed(() => (processType.value === 'add' ? 'white' : 'success'))

const contentLength = computed(() => record.nursingrecord_content?.length ?? 0)

const hasUser = computed(() => Boolean(store.state?.uData?.snkey))

const datasetMap = {
  medicalRecord: medicalRecordItems,
  signLife: signLifeItems,
  nursingPlan: nursingPlanItems,
  inspectionreport: inspectionReportItems,
  pipeline_used: pipelineUsedItems,
  consultation: consultationItems,
}

const resetRecord = () => {
  Object.assign(record, {
    createInfo: {},
    editInfo: [],
    u_snkey: store.state.uData.snkey,
    date: dayjs().format('YYYY-MM-DD'),
    time: dayjs().format('HH:mm'),
    project: '',
    focus: 'false',
    nursingrecord_content: '',
  })
}

const closeDialog = () => {
  if (loading.value) return
  dialog.value = false
}

const validateForm = async () => {
  const result = await formRef.value?.validate()
  return result?.valid ?? false
}

// const safeParseRow = (row) => {
//   if (!row) return {}
//   if (row.datalist) {
//     try {
//       const parsed = JSON.parse(row.datalist)
//       return {
//         ...parsed,
//         snkey: row.snkey,
//         create_man: row.create_man,
//         edit_man: row.edit_man,
//       }
//     } catch (error) {
//       console.warn('parse datalist failed', error)
//       return { ...row }
//     }
//   }
//   return { ...row }
// }

// const fetchMedicalRecords = async () => {
//   if (!hasUser.value) {
//     medicalRecordItems.value = []
//     return
//   }
//   const url = `medicinerecord/getByUserSnkey/${store.state.databaseName}/${store.state.uData.snkey}`
//   const response = await api.options(url)
//   medicalRecordItems.value = Array.isArray(response) ? response.map(safeParseRow) : []
// }

const fetchByTable = async (table, target) => {
  console.log(table, target)
  if (!hasUser.value) {
    target.value = []
    return
  }
  const payload = {
    key: 'u_snkey',
    value: store.state.uData.snkey,
  }
  const url = `byjson/searchByKeyValue/${store.state.databaseName}/${table}`
  const response = await api.options(url, payload)
  target.value = Array.isArray(response) ? response.map(i => ({
    ...JSON.parse(i.datalist),
    snkey: i.snkey,
  })) : []
}

const fetchRelatedResources = async () => {
  if (!hasUser.value) {
    medicalRecordItems.value = []
    signLifeItems.value = []
    nursingPlanItems.value = []
    inspectionReportItems.value = []
    pipelineUsedItems.value = []
    consultationItems.value = []
    return
  }

  // await fetchByTable('medicialrecord', medicalRecordItems)
  // await fetchByTable('signlife', signLifeItems)
  // await fetchByTable('nursingplan', nursingPlanItems)
  // await fetchByTable('inspectionreport', inspectionReportItems)
  // await fetchByTable('pipeline_used', pipelineUsedItems)
  // await fetchByTable('consultation', consultationItems)
  await Promise.all([
    fetchByTable('medicialrecord', medicalRecordItems),
    fetchByTable('signlife', signLifeItems),
    fetchByTable('nursingplan', nursingPlanItems),
    fetchByTable('inspectionreport', inspectionReportItems),
    fetchByTable('pipeline_used', pipelineUsedItems),
    fetchByTable('consultation', consultationItems),
  ])
}

watch(
  () => store.state?.uData?.snkey,
  () => {
    fetchRelatedResources()
  },
  { immediate: true }
)

const openSelectList = (database) => {
  if (!record.date) {
    proxy?.$swal?.({ icon: 'warning', title: '請先選擇紀錄日期。' })
    return
  }

  const collection = datasetMap[database]?.value ?? []
  let matchItems = []

  if (database === 'pipeline_used') {
    matchItems = collection.filter(
      (item) => record.date >= (item.start_date ?? '') && record.date <= (item.end_date ?? '')
    )
  } else {
    matchItems = collection.filter((item) => (item.date ?? '') === record.date)
  }

  if (!matchItems.length) {
    store.showToastMulti({
      type: 'warning',
      message: '暫無符合的紀錄',
      closeTime: 2,
    })
    return
  }

  selectListRef.value?.open({
    database,
    matchItems,
  })
}

const appendLine = (text) => {
  const current = record.nursingrecord_content ?? ''
  record.nursingrecord_content = current ? `${current}\n${text}` : text
}

const handleSelectFromList = (item) => {
  if (!item) return

  const data = item.data ?? {}

  switch (item.database) {
    case 'medicalRecord': {
      const content = [
        '[就診紀錄內容]',
        `就診日期: ${data.date ?? ''}`,
        `診別: ${data.outpatient ?? ''}`,
        `時段: ${data.time ?? ''}`,
        `醫院: ${data.hospital_name ?? ''}`,
        `科別: ${data.branch_name ?? ''}`,
        `醫師: ${data.doctor_name ?? ''}`,
        `就診主因: ${data.main_cause_of_treatment_name ?? ''}`,
        `回診日期: ${data.back_date ?? ''}`,
        `使用車輛: ${data.car ?? ''}`,
        `陪診人員: ${data.accompany ?? ''}`,
        `管路: ${data.pipeline ?? ''}`,
        `管路到期日: ${data.pipelinedate ?? ''}`,
        `攜帶物品: ${data.carryitems ?? ''}`,
        '',
        '原因狀況描述:',
        data.description ?? '',
        '',
        '就醫情形回覆:',
        data.response ?? '',
      ].join('\n')
      appendLine(content)
      break
    }
    case 'signLife': {
      const lines = ['[生命徵象內容]']
      const mapping = [
        ['評估時間', data.time],
        ['檢查結果', data.result],
        ['體重', data.weight],
        ['血壓(H)', data.bp_h],
        ['血壓(L)', data.bp_l],
        ['脈搏', data.pulse],
        ['體溫', data.temperature],
        ['呼吸', data.breath],
        ['血糖', data.blood_sugar],
        ['血氧濃度', data.blood_oxygen],
        ['疼痛指數', data.pain],
        ['GCS-E', data.gcs_e],
        ['GCS-V', data.gcs_v],
        ['GCS-M', data.gcs_m],
        ['大便次數', data.stool],
        ['備註', data.note],
      ]
      const line = mapping
        .filter(([, value]) => value !== undefined && value !== null && `${value}` !== '')
        .map(([label, value]) => `${label}:${value}`)
        .join('; ')
      if (line) {
        lines.push(line)
      }
      appendLine(lines.join('\n'))
      break
    }
    case 'nursingPlan': {
      const content = [
        '[護理計畫單內容]',
        '護理診斷:',
        data.question ?? '',
        '',
        '可能導因:',
        data.relevant ?? '',
        '',
        '護理目標:',
        data.target ?? '',
        '',
        '護理措施:',
        data.measures ?? '',
        '',
        '評值說明:',
        data.plan ?? '',
      ].join('\n')
      appendLine(content)
      break
    }
    case 'inspectionreport': {
      const mapping = [
        ['檢驗地點', data.location],
        ['白血球', data.leukocyte],
        ['紅血球', data.erythrocyte],
        ['血色素', data.hemoglobin],
        ['血小板', data.platelet],
        ['白蛋白', data.albumin],
        ['醣化血色素', data.glycosylatedhemoglobin],
        ['GOT(AST)', data.got],
        ['GPT(ALT)', data.gpt],
        ['血糖', data.bloodsugar],
        ['膽固醇', data.cholesterol],
        ['TG', data.tg],
        ['BUN', data.bun],
        ['CRE', data.cre],
        ['UA', data.ua],
        ['Na', data.na],
        ['K', data.k],
        ['HDL/LDL', data.hdlldl],
        ['尿液', data.ph],
        ['尿蛋白(-)', data.urineprotein],
        ['尿液 OB(-)', data.ob],
        ['尿液 RBC', data.rbc],
        ['尿液 WBC', data.wbc],
        ['尿液 Bacteria(-)', data.bacteria],
        ['尿液 GLU(-)', data.glu],
        ['細菌培養 Urine', data.urine],
        ['細菌培養 Sputum', data.sputum],
        ['其他備註', data.note],
        ['處置', data.dispose],
        ['追蹤', data.track],
      ]
      const line = mapping
        .filter(([, value]) => value !== undefined && value !== null && `${value}` !== '')
        .map(([label, value]) => `${label}:${value}`)
        .join('; ')
      const content = ['[檢驗報告內容]', line].filter(Boolean).join('\n')
      appendLine(content)
      break
    }
    case 'pipeline_used': {
      const content = [
        '[管路使用紀錄]',
        `使用管路:${data.name ?? ''}`,
        `單位:${data.unit ?? ''}`,
        `日期:${data.start_date ?? ''} ~ ${data.end_date ?? ''}`,
        `備註:${data.note ?? ''}`,
      ].join(' ')
      appendLine(content)
      break
    }
    case 'consultation': {
      const sections = [
        '[轉介照會單內容]',
        '預計照會人員:',
        [
          data.doctor ? '醫師' : '',
          data.nutritionist ? '營養師' : '',
          data.socialworker ? '社工' : '',
          data.rehabilitation ? '物理治療師' : '',
          data.attendant ? '照服員' : '',
          data.otherworker_content ? `其他人員:${data.otherworker_content}` : '',
        ]
          .filter(Boolean)
          .join('；'),
        '',
        '照會原因及狀況:',
      ]

      const reasons = [
        ['精神及行為異常', data.result1, data.result1_content],
        ['健康狀況異常', data.result2, data.result2_content],
        ['日常生活無法自理', data.result3, data.result3_content],
        ['肢體功能退化', data.result4, data.result4_content],
        ['疑自殺意圖', data.result5, data.result5_content],
        ['服藥不合作', data.result6, data.result6_content],
        ['營養狀況異常', data.result7, data.result7_content],
        ['其他', data.result8, data.result8_content],
      ]

      reasons.forEach(([label, flag, content]) => {
        if (flag) {
          sections.push(`${label}:${content ?? ''}`)
        }
      })

      sections.push(
        '',
        `護理人員:${data.nurse_name ?? ''} 日期:${data.date ?? ''}`,
        `醫師照會回覆:${data.doctor_response ?? ''}`,
        `照會人員:${data.doctor_name ?? ''} 日期:${data.doctor_name_date ?? ''}`,
        `營養師照會回覆:${data.nutritionist_response ?? ''}`,
        `照會人員:${data.nutritionist_name ?? ''} 日期:${data.nutritionist_name_date ?? ''}`,
        `社工照會回覆:${data.socialworker_response ?? ''}`,
        `照會人員:${data.socialworker_name ?? ''} 日期:${data.socialworker_name_date ?? ''}`,
        `物理治療師照會回覆:${data.rehabilitation_response ?? ''}`,
        `照會人員:${data.rehabilitation_name ?? ''} 日期:${data.rehabilitation_name_date ?? ''}`,
        `照服員照會回覆:${data.attendant_response ?? ''}`,
        `照會人員:${data.attendant_name ?? ''} 日期:${data.attendant_name_date ?? ''}`,
        data.otherworker_response
          ? `其他人員(${data.otherworker_content ?? ''})照會回覆:${data.otherworker_response}`
          : '',
        data.otherworker_name ? `照會人員:${data.otherworker_name} 日期:${data.otherworker_name_date ?? ''}` : '',
        `追蹤處理:${data.track_response ?? ''}`,
        `處理者簽名:${data.track_name ?? ''} 日期:${data.track_name_date ?? ''}`
      )

      appendLine(
        sections
          .filter((line) => line !== undefined && line !== null && `${line}`.trim() !== '')
          .join('\n')
      )
      break
    }
    default:
      break
  }
}

const handleAdd = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    proxy?.$swal?.({ icon: 'warning', title: '資料輸入不完全，請重新確認。' })
    return
  }

  loading.value = true

  record.createInfo = {
    snkey: store.state.pData.snkey,
    name: store.state.pData.username,
    time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }


  let postData = {
    datalist: JSON.stringify(record),
  }

  const response = await api.add('nursingrecord', postData)
  loading.value = false

  if (response.state == 1) {
    proxy?.$swal?.({ icon: 'success', title: '新增成功' })
    closeDialog()
    emit('refresh')
  } else {
    proxy?.$swal?.({ icon: 'error', title: '新增失敗，請稍後再試。' })
  }
}

const handleEdit = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    proxy?.$swal?.({ icon: 'warning', title: '資料輸入不完全，請重新確認。' })
    return
  }

  loading.value = true

  record.editInfo.unshift({
    snkey: store.state.pData.snkey,
    name: store.state.pData.username,
    time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  })

  let postData = {
    snkey: record.snkey,
    datalist: JSON.stringify(record),
    updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }

  let response = await api.post('nursingrecord', postData)

  loading.value = false

  if (response.state == 1) {
    proxy?.$swal?.({ icon: 'success', title: '修改成功' })
    closeDialog()
    emit('refresh')
  } else {
    proxy?.$swal?.({ icon: 'error', title: '修改失敗，請稍後再試。' })
  }
}

const openForAdd = () => {
  resetRecord()
  processType.value = 'add'
  dialog.value = true
}

const openForEdit = (item) => {
  resetRecord()
  processType.value = 'edit'
  const payload = JSON.parse(JSON.stringify(item ?? {}))
  Object.assign(record, { ...payload })
  if (!record.time) {
    record.time = dayjs().format('HH:mm')
  }
  dialog.value = true
}

defineExpose({
  openForAdd,
  openForEdit,
  closeDialog,
})
</script>

<style scoped lang="scss">
.nursingrecord-add {
  &__header {
    background-image: linear-gradient(135deg, rgba(26, 115, 232, 0.15), rgba(26, 115, 232, 0.05));
  }

  &__shortcut {
    background-color: rgba(33, 150, 243, 0.04);
  }

  &__toggle {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .v-btn {
      flex: 1 1 180px;
    }
  }

  &__editor {
    background: #fff;
  }
}
</style>