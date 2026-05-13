<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUserRank } from '~/api/oj'

const route = useRoute()

const PAGE_SIZE = 30
const items = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)

const ruleType = computed(() => (route.name === 'oi-rank' ? 'oi' : 'acm'))
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

async function load() {
  loading.value = true
  try {
    const data = await getUserRank((page.value - 1) * PAGE_SIZE, PAGE_SIZE, ruleType.value)
    items.value = data?.results || []
    total.value = data?.total || 0
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  load()
}

const podium = computed(() => items.value.slice(0, 3))
const others = computed(() => items.value.slice(3))

onMounted(load)
watch(() => route.name, () => { page.value = 1; load() })
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">{{ ruleType.toUpperCase() }} RANK</div>
      <h1 class="title">전체 랭킹</h1>
      <p class="subtitle">{{ ruleType === 'oi' ? '총 점수 기준' : '해결 문제 수 기준' }} 누적 순위입니다.</p>
    </header>

    <section v-if="podium.length" class="podium">
      <div v-for="(p, i) in podium" :key="p.user?.username || i" :class="['podium-card surface', `pod-${i + 1}`]">
        <div class="mono pod-rank">#{{ (page - 1) * PAGE_SIZE + i + 1 }}</div>
        <div class="pod-name">{{ p.user?.realname || p.user?.username || '–' }}</div>
        <div class="mono pod-user">@{{ p.user?.username }}</div>
        <div class="pod-stat">
          <span class="mono big">{{ ruleType === 'oi' ? p.total_score : p.accepted_number }}</span>
          <span class="mono t-muted">{{ ruleType === 'oi' ? '점' : 'AC' }}</span>
        </div>
      </div>
    </section>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-rank">순위</th>
            <th>이름</th>
            <th>아이디</th>
            <th>해결</th>
            <th>제출</th>
            <th>정답률</th>
            <th v-if="ruleType === 'oi'">점수</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="7" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="7" class="empty">랭킹 데이터가 없습니다.</td></tr>
          <tr v-for="(r, i) in others" :key="r.user?.username || i">
            <td class="mono col-rank">{{ (page - 1) * PAGE_SIZE + i + 4 }}</td>
            <td>{{ r.user?.realname || '–' }}</td>
            <td class="mono">{{ r.user?.username }}</td>
            <td class="mono">{{ r.accepted_number }}</td>
            <td class="mono t-muted">{{ r.submission_number }}</td>
            <td class="mono">{{ r.submission_number ? Math.round((r.accepted_number / r.submission_number) * 100) : 0 }}%</td>
            <td v-if="ruleType === 'oi'" class="mono">{{ r.total_score }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="page <= 1" @click="setPage(page - 1)">←</button>
      <span class="mono pager-info">{{ page }} / {{ totalPages }}</span>
      <button class="btn btn-sm" :disabled="page >= totalPages" @click="setPage(page + 1)">→</button>
    </nav>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 20px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0 0 6px; color: var(--ink); }
.subtitle { font-size: 14px; color: var(--ink-2); margin: 0; }

.podium { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 720px) { .podium { grid-template-columns: 1fr; } }
.podium-card { padding: 22px; text-align: center; }
.pod-1 { border-color: oklch(0.78 0.14 60); background: oklch(0.96 0.06 60); }
.pod-3 { border-color: oklch(0.66 0.10 28); background: oklch(0.96 0.04 28); }
[data-theme='dark'] .pod-1 { background: oklch(0.30 0.08 60 / 0.5); }
[data-theme='dark'] .pod-3 { background: oklch(0.28 0.06 28 / 0.5); }
.pod-rank { font-size: 24px; font-weight: 700; color: var(--ink-2); }
.pod-name { font-size: 18px; font-weight: 600; margin-top: 6px; }
.pod-user { font-size: 11px; color: var(--ink-3); }
.pod-stat { margin-top: 12px; display: inline-flex; align-items: baseline; gap: 4px; }
.big { font-size: 28px; font-weight: 700; }

.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-rank { width: 70px; color: var(--ink); font-weight: 600; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
