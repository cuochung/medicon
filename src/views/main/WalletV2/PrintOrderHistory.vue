<script setup>
import { computed, nextTick, ref } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  orders: {
    type: Array,
    required: true,
    default: () => [],
  },
  walletInfo: {
    type: Object,
    default: null,
  },
  customerName: {
    type: String,
    default: '',
  },
  filterStartDate: {
    type: String,
    default: '',
  },
  filterEndDate: {
    type: String,
    default: '',
  },
})

const formatDate = (value) => {
  if (!value) return '-'
  const d = dayjs(value)
  if (!d.isValid()) return value || '-'
  return d.format('YYYY-MM-DD')
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const d = dayjs(value)
  if (!d.isValid()) return value || '-'
  return d.format('YYYY-MM-DD HH:mm:ss')
}

const formatCurrencyNumber = (amount) => {
  const n = Number.isFinite(Number(amount)) ? Number(amount) : 0
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

const subtitleText = computed(() => {
  const parts = []
  if (props.filterStartDate || props.filterEndDate) {
    const range = []
    if (props.filterStartDate) range.push(formatDate(props.filterStartDate))
    if (props.filterEndDate) range.push(formatDate(props.filterEndDate))
    parts.push(`查詢日期：${range.join(' ~ ')}`)
  } else {
    parts.push('全部記錄')
  }
  if (props.customerName) {
    parts.push(`客戶：${props.customerName}`)
  }
  return parts.join(' ｜ ')
})

const printTime = computed(() => formatDateTime(new Date().toISOString()))

const reportTemplateRef = ref(null)

const generateReportHTML = () => {
  return new Promise((resolve) => {
    nextTick(() => {
      nextTick(() => {
        const wrap = reportTemplateRef.value
        if (!wrap) {
          resolve('')
          return
        }
        const container = wrap.querySelector('.report-container')
        if (!container) {
          resolve('')
          return
        }
        const content = container.cloneNode(true).outerHTML

        const style = `
          *{margin:0;padding:0;box-sizing:border-box;}
          body{font-family:'Microsoft JhengHei',Arial,sans-serif;padding:20px;background:#fff;}
          .report-container{max-width:1200px;margin:0 auto;background:#fff;}
          .report-header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #333;}
          .report-title{font-size:24px;font-weight:bold;margin-bottom:10px;}
          .report-subtitle{font-size:14px;color:#666;}
          .info-section{margin:20px 0;}
          .info-row{display:flex;margin-bottom:6px;font-size:13px;}
          .info-label{width:110px;min-width:110px;font-weight:bold;}
          .info-value{flex:1;}
          table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;}
          th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}
          th{background:#f5f5f5;font-weight:bold;text-align:center;}
          tr:nth-child(even){background:#fafafa;}
          .text-right{text-align:right;}
          .text-center{text-align:center;}
          .print-date{text-align:right;font-size:12px;color:#666;margin-top:20px;}
          @media print{body{padding:0}.no-print{display:none}}
        `

        const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>會員儲值v2 交易記錄</title>
  <style>${style}</style>
</head>
<body>
  ${content}
</body>
</html>`

        resolve(html)
      })
    })
  })
}

const exportTransactions = async () => {
  if (!props.orders || props.orders.length === 0) return

  const html = await generateReportHTML()
  if (!html) return

  const win = window.open('', '_blank')
  if (!win) return

  win.document.write(html)
  win.document.close()
}

defineExpose({
  exportTransactions,
})
</script>

<template>
  <!-- 隱藏報表模板，僅供輸出用 -->
  <div ref="reportTemplateRef" style="display: none;">
    <div class="report-container">
      <div class="report-header">
        <div class="report-title">會員儲值 V2 交易記錄</div>
        <div class="report-subtitle">{{ subtitleText }}</div>
      </div>

      <div class="info-section" v-if="walletInfo">
        <div class="info-row">
          <span class="info-label">基準日：</span>
          <span class="info-value">{{ walletInfo.baseDate || '未設定' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">目前儲值餘額：</span>
          <span class="info-value">{{ formatCurrencyNumber(walletInfo.baseAmount) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">本次查詢扣款金額：</span>
          <span class="info-value">{{ formatCurrencyNumber(walletInfo.usedAmount) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">預估剩餘餘額：</span>
          <span class="info-value">{{ formatCurrencyNumber(walletInfo.remainAmount) }}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:6%;">序號</th>
            <th style="width:12%;">訂購日期</th>
            <th style="width:16%;">訂單編號</th>
            <th style="width:24%;">客戶名稱</th>
            <th style="width:26%;">產品名稱</th>
            <th style="width:12%;">金額(含稅)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in orders" :key="row.snkey || idx">
            <td class="text-center">{{ idx + 1 }}</td>
            <td>{{ formatDate(row.orderDate) }}</td>
            <td>{{ row.documentNumber }}</td>
            <td>{{ row.customerFullName }}</td>
            <td>{{ row.productName }}</td>
            <td class="text-right">{{ formatCurrencyNumber(row.amountWithTax) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="print-date">列印時間：{{ printTime }}</div>
    </div>
  </div>
</template>

