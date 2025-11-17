1. 畫面風格是 日間照護風格
2. 主要配色都放在 assets/css/mystyle.css 裡
3. 依以上條件處理畫面的版面及配色
4. 語法改為 vue3
5. ui 使用 vuetify3；畫面結構儘量用 vuetify3的語法去架構
6. api的用法是 import api from '@/assets/js/api.js'
7. api使用到 general/getBykey 時;一律改為 byjson/searchByKeyValue
8. vuetify3 v-for 使用時，資料要 加上 .raw 才讀到的內容