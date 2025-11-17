<template>
  <v-dialog v-model="dialog" max-width="960">
    <v-card rounded="xl" class="select-list-dialog">
      <v-sheet
        color="primary"
        variant="tonal"
        class="select-list-dialog__header px-6 py-4"
        rounded="t-xl"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h6 font-weight-bold mb-1">{{ title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ subtitle }}
            </p>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </v-sheet>

      <v-card-text class="pa-0">
        <v-sheet class="px-6 py-4">
          <v-alert
            variant="tonal"
            color="primary"
            border="start"
            icon="mdi-database-search"
            class="mb-4"
          >
            點選下方列表即可將內容帶入護理紀錄。
          </v-alert>

          <v-list lines="two" density="comfortable" class="select-list-dialog__list">
            <template v-if="items.length">
              <v-list-item
                v-for="item in items"
                :key="item.id"
                :title="item.content"
                :subtitle="item.subtitle"
                color="primary"
                class="select-list-dialog__item"
                @click="handleSelect(item)"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="40">
                    <v-icon color="primary">mdi-check-circle</v-icon>
                  </v-avatar>
                </template>
                <template #append>
                  <v-btn icon="mdi-chevron-right" variant="text" color="primary" />
                </template>
              </v-list-item>
            </template>
            <template v-else>
              <div class="text-body-2 text-medium-emphasis text-center py-6">
                目前沒有符合條件的資料。
              </div>
            </template>
          </v-list>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'

const dialog = ref(false)
const currentDatabase = ref('general')
const rawItems = ref([])

const emit = defineEmits(['select'])

const titleMap = {
  general: '資料選擇',
  medicalRecord: '資料選擇－就診紀錄',
  signLife: '資料選擇－生命徵象',
  nursingPlan: '資料選擇－護理計畫',
  inspectionreport: '資料選擇－檢驗報告單',
  pipeline_used: '資料選擇－管路使用紀錄',
  consultation: '資料選擇－轉介照會單',
}

const subtitleMap = {
  general: '請選擇需要帶入的資料。',
  medicalRecord: '帶入住民當日的就診紀錄，快速紀錄醫囑與轉介資訊。',
  signLife: '帶入同日的生命徵象數據，讓紀錄完整呈現。',
  nursingPlan: '將既有護理計畫的重點帶入紀錄，維持跨班資訊一致。',
  inspectionreport: '引用檢驗報告摘錄，維持資訊同步。',
  pipeline_used: '檢視目前使用中的管路資訊，快速帶入紀錄。',
  consultation: '帶入轉介照會單紀錄，補充跨團隊溝通內容。',
}

const title = computed(() => titleMap[currentDatabase.value] ?? titleMap.general)
const subtitle = computed(() => subtitleMap[currentDatabase.value] ?? subtitleMap.general)

const items = computed(() => rawItems.value)

const transformItems = (payload) => {
  const { database, matchItems = [] } = payload

  switch (database) {
    case 'medicalRecord':
      return matchItems.map((item, idx) => ({
        id: `${database}-${idx}`,
        database,
        data: item,
        content: `${item.date ?? ''}｜${item.hospital_name ?? ''}｜${item.branch_name ?? ''}｜${item.doctor_name ?? ''}`,
        subtitle: item.main_cause_of_treatment_name ? `就診主因：${item.main_cause_of_treatment_name}` : '',
      }))
    case 'signLife':
      return matchItems.map((item, idx) => ({
        id: `${database}-${idx}`,
        database,
        data: item,
        content: `${item.date ?? ''}｜${item.time ?? ''}`,
        subtitle: item.create_man ? `紀錄人員：${item.create_man}` : '',
      }))
    case 'nursingPlan':
      return matchItems.map((item, idx) => ({
        id: `${database}-${idx}`,
        database,
        data: item,
        content: `${item.date ?? ''}｜${item.question ?? ''}`,
        subtitle: item.stop_date ? `停止日期：${item.stop_date}` : '進行中計畫',
      }))
    case 'inspectionreport':
      return matchItems.map((item, idx) => ({
        id: `${database}-${idx}`,
        database,
        data: item,
        content: `${item.date ?? ''}｜${item.location ?? ''}`,
        subtitle: item.create_man ? `填寫人員：${item.create_man}` : '',
      }))
    case 'pipeline_used':
      return matchItems.map((item, idx) => ({
        id: `${database}-${idx}`,
        database,
        data: item,
        content: `${item.name ?? ''}｜${item.unit ?? ''}`,
        subtitle: `${item.start_date ?? ''} ~ ${item.end_date ?? ''}${item.create_man ? `｜${item.create_man}` : ''}`,
      }))
    case 'consultation':
      return matchItems.map((item, idx) => ({
        id: `${database}-${idx}`,
        database,
        data: item,
        content: `${item.date ?? ''}｜${item.nurse_name ?? ''}`,
        subtitle: item.create_man ? `紀錄人員：${item.create_man}` : '',
      }))
    default:
      return matchItems.map((item, idx) => ({
        id: `${database}-${idx}`,
        database,
        data: item,
        content: JSON.stringify(item),
        subtitle: '',
      }))
  }
}

const open = (payload) => {
  currentDatabase.value = payload?.database ?? 'general'
  rawItems.value = transformItems(payload)
  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const handleSelect = (item) => {
  emit('select', item)
  close()
}

defineExpose({
  open,
  close,
})
</script>

<style scoped lang="scss">
.select-list-dialog {
  &__header {
    background-image: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04));
  }

  &__list {
    max-height: 60vh;
    overflow-y: auto;
  }

  &__item + &__item {
    margin-top: 4px;
  }
}
</style>