<template>
  <div class="tableImage">
    <div class="d-flex justify-center align-center justTransparent" style="height:100%">
      <v-row class="justify-center" v-if="matchDatabase">
        <v-col cols="11" sm="8" md="6" lg="5">
          <div class="loginCardBg pa-8 pa-md-10 rounded-lg">
            <!-- 標題區域 -->
            <div class="text-center mb-8">
              <div class="text-h5 text-sm-h4 font-weight-bold mb-2 loginTitleColor" style="letter-spacing: 0.5px;">
                {{ store.cData.company_name }}
              </div>
              <div class="text-subtitle-1 text-sm-h6 mb-4 loginSubtitleColor" style="font-weight: 500;">
                後台管理系統
              </div>
              <v-chip 
                small 
                outlined 
                color="#512DA8" 
                class="text-caption"
                style="border-color: var(--daycare-primary); color: var(--daycare-primary);"
              >
                Version {{ store.state.verMsg }}
              </v-chip>
            </div>

            <v-divider class="mb-8 loginDividerColor"></v-divider>

            <!-- 表單區域 -->
            <v-form ref="form" class="login-form">
              <div class="mb-6">
                <v-text-field 
                  label="授權帳號" 
                  placeholder="請輸入您的帳號"
                  prepend-inner-icon="mdi-account-outline" 
                  v-model="loginForm.account"
                  :rules="emptyRules" 
                  @keyup.enter="checkLogin" 
                  autofocus 
                  color="#512DA8"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4 loginInputColor"
                ></v-text-field>
                
                <v-text-field 
                  type="password" 
                  label="密碼" 
                  placeholder="請輸入您的密碼"
                  prepend-inner-icon="mdi-lock-outline"
                  v-model="loginForm.password" 
                  :rules="emptyRules" 
                  @keyup.enter="checkLogin"
                  color="#512DA8"
                  class="loginInputColor"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </div>

              <v-btn 
                block 
                size="large"
                class="login-btn white--text mb-6 loginBtnColor" 
                @click.stop="checkLogin"
                elevation="2"
              >
                <v-icon left>mdi-login</v-icon>
                登入系統
              </v-btn>
            </v-form>

            <!-- 底部資訊 -->
            <v-divider class="mb-4 loginDividerLightColor"></v-divider>
            <div class="d-flex flex-column flex-sm-row justify-space-between align-center text-caption loginSubtitleColor">
              <div class="mb-2 mb-sm-0 d-flex align-center">
                <v-icon small class="mr-1" style="color: var(--daycare-secondary);">mdi-clock-outline</v-icon>
                <span v-if="store.cData.last_login_time">最後登入：{{ store.cData.last_login_time }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon small class="mr-1" style="color: var(--daycare-secondary);">mdi-copyright</v-icon>
                <span>© 2025.11.14 All Rights Reserved</span>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

      <div v-else class="text-center pa-8">
        <v-alert
          type="error"
          prominent
          border="start"
          colored-border
          elevation="3"
          class="mx-auto"
          max-width="600"
        >
          <div class="text-h6 mb-2">
            <v-icon large class="mr-2">mdi-alert-circle</v-icon>
            資料庫連線異常
          </div>
          <div class="text-body-1">
            資料庫未正常連結，請按 <strong>CTRL+F5</strong> 重新整理頁面後再次嘗試登入。
          </div>
          <div class="text-body-2 mt-2">
            若問題持續存在，請聯繫系統工程師。
          </div>
        </v-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/useStore'
import api from '@/assets/js/api.js'

const { proxy } = getCurrentInstance()

const store = useStore()
const router = useRouter()
const form = ref(null)

// 響應式數據
const matchDatabase = ref(false)
const loginForm = ref({
  account: '',
  password: ''
})

// 表單驗證規則
const emptyRules = [(v) => !!v || '不可空白']

// 檢查是否已登入
const loginedCheck = () => {
  if (sessionStorage.getItem('logined') === 'logined') {
    router.push('/main/functionlist')
  }
}

// 獲取公司數據
const getCompData = async () => {
  try {
    const response = await api.get('other_data')
    console.log('response',response)
    const cData = response[0]
    if (cData) {
      store.cData = cData
      sessionStorage.setItem('cData', JSON.stringify(cData))
      matchDatabase.value = true
    }
  } catch (error) {
    matchDatabase.value = false
    console.error(error)
    proxy.$swal({
      icon: 'error',
      title: '資料庫未正常連結!! 請按 CTRL+F5 後重新登入~ 或洽系統工程師'
    })
  }
}

// 登入檢查
const checkLogin = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  try {
    const url = `login/logining/${store.state.databaseName}`
    const response = await api.options(url, loginForm.value)
    console.log('login response',response)
    
    if (response.data === 'databaseError') {
      proxy.$swal({
        icon: 'error',
        title: '資料庫未正常連結!! 請按F5後重新登入~'
      })
    } else if (response.state === 'logined') {
      if (response.pData.suspension) {
        proxy.$swal({
          icon: 'error',
          title: '停權中!!! 無法登入!!'
        })
      } else {
        let pData = response.pData
        delete pData.account
        delete pData.password
        store.pData = pData
        sessionStorage.setItem('pData', JSON.stringify(pData))
        sessionStorage.setItem('logined', 'logined')
        router.push('/main/functionlist')
        proxy.$swal({
          icon: 'success',
          title: '登入成功'
        })
      }
    } else {
      proxy.$swal({
        icon: 'error',
        title: '未授權的登入者'
      })
    }
  } catch (error) {
    proxy.$swal({
      icon: 'error',
      title: '登入失敗，請檢查帳號密碼'
    })
  }
}

// 生命週期鉤子
onBeforeMount(() => {
  getCompData()
})

onMounted(() => {
  loginedCheck()
})
</script>

<style scoped>
body::-webkit-scrollbar {
  display: none;
}

.login-form .v-text-field {
  margin-bottom: 8px;
}

.login-form :deep(.v-field__outline) {
  color: var(--daycare-divider);
}

.login-form :deep(.v-field--focused .v-field__outline) {
  color: var(--daycare-primary);
}

.login-form :deep(.v-field__input) {
  color: var(--daycare-primary);
}

.login-form :deep(.v-label) {
  color: var(--daycare-secondary);
}

.login-form :deep(.v-field--focused .v-label) {
  color: var(--daycare-primary);
}

.login-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  background: linear-gradient(135deg, var(--daycare-button) 0%, var(--daycare-primary) 100%);
}

.login-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, var(--daycare-primary) 0%, var(--daycare-secondary) 100%);
}

.login-btn:hover.loginBtnColor {
  box-shadow: 0 6px 20px var(--daycare-btn-hover-shadow) !important;
}

.login-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px var(--daycare-shadow) !important;
}

.loginCardBg {
  transition: all 0.3s ease;
}

.loginCardBg:hover {
  box-shadow: 0 12px 48px 0 var(--daycare-shadow),
              0 4px 12px 0 var(--daycare-shadow-light) !important;
}

</style>
