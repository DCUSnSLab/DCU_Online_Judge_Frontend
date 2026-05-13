<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 'low' | 'mid' | 'high' | 'accent' | null
  tone: { type: String, default: null },
  size: { type: String, default: 'md' } // 'sm' | 'md'
})

const cls = computed(() => [
  'chip',
  props.tone ? `chip-${props.tone}` : null,
  props.size === 'sm' ? 'chip-size-sm' : null
])
</script>

<template>
  <span :class="cls"><slot /></span>
</template>

<style scoped>
.chip-size-sm {
  padding: 1px 6px;
  font-size: 11px;
}
</style>
