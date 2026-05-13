<script setup>
defineProps({
  eyebrow: { type: String, default: 'DCUCODE' },
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  width: { type: Number, default: 440 }
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-card" :style="{ maxWidth: width + 'px' }">
      <header class="auth-head">
        <div class="mono eyebrow">{{ eyebrow }}</div>
        <h1 class="title">{{ title }}</h1>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </header>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 56px);
  display: grid;
  place-items: center;
  padding: 40px 20px;
  background: var(--sunken);
}
.auth-card {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 36px;
  box-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.12);
}
.auth-head {
  margin-bottom: 24px;
}
.eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.4px;
  margin: 0;
  color: var(--ink);
}
.subtitle {
  font-size: 13px;
  color: var(--ink-2);
  margin: 4px 0 0;
}
</style>
