<template>
  <div class="PDDSelectSingleString" ref="selectElement">
    <!-- 
      PDD 單項式選單 傳入為陣列，回傳只回傳單一文字資料
      2023.11.5 加入選單向下延申長度無法顯示時就向上顯示 在 watch 裡
      2023.11.9 顯示時如果外部div 有 overflow時,會造成選單無法顯示浮動的情況.所以邏輯上修改為
      依照取得的select框位置,再透過絕對定位,fixed 在某個位置
     -->

    <!-- 這行是拿來讓父組件判斷 form裡的值是否合法用,一定要有 -->
    <input type="text" :name="labelVal" :value="ruleVal" hidden>

    <div class="btnContent" @click="isShow = !isShow">
      <span class="label-title" :class="targetValue.length ? 'active' : ''">
        {{ labelVal }}
        <span v-if="targetValue.length && !single">( {{ targetValue.length }} )</span>
      </span>
      <span class="errorMsg" v-if="!ruleVal">({{ errorMsg }})</span>
      <span v-if="targetValue" class="label-text">{{ returnSelectedContent() }}</span>


      <span class="arrow-down" :class="isShow ? 'active' : ''">
        <i class="fa-solid fa-chevron-down"></i>
      </span>
    </div>


    <transition name="fade" mode="out-in" appear>
      <div class="listContent" ref="listContainerElement" v-if="isShow">
        <div class="search" :style="isInputFocus ? 'border: 2px solid var(--color-1);' : ''">
          <input type="text" class="search-text" @keydown="checkKeyDown" @focus="isInputFocus = true"
            @blur="isInputFocus = false" v-model="searchKey" v-focus>
          <i class="fa-solid fa-search"></i>
        </div>

        <ul>
          <li v-for="(item, index) in searchItems" @click="selectItem(item)" class="list-item"
            :class="{ 'active': index == isSelectIndex }">
            <span class="checkbox">
              <i class="fa-solid fa-check check-icon" :style="`transform: scale(${returnCheck(item)})`"></i>
            </span>
            <span class="item-text">{{ item.text ? item.text : item }}</span>
          </li>
        </ul>
      </div>
    </transition>

  </div>
</template>


<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

// focus 寫法.透過Directive 建構一個 v-focus,使用在input 時,就會有focus的效果,而且只要是使用就會一直觸發
const vFocus = {
  mounted: (el) => el.focus()
}

const isInputFocus = ref(false) //處理search裡的input是否為選中狀態 -> 外邊框做一些css 樣式用
const isShow = ref(false) //選單顯示控制

//鍵盤控制上下,space選擇項目
const isSelectIndex = ref(-1) //目前li選單停留位置 -1 為未選擇
const checkKeyDown = (el) => {
  // console.log('pressKey=',el.key)
  let keyVal = el.key;
  // 按下
  if (keyVal == 'ArrowDown') {
    if (isSelectIndex.value == -1) {
      isSelectIndex.value = 0
    } else {
      if (isSelectIndex.value == Number(searchItems.value.length) - 1) {
        isSelectIndex.value = 0
      } else {
        isSelectIndex.value++
      }
    }
  }
  //按上
  if (keyVal == 'ArrowUp') {
    if (isSelectIndex.value == -1) {
      isSelectIndex.value = Number(searchItems.value.length) - 1
    } else {
      if (isSelectIndex.value == 0) {
        isSelectIndex.value = Number(searchItems.value.length) - 1
      } else {
        isSelectIndex.value--
      }
    }
  }
  //按enter
  if (keyVal == 'Enter') {
    if (isSelectIndex.value != -1) {
      selectItem(searchItems.value[isSelectIndex.value], 'keyboard')
    }
  }
  //按space ;寫不出來,棄用
  // if (keyVal == ' '){
  //   if (isSelectIndex.value != -1){
  //     selectItem(searchItems.value[isSelectIndex.value], 'keyboard')
  //     searchKey.value = searchKey.value.trim()
  //   }
  // }
  //按Esc
  if (keyVal == 'Escape') {
    isShow.value = false;
  }
}


//判斷是String -> String化後回傳 ;Object->只取text內容 -> String化後回傳
const returnSelectedContent = () => {
  if (targetValue.value.length == 0) return ''

  if (typeof (targetValue.value[0]) == 'object') {
    let str = targetValue.value.map(i => i.text)
    return String(str);
  } else {
    return String(targetValue.value)
  }

}

//處理搜尋功能;為物件時,只選出text中的資料
const searchKey = ref('')
const searchItems = computed(() => {
  return props.items.filter(i => {
    let str = i;
    if (typeof (str) == 'object') {
      str = JSON.stringify(i.text)
    }
    if (str.includes(searchKey.value)) {
      return i
    }
  })
})

//處理組件以外時,觸發關閉 isShow 的功能
const closeOnOutsideClick = (event) => {
  if (isShow.value) {
    const clickedElement = event.target
    if (!clickedElement.closest('.PDDSelectSingleString')) {
      console.log('run show false')
      isShow.value = false
    }
  }
}
onMounted(() => {
  // console.log('on mounted')
  document.addEventListener('click', closeOnOutsideClick);  //處理 點擊 options以外時的觸發動作

})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeOnOutsideClick)
})
//處理組件以外時,觸發關閉 isShow 的功能 end


//props,emit
const props = defineProps({
  items: {
    type: Array,
    default: []
  },
  rules: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String, Number,
    default: ''
  },
  labelVal: {
    type: String, Number,
    default: ''
  },
  single: { //只接受選擇一項,原始設計是可以多選單為主,設定single 就只能選擇一項
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['update:modelValue']);
const targetValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})


/*2023.11.5處理下方選單是否超出營幕下方,超出就顯示到上方;
如果切換畫面的話可能會暫時都只顯示在上方;
目前顯示高度是 .listContent -> max-height:250px (options顯示的內容）
*/
const selectElement = ref() //定義 整個select 的位置 -> 透過　getBoundingClientRect　找出這個select在營幕上的位置用
const listContainerElement = ref()  //顯示　options內容時的容器，拿來算出有沒有超過營幕用
const optionZone = ref({
  x: '',
  y: '',
  width: '',
})

//透過監控 isShow = true 時 -> 來判斷及控制 options 顯示在上面或下面 
watch(() => isShow.value, async (val) => {
  if (val) {  //ture 才執行
    await nextTick();
    const windowHeight = window.innerHeight; //定義目前營幕高度
    const selectInfo = selectElement.value.getBoundingClientRect();

    if (Number(selectInfo.bottom) + 250 > windowHeight) {
      // console.log('up', Number(selectInfo.bottom), windowHeight)
      optionZone.value.x = selectInfo.x + 'px';
      optionZone.value.y = (selectInfo.y - 257) + 'px'
      optionZone.value.width = selectInfo.width + 'px'
    } else {
      // console.log('down', Number(selectInfo.bottom), windowHeight)
      optionZone.value.x = selectInfo.x + 'px';
      optionZone.value.y = (selectInfo.y + 50) + 'px'
      optionZone.value.width = selectInfo.width + 'px'
    }

  }

})
//處理下方選單是否超出營幕下方,超出就顯示到上方 end


//返回是否勾選
const returnCheck = (item) => {
  if (!isShow.value || targetValue.value == '') { return 0 }

  if (item == targetValue.value) {
    return 1
  } else {
    return 0
  }

}

//加入或刪除選擇的項目
const selectItem = (item, pressKey = 'mouse') => {
  if (pressKey == 'mouse') {
    isSelectIndex.value = -1;  //用滑鼠選擇後,用鍵盤選擇回到未選擇狀態
  }

  isShow.value = false
  emit("update:modelValue", item)
  checkRule(item) //判斷驗證

}

//判斷驗證用
const ruleVal = ref(true)  //驗證預證值為Pass -> 父組件觸發sumbit時,可以知道是否有false的值
const errorMsg = ref('')  //存放驗證未過時錯誤訊息
const checkRule = (item=null) => {  //實際驗證過程
  if (props.rules) {
    let ruleArr = props.rules.split('::')
    let re = new RegExp(ruleArr[0]) //設定驗證的規則 -> 目前一律用正則去判斷
    errorMsg.value = ruleArr[1]  //設定驗證沒過時的訊息
    
    if (item == null) {
      ruleVal.value = re.test(props.modelValue);
    }else{
      ruleVal.value = re.test(item);
    }
  }
}
//判斷驗證用 end


//父項可控制function 設定
defineExpose({ checkRule })
</script>


<style scoped>
.search {
  display: flex;
  align-items: center;
  margin: 5px;
  border-radius: 5px;
  border: 2px solid white;
  transition: all 0.3s;
  outline: none;
}

.search .search-text {
  width: 100%;
  outline: none;
  font-size: 1rem;
  padding: 5px;
  border: none;
}

.PDDSelectSingleString {
  position: relative;
  background-color: white;
  border-radius: 5px;
  min-height:55px;
  
}

.btnContent {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  margin: 0 8px;
  margin-top:12px;
}

.btnContent .label-text {
  position: absolute;
  translate: 0px 6px;
  font-size:1.2rem;
}

.btnContent .label-title {
  transition: 0.3s all;
  font-size: 1.3rem;
}


.btnContent .label-title.active {
  color: black;
  padding: 0;
  translate: -5px -11px;
  font-size: 0.8em;
}

/* .btnContent .label-title i {
  font-weight: bold;
  color: red;
  font-size: 0.8rem;
  animation: fade-in 2s;
} */
.btnContent .errorMsg {
  position: absolute;
  top:0px;
  right:4px;
  font-weight: bold;
  color: red;
  font-size: 0.8rem;
  animation: fade-in 2s;
}


@keyframes fade-in {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.btnContent .arrow-down {
  font-size: 1.3rem;
  transition: 0.3s all;
}

.btnContent .arrow-down.active {
  transform: rotate(180deg);
}

.listContent {
  z-index: 3;
  position: fixed;
  left: v-bind('optionZone.x');
  top: v-bind('optionZone.y');
  min-width: v-bind('optionZone.width');
  margin-top: 5px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height: 250px;
}

.listContent::-webkit-scrollbar{
  width:0.2rem;
  height:0.2rem;
}
.listContent::-webkit-scrollbar-thumb{
  border-radius: .2rem;
  background-color: grey;
  visibility: hidden;
}
.listContent:hover::-webkit-scrollbar-thumb{
  visibility:visible;
}

  .listContent ul {
    padding: 0 5px;
  }


  .listContent li {
    list-style: none;
    padding: 2px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
  }

.listContent li:hover,.listContent .list-item.active {
  background-color: rgba(var(--setColor-3),1);
  color:rgba(var(--setColor-1),1);
  font-weight: 500;
}

  .list-item {
    display: flex;
    align-items: center;
  }

.listContent .list-item .checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--color-1);
  border-radius: 4px;
}

  .listContent .list-item .item-text {
    margin-left: 5px;
  }


  /* 動畫透過vue3處理 */
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.5s ease;
  }

  .fade-enter-from {
    opacity: 0;
    transform: translateY(-30%);
  }

  .fade-leave-to {
    opacity: 0;
    transform: translateY(30%);
  }

  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
    transform: translateY(0);
  }

</style>