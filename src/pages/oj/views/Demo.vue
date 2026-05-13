<script setup>
import { useNotice } from '~/composables/useNotice'
import AppChip from '~/components/AppChip.vue'
import StatusDot from '~/components/StatusDot.vue'

const notice = useNotice()

const difficulties = [
  { tone: 'low', label: 'Low' },
  { tone: 'mid', label: 'Mid' },
  { tone: 'high', label: 'High' }
]
const statuses = [
  { status: 'ac', label: 'Accepted' },
  { status: 'wa', label: 'Wrong Answer' },
  { status: 'tle', label: 'Time Limit' },
  { status: 'ce', label: 'Compile Error' },
  { status: 'judging', label: 'Judging' },
  { status: 'pending', label: 'Pending' }
]
</script>

<template>
  <div class="demo">
    <div class="demo-hero">
      <div class="mono eyebrow">SPRINT 0 · FOUNDATION</div>
      <h1>디자인 시스템이 연결됐어요.</h1>
      <p class="t-secondary">상단 NavBar의 달/태양 아이콘으로 paper / carbon 테마를 전환할 수 있어요.</p>
    </div>

    <section class="surface demo-section">
      <h2>Buttons</h2>
      <div class="row">
        <button class="btn btn-primary">Primary</button>
        <button class="btn">Default</button>
        <button class="btn btn-ghost">Ghost</button>
        <button class="btn btn-sm">Small</button>
        <button class="btn btn-lg btn-primary">Large primary</button>
      </div>
    </section>

    <section class="surface demo-section">
      <h2>Difficulty chips</h2>
      <div class="row">
        <app-chip v-for="d in difficulties" :key="d.tone" :tone="d.tone">{{ d.label }}</app-chip>
        <app-chip>neutral</app-chip>
        <app-chip tone="accent">accent</app-chip>
      </div>
    </section>

    <section class="surface demo-section">
      <h2>Status dots</h2>
      <div class="rows">
        <div v-for="s in statuses" :key="s.status" class="status-row">
          <status-dot :status="s.status" :label="s.label" />
          <span class="mono t-muted">{{ s.status.toUpperCase() }}</span>
        </div>
      </div>
    </section>

    <section class="surface demo-section">
      <h2>Snackbar</h2>
      <div class="row">
        <button class="btn btn-primary" @click="notice.success('저장되었어요')">Success</button>
        <button class="btn" @click="notice.info('알림')">Info</button>
        <button class="btn" @click="notice.warning('주의')">Warning</button>
        <button class="btn" @click="notice.error('에러')">Error</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 32px 80px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.demo-hero {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.demo-hero h1 {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.8px;
  line-height: 1.15;
  margin: 0;
  color: var(--ink);
}

.demo-section {
  padding: 24px;
}
.demo-section h2 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--ink-3);
  font-family: var(--font-mono);
  margin: 0 0 16px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.rows {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--sunken);
  border-radius: var(--r-sm);
}
</style>
