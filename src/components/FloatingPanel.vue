<template>
  <div
    ref="panelRef"
    class="floating-panel"
    :class="{ 'floating-panel--dragging': isDragging }"
    :style="panelStyle"
    v-show="delayShow"
  >
    <div
      ref="headerRef"
      class="floating-panel__header"
      @mousedown="onDragStart"
      @touchstart.passive="onDragStart"
    >
      <slot name="header" :dragging="isDragging">
        <div class="floating-panel__header-content">
          <v-icon
            size="20"
            :color="iconColor"
            class="floating-panel__icon"
          >
            {{ icon }}
          </v-icon>
          <span class="floating-panel__title">{{ title }}</span>
        </div>
      </slot>
    </div>

    <div class="floating-panel__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRefs,
  watch,
  watchEffect,
} from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  initialLeft: { type: Number, default: null },
  initialTop: { type: Number, default: null },
  draggable: { type: Boolean, default: true },
  minLeft: { type: Number, default: 0 },
  minTop: { type: Number, default: 0 },
  offsetRight: { type: Number, default: 24 },
  offsetBottom: { type: Number, default: 24 },
  initialOpacity: { type: Number, default: 0.6 },
  hoverOpacity: { type: Number, default: 1 },
  icon: { type: String, default: 'mdi-map-marker-path' },
  iconColor: { type: String, default: 'white' },
  initialDelay: { type: Number, default: 1000 },
});

const { title, icon, iconColor } = toRefs(props);
const emit = defineEmits(['drag-start', 'drag', 'drag-end']);

const delayShow = ref(false);
const panelRef = ref(null);
const headerRef = ref(null);
const resizeObserver = ref(null);
const containerObserver = ref(null);
let resizeObserverStop = null;
let containerObserverStop = null;
let initialPositionRaf = null;
let initialPositionAttempts = 0;
let initialDelayTimeout = null;
const MAX_INITIAL_ATTEMPTS = 24;

const position = reactive({
  x: typeof props.initialLeft === 'number' ? props.initialLeft : 0,
  y: typeof props.initialTop === 'number' ? props.initialTop : 0,
});

const dragState = reactive({
  offsetX: 0,
  offsetY: 0,
});

const isDragging = ref(false);
const hasInitialized = ref(
  typeof props.initialLeft === 'number' && typeof props.initialTop === 'number',
);
const userHasDragged = ref(false);

watch(
  () => [props.initialLeft, props.initialTop],
  ([left, top]) => {
    if (!isDragging.value) {
      if (typeof left === 'number') {
        position.x = left;
        hasInitialized.value = true;
      } else {
        setDefaultPosition();
      }

      if (typeof top === 'number') {
        position.y = top;
        hasInitialized.value = true;
      } else {
        setDefaultPosition();
      }
    }
  },
);

const panelStyle = computed(() => ({
  transform: `translate(${position.x}px, ${position.y}px)`,
  visibility: hasInitialized.value ? 'visible' : 'hidden',
  '--floating-panel-opacity': props.initialOpacity,
  '--floating-panel-hover-opacity': props.hoverOpacity,
}));

function getPointerPosition(event) {
  if (event.touches?.length) {
    const touch = event.touches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

function onDragStart(event) {
  if (!props.draggable) return;

  const { x, y } = getPointerPosition(event);
  const rect = panelRef.value?.getBoundingClientRect();

  dragState.offsetX = x - (rect?.left ?? x);
  dragState.offsetY = y - (rect?.top ?? y);
  isDragging.value = true;

  emit('drag-start', { x: position.x, y: position.y });

  window.addEventListener('mousemove', onDragMove, { passive: false });
  window.addEventListener('mouseup', onDragEnd, { passive: false });
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('touchend', onDragEnd, { passive: false });
  window.addEventListener('touchcancel', onDragEnd, { passive: false });
}

function onDragMove(event) {
  if (!isDragging.value) return;

  event.preventDefault();
  userHasDragged.value = true;

  const { x, y } = getPointerPosition(event);

  const nextX = x - dragState.offsetX;
  const nextY = y - dragState.offsetY;

  position.x = Math.max(props.minLeft, nextX);
  position.y = Math.max(props.minTop, nextY);

  emit('drag', { x: position.x, y: position.y });
}

function onDragEnd() {
  if (!isDragging.value) return;

  isDragging.value = false;
  emit('drag-end', { x: position.x, y: position.y });

  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('touchend', onDragEnd);
  window.removeEventListener('touchcancel', onDragEnd);
}

onBeforeUnmount(() => {
  onDragEnd();
  teardownResizeObserver();
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowResize);
    cancelInitialPosition();
    cancelInitialDelay();
  }
});

onMounted(() => {
  if (typeof window === 'undefined') {
    hasInitialized.value = true;
    return;
  }

  if (typeof props.initialLeft === 'number' && typeof props.initialTop === 'number') {
    hasInitialized.value = true;
    return;
  }

  setupResizeObserver();
  window.addEventListener('resize', onWindowResize, { passive: true });
  setDefaultPosition();

  setTimeout(() => {
    delayShow.value = true;
  }, 500);
});

function setDefaultPosition() {
  if (typeof window === 'undefined') return;
  setupResizeObserver();

  cancelInitialDelay();
  cancelInitialPosition();
  hasInitialized.value = false;

  nextTick(() => {
    const panel = panelRef.value;
    if (!panel) return;

    userHasDragged.value = false;
    if (typeof window !== 'undefined' && props.initialDelay > 0) {
      initialDelayTimeout = window.setTimeout(() => {
        initialDelayTimeout = null;
        scheduleInitialPosition();
      }, props.initialDelay);
    } else {
      scheduleInitialPosition();
    }
  });
}

function maybeRecalculatePosition(force = false) {
  if (typeof window === 'undefined') return;
  if (!force && userHasDragged.value) return;

  const shouldAutoLeft = typeof props.initialLeft !== 'number';
  const shouldAutoTop = typeof props.initialTop !== 'number';

  if (!shouldAutoLeft && !shouldAutoTop) {
    hasInitialized.value = true;
    return;
  }

  const panel = panelRef.value;
  if (!panel) return;

  const rect = panel.getBoundingClientRect();
  
  if (rect.width === 0 || rect.height === 0) return;

  const contextRect = getPositionContextRect();
  const targetRight = contextRect.left + contextRect.width - props.offsetRight;
  const targetBottom = contextRect.top + contextRect.height - props.offsetBottom;

  if (shouldAutoLeft) {
    const nextX = targetRight - rect.width;
    position.x = Math.max(props.minLeft, nextX);
  }
  if (shouldAutoTop) {
    const nextY = targetBottom - rect.height;
    position.y = Math.max(props.minTop, nextY);
  }

  hasInitialized.value = true;
}

function setupResizeObserver() {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return;
  if (resizeObserver.value) return;

  resizeObserver.value = new ResizeObserver(() => {
    maybeRecalculatePosition();
  });

  resizeObserverStop = watchEffect((onCleanup) => {
    const node = panelRef.value;
    if (!resizeObserver.value || !node) return;

    const context = getPositionContextElement();

    resizeObserver.value.observe(node);
    ensureContainerObserver();
    if (containerObserver.value && context) {
      containerObserver.value.observe(context);
    }

    onCleanup(() => {
      if (resizeObserver.value && node) {
        resizeObserver.value.unobserve(node);
      }
      if (containerObserver.value && context) {
        containerObserver.value.unobserve(context);
      }
    });
  });
}

function teardownResizeObserver() {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
  }
  if (resizeObserverStop) {
    resizeObserverStop();
    resizeObserverStop = null;
  }
  if (containerObserver.value) {
    containerObserver.value.disconnect();
    containerObserver.value = null;
  }
  if (containerObserverStop) {
    containerObserverStop();
    containerObserverStop = null;
  }
}

function onWindowResize() {
  maybeRecalculatePosition();
}

function ensureContainerObserver() {
  if (containerObserver.value || typeof ResizeObserver === 'undefined') return;
  containerObserver.value = new ResizeObserver(() => {
    maybeRecalculatePosition();
  });
  containerObserverStop = () => {
    if (containerObserver.value) {
      containerObserver.value.disconnect();
      containerObserver.value = null;
    }
  };
}

function getPositionContextElement() {
  if (typeof window === 'undefined') return null;
  const panel = panelRef.value;
  if (!panel) return null;

  let current = panel.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const hasTransform =
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.contain === 'paint' ||
      style.willChange.includes('transform');
    const isOverlayContent = current.classList.contains('v-overlay__content');
    if (hasTransform || isOverlayContent) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getPositionContextRect() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, left: 0, top: 0 };
  }

  const context = getPositionContextElement();
  if (context) {
    return context.getBoundingClientRect();
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  };
}

function scheduleInitialPosition() {
  cancelInitialPosition();

  const attempt = () => {
    if (typeof window === 'undefined') return;
    const panel = panelRef.value;
    if (!panel) {
      cancelInitialPosition();
      return;
    }

    const rect = panel.getBoundingClientRect();
    const contextRect = getPositionContextRect();
    const ctxWidth = contextRect.width;
    const ctxHeight = contextRect.height;
    const sizeReady =
      rect.width > 0 &&
      rect.height > 0 &&
      ctxWidth > 0 &&
      ctxHeight > 0;

    if (sizeReady || initialPositionAttempts >= MAX_INITIAL_ATTEMPTS) {
      maybeRecalculatePosition(true);
      cancelInitialPosition();
      return;
    }

    initialPositionAttempts += 1;
    initialPositionRaf = window.requestAnimationFrame(attempt);
  };

  initialPositionAttempts = 0;
  initialPositionRaf = window.requestAnimationFrame(attempt);
}

function cancelInitialPosition() {
  if (typeof window === 'undefined') return;
  if (initialPositionRaf !== null) {
    window.cancelAnimationFrame(initialPositionRaf);
    initialPositionRaf = null;
  }
  initialPositionAttempts = 0;
}

function cancelInitialDelay() {
  if (typeof window === 'undefined') return;
  if (initialDelayTimeout !== null) {
    window.clearTimeout(initialDelayTimeout);
    initialDelayTimeout = null;
  }
}
</script>

<style scoped>
.floating-panel {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2000;
  min-width: 240px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background-color: #fffaf0;
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(217, 119, 6, 0.2);
  overflow: hidden;
  opacity: var(--floating-panel-opacity, 1);
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
}

.floating-panel:hover {
  opacity: var(--floating-panel-hover-opacity, 1);
}

.floating-panel--dragging {
  box-shadow: 0 18px 44px rgba(194, 65, 12, 0.32);
  cursor: grabbing;
}

.floating-panel__header {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  background: linear-gradient(135deg, #f97316, #fde68a);
  color: #fff8e7;
  cursor: grab;
  user-select: none;
  min-height: 52px;
}

.floating-panel__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.floating-panel__header-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.floating-panel__icon {
  flex-shrink: 0;
}

.floating-panel__body {
  /* padding: 16px 20px; */
  overflow: auto;
  background-color: #fff6e5;
  flex: 1;
}
</style>
