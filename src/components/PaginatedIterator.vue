<template>
  <v-data-iterator
    :items="items"
    :items-per-page="modelItemsPerPage"
    :page="modelPage"
    @update:page="onUpdatePage"
    @update:items-per-page="onUpdateItemsPerPage"
  >
    <template #default="slotProps">
      <slot name="default" v-bind="slotProps" />
    </template>

    <template #footer>
      <div class="d-flex justify-space-between align-center pa-4">
        <div class="d-flex align-center">
          <span class="mr-4">每頁顯示：</span>
          <v-select
            v-model="localItemsPerPage"
            :items="itemsPerPageOptions"
            item-title="title"
            item-value="value"
            density="compact"
            hide-details
            style="max-width: 100px;"
          />
        </div>

        <div class="d-flex align-center">
          <span class="mr-4">
            {{ displayRange }} / {{ totalItems }}
          </span>

          <v-btn density="compact" icon :disabled="localPage === 1" @click="goFirst">
            <v-icon>mdi-page-first</v-icon>
          </v-btn>

          <v-btn class="ml-1" density="compact" icon :disabled="localPage === 1" @click="goPrev">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>

          <span class="mx-3">
            {{ localPage }} / {{ totalPages }}
          </span>

          <v-btn density="compact" icon :disabled="localPage === totalPages" @click="goNext">
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>

          <v-btn class="ml-1" density="compact" icon :disabled="localPage === totalPages" @click="goLast">
            <v-icon>mdi-page-last</v-icon>
          </v-btn>
        </div>
      </div>
    </template>
  </v-data-iterator>
  
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  page: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 10 },
  itemsPerPageOptions: {
    type: Array,
    default: () => [
      { value: 5, title: '5' },
      { value: 10, title: '10' },
      { value: 25, title: '25' },
    ],
  },
});

const emit = defineEmits(['update:page', 'update:items-per-page']);

const localPage = ref(props.page);
const localItemsPerPage = ref(props.itemsPerPage);

watch(() => props.page, (v) => { localPage.value = v; });
watch(() => props.itemsPerPage, (v) => { localItemsPerPage.value = v; });

const modelPage = computed({
  get: () => localPage.value,
  set: (v) => { localPage.value = v; emit('update:page', v); },
});

const modelItemsPerPage = computed({
  get: () => localItemsPerPage.value,
  set: (v) => { localItemsPerPage.value = v; emit('update:items-per-page', v); },
});

const totalItems = computed(() => props.items.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / localItemsPerPage.value)));

const displayRange = computed(() => {
  const start = (localPage.value - 1) * localItemsPerPage.value + 1;
  const end = Math.min(localPage.value * localItemsPerPage.value, totalItems.value);
  return `${Math.min(start, totalItems.value)}-${end}`;
});

function onUpdatePage(v) { modelPage.value = v; }
function onUpdateItemsPerPage(v) { modelItemsPerPage.value = v; }

function goFirst() { modelPage.value = 1; }
function goPrev() { if (localPage.value > 1) modelPage.value = localPage.value - 1; }
function goNext() { if (localPage.value < totalPages.value) modelPage.value = localPage.value + 1; }
function goLast() { modelPage.value = totalPages.value; }
</script>

<style scoped>
</style>


