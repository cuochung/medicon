<template>
  <div class="radio-group">
    <label class="radio" v-for="item, index in props.items" :key="index">
      <input type="radio" :value="item" v-model="targetValue">{{ item }}
      <span></span>
    </label>

  </div>
</template>

<script setup>
//2023.11.22 暫未加入驗證

import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: []
  },
  modelValue: {
    type: String,
    default: '新品'
  },
})
// const radioVal = ref('新品')
const emit = defineEmits(['update:modelValue','focusToProduce']);
const targetValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value)
    emit("focusToProduce")
  }
})

</script>


<style scoped>
.radio-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.radio {
  font-size: 1.5rem;
  color: var(--color-1);
  padding-left: 30px;
  position: relative;
}

.radio:hover{
  cursor: pointer;
}

.radio input[type="radio"] {
  display: none;
}

.radio span {
  position: absolute;
  display: block;
  top: 6px;
  left: 2px;
  border: 3px solid var(--color-1);
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.radio span:after {
  content: '';
  height: 10px;
  width: 10px;
  background-color: var(--color-1);
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0);
  border-radius: 50%;
  transition: 0.3s ease-in-out 0s;
}

.radio input[type="radio"]:checked~span:after {
  transform: translate(-50%, -50%) scale(1);
}
</style>