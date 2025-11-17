<template>
  <div class="PDDDataIterator">
    <div class="footer">
      <div class="pageNation">
        <i class="fa-solid fa-angle-left" @click="Number(list.page) > 1 ? String(list.page--) : '1';
        activeMove = 'slideLeft'"></i>
        <div v-for="page in pages">
          <div v-if="page != '...'" class="page" :class="list.page == page ? 'active' : ''" @click="list.page = page">{{
            page }}</div>

          <div v-else class="space">{{ page }}</div>
        </div>
        <i class="fa-solid fa-angle-right" @click="Number(list.page) < Number(JSON.parse(JSON.stringify(pages)).pop()) ? String(list.page++) : String(pages);
        activeMove = 'slideRight'"></i>
      </div>

      <div class="pageDetail">
        <div>
          {{ Number(list.start) + 1 }} - {{ Number(list.end) + 1 > props.items.length ? props.items.length :
            Number(list.end) + 1 }} / 共 {{ props.items.length }} 筆
        </div>

        <div>
          每頁
          <select class="item-per-page" v-model="list.itemsPerPage">
            <option v-for="item in itemsPerPageOptions">{{ item }}</option>
          </select>
          筆
        </div>
      </div>
    </div>

    <div class="search" :class="isInputFocus ? 'inputFocus' : ''" v-if="props.noSearchBar">
      <input type="text" class="search-text" @focus="isInputFocus = true" @blur="isInputFocus = false"
        v-model="searchKey">
      <i class="fa-solid fa-magnifying-glass" style="color:black"></i>
    </div>

    <transition :name="activeMove" mode="out-in">
      <slot :matchItems="matchItems" :page="list.page" :showItem="showItem" :matchSearchItems="matchSearchItems"></slot>
    </transition>

    <div class="footer">
      <div class="pageNation">
        <i class="fa-solid fa-angle-left" @click="Number(list.page) > 1 ? String(list.page--) : '1';
        activeMove = 'slideLeft'"></i>
        <div v-for="page in pages">
          <div v-if="page != '...'" class="page" :class="list.page == page ? 'active' : ''" @click="list.page = page">{{
            page }}</div>

          <div v-else class="space">{{ page }}</div>
        </div>
        <i class="fa-solid fa-angle-right" @click="Number(list.page) < Number(JSON.parse(JSON.stringify(pages)).pop()) ? String(list.page++) : String(pages);
        activeMove = 'slideRight'"></i>
      </div>

      <div class="pageDetail">
        <div>
          {{ Number(list.start) + 1 }} - {{ Number(list.end) + 1 > props.items.length ? props.items.length :
            Number(list.end) + 1 }} / 共 {{ props.items.length }} 筆
        </div>

        <div>
          每頁
          <select class="item-per-page" v-model="list.itemsPerPage">
            <option v-for="item in itemsPerPageOptions">{{ item }}</option>
          </select>
          筆
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  items: {  //傳入來的資料
    type: Array,
    default: []
  },
  itemsPerPageOptions: { //每頁切換的設定值
    type: Array,
    default: [10, 20, 30]
  },
  itemsPerPage: {  //每頁顯示數量
    type: Number,
    default: 10
  },
  noSearchBar:{
    type:Boolean,
    default: true
  }
})

onMounted(() => {
  list.value.itemsPerPage = props.itemsPerPage
  // list.value.page = '1'
})

const activeMove = ref('slideRight')  //動畫顯示方向設定

//標準搜尋
const searchKey = ref('')  //搜尋用key
const matchSearchItems = computed(() => {
  // console.log('run computed')
  if (searchKey.value.length == 0){
    return props.items
  }else{
    let searchArr = searchKey.value.split(' ')
    let match = searchArr.reduce((matchItems,key)=>{
      return matchItems.filter(i => JSON.stringify(i).includes(key))
    },props.items)
    return match;
    // return props.items.filter(i => JSON.stringify(i).includes(searchKey.value))
  }
})

//動畫發生顯示用陣列 -> 向外傳遞後使用
const showItem = ref([])
//按照目前顯示的page數,取得資料
const matchItems = computed(() => {
  showItem.value = []
  let match = matchSearchItems.value.filter((i, index) => {
    let start = (list.value.page - 1) * list.value.itemsPerPage
    let end = ((list.value.page - 1) * list.value.itemsPerPage) + Number(list.value.itemsPerPage) - 1
    list.value.start = start //標記開始資料為第幾筆
    list.value.end = end //標記結束資料第幾筆

    if (index >= start && index <= end) {
      return i
    }
  })

  //動畫間隔時間
  match.forEach((item, index) => {
    setTimeout(() => {
      showItem.value[index] = true;
    }, index * 100); // 100毫秒
  });

  return match;
})
//計算符合資料應顯示頁數
// const pages = computed(() => {
//   return Math.ceil(matchSearchItems.value.length / list.value.itemsPerPage);  //無條件進位頁數
// })
/*
pages 值小於等於6 顯示6格 
page 值大於3 顯示1-4 ... 最後一格
page 值小於最大值-3 顯示1 ... 及最後四格
page 值大於4 小於值小於最大值-3,顯示1 ... 目前值-1 及目前值 目前值+1 ... 最後1格
 */
const pages = computed(() => {
  let totalPages = Math.ceil(matchSearchItems.value.length / list.value.itemsPerPage);  //取得最大 pages 值
  let pagesArr = []
  let maxShowPages = 7; //設定同時顯示最大頁數
  if (totalPages < 7) {
    maxShowPages = totalPages
  }

  if (totalPages <= maxShowPages) {
    for (let i = 1; i <= maxShowPages; i++) {
      pagesArr.push(i)
    }
    return pagesArr
  }

  if (list.value.page <= 3) {
    return ['1', '2', '3', '4', '...', String(totalPages)]
  }
  if (list.value.page >= (totalPages - 2)) {
    return ['1', '...', String(totalPages - 3), String(totalPages - 2), String(totalPages - 1), String(totalPages)]
  }

  return [
    '1', '...', String(Number(list.value.page) - 1), String(list.value.page), String(Number(list.value.page) + 1), '...', String(totalPages)
  ]

  // return Math.ceil(matchSearchItems.value.length / list.value.itemsPerPage);  //無條件進位頁數
})

const list = ref({
  itemsPerPage: 10,
  page: '1',
})
const isInputFocus = ref(false)  //透過這個值去觸發 focus時的反應

//如果切換每頁顯示數量時 -> 造成總顯示頁數變化.如果原來頁數 > 目前顯示最大頁數 -> 頁數跳到最大頁數位置
watch(() => pages.value, (val) => {
  let newVal = JSON.parse(JSON.stringify(val))
  newVal = newVal.pop()
  if (Number(list.value.page) > Number(newVal)) {
    list.value.page = newVal
  }
})

</script>


<style scoped>
.pageNation {
  display: flex;
  align-items: center;
}

.pageNation i {
  cursor: pointer;
  padding: 7px 10px;
  border-radius: 50%;
  transition: 0.2s;
}

.pageNation i:hover {
  background-color: rgba(var(--setColor-3),1);
}

.pageNation .page {
  background-color: rgba(var(--setColor-1),1);
  border-radius: 5px;
  margin-right: 3px;
  margin-left: 3px;
  padding: 4px 10px;
  font-size: 1em;
  cursor: pointer;
  transition: 0.2s;
}

.pageNation .space {
  color: white;
  margin-right: 3px;
  margin-left: 3px;
}

.pageNation .page.active {
  background-color: rgba(var(--setColor-2),1);
  color: rgba(var(--setColor-1),1);
  cursor: default;
}

.footer {
  display: flex;
  justify-content: space-between;
}

.footer .item-per-page {
  font-size: 1em;
  border-radius: 5px;
  padding: 4px;
}

.search {
  display: flex;
  align-items: center;
  margin:10px 0px;
  width: 99%;
  padding: 6px;
  background-color: white;
  border-radius: 5px;
  outline: none;
}

.search .search-text {
  width: 100%;
  outline: none;
  font-size: 1em;
  margin-right: 5px;
  border:none;
}

.inputFocus{
  border: 2px solid lightblue;
}

.pageDetail{
  display: flex;
  justify-content: center;
  align-items: center;
  gap:10px;

}
/* slideRight */
.slideRight-enter-active,
.slideRight-leave-active {
  transition: all 0.5s ease;
}

.slideRight-enter-from {
  opacity: 0;
  transform: translateX(-5%);
}

.slideRight-leave-to {
  opacity: 0;
  transform: translateX(5%);
}

.slideRight-enter-to,
.slideRight-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* slideLeft */
.slideLeft-enter-active,
.slideLeft-leave-active {
  transition: all 0.5s ease;
}

.slideLeft-enter-from {
  opacity: 0;
  transform: translateX(5%);
}

.slideLeft-leave-to {
  opacity: 0;
  transform: translateX(-5%);
}

.slideLeft-enter-to,
.slideLeft-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@media screen and (max-width: 376px) {
  .footer{
    display: block;
  }
  .pageNation{
    display: flex;
    justify-content: space-around;
    margin-bottom: 5px;
  }
}
</style>