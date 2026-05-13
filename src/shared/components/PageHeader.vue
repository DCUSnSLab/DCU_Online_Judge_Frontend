<script setup>
defineProps({
  eyebrow: { type: String, default: null },
  title: { type: String, required: true },
  sticky: { type: Boolean, default: true }
})
</script>

<template>
  <header :class="['page-header', { sticky }]">
    <div class="page-header-text">
      <div v-if="eyebrow" class="page-header-eyebrow mono">{{ eyebrow }}</div>
      <h1 class="page-header-title">{{ title }}</h1>
    </div>
    <div class="page-header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 32px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  gap: 16px;
}
.page-header.sticky {
  position: sticky;
  top: 0;
  z-index: 10;
}
.page-header-eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.page-header-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin: 2px 0 0;
  color: var(--ink);
}
.page-header-actions {
  display: flex;
  gap: 8px;
}
</style>
