<template>
  <div class="PDDDropdownButton" @click.prevent="dialog = !dialog">

    <button class="btnPrimary">
      {{ title }}
    </button>

    <transition name="btndropdown" mode="out-in" appear>
      <div class="dropdown-menu" v-if="dialog">
        <slot></slot>
        <!-- <div class="fn">功能1</div>
        <div class="fn">功能2</div>
        <div class="fn">功能3456789</div> -->
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title:{
    type: String,
    default:'title set'
  }
})

const dialog = ref(false)


</script>


<style>
.PDDDropdownButton {
  position: relative;
  text-wrap: nowrap;
  min-width: 70px;
}

.dropdown-menu {
  position: absolute;
  left: 50%;
  top: 55px;
  transform: translate(-50%, 0);
  background-color: var(--color-2);
  padding: 10px;
  text-wrap: nowrap;
  min-width: 100px;
  text-align: center;
  border-radius: 5px;
  z-index: 99;
  font-size: 1.2rem;
}
.dropdown-menu .fn:hover{
  background: var(--color-3);
}


.btndropdown-enter-active,
.btndropdown-leave-active {
  transition: all 0.5s ease;
}

.btndropdown-enter-from {
  opacity: 0;
  transform: translate(-50%,-30%);
}

.btndropdown-leave-to {
  opacity: 0;
  transform: translate(-50%,30%);
}

.btndropdown-enter-to,
.btndropdown-leave-from {
  opacity: 1;
  transform: translate(-50%,0);
}
</style>
