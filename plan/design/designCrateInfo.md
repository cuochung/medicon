1. create_man 改為 createInfo
資料結構為{
    snkey: store.state.pData.snkey,
    name: store.state.pData.username,
    time: dayjs().format('YYYY-MM-DD HH:mm:ss')
}
2. edit_man 改為 editInfo
資料結構為{
    snkey: store.state.pData.snkey,
    name: store.state.pData.username,
    time: dayjs().format('YYYY-MM-DD HH:mm:ss')
}
以 push的方式存入 editInfo 裡
3. 只處理 addOK 及 editOK 裡的內容就可以了；直接定義在這兩個功能裡就好了；不用再做任何替代函數
4. index.vue 裡的 原來 create_man 的顯示內容；也由 createInfo.name 替代