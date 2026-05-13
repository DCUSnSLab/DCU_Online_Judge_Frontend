<script setup>
import { mdiTrayRemove } from '@mdi/js'

defineProps({
  // SVG path string (from @mdi/js). Pass null to hide.
  icon: { type: String, default: mdiTrayRemove },
  title: { type: String, default: '비어있어요' },
  description: { type: String, default: null }
})
</script>

<template>
  <div class="empty">
    <v-icon v-if="icon" :icon="icon" size="32" class="empty-icon" />
    <div class="empty-title">{{ title }}</div>
    <div v-if="description" class="empty-desc">{{ description }}</div>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  color: var(--ink-3);
}
.empty-icon {
  color: var(--ink-3);
  margin-bottom: 12px;
}
.empty-title {
  font-size: var(--t-15);
  font-weight: var(--w-medium);
  color: var(--ink-2);
  margin-bottom: 4px;
}
.empty-desc {
  font-size: var(--t-13);
  color: var(--ink-3);
}
.empty-action {
  margin-top: 16px;
}
</style>
