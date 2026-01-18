<script setup>
import { computed, createApp, nextTick, ref, watch } from 'vue'
import dayjs from 'dayjs'
import api from '@/assets/js/api.js'

// Props
const props = defineProps({
  transactions: {
    type: Array,
    required: true,
    default: () => []
  },
  customerData: {
    type: Object,
    default: null
  },
  stats: {
    type: Object,
    required: true,
    default: () => ({
      filterTransactionType: null,
      filterStartDate: '',
      filterEndDate: '',
      totalRecharge: 0,
      totalDeduction: 0,
      totalCount: 0
    })
  },
  customers: {
    type: Array,
    default: () => []
  }
})

// 取得客戶名稱
const getCustomerName = (customerNumber) => {
  const customer = props.customers.find(c => c.customerNumber === customerNumber)
  return customer ? customer.customerFullName : null
}

// 格式化日期時間
const formatDateTime = (dateValue) => {
  if (!dateValue) return '-'
  const date = dayjs(dateValue)
  if (date.isValid()) {
    return date.format('YYYY-MM-DD HH:mm:ss')
  }
  return dateValue || '-'
}

// 格式化貨幣數字（用於輸出報表）
const formatCurrencyNumber = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// 計算屬性
const dateRange = computed(() => {
  const range = []
  if (props.stats.filterStartDate) {
    range.push(dayjs(props.stats.filterStartDate).format('YYYY年MM月DD日'))
  }
  if (props.stats.filterEndDate) {
    range.push(dayjs(props.stats.filterEndDate).format('YYYY年MM月DD日'))
  }
  return range
})

const subtitleText = computed(() => {
  const dateText = dateRange.value.length > 0 
    ? `查詢日期：${dateRange.value.join(' ~ ')}` 
    : '全部記錄'
  const typeText = props.stats.filterTransactionType 
    ? ` | 交易類型：${props.stats.filterTransactionType === 'recharge' ? '儲值' : '扣款'}` 
    : ''
  return dateText + typeText
})

const formattedTotalRecharge = computed(() => formatCurrencyNumber(props.stats.totalRecharge))
const formattedTotalDeduction = computed(() => formatCurrencyNumber(props.stats.totalDeduction))
const formattedNetAmount = computed(() => formatCurrencyNumber(props.stats.totalRecharge - props.stats.totalDeduction))
const printTime = computed(() => formatDateTime(new Date().toISOString()))

// 引用 template 中的報表模板
const reportTemplateRef = ref(null)

// 訂單資料
const orderData = ref([])
const orderMap = ref(new Map()) // 用 Map 存儲 documentNumber -> 訂單資料的映射

// 格式化日期（只顯示日期部分）
const formatDate = (dateValue) => {
  if (!dateValue) return '-'
  const date = dayjs(dateValue)
  if (date.isValid()) {
    return date.format('YYYY-MM-DD')
  }
  return dateValue || '-'
}

// 獲取訂單資料
const fetchOrderData = async () => {
  try {
    const rs = await api.get('orderdata')
    if (rs && rs.length > 0) {
      orderData.value = rs.map((i) => ({
        ...JSON.parse(i.datalist),
        snkey: i.snkey
      }))
      
      // 建立 documentNumber 到訂單資料的映射
      const map = new Map()
      orderData.value.forEach(order => {
        const docNum = order.documentNumber
        if (docNum) {
          if (!map.has(docNum)) {
            map.set(docNum, [])
          }
          map.get(docNum).push(order)
        }
      })
      orderMap.value = map
    }
  } catch (error) {
    console.error('獲取訂單資料失敗:', error)
  }
}

// 根據訂單編號獲取訂單資料
const getOrdersByDocumentNumber = (documentNumber) => {
  if (!documentNumber) return []
  return orderMap.value.get(documentNumber) || []
}

// 計算所有交易記錄中涉及的訂單編號
const uniqueDocumentNumbers = computed(() => {
  const docNumbers = new Set()
  props.transactions.forEach(transaction => {
    if (transaction.documentNumber) {
      docNumbers.add(transaction.documentNumber)
    }
  })
  return Array.from(docNumbers)
})

// 監聽 transactions 變化，自動獲取訂單資料
watch(() => props.transactions, async () => {
  if (props.transactions && props.transactions.length > 0) {
    await fetchOrderData()
  }
}, { immediate: true })

// 生成交易記錄報表 HTML（使用 Vue 3 template 構建）
const generateTransactionReportHTML = () => {
  return new Promise((resolve) => {
    // 使用雙重 nextTick 確保 DOM 完全渲染
    nextTick(() => {
      nextTick(() => {
        // 從 ref 中獲取已渲染的內容
        const templateElement = reportTemplateRef.value
        if (!templateElement) {
          console.error('無法找到報表模板，reportTemplateRef.value 為 null')
          console.log('請確保組件已經掛載')
          resolve('')
          return
        }

        // 獲取已經渲染好的報表內容
        const reportContainer = templateElement.querySelector('.report-container')
        if (!reportContainer) {
          console.error('無法找到報表容器 .report-container')
          console.log('templateElement:', templateElement)
          console.log('templateElement.innerHTML:', templateElement.innerHTML)
          resolve('')
          return
        }

        // 克隆容器內容以避免影響原 DOM
        const content = reportContainer.cloneNode(true).outerHTML
        
        // 調試信息
        console.log('成功獲取報表內容，長度:', content.length)
        if (content.length === 0) {
          console.warn('報表內容為空，請檢查數據是否正確傳入')
        }

      const reportStyle = `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Microsoft JhengHei', Arial, sans-serif;
          padding: 20px;
          background: #fff;
        }
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          background: #fff;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .report-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .report-subtitle {
          font-size: 14px;
          color: #666;
        }
        .info-section {
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-label {
          font-weight: bold;
          width: 120px;
          min-width: 120px;
        }
        .info-value {
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .summary-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #333;
        }
        .summary-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .summary-label {
          font-weight: bold;
          width: 150px;
          text-align: right;
          margin-right: 20px;
        }
        .summary-value {
          width: 150px;
          text-align: right;
          font-weight: bold;
        }
        .recharge {
          color: #4caf50;
        }
        .deduction {
          color: #f44336;
        }
        .print-date {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-top: 20px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      `

      const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>交易記錄報表</title>
  <style>${reportStyle}</style>
</head>
<body>
  ${content}
</body>
</html>`

        resolve(htmlContent)
      })
    })
  })
}

// 輸出交易記錄
const exportTransactions = async () => {
  if (props.transactions.length === 0) {
    return
  }

  // 生成 HTML 內容
  const htmlContent = await generateTransactionReportHTML()

  // 開啟新視窗顯示
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    // 等待內容載入後自動列印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }
}

// 暴露方法供外部調用
defineExpose({
  exportTransactions
})
</script>

<template>
  <!-- 報表模板（隱藏，僅用於生成 HTML） -->
  <div ref="reportTemplateRef" style="display: none;">
    <div class="report-container">
      <div class="report-header">
        <div class="report-title">交易記錄報表</div>
        <div class="report-subtitle">{{ subtitleText }}</div>
      </div>

      <div v-if="customerData" class="info-section">
        <div class="info-row">
          <span class="info-label">客戶名稱：</span>
          <span class="info-value">{{ customerData.customerFullName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">客戶編號：</span>
          <span class="info-value">{{ customerData.customerNumber || '-' }}</span>
        </div>
        <div v-if="customerData.customerAddress" class="info-row">
          <span class="info-label">客戶地址：</span>
          <span class="info-value">{{ customerData.customerAddress }}</span>
        </div>
        <div v-if="customerData.phone" class="info-row">
          <span class="info-label">電話：</span>
          <span class="info-value">{{ customerData.phone }}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%;">序號</th>
            <th style="width: 14%;">交易日期</th>
            <!-- <th style="width: 10%;">客戶編號</th> -->
            <!-- <th style="width: 12%;">客戶名稱</th> -->
            <th style="width: 6%;">交易類型</th>
            <th style="width: 8%;" class="text-right">交易金額</th>
            <th style="width: 12%;" class="text-right">交易前餘額</th>
            <th style="width: 12%;" class="text-right">交易後餘額</th>
            <th style="width: 14%;">訂單編號</th>
            <th style="width: 29%;">備註</th>
            <!-- <th style="width: 10%;">操作人員</th> -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="(transaction, index) in transactions" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td>{{ formatDateTime(transaction.transactionDate) }}</td>
            <!-- <td>{{ transaction.customerNumber || '-' }}</td> -->
            <!-- <td>{{ getCustomerName(transaction.customerNumber) || '-' }}</td> -->
            <td :class="['text-center', transaction.transactionType === 'recharge' ? 'recharge' : 'deduction']">
              <strong>{{ transaction.transactionType === 'recharge' ? '儲值' : '扣款' }}</strong>
            </td>
            <td :class="['text-right', transaction.transactionType === 'recharge' ? 'recharge' : 'deduction']">
              <strong>{{ transaction.transactionType === 'recharge' ? '+' : '-' }}{{ formatCurrencyNumber(Math.abs(transaction.amount || 0)) }}</strong>
            </td>
            <td class="text-right">{{ formatCurrencyNumber(transaction.balanceBefore || 0) }}</td>
            <td class="text-right"><strong>{{ formatCurrencyNumber(transaction.balanceAfter || 0) }}</strong></td>
            <td>{{ transaction.documentNumber || '-' }}</td>
            <td>{{ transaction.notes || '-' }}</td>
            <!-- <td>
              {{ transaction.createInfo ? transaction.createInfo.name : '-' }}
              <br v-if="transaction.createInfo && transaction.createInfo.time">
              <span v-if="transaction.createInfo && transaction.createInfo.time" style="font-size: 10px; color: #999;">{{ formatDateTime(transaction.createInfo.time) }}</span>
            </td> -->
          </tr>
        </tbody>
      </table>

      <v-divider></v-divider>

      <!-- 訂單內容總表 -->
      <div v-if="uniqueDocumentNumbers.length > 0" style="margin-top: 30px;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333;">
          訂單內容明細
        </div>
        
        <div v-for="docNumber in uniqueDocumentNumbers" :key="docNumber" style="margin-bottom: 30px;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #1976d2;">
            訂單編號：{{ docNumber }}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr>
                <th style="width: 12%; border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: center;">出貨日期</th>
                <th style="width: 25%; border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: center;">品名規格</th>
                <th style="width: 15%; border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: center;">規格</th>
                <th style="width: 12%; border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: right;">單價</th>
                <th style="width: 10%; border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: right;">數量</th>
                <th style="width: 15%; border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: right;">小計</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(order, index) in getOrdersByDocumentNumber(docNumber)" :key="index" :style="{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{ formatDate(order.orderDate) || '-' }}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">{{ order.productName || '-' }}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">{{ order.specification || '-' }}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{{ order.unitPrice ? formatCurrencyNumber(parseFloat(order.unitPrice)) : '-' }}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{{ order.quantity || '-' }}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">{{ order.amount ? formatCurrencyNumber(parseFloat(order.amount)) : '-' }}</td>
              </tr>
              <!-- 合計行 -->
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: right;">合計：</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                  {{ formatCurrencyNumber(getOrdersByDocumentNumber(docNumber).reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-row">
          <span class="summary-label">交易筆數：</span>
          <span class="summary-value">{{ stats.totalCount }} 筆</span>
        </div>
        <div class="summary-row">
          <span class="summary-label" style="color: #4caf50;">儲值總額：</span>
          <span class="summary-value" style="color: #4caf50;">{{ formattedTotalRecharge }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label" style="color: #f44336;">扣款總額：</span>
          <span class="summary-value" style="color: #f44336;">{{ formattedTotalDeduction }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">淨額：</span>
          <span class="summary-value">{{ formattedNetAmount }}</span>
        </div>
      </div>

      

      <v-divider></v-divider>
      <div class="print-date">列印時間：{{ printTime }}</div>
    </div>

    
  </div>
</template>

