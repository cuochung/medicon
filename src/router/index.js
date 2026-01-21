import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: 'Login' },
  },
  {
    path: '/main',
    name: 'main',
    component: () => import('@/views/main/Main.vue'),
    // meta: { title: '主畫面' },
    children: [
      { path: 'functionlist', name: 'functionlist', component: () => import('@/views/main/FunctionList.vue') },
      { path: 'Supplier', name: 'Supplier', component: () => import('@/views/main/Supplier/index.vue') },
      { path: 'Personnel', name: 'Personnel', component: () => import('@/views/main/Personnel/index.vue') },
      { path: 'Customer', name: 'Customer', component: () => import('@/views/main/Customer/index.vue') },
      { path: 'Order', name: 'Order', component: () => import('@/views/main/Order/index.vue') },
      { path: 'RawMaterial', name: 'RawMaterial', component: () => import('@/views/main/RawMaterial/index.vue') },
      { path: 'Wallet', name: 'Wallet', component: () => import('@/views/main/Wallet/index.vue') },
      { path: 'Wallet/Recharge', name: 'WalletRecharge', component: () => import('@/views/main/Wallet/Recharge.vue') },
      { path: 'Wallet/Deduction', name: 'WalletDeduction', component: () => import('@/views/main/Wallet/Deduction.vue') },
      { path: 'Wallet/OrderQuery', name: 'WalletOrderQuery', component: () => import('@/views/main/Wallet/OrderQuery.vue') },
      { path: 'Wallet/TransactionHistory', name: 'WalletTransactionHistory', component: () => import('@/views/main/Wallet/TransactionHistory.vue') },
      { path: 'Wallet/BalanceQuery', name: 'WalletBalanceQuery', component: () => import('@/views/main/Wallet/BalanceQuery.vue') },
    ]
  },

  //列印區
  // { path: '/NursingplanPrint', name: 'NursingplanPrint', component: () => import('@/views/main/Documents/Nursingplan/PrintPage.vue') },
  // { path: '/NursingrecordPrint', name: 'NursingrecordPrint', component: () => import('@/views/main/Documents/Nursingrecord/PrintPage.vue') },
  // {
  //   path: '/orderpage',
  //   name: 'orderpage',
  //   component: () => import('@/views/orderpage/index.vue'),
  //   meta: { title: '會員功能' },
  // },
  // 將 404 路由放在最後
  { path: '/:pathMatch(.*)*', redirect: '/' },

]

const router = createRouter({
  history: createWebHistory('/medicon/'),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.title != undefined) {
    window.document.title = to.meta.title
  } else {
    window.document.title = '美光生技'
  }
  next()
})

export default router
