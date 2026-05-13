<script setup>
import { computed } from 'vue'

// status: 'ac' | 'wa' | 'tle' | 'mle' | 'ce' | 'pending' | 'judging'
const props = defineProps({
  status: { type: String, required: true },
  size: { type: Number, default: 8 },
  label: { type: String, default: null }
})

const dotStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`
}))
</script>

<template>
  <span class="status-wrap">
    <span :class="['dot', `dot-${status}`]" :style="dotStyle" aria-hidden="true" />
    <span v-if="label" class="t-secondary">{{ label }}</span>
  </span>
</template>

<style scoped>
.status-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
