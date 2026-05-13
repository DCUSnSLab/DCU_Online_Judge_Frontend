<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getACMACInfo } from '~/api/oj'

const route = useRoute()
const items = ref([])
const autoRefresh = ref(true)
const loading = ref(false)
let timer = null

const contestID = computed(() => route.params.contestID)

async function load() {
  loading.value = true
  try {
    const data = await getACMACInfo({ contest_id: contestID.value })
    items.value = Array.isArray(data) ? data : data?.results || []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function startAuto() {
  stopAuto()
  if (autoRefresh.value) {
    timer = setInterval(load, 10000)
  }
}
function stopAuto() {
  if (timer) { clearInterval(timer); timer = null }
}

function toggleAuto() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) startAuto()
  else stopAuto()
}

function fmtTime(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

onMounted(() => { load(); startAuto() })
onBeforeUnmount(stopAuto)
</script>

<template>
  <section class="surface card">
    <header class="card-head">
      <h2 class="card-title">ACM Helper</h2>
      <label class="toggle-row">
        <input type="checkbox" :checked="autoRefresh" @change="toggleAuto" />
        <span class="mono">자동 새로고침 (10s)</span>
      </label>
    </header>
    <table class="data-table">
      <thead><tr><th>시각</th><th>참가자</th><th>문제</th><th>결과</th></tr></thead>
      <tbody>
        <tr v-if="loading && !items.length"><td colspan="4" class="empty">불러오는 중…</td></tr>
        <tr v-else-if="!items.length"><td colspan="4" class="empty">최근 AC 정보가 없습니다.</td></tr>
        <tr v-for="(r, i) in items" :key="i">
          <td class="mono">{{ fmtTime(r.submission_time || r.time) }}</td>
          <td class="mono">{{ r.username }}</td>
          <td class="mono">{{ r.problem_id || r.problem }}</td>
          <td><span class="chip chip-low">AC</span></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.card { padding: 0; overflow: hidden; }
.card-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.card-title { font-size: 14px; font-weight: 600; margin: 0; }
.toggle-row { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-2); }
.toggle-row input { accent-color: var(--accent); }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
</style>
