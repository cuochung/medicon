<template>
  <div class="checkboxContainer"> 
    <label class="labelBox" :for="props.labelVal + index">
      <input type="checkbox" class="checkbox__input" :id="props.labelVal + index" :value="props.labelVal" v-model="targetValue" @change="checkRule">
      <div class="checkbox__box">
        <i class="fa-solid fa-check"></i>
      </div>
      <span v-show="props.showLabel">{{ props.labelVal }} <i v-if="!ruleVal">({{ errorMsg }})</i></span>
    </label>
    <input type="text" :name="props.labelVal" :value="ruleVal" hidden>
  </div>
</template>

<script setup>
/*
PDDCheckBoxBoolean 裡面值的反應處理邏輯:
(1)傳入的 modelValue 只吃 Boolean 值, true 或 false
(2)在透過v - model綁定前的值, 都要處理成 'true' or 'false'
(3)加入透過 labelVal 及index組成的 for 及 id 去綁定同一個組件, 不然只使用label會造成當label同名稱時, 會互相干擾
(4)使用在v - for迴圈裡的, 要傳入 props.index 不然會跟(3)一樣的狀況
 */
import { computed, ref } from 'vue'

const props = defineProps({
  index:{ //拿來使用在多個 checkbox時,如果不用這個分辨,會同時觸發所有的checkbox
    type: Number,
    default: 0,
  },
  rules: {
    type: String,
    default: ''
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  labelVal: {
    type: String, Number,
    default: ''
  },
  showLabel:{
    type: Boolean,
    default: true,
  }
});

const emit = defineEmits(['update:modelValue']);

const targetValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

//判斷驗證用
const ruleVal = ref(true)  //驗證預證值為Pass -> 父組件觸發sumbit時,可以知道是否有false的值
const errorMsg = ref('')  //存放驗證未過時錯誤訊息
const checkRule = () => {  //實際驗證過程
  if (props.rules) {
    let ruleArr = props.rules.split('::')
    let re = new RegExp(ruleArr[0]) //設定驗證的規則 -> 目前一律用正則去判斷
    errorMsg.value = ruleArr[1]  //設定驗證沒過時的訊息
    ruleVal.value = props.modelValue;
    // ruleVal.value = re.test(props.modelValue);
  }
}

defineExpose({ checkRule })
</script>

<style scoped>
.labelBox{
  display: flex;
  align-items: center;
  cursor: pointer;
}
.checkbox__input{
  display: none;
}
.checkbox__box{
  width:1.25rem;
  height: 1.25rem;
  border:2px solid grey;
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right:5px;
  flex-shrink:0;
  transition: 0.2s ease-in-out;
}

.checkbox__box i{
  display: none;
  padding:0;
  margin:0;
}

.checkbox__input:checked + .checkbox__box{
  background: #2266dc;
  border-color: #2266dc;
}
.checkbox__input:checked + .checkbox__box::after{
  color:white;
}
.checkbox__input:checked + .checkbox__box i{
  display: block;
}


</style>