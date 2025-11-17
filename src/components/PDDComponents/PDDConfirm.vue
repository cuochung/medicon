<script setup>
import { ref } from 'vue';

const dialogVisible = ref(false);
const title = ref('刪除確認');
const message = ref('確認要刪除嗎??')

let resolve, reject;

const confirm = (setData=null) => {
  //判斷是否有傳自定義資料進來
  if (setData != null){
    if (setData.title){ title .value = setData.title }
    if (setData.message){ message .value = setData.message }
  }

  dialogVisible.value = true;

  return new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
};

const accept = () => {
  dialogVisible.value = false;
  resolve(true);
};

const cancel = () => {
  dialogVisible.value = false;
  reject(false);
};

defineExpose({ confirm })
</script>


<template>
  <Transition name="pulse">
    <div class="dialog" v-if="dialogVisible" @click.self="cancel">
      <div class="dialogContent">
        <div class="icon">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <h2>{{ title }}</h2>
        <p v-html="message"></p>
        
        <div class="buttons">
          <button @click="cancel">取消</button>
          <button class="accept" @click="accept">確認</button>
        </div>
      </div>
    </div>
  </Transition>
</template>



<style>
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 999;
}

.pulse-enter-active,
.pulse-leave-active {
  animation: pulse .2s;
}

.pulse-enter-from,
.pulse-leave-to {
  animation: pulse .2s reverse;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.dialog .dialogContent {
  background: white;
  padding: 20px 50px;
  border-radius: 5px;
  border:red 2px solid;
  box-shadow: 0 0 5px white;
}

.dialog .dialogContent .icon{
  color:red;
  font-size:3rem;
  text-align: center;
}

.dialog h2 {
  margin-top:10px;
  font-size:1.5rem;
  text-align: center;
  font-weight: 600;
  color:red;
}

.dialog p{
  font-size:1rem;
  text-align: center;
  color:black;
}

.buttons {
  display: flex;
  justify-content: space-between;
  margin-top:15px;
}

.buttons button{
  padding: 5px 10px;
  font-size: 1rem;
  outline: none;
  border: none;
  background-color: #D3D3D3;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition:background-color 0.2s in
}

.buttons button.accept{
  background-color: #ffafad ;
}

.buttons button:hover {
  background-color: #A9A9A9;
}
.buttons button.accept:hover {
  background-color: #FF0000  ;
}
</style>
