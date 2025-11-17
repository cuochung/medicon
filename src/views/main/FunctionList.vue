<template>
  <div class="functionlist tableImage">
    <div class="justTransparent mt-3" style="height:100%">
      <v-row appear tag="transition-group" class="pa-4">
        <v-col 
          class="align-center pa-0 py-1" 
          cols="6" 
          md="3" 
          v-for="(item,index) in items" 
          :key="item.label" 
          v-ripple
          :data-index="index"
        >
          <div 
            class="zoneStyle function-card ma-2 px-4 py-3 rounded-xl" 
            v-if="item.keyName != 'exit'"
          >
            <router-link :to="item.route" custom v-slot="{ navigate }">
              <div @click="navigate" @keypress.enter="navigate" class="function-card-content">
                <div class="titleFontColor function-title">{{ item.label }}</div>
                <div class="function-image-wrapper">
                  <v-img 
                    :src="item.image" 
                    aspect-ratio="2.5" 
                    contain
                    class="function-image"
                  ></v-img>
                </div>
              </div>
            </router-link>
          </div>

          <div 
            class="zoneStyle function-card function-card-exit ma-2 px-4 py-3 rounded-xl" 
            v-if="item.keyName == 'exit'"
            @click.stop="logout"
          >
            <div class="function-card-content">
              <h2 class="titleFontColor function-title">{{ item.label }}</h2>
              <div class="function-image-wrapper">
                <v-img 
                  :src="item.image" 
                  aspect-ratio="2.5" 
                  contain
                  class="function-image"
                ></v-img>
              </div>
            </div>
          </div>
        </v-col>

      </v-row>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/useStore'

const router = useRouter()
const store = useStore()

// 計算屬性：過濾有權限的功能項目
const items = computed(() => {
  return store.state.authKeys.filter(
    (item) =>
      store.state.pData[item.authKey] == "true" ||
      item.authKey == "pass" ||
      item.authKey == "exit_key"
  )
})

// 登出方法
const logout = () => {
  router.push("/login")
  sessionStorage.clear() // 清除sessionStorage
}
</script>


<style scoped>
.functionlist {
  min-height: 100vh;
  padding-bottom: 2rem;
}

.function-card {
  background: rgba(243, 229, 245, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 4px 16px var(--daycare-shadow-light),
              0 2px 4px var(--daycare-shadow);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.function-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(81, 45, 168, 0.1) 0%, 
    rgba(123, 31, 162, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.function-card:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 12px 32px var(--daycare-shadow),
              0 6px 16px var(--daycare-btn-hover-shadow);
  border-color: var(--daycare-accent);
}

.function-card:hover::before {
  opacity: 1;
}

.function-card:active {
  transform: translateY(-4px) scale(1.01);
  transition: all 0.2s ease;
}

.function-card-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.function-title {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  text-shadow: 2px 2px 4px rgba(81, 45, 168, 0.6);
}

.function-card:hover .function-title {
  text-shadow: 2px 2px 6px rgba(81, 45, 168, 0.8);
  transform: scale(1.05);
}

.function-image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.3);
  padding: 8px;
  transition: all 0.3s ease;
}

.function-card:hover .function-image-wrapper {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px var(--daycare-shadow);
}

.function-image {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(81, 45, 168, 0.2));
}

.function-card:hover .function-image {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(81, 45, 168, 0.4));
}

/* 登出按鈕特殊樣式 */
.function-card-exit {
  border-color: rgba(255, 107, 107, 0.3);
}

.function-card-exit:hover {
  border-color: rgba(255, 107, 107, 0.6);
  box-shadow: 0 12px 32px rgba(255, 107, 107, 0.3),
              0 6px 16px rgba(255, 107, 107, 0.2);
}

.function-card-exit::before {
  background: linear-gradient(135deg, 
    rgba(255, 107, 107, 0.1) 0%, 
    rgba(255, 82, 82, 0.05) 100%);
}

.function-card-exit:hover .function-title {
  color: #FF6B6B;
  text-shadow: 2px 2px 6px rgba(255, 107, 107, 0.8);
}

/* 響應式設計 */
@media (max-width: 960px) {
  .function-title {
    font-size: 1rem;
  }
  
  .function-card:hover {
    transform: translateY(-4px) scale(1.02);
  }
}

/* 過渡動畫 */
.v-row {
  transition: all 0.3s ease;
}

/* Ripple 效果優化 */
:deep(.v-ripple__container) {
  color: var(--daycare-accent);
}
</style>