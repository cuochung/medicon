<template>
  <div class="personneladd">
    <v-dialog v-model="dialog" fullscreen persistent>
      <template #activator="{ props }">
        <v-btn v-bind="props" class="personnel-add-btn" color="primary" variant="elevated"
          prepend-icon="mdi-account-star" rounded="pill" elevation="6" @click="addProcess">
          新增人員
        </v-btn>
      </template>

      <v-card class="personnel-dialog" rounded="xl">
        <v-card-title class="d-flex" :class="titleStyle" primary-title>
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" class="ml-2" variant="text" color="white" @click="dialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="form">
            <v-sheet class="info-section" color="primary-lighten-5" variant="tonal" rounded="lg">
              <div class="info-section__header">
                <v-icon color="primary" size="24">mdi-badge-account-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary ml-2">基本資料</span>
              </div>
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="登入授權帳號"
                    prepend-icon="mdi-account-key-outline"
                    v-model="list.account"
                    :rules="emptyRules"
                    autofocus
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="登入密碼"
                    prepend-icon="mdi-key-variant"
                    v-model="list.password"
                    :rules="emptyRules"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="姓名"
                    prepend-icon="mdi-account"
                    v-model="list.username"
                    :rules="emptyRules"
                    density="comfortable"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="員工編號"
                    prepend-icon="mdi-card-account-details-outline"
                    v-model="list.employee_number"
                    density="comfortable"
                    variant="outlined"
                    counter="10"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-sheet>

            <v-alert border="start" border-color="primary" elevation="2" variant="tonal" class="auth-section">
              <div class="d-flex pa-2 align-center">
                <header class="text-primary font-weight-bold">權限設定</header>
                <v-spacer></v-spacer>
                <v-btn class="mx-2" color="primary" size="small" variant="flat" @click.stop="authSelectAll">全選</v-btn>
                <v-btn size="small" variant="outlined" color="primary" @click.stop="authCancelAll">全不選</v-btn>
              </div>
              <v-row>
                <v-col cols="12" md="3" v-for="authKey in filterAuthKeys" :key="authKey.keyName">
                  <v-alert :color="authKey.color" variant="tonal" v-if="authKey.keyName != 'exit'">
                    <v-checkbox hide-details :label="authKey.label" v-model="list[`${authKey.keyName}_key`]"
                      value="true"></v-checkbox>
                    <v-slide-y-transition>
                      <v-list
                        v-if="list[`${authKey.keyName}_key`]"
                        class="auth-sublist"
                        density="compact"
                      >
                        <v-list-item
                          v-for="option in permissionOptions"
                          :key="`${authKey.keyName}_${option.suffix}`"
                        >
                          <template #prepend>
                            <v-icon size="18" color="primary">{{ option.icon }}</v-icon>
                          </template>
                          <v-list-item-title>{{ option.label }}</v-list-item-title>
                          <template #append>
                            <v-checkbox
                              hide-details
                              density="comfortable"
                              v-model="list[`${authKey.keyName}_${option.suffix}`]"
                              true-value="true"
                              false-value=""
                            ></v-checkbox>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-slide-y-transition>
                  </v-alert>
                </v-col>

              </v-row>
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" class="text-white" @click="addOK"
            v-if="processType == 'add'">確認新增</v-btn>
          <v-btn color="success" variant="flat" class="text-white" @click="editOK"
            v-if="processType == 'edit'">確認修改</v-btn>
        </v-card-actions>
        <!-- <pre>{{ list }}</pre> -->
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, getCurrentInstance } from 'vue'
import { useStore } from '@/stores/useStore'
import dayjs from "dayjs"
import api from '@/assets/js/api'

const { proxy } = getCurrentInstance()
const store = useStore()

// Props
const props = defineProps({
  usingDatabase: String,
  personnelItems: Array,
  authKeys: Array
})

// Emits
const emit = defineEmits(['getAllData'])

// Refs
const dialog = ref(false)
const list = ref({
  createInfo: {},
  editInfo: []
})
const processType = ref('')
const title = ref('')
const titleStyle = ref('')
const form = ref(null)

// Validation rules
const emptyRules = [(v) => !!v || "不可空白"]

// Computed
const filterAuthKeys = computed(() => {
  return props.authKeys.filter((i) => i.authKey != "pass")
})

const keyItems = computed(() => {
  let items = {}
  for (let i of filterAuthKeys.value) {
    items[`${i.keyName}_key`] = ""
    items[`${i.keyName}_add_key`] = ""
    items[`${i.keyName}_edit_key`] = ""
    items[`${i.keyName}_del_key`] = ""
    items[`${i.keyName}_search_key`] = ""
  }
  return items
})

const permissionOptions = [
  { suffix: 'add_key', label: '新增', icon: 'mdi-plus-circle-outline' },
  { suffix: 'edit_key', label: '修改', icon: 'mdi-pencil-outline' },
  { suffix: 'del_key', label: '刪除', icon: 'mdi-delete-outline' },
  { suffix: 'search_key', label: '查詢', icon: 'mdi-magnify' }
]

// Methods
const addProcess = () => {
  processType.value = "add"
  title.value = "新增人員資料"
  titleStyle.value = "dialog-title dialog-title--add"
  list.value = { 
    ...keyItems.value,
    createInfo: {},
    editInfo: []
   }
  nextTick(() => {
    form.value.resetValidation()
  })
}

const editProcess = (item) => {
  processType.value = "edit"
  title.value = "修改人員資料"
  titleStyle.value = "dialog-title dialog-title--edit"
  list.value = { ...item }
  dialog.value = true
}

const addOK = async () => {
  // 新增時登入帳號不可重覆
  const match = props.personnelItems.find(i => i.account == list.value.account)
  if (match) {
    proxy.$swal({ icon: "error", title: "登入帳號不可重覆!!" })
    return false
  }

  // 確認新增
  const { valid } = await form.value.validate()
  if (valid) {
    list.value.createInfo = {
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    const postData = {
      datalist: JSON.stringify(list.value)
    }

    try {
      const rs = await api.add(props.usingDatabase, postData)
      if (rs.state == 1) {
        proxy.$swal({ icon: "success", title: "已新增" })
        emit("getAllData")
        dialog.value = false
      }
    } catch (err) {
      proxy.$swal({ icon: "error", title: "資料存取錯誤!!內容:" + err })
    }
  } else {
    proxy.$swal({ icon: "error", title: "資料輸入不完整!!請再次確認!!" })
  }
}

const editOK = async () => {
  // 確認修改
  const { valid } = await form.value.validate()
  if (valid) {
    
    list.value.editInfo.unshift({
      snkey: store.state.pData.snkey,
      name: store.state.pData.username,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss")
    })

    const postData = {
      snkey: list.value.snkey,
      datalist: JSON.stringify(list.value),
      updateTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    const rs = await api.post(props.usingDatabase, postData)
    if (rs.state == 1) {
      proxy.$swal({
        icon: "success",
        title: "已修改,權限相關功能將在重新登入後生效"
      })
      emit("getAllData")
      dialog.value = false
    }
  } else {
    proxy.$swal({ icon: "error", title: "資料輸入不完整!!請再次確認!!" })
  }
}

const authSelectAll = () => {
  for (let key in list.value) {
    if (key.includes("_key")) {
      list.value[key] = "true"
    }
  }
}

const authCancelAll = () => {
  for (let key in list.value) {
    if (key.includes("_key")) {
      list.value[key] = ""
    }
  }
}

defineExpose({
  editProcess
})
</script>

<style scoped lang="scss">
.personnel-add-btn {
  padding-inline: 22px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: none;
  background: linear-gradient(135deg, rgba(74, 107, 95, 0.95), rgba(123, 163, 184, 0.92));
  color: #ffffff;

  &:hover {
    box-shadow: 0 10px 24px rgba(90, 122, 111, 0.32);
  }
}

.personnel-dialog {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 24px 60px rgba(74, 107, 95, 0.22);
}

.font-weight-black {
  font-weight: 700 !important;
}

.dialog-title {
  padding: 18px 24px;
  font-size: 1.15rem;
  color: #ffffff;

  &--add {
    background: linear-gradient(135deg, rgba(74, 107, 95, 0.95), rgba(123, 163, 184, 0.85));
  }

  &--edit {
    background: linear-gradient(135deg, rgba(107, 154, 138, 0.95), rgba(123, 163, 184, 0.85));
  }
}

.auth-section {
  background-color: rgba(245, 230, 211, 0.35) !important;
  border-radius: 16px;
  border: 1px solid rgba(123, 163, 184, 0.3);
}

.info-section {
  padding: 18px 20px;
  background-color: rgba(255, 255, 255, 0.86) !important;
  border: 1px solid rgba(123, 163, 184, 0.25);
  box-shadow: 0 8px 22px rgba(74, 107, 95, 0.12);
  margin-bottom: 20px;

  &__header {
    display: flex;
    align-items: center;
  }
}

.auth-sublist {
  margin-left: 28px;
  border-left: 2px solid var(--daycare-divider-light);
  padding-left: 12px;

  .v-list-item-title {
    font-weight: 500;
    color: rgba(74, 107, 95, 0.8);
  }
}
</style>