<template>
  <div class="inputBox">
    
    <input ref="inputRef" class="form__input" :class="otherInputClass" :type="typeSet" :disabled="readonlySet" v-model="targetValue"
      @blur="checkRule" placeholder=" ">
    <label>{{ labelVal }}</label>
    <span class="errorMsg" v-if="!ruleVal">({{ errorMsg }})</span>

    <i :class="iconSet"></i>
    <input type="text" :name="labelVal" :value="ruleVal" hidden>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  rules: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  labelVal: {
    type: [String, Number],
    default: ''
  },
  otherInputClass: {
    type: String,
    default: ''
  },
  typeSet: {
    type: String,
    default: 'text'
  },
  readonlySet:{
    type:Boolean,
    default:false
  },
  iconSet:{
    type:String,
    default:''
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
    ruleVal.value = re.test(props.modelValue);
  }
}

const inputRef = ref()
//2023.2.28 加入focus 設定
const inputFocus = () => {
  inputRef.value.focus()
}

defineExpose({ checkRule, inputFocus })
</script>


<style scoped>
.inputBox {
  position: relative;
  /* padding: 20px 7px 4px 5px; */
  background-color: white;
  border-radius: 5px;
  color:black;
  min-height:55px;
  width:100%;
  display: flex;
  justify-content: left;
}

.inputBox>i{
  position: absolute;
  top:20px;
  right:10px;
}

.inputBox input {
  /* width:100px; */
  width:100%;
  /* position: absolute; */
  /* top:20px; */
  /* left:5px; */
  margin: 0 5px;
  margin-top: 18px;
  margin-bottom: 2px;
  outline: none;
  font-size: 1.2rem;
  border:0;
  transition: 0.5s all ease-in-out;
  border-bottom: 3px solid white;
  /* padding-bottom: 5px; */
  /* background-color: red; */
}

.inputBox input:focus {
  border-bottom: 3px solid var(--color-1);
}


.inputBox input:focus~label {
  padding: 1px;
  padding-left: 5px;
  font-size: 0.8rem;
  
}

.form__input:not(:placeholder-shown).form__input:not(:focus)+label {
  padding: 1px;
  padding-left: 5px;
  font-size: 0.8rem;
}

.inputBox .errorMsg {
  position: absolute;
  top:0px;
  right:4px;
  font-weight: bold;
  color: red;
  font-size: 0.8rem;
  animation: fade-in 2s;
}
/* .inputBox label i {
  font-weight: bold;
  color: red;
  font-size: 0.8rem;
  animation: fade-in 2s initial;
} */

@keyframes fade-in {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.inputBox label {
  position: absolute;
  left: 0;
  top:0;
  padding: 10px;
  pointer-events: none;
  font-size: 1.3rem;
  transition: 0.3s all ease-in-out;
}


/* mobileStyle */
@media screen and (max-width: 376px) {
  .inputBox input {
    font-size: 1rem;
  }

}


</style>
