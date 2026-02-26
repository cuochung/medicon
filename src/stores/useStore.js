import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useStore = defineStore('company', () => {

  // let setBaseUrl = 'http://localhost'; //地區測試
  const setBaseUrl = 'https://www.pddtvgame.com'; //線上主機
  // const setBaseUrl = 'https://www.pddtech.online'; //線上二號機


  const state = {
    verMsg: "2026.2.26.1",
    databaseName: "medicon", //資料庫名
    base_url: `${setBaseUrl}/mediconapi`, //線上專用指定去讀圖片或其他東西的位置

    rustBaseURL: `${setBaseUrl}:3000`, // Rust 伺服器 baseURL
    rustApiToken: "your-internal-secret-key", // Rust 伺服器 API Token

    loading: false, //載入中

    //暫存用資料
    cData: {},  //廠商資料
    pData: {},  //使用者

    usingItems: [], //處理中頁面暫存資料
    customerItems: [], //會員資料

    //功能名稱,樣式,key值,引用圖片,授權,icon圖片設定,
    authKeys: [
      //配方管理
      {
        label: "配方管理", class: "ma-1 white--text", color: "primary", keyName: 'Recipe',
        image: new URL('@/assets/img/document_meisaisyo.png', import.meta.url).href,
        route: "/main/Recipe",
        authKey: "Recipe_key",
        icon: 'mdi-bottle-tonic-outline',
      },
      {
        label: "原料管理", class: "ma-1 white--text", color: "primary", keyName: 'RawMaterial',
        image: new URL('@/assets/img/job_chinretsu_man.png', import.meta.url).href,
        route: "/main/RawMaterial",
        authKey: "RawMaterial_key",
        icon: 'mdi-bottle-tonic-outline',
      },
      {
        label: "供應商管理", class: "ma-1 white--text", color: "primary", keyName: 'supplier',
        image: new URL('@/assets/img/nimotsu_box_close_bad.png', import.meta.url).href,
        route: "/main/Supplier",
        authKey: "supplier_key",
        icon: 'mdi-store',
      },
      {
        label: "客戶管理", class: "ma-1 white--text", color: "primary", keyName: 'customer',
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
        label: "會員儲值", class: "ma-1 white--text", color: "success", keyName: 'wallet',
        image: new URL('@/assets/img/saifu_gamaguchi.png', import.meta.url).href,
        route: "/main/Wallet",
        authKey: "wallet_key",
        icon: 'mdi-wallet',
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
