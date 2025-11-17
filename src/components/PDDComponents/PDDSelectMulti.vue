<template>
  <div class="PDDSelectMulti">
    <!-- 這行是拿來讓父組件判斷 form裡的值是否合法用,一定要有 -->
    <input type="text" :name="labelVal" :value="ruleVal" hidden>  
    
    <div class="btnContent" @click="isShow = !isShow" tabindex="0" @focus="isShow = true">
      <span class="label-title" :class="targetValue.length ? 'active' : ''">
        {{ labelVal }} 
        <span v-if="targetValue.length && !single">( {{ targetValue.length }} )</span>
        <i v-if="!ruleVal">({{ errorMsg }})</i>
      </span>
      <span v-if="targetValue" class="label-text">{{ returnSelectedContent() }}</span>
      
      <span class="arrow-down" :class="isShow ? 'active' : ''">
        <i class="fa-solid fa-chevron-down"></i>
      </span>
    </div>
  
    <transition name="fade" mode="out-in" appear>
      <div class="listContent" v-if="isShow">
        <div class="search" :style="isInputFocus ? 'border: 2px solid lightblue;' : ''">
          <input type="text" class="search-text" 
            @keydown="checkKeyDown"
            @focus="isInputFocus = true" 
            @blur="isInputFocus = false" 
            v-model="searchKey"
            v-focus>
          <i class="fa-solid fa-search"></i>
        </div>

        <ul>
          <li 
          v-for="(item, index) in searchItems" 
          @click="selectItem(item)"
          class="item" :class="{'active': index == isSelectIndex }"
          >
            <span v-show="!single" class="checkbox">
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// focus 寫法.透過Directive 建構一個 v-focus,使用在input 時,就會有focus的效果,而且只要是使用就會一直觸發
const vFocus = {
  mounted: (el) => el.focus()
}

//鍵盤控制上下,space選擇項目
const isSelectIndex = ref(-1) //目前li選單停留位置 -1 為未選擇
const checkKeyDown = (el) =>{
  // console.log('pressKey=',el.key)
  let keyVal = el.key;
  // 按下
  if (keyVal == 'ArrowDown'){
    if (isSelectIndex.value == -1){
      isSelectIndex.value = 0
    }else{
      if (isSelectIndex.value == Number(searchItems.value.length)-1){
        isSelectIndex.value = 0  
      }else{
        isSelectIndex.value++
      }
    }
  }
  //按上
  if (keyVal == 'ArrowUp'){
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
  if (keyVal == 'Escape'){
    isShow.value = false;
  }
}



//處理search裡的input是否為選中狀態 -> 外邊框做一些css 樣式用
const isInputFocus = ref(false)

//判斷是String -> String化後回傳 ;Object->只取text內容 -> String化後回傳
const returnSelectedContent = () =>{
  if (targetValue.value.length == 0) return ''

  if (typeof(targetValue.value[0]) == 'object'){
    let str = targetValue.value.map(i=>i.text)
    return String(str);
  }else{
    return String(targetValue.value)
  }
  
}

//處理搜尋功能;為物件時,只選出text中的資料
const searchKey = ref('')
const searchItems = computed(()=>{
  return props.items.filter(i=>{
    let str = i;
    if (typeof(str) == 'object'){
      str = JSON.stringify(i.text)
    }
    if (str.includes(searchKey.value)){
      return i
    }
  })
})

//處理組件以外時,觸發關閉 isShow 的功能
const closeOnOutsideClick = (event) => {
  if (isShow.value) {
    const clickedElement = event.target
    if (!clickedElement.closest('.PDDSelectMulti')) {
      isShow.value = false
    }
  }
}
onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick);
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
    type: Array,
    default: []
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
  get: () => JSON.parse(JSON.stringify(props.modelValue)),
  set: (value) => emit("update:modelValue", value)
})

//選單顯示控制
const isShow = ref(false)

//返回是否勾選
const returnCheck = (item) => {
  let match = targetValue.value.find(i => i === item)
  if (match) {
    return 1
  } else {
    return 0
  }
}

//加入或刪除選擇的項目
const selectItem = (item,pressKey='mouse') => {
  if (pressKey == 'mouse'){
    isSelectIndex.value = -1;  //用滑鼠選擇後,用鍵盤選擇回到未選擇狀態
  }

  let match = targetValue.value.find(i => i === item)
  if (match) {
    targetValue.value.some((i, index) => {
      if (i === item) {
        targetValue.value.splice(index, 1)
      }
    })
  } else {
    //判斷單選
    if (props.single) { 
      targetValue.value.splice(0, 1) 
      isShow.value = false
    }

    targetValue.value.push(item)
  }

  emit("update:modelValue", targetValue.value)
  checkRule(item) //判斷驗證

}

//判斷驗證用
const ruleVal = ref(true)  //驗證預證值為Pass -> 父組件觸發sumbit時,可以知道是否有false的值
const errorMsg = ref('')  //存放驗證未過時錯誤訊息
const checkRule = () => {  //實際驗證過程
  if (props.rules) {
    let ruleArr = props.rules.split('::')
    let re = new RegExp(ruleArr[0]) //設定驗證的規則 -> 目前一律用正則去判斷
    errorMsg.value = ruleArr[1]  //設定驗證沒過時的訊息
    ruleVal.value = re.test(targetValue.value);
  }
}

//父項可控制function 設定
defineExpose({ checkRule })
</script>


<style scoped>
.search{
  display: flex;
  align-items: center;
  width:100%;
  padding:6px;
  border-radius: 5px;
  border:1px solid grey;
}
.search .search-text{
  width:100%;
  outline: none;
  font-size: 1em;
  margin-right:5px;
}

.PDDSelectMulti {
  position: relative;
}

.btnContent {
  background-color: white;
  border-radius: 5px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.btnContent .label-text{
  position: absolute;
  translate: 0px 6px;
}
.btnContent .label-title{
  transition: 0.3s;
}
.btnContent .label-title.active {
  color: blue;
  padding: 0;
  translate:-7px -10px;
  font-size: 0.5em;
}
.btnContent .label-title i{
  font-weight: bold;
  color: red;
  font-size: 0.5em;
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
  transition: 0.3s;
}

.btnContent .arrow-down.active {
  transform: rotate(180deg);
}

.listContent {
  z-index:2;
  position: absolute;
  width: 100%;
  margin-top: 5px;
  background-color: white;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height:250px;
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

.listContent li {
  list-style: none;
  display: flex;
  align-items: center;
  padding: 5px 5px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
}

.listContent li:hover,.listContent .item.active {
  background-color: #e7edfe;
  font-weight: 900;
}

.listContent .item .checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border: 1.5px solid #c0c0c0;
  border-radius: 4px;
}

.listContent .item .item-text {
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
}</style>