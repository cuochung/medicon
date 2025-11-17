<template>
  <div class="inputBox">
    <input readonly class="form__input" type="text" :value="targetValue" placeholder=" ">

    <label>{{ labelVal }} <i v-if="!ruleVal">({{ errorMsg }})</i></label>

    <select v-model="targetValue" @change="checkRule($event)">
      <option v-for="item in items" class="selected">{{ item }}</option>
    </select>
    
    <input type="text" :name="labelVal" :value="ruleVal" hidden>
  </div>

</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items:{
    type:Array,
    default:[]
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
});
const emit = defineEmits(['update:modelValue']);

const targetValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

//判斷驗證用
const ruleVal = ref(true)  //驗證預證值為Pass -> 父組件觸發sumbit時,可以知道是否有false的值
const errorMsg = ref('')  //存放驗證未過時錯誤訊息
const checkRule = (event) => {  //實際驗證過程
  // console.log('run rule', event.target.value)
  let val = props.modelValue
  if (event){
    val = event.target.value
  }
  if (props.rules) {
    let ruleArr = props.rules.split('::')
    // console.log(props.rules)
    let re = new RegExp(ruleArr[0]) //設定驗證的規則 -> 目前一律用正則去判斷
    errorMsg.value = ruleArr[1]  //設定驗證沒過時的訊息
    ruleVal.value = re.test(val);
    // let re = new RegExp(props.rules)
    // ruleVal.value = re.test(props.modelValue);
    // console.log('re',re,'rs',rs)
  }
}

defineExpose({ checkRule })
</script>


<style scoped>
.inputBox {
  position: relative;
  border-radius: 5px;
  width:100%;
  background-color: white;
  height:50px;
}

.form__input {
  border-radius: 5px;
  outline: none;
  /* font-size: 1.3em; */
  color:transparent;
  border:none;
}

/* .form__input:focus { */
  /* border: 2px solid lightblue; */
  /* border-top:2px solid blue;
  border-bottom:2px solid blue; */
/* } */

.form__input:focus~label {
  color: black;
  /* transform: translateY(-10px); */
  padding: 0;
  padding-left: 3px;
  font-size: 0.5em;
}

.form__input:not(:placeholder-shown).form__input:not(:focus)+label {
  /* transform: translateY(-10px); */
  color: black;
  padding: 0;
  padding-left: 3px;
  font-size: 0.5em;
}

.inputBox label i {
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

.inputBox label {
  position: absolute;
  left: 2px;
  padding: 10px;
  pointer-events: none;
  font-size: 1.3rem;
  transition: 0.3s;
}



.inputBox select{
  width:100%;
  border-radius: 5px;
  outline: none;
  position: absolute;
  left: 2px;
  top:6px;
  background-color: transparent;
  font-size: 1.3em;
  height:50px;
  border:none;
}
option:focus{
  background: red;
}

</style>
