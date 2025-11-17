<template>
  <div>
    <v-dialog v-model="dialog" width="auto" scrollable fullscreen transition="dialog-bottom-transition">
      <template v-slot:activator="{ props }">
        <v-img :src="picBaseUrl + item.picName" :lazy-src="picBaseUrl + 'lazypic.jpg'" 
          class="d-flex align-end rounded-xl" width="100%" v-bind="props">
        </v-img>
      </template>

      <v-card class="black">
        <v-card-title>
          <v-btn icon large dark class="mt-1" @click.stop="dialog = !dialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-img class="mt-1" :src="picBaseUrl + item.picName" :lazy-src="picBaseUrl + 'lazypic.jpg'" 
            width="100%" @click.stop="dialog = !dialog">
          </v-img>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from '@/stores/useStore'

const props = defineProps({
  item: Object,
  folder: String
})

const store = useStore()
const dialog = ref(false)
const picBaseUrl = computed(() => `${store.state.base_url}/upload/${props.folder}/`)
</script>