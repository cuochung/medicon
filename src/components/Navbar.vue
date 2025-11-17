<template>
  <nav class="nav">

    <v-navigation-drawer 
      app 
      temporary 
      v-model="drawer" 
      location="right" 
      class="navbar-drawer"
    >
      <v-list-item-title class="text-center titleFontColor my-2 navbar-title">
        功能選擇
      </v-list-item-title>
      <v-divider class="navbar-divider"></v-divider>

      <v-list density="compact" nav class="navbar-list">
        <v-list-item 
          v-for="item in items" 
          :key="item.label" 
          :to="item.route" 
          v-show="checkAuth(item.authKey)"
          class="navbar-list-item"
        >
          <template v-slot:prepend>
            <v-icon class="navbar-icon">{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title class="navbar-item-title">{{ item.label }}</v-list-item-title>
        </v-list-item>

        <v-list-item @click="logout" class="navbar-list-item logout-item">
          <template v-slot:prepend>
            <v-icon class="navbar-icon">mdi-logout</v-icon>
          </template>
          <v-list-item-title class="navbar-item-title">登出</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar 
      app 
      fixed 
      class="align-center navbar-app-bar"
      elevation="2"
    >
      <v-toolbar-title style="cursor: pointer;">
        <router-link to="/main/functionlist" custom v-slot="{ navigate }">
          <div @click="navigate" @keypress.enter="navigate" class="d-flex navbar-title-text">
            <span class="font-weight-black subtitle-1 text-sm-h6">
              {{ store.state.cData.company_name }}
            </span>
            <span class="subtitle-1 ml-2 d-none d-sm-flex" style="opacity: 0.9;">
              v.{{ store.state.verMsg }}
            </span>
          </div>
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn 
        text 
        class="font-weight-black text-caption text-sm-h6 navbar-user-btn"
        @click.stop="drawer = !drawer"
      >
        <div class="navbar-user-text">{{ store.state.pData.username }}</div>
        <v-icon class="ml-1 navbar-user-icon">mdi-apps</v-icon>
      </v-btn>
    </v-app-bar>


  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/useStore'

const router = useRouter()
const store = useStore()

// 響應式數據
const personnel_key = ref(true)
const drawer = ref(false)

// 計算屬性
const items = computed(() => {
  return store.state.authKeys
})

// 方法
const logout = () => {
  store.state.logined = false
  router.push("/login")
  sessionStorage.clear() //清除sessionStorage
}

const getSessionStorage = () => {
  if (sessionStorage.getItem("pData") != null) {
    store.state.cData = JSON.parse(sessionStorage.getItem("cData"))
    store.state.pData = JSON.parse(sessionStorage.getItem("pData"))
  } else {
    router.push("/login")
  }
}

const checkAuth = (authkey) => {
  if (store.state.pData[authkey] === "true" || authkey === "pass") {
    return true
  }
  return false
}

// 生命週期鉤子
onMounted(() => {
  getSessionStorage() //取得暫存的廠商及使用者資料
  checkAuth() //判斷授權的功能
})
</script>

<style lang="scss" scoped>
.navbar-app-bar {
  background: rgba(225, 190, 231, 0.9) !important;
  background-image: url("@/assets/BG_top.png") !important;
  background-repeat: repeat !important;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--daycare-divider-light);
  transition: all 0.3s ease;
}

.navbar-app-bar:hover {
  box-shadow: 0 4px 12px var(--daycare-shadow) !important;
}

.navbar-drawer {
  background: rgba(225, 190, 231, 0.9) !important;
  background-image: url("@/assets/BG_top.png") !important;
  background-repeat: repeat !important;
  backdrop-filter: blur(8px);
  border-left: 1px solid var(--daycare-divider-light);
}

.navbar-title {
  font-weight: 600;
  letter-spacing: 0.5px;
  font-size: 1.1rem;
}

.navbar-divider {
  border-color: var(--daycare-divider) !important;
  opacity: 0.6;
}

.navbar-list {
  padding: 8px 0;
}

.navbar-list-item {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar-list-item:hover {
  background: rgba(81, 45, 168, 0.2) !important;
  transform: translateX(-4px);
}

.navbar-list-item:active {
  background: rgba(81, 45, 168, 0.3) !important;
}

.navbar-icon {
  color: var(--daycare-primary) !important;
  transition: all 0.3s ease;
}

.navbar-list-item:hover .navbar-icon {
  color: #FFFFFF !important;
  transform: scale(1.1);
}

.navbar-item-title {
  color: var(--daycare-primary) !important;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.navbar-list-item:hover .navbar-item-title {
  color: #FFFFFF !important;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(81, 45, 168, 0.5);
}

/* 頂部導航欄文字顏色 - 與右側欄一致 */
.navbar-title-text {
  color: var(--daycare-primary) !important;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.navbar-user-text {
  color: var(--daycare-primary) !important;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.navbar-user-icon {
  color: var(--daycare-primary) !important;
  transition: transform 0.3s ease;
}

.navbar-user-btn {
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 8px 12px !important;
}

.navbar-user-btn:hover {
  background: rgba(81, 45, 168, 0.2) !important;
  transform: translateY(-2px);
}

.navbar-user-btn:hover .navbar-user-text {
  color: #FFFFFF !important;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(81, 45, 168, 0.5);
}

.navbar-user-btn:hover .navbar-user-icon {
  color: #FFFFFF !important;
  transform: rotate(90deg);
}

.v-snack__content {
  font-size: 2rem;
}

/* 確保背景圖片正確顯示 */
:deep(.v-toolbar__content) {
  background-image: url("@/assets/BG_top.png");
  background-repeat: repeat;
}

:deep(.v-navigation-drawer__content) {
  background-image: url("@/assets/BG_top.png");
  background-repeat: repeat;
}
</style>