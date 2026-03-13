<template>
  <div class="import-excel-wallet-v2">
    <v-dialog v-model="dialog" max-width="800" persistent>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          color="primary"
          variant="elevated"
          prepend-icon="mdi-file-import"
          rounded="pill"
          elevation="6"
          @click="openDialog"
        >
          匯入 Excel
        </v-btn>
      </template>

      <v-card class="import-dialog" rounded="xl">
        <v-card-title class="d-flex dialog-title dialog-title--import" primary-title>
          <div class="text-h6 font-weight-bold">匯入儲金餘額（客戶名與餘額）</div>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            class="ml-2"
            variant="text"
            color="white"
            @click="closeDialog"
          />
        </v-card-title>

        <v-card-text class="pt-6">
          <v-sheet class="info-section" color="primary-lighten-5" variant="tonal" rounded="lg">
            <div class="info-section__header mb-4">
              <v-icon color="primary" size="24">mdi-file-excel</v-icon>
              <span class="text-subtitle-1 font-weight-bold text-primary ml-2">選擇 Excel 檔案</span>
            </div>
            <p class="text-caption text-medium-emphasis mb-2">
              表頭需包含「客戶」、「結算2月餘額」（或「結算餘額」）。餘額可為正數（如 24,400）或括號負數（如 (6,560)）。
            </p>
            <v-file-input
              v-model="selectedFile"
              label="選擇 Excel 檔案"
              accept=".xlsx,.xls"
              prepend-icon="mdi-file-excel"
              variant="outlined"
              density="comfortable"
              :rules="fileRules"
              @update:model-value="onFileSelected"
            />

            <v-alert v-if="selectedFileName" type="info" variant="tonal" class="mt-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-file-check</v-icon>
                <span>已選擇檔案: {{ selectedFileName }}</span>
              </div>
            </v-alert>
          </v-sheet>

          <v-sheet
            v-if="datas.length > 0"
            class="data-preview mt-4"
            color="success-lighten-5"
            variant="tonal"
            rounded="lg"
          >
            <div class="info-section__header mb-3">
              <v-icon color="success" size="24">mdi-check-circle</v-icon>
              <span class="text-subtitle-1 font-weight-bold text-success ml-2">
                資料預覽 (共 {{ datas.length }} 筆)
              </span>
            </div>
            <v-alert type="success" variant="tonal" class="mb-4">
              資料已成功解析，共 {{ datas.length }} 筆記錄
            </v-alert>
            <v-table density="compact" class="preview-table">
              <thead>
                <tr>
                  <th>客戶名稱</th>
                  <th class="text-end">儲金餘額</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in datas.slice(0, 5)" :key="index">
                  <td>{{ item.customerName || '—' }}</td>
                  <td class="text-end">{{ formatBalance(item.balance) }}</td>
                </tr>
              </tbody>
            </v-table>
            <div v-if="datas.length > 5" class="text-caption text-center mt-2 pa-2">
              僅顯示前 5 筆，共 {{ datas.length }} 筆資料
            </div>
          </v-sheet>

          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
            {{ errorMessage }}
          </v-alert>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="closeDialog">
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-white"
            :disabled="!selectedFile || datas.length === 0"
            :loading="loading"
            @click="processImport"
          >
            確認匯入
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'
import { useStore } from '@/stores/useStore'
import * as XLSX from 'xlsx'
import api from '@/assets/js/api.js'
import dayjs from 'dayjs'

const emit = defineEmits(['imported'])
const { proxy } = getCurrentInstance()
const store = useStore()

const dialog = ref(false)
const selectedFile = ref(null)
const selectedFileName = ref('')
const datas = ref([])
const errorMessage = ref('')
const loading = ref(false)

// Excel 欄位（中文）→ 後端欄位（英文）
const FIELD_MAP = {
  '客戶': 'customerName',
  '結算2月餘額': 'balance',
  '結算餘額': 'balance'
}

const fileRules = [
  (v) => !!v || '請選擇 Excel 檔案',
  (v) => {
    if (!v) return true
    const extension = (v.name || '').split('.').pop()?.toLowerCase()
    return ['xlsx', 'xls'].includes(extension) || '請選擇 .xlsx 或 .xls 檔案'
  }
]

function formatBalance (val) {
  const n = parseFloat(val)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/** 解析餘額字串：支援 "24,400"、" (6,560) " 等格式 */
function parseBalance (str) {
  if (str == null || String(str).trim() === '') return 0
  let s = String(str).trim()
  const isNegative = s.startsWith('(')
  s = s.replace(/[(),\s]/g, '')
  const n = parseFloat(s)
  if (Number.isNaN(n)) return 0
  return isNegative ? -n : n
}

function openDialog () {
  dialog.value = true
  resetForm()
}

function closeDialog () {
  if (loading.value) return
  dialog.value = false
  resetForm()
}

function resetForm () {
  selectedFile.value = null
  selectedFileName.value = ''
  datas.value = []
  errorMessage.value = ''
  loading.value = false
}

function onFileSelected (file) {
  if (!file) {
    selectedFileName.value = ''
    datas.value = []
    errorMessage.value = ''
    return
  }
  selectedFileName.value = file.name
  errorMessage.value = ''
  datas.value = []
  parseExcelFile(file).then(() => {}).catch((err) => {
    console.error('Excel parsing error:', err)
    errorMessage.value = `解析 Excel 檔案時發生錯誤: ${err.message}`
    datas.value = []
  })
}

function parseExcelFile (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

        if (jsonData.length < 2) {
          reject(new Error('Excel 檔案至少需要包含標題行和一行資料'))
          return
        }

        const headers = jsonData[0]
        const needCustomer = 'customerName'
        const needBalance = 'balance'
        const hasCustomer = headers.some((h) => FIELD_MAP[String(h).trim()] === 'customerName')
        const hasBalance = headers.some((h) => FIELD_MAP[String(h).trim()] === 'balance')
        if (!hasCustomer || !hasBalance) {
          reject(new Error('表頭須包含「客戶」以及「結算2月餘額」或「結算餘額」'))
          return
        }

        const headerIndexMap = {}
        headers.forEach((header, index) => {
          const key = FIELD_MAP[String(header).trim()]
          if (key) headerIndexMap[key] = index
        })

        const parsedData = []
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (row.every((cell) => !cell || String(cell).trim() === '')) continue

          const customerName = row[headerIndexMap.customerName] != null
            ? String(row[headerIndexMap.customerName]).trim()
            : ''
          const rawBalance = row[headerIndexMap.balance] != null ? row[headerIndexMap.balance] : ''
          const balance = parseBalance(rawBalance)

          parsedData.push({ customerName, balance })
        }

        if (parsedData.length === 0) {
          reject(new Error('Excel 檔案中沒有有效的資料行'))
          return
        }

        datas.value = parsedData
        resolve(parsedData)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('讀取檔案時發生錯誤'))
    reader.readAsArrayBuffer(file)
  })
}

async function processImport () {
  if (datas.value.length === 0) {
    proxy.$swal({
      icon: 'warning',
      title: '沒有可匯入的資料',
      text: '請先選擇並解析 Excel 檔案',
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center'
    })
    return
  }

  const result = await proxy.$swal({
    icon: 'warning',
    title: '確認要清空後再匯入嗎？',
    text: 'walletdatav2 既有資料將會被清空，再匯入目前 Excel 的全部筆數。',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
  })

  if (!result.isConfirmed) {
    return
  }

  loading.value = true
  try {
    // 先用 truncateTable 清空 walletdatav2（參考 shuaya 專案用法）
    const truncateRs = await api.options(
      `general/truncateTable/${store.state.databaseName}/walletdatav2`
    )
    console.log('[WalletV2 匯入] truncate walletdatav2 result:', truncateRs)

    if (!truncateRs || truncateRs.state !== 1) {
      loading.value = false
      proxy.$swal({
        icon: 'error',
        title: '清空資料表失敗',
        text: truncateRs?.message || truncateRs?.msg || '無法清空 walletdatav2，匯入已中止。',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6',
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: false,
        position: 'center'
      })
      return
    }

    const payload = datas.value.map((item) => ({
      datalist: JSON.stringify({
        customerName: item.customerName,
        balance: item.balance,
        createInfo: {
          snkey: store.state.pData?.snkey,
          name: store.state.pData?.username || '',
          time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        },
        editInfo: []
      })
    }))

    const rs = await api.options(
      `general/addMulti/${store.state.databaseName}/walletdatav2`,
      payload
    )

    loading.value = false

    const hasError = Array.isArray(rs) && rs.some((item) => item?.state === 0)
    if (hasError) {
      proxy.$swal({
        icon: 'error',
        title: '匯入過程發生錯誤',
        text: '部分資料可能未能成功匯入，請稍後再試',
        confirmButtonText: '確定',
        confirmButtonColor: '#3085d6',
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: false,
        position: 'center'
      })
      return
    }

    proxy.$swal({
      icon: 'success',
      title: '匯入成功',
      text: `已成功清空並匯入 ${datas.value.length} 筆資料`,
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center'
    })

    closeDialog()
    emit('imported')
  } catch (err) {
    loading.value = false
    console.error('匯入錯誤:', err)
    proxy.$swal({
      icon: 'error',
      title: '匯入失敗',
      text: err?.message || '未知錯誤',
      confirmButtonText: '確定',
      confirmButtonColor: '#3085d6',
      toast: false,
      timer: null,
      showConfirmButton: true,
      showCancelButton: false,
      position: 'center'
    })
  }
}
</script>

<style scoped lang="scss">
.import-dialog {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--daycare-divider-light);
  box-shadow: 0 24px 60px rgba(74, 107, 95, 0.22);
}

.dialog-title {
  padding: 18px 24px;
  font-size: 1.15rem;
  color: #ffffff;

  &--import {
    background: linear-gradient(135deg, rgba(74, 107, 95, 0.95), rgba(123, 163, 184, 0.85));
  }
}

.info-section {
  padding: 18px 20px;
  background-color: rgba(255, 255, 255, 0.86) !important;
  border: 1px solid rgba(123, 163, 184, 0.25);
  box-shadow: 0 8px 22px rgba(74, 107, 95, 0.12);

  &__header {
    display: flex;
    align-items: center;
  }
}

.data-preview {
  padding: 18px 20px;
  background-color: rgba(255, 255, 255, 0.86) !important;
  border: 1px solid rgba(123, 163, 184, 0.25);
  box-shadow: 0 8px 22px rgba(74, 107, 95, 0.12);
}

.preview-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: rgba(74, 107, 95, 0.1);
    font-weight: 600;
    color: var(--daycare-primary);
  }

  td, th {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(123, 163, 184, 0.2);
  }
}
</style>
