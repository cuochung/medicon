import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useStore = defineStore('company', () => {
  const state = {
    verMsg: "2025.11.14.1",
    databaseName: "medicon", //資料庫名
    base_url: "http://localhost/mediconapi", //localhost測試用
    // base_url: "https://www.pddtvgame.com/mediconapi", //線上專用指定去讀圖片或其他東西的位置

    loading: false, //載入中

    //暫存用資料
    cData: {},  //廠商資料
    pData: {},  //使用者

    usingItems: [], //處理中頁面暫存資料
    customerItems: [], //會員資料

    //功能名稱,樣式,key值,引用圖片,授權,icon圖片設定,
    authKeys: [
      {
        label: "顧客管理", class: "ma-1 white--text", color: "primary", keyName: 'customer',
        image: new URL('@/assets/img/kankou_shopping_asia.png', import.meta.url).href,
        route: "/main/Customer",
        authKey: "customer_key",
        icon: 'mdi-account',
      },
      {
        label: "訂單管理", class: "ma-1 white--text", color: "primary", keyName: 'order',
        image: new URL('@/assets/img/shopping_order_youshi.png', import.meta.url).href,
        route: "/main/Order",
        authKey: "order_key",
        icon: 'mdi-account',
      },
      
      {
        label: "人員管理", class: "ma-1 white--text", color: "purple", keyName: 'personnel',
        image: new URL('@/assets/img/benkyoukai_kunrenkou_asia.png', import.meta.url).href,
        route: "/main/Personnel",
        authKey: "personnel_key",
        icon: 'mdi-account',
      },
      

      {
        label: "登出", class: "ma-1 white--text", color: "dark", keyName: 'exit',
        image: new URL('@/assets/img/text_exit.png', import.meta.url).href,
        route: "/login",
        authKey: "exit_key",
        icon: 'mdi-logout',
      },
    ],
  }

  //全域toast multi功能;基本上只把要toast的暫存在pinia裡,其他都由PDDToastMultiV2Pinia去控制顯示結果,
  const toasts = ref([])
  const showToastMulti = (newToast) => {
    console.log('newToast',newToast)
    let finalToast = {
      ...newToast,
      timeStamp: Date.now(), //設定時間,用在顯示動畫的key使用,也可以拿來計算動畫剩餘時間
      active: true, //動畫是否執行
      closeTime: newToast.closeTime ? newToast.closeTime : 5
    }
    toasts.value.push(finalToast)

    setTimeout(() => {
      closeShowToastMulti(finalToast.timeStamp)
    }, finalToast.closeTime * 1000)
  }
  //關閉toast內容 for multi ver.
  const closeShowToastMulti = (timeStamp) => {
    toasts.value.some((i, index) => {
      let str = JSON.stringify(i)
      if (str.includes(String(timeStamp)) && i.active) {
        toasts.value.splice(index, 1)
      }
    })
  }
  //全域toast multi功能 end

  return {
    state, //暫存用的都放這裡
    toasts, showToastMulti, closeShowToastMulti,  //multi toast用的到
    // handleImageError,
  }
})
