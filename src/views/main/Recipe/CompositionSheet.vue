<template>
  <div class="composition-sheet pa-6">
    <v-container fluid class="pa-0">
      <v-row>
        <v-col cols="12">
          <v-sheet class="composition-hero" elevation="0" rounded="xl">
            <div class="d-flex flex-column flex-md-row align-center justify-space-between">
              <div class="d-flex align-center mb-4 mb-md-0">
                <v-btn
                  icon
                  variant="text"
                  class="mr-2"
                  color="primary"
                  @click="goBack"
                >
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <div>
                  <h2 class="hero-title mb-1">成分表</h2>
                  <p class="hero-subtitle mb-0">
                    顯示配方的 INCI 成分與 wt% 組成。
                  </p>
                </div>
              </div>
              <div class="text-body-2 text-medium-emphasis">
                <span v-if="recipeBasic.recipeNumber">
                  配方編號：<strong>{{ recipeBasic.recipeNumber }}</strong>
                </span>
                <span v-if="recipeBasic.version" class="ml-4">
                  版本：<strong>{{ recipeBasic.version }}</strong>
                </span>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" v-if="loading">
        <v-col cols="12">
          <v-sheet class="d-flex align-center justify-center py-10" rounded="xl">
            <v-progress-circular indeterminate color="primary" size="40" />
            <span class="ml-4 text-subtitle-1">載入成分表中，請稍候…</span>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mt-4" v-else>
        <v-col cols="12">
          <v-card class="info-card" variant="tonal" color="primary">
            <v-card-title class="info-card__title">
              配方資訊
            </v-card-title>
            <v-card-text>
              <v-row class="info-grid">
                <v-col cols="12" md="4">
                  <div class="info-row">
                    <span class="info-label">配方編號</span>
                    <span class="info-value">{{ recipeBasic.recipeNumber || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">產品名稱</span>
                    <span class="info-value">{{ recipeBasic.productName || '-' }}</span>
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="info-row">
                    <span class="info-label">版本</span>
                    <span class="info-value">{{ recipeBasic.version || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">產品規格</span>
                    <span class="info-value">{{ recipeBasic.productSpec || '-' }}</span>
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="info-row">
                    <span class="info-label">生產批量</span>
                    <span class="info-value">{{ recipeBasic.productionBatch || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">總生產量</span>
                    <span class="info-value">{{ recipeBasic.totalProduction || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">原料數量</span>
                    <span class="info-value">{{ recipeBasic.itemCount }}</span>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card class="summary-card" variant="tonal" color="info">
            <v-card-title class="info-card__title">
              成分統計
            </v-card-title>
            <v-card-text>
              <div class="info-row">
                <span class="info-label">成分數量</span>
                <span class="info-value">{{ compositions.length }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">總 wt%</span>
                <span class="info-value">{{ totalFinalPercentage.toFixed(3) }}%</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4" v-if="!loading">
        <v-col cols="12">
          <v-alert
            v-if="warningMessages.length > 0"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <div v-for="(msg, idx) in warningMessages" :key="idx">
              {{ msg }}
            </div>
          </v-alert>

          <v-alert
            v-if="!recipeFound"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            找不到指定的配方資料，請返回配方列表重新操作。
          </v-alert>

          <v-card class="table-card" v-if="recipeFound">
            <v-table fixed-header class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-left" style="width: 60px;">No</th>
                  <th class="text-left" style="width: 220px;">Composition</th>
                  <th class="text-left" style="width: 120px;">Breakdown INCI Name</th>
                  <th class="text-left">CAS No</th>
                  <th class="text-left">Function</th>
                  <th class="text-left" style="width: 140px;">wt%</th>
                  <th class="text-left">來源原料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in compositions" :key="row.key">
                  <td>{{ index + 1 }}</td>
                  <td>{{ row.compositionText }}</td>
                  <td>{{ row.breakdownInciName }}</td>
                  <td>{{ row.casNo || '-' }}</td>
                  <td>{{ row.ingredientFunction || '-' }}</td>
                  <td>{{ row.finalPercentage.toFixed(4) }}%</td>
                  <td>
                    <div class="source-list">
                      <div
                        v-for="(src, sIdx) in row.sources"
                        :key="sIdx"
                        class="text-caption"
                      >
                        {{ src.materialNumber }}（{{ src.materialName || '-' }}）：
                        {{ src.recipePercentage.toFixed(4) }}% ×
                        {{ src.materialWtPercent.toFixed(4) }}%
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-if="compositions.length === 0">
                  <td colspan="7" class="text-center py-6 text-medium-emphasis">
                    沒有符合搜尋條件的成分資料。
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/assets/js/api.js'

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const props = defineProps({
  snkey: {
    type: String,
    required: false,
  },
})

const loading = ref(true)
const recipeFound = ref(false)
const recipeBasic = ref({
  recipeNumber: '',
  productName: '',
  version: '',
  productSpec: '',
  productionBatch: '',
  totalProduction: '',
  itemCount: 0,
})

const compositions = ref([])
const warningMessages = ref([])

const goBack = () => {
  router.push({ name: 'Recipe' })
}

const parseWtPercent = (value) => {
  if (value === null || value === undefined || value === '') {
    return NaN
  }
  let text = String(value).replace('%', '').trim()
  if (text === '') return NaN
  if (isNaN(parseFloat(text))) return NaN
  let numValue = parseFloat(text)
  if (numValue > 0 && numValue <= 1) {
    numValue = numValue * 100
  }
  return numValue
}

const loadData = async () => {
  loading.value = true
  warningMessages.value = []
  compositions.value = []
  recipeFound.value = false

  try {
    const recipeRs = await api.get('recipe')
    let targetRecipe = null
    const paramSnkey = props.snkey || route.params.snkey

    if (recipeRs && recipeRs.length > 0) {
      const mapped = recipeRs.map((row) => ({
        ...JSON.parse(row.datalist),
        snkey: row.snkey,
      }))
      if (paramSnkey) {
        targetRecipe = mapped.find((r) => String(r.snkey) === String(paramSnkey))
      }
      if (!targetRecipe && mapped.length > 0) {
        targetRecipe = mapped[0]
        warningMessages.value.push('找不到對應 snkey 的配方，已暫時顯示第一筆資料。')
      }
    }

    if (!targetRecipe) {
      recipeFound.value = false
      loading.value = false
      return
    }

    recipeFound.value = true

    const items = Array.isArray(targetRecipe.items) ? targetRecipe.items : []
    recipeBasic.value = {
      recipeNumber: targetRecipe.recipeNumber || '',
      productName: targetRecipe.productName || '',
      version: targetRecipe.version || '',
      productSpec: targetRecipe.productSpec || '',
      productionBatch: targetRecipe.productionBatch || '',
      totalProduction: targetRecipe.totalProduction || '',
      itemCount: items.length,
    }

    const rawRs = await api.get('raw_material')
    const materialMap = new Map()

    if (rawRs && rawRs.length > 0) {
      rawRs.forEach((row) => {
        try {
          const data = JSON.parse(row.datalist)
          if (!data.materialNumber) return
          materialMap.set(data.materialNumber, {
            ...data,
            snkey: row.snkey,
          })
        } catch (e) {
          console.warn('解析原料資料失敗', e)
        }
      })
    }

    const missingMaterials = []
    const noCompositionMaterials = []
    const compMap = new Map()

    items.forEach((item) => {
      const materialNumber = (item.materialNumber || '').trim()
      if (!materialNumber) return

      const recipePercentage = parseFloat(item.percentage) || 0
      if (recipePercentage === 0) return

      const material = materialMap.get(materialNumber)
      if (!material) {
        missingMaterials.push(materialNumber)
        return
      }

      const materialCompositions = Array.isArray(material.compositions)
        ? material.compositions
        : []

      if (materialCompositions.length === 0) {
        noCompositionMaterials.push(
          `${materialNumber}${material.materialName ? `（${material.materialName}）` : ''}`,
        )
        return
      }

      materialCompositions.forEach((comp) => {
        const wt = parseWtPercent(comp.wtPercent)
        if (!isFinite(wt) || isNaN(wt)) {
          return
        }

        const inciName = comp.breakdownInciName || comp.composition
        if (!inciName) return

        const key = `${comp.casNo || ''}|${inciName}`
        const finalP = (recipePercentage * wt) / 100

        if (!compMap.has(key)) {
          compMap.set(key, {
            key,
            inciName,
            compositionText: comp.composition || '',
            breakdownInciName: comp.breakdownInciName || '',
            casNo: comp.casNo || '',
            ingredientFunction: comp.ingredientFunction || '',
            finalPercentage: 0,
            sources: [],
          })
        }

        const entry = compMap.get(key)

        if (!entry.compositionText && comp.composition) {
          entry.compositionText = comp.composition
        }
        if (!entry.breakdownInciName && comp.breakdownInciName) {
          entry.breakdownInciName = comp.breakdownInciName
        }

        entry.finalPercentage += finalP
        entry.sources.push({
          materialNumber,
          materialName: material.materialName || '',
          recipePercentage,
          materialWtPercent: wt,
        })
      })
    })

    if (missingMaterials.length > 0) {
      warningMessages.value.push(
        `下列料號在原料資料中找不到，已略過：${missingMaterials.join(', ')}`,
      )
    }

    if (noCompositionMaterials.length > 0) {
      warningMessages.value.push(
        `下列原料未建立成分組成，未納入計算：${noCompositionMaterials.join(', ')}`,
      )
    }

    const resultList = Array.from(compMap.values())
    resultList.sort((a, b) => b.finalPercentage - a.finalPercentage)
    compositions.value = resultList
  } catch (error) {
    console.error('載入成分表資料失敗', error)
    proxy?.$swal?.({
      title: '載入失敗',
      text: error.message || '取得配方或原料資料時發生錯誤',
      icon: 'error',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center',
    })
  } finally {
    loading.value = false
  }
}

const totalFinalPercentage = computed(() =>
  compositions.value.reduce((sum, c) => sum + (c.finalPercentage || 0), 0),
)

onMounted(async () => {
  await loadData()
})
</script>

<style scoped lang="scss">
.composition-sheet {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(168, 197, 181, 0.18), rgba(123, 163, 184, 0.1));
}

.composition-hero {
  background: linear-gradient(135deg, rgba(74, 107, 95, 0.18), rgba(123, 163, 184, 0.2));
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 10px 24px rgba(74, 107, 95, 0.18);
  padding: 24px;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--daycare-primary);
}

.hero-subtitle {
  color: rgba(74, 107, 95, 0.78);
}

.info-card {
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(74, 107, 95, 0.12);
  border: 1px solid rgba(91, 143, 163, 0.18);

  &__title {
    font-size: 1rem;
    font-weight: 700;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .info-label {
    font-size: 0.85rem;
    color: rgba(74, 107, 95, 0.78);
  }

  .info-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--daycare-primary);
    margin-left: 12px;
  }
}

.info-grid {
  row-gap: 8px;
}

.summary-card {
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(74, 107, 95, 0.12);
  border: 1px solid rgba(91, 143, 163, 0.18);
}

.search-field {
  min-width: 220px;
}

.table-card {
  border-radius: 24px;
  box-shadow: 0 14px 40px rgba(74, 107, 95, 0.14);
  border: 1px solid rgba(91, 143, 163, 0.16);
}

.source-list {
  max-height: 120px;
  overflow-y: auto;
}
</style>

