<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiMagnify } from '@mdi/js'
import { getContestList } from '~/api/oj'

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 10
const items = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ keyword: '', status: '', rule_type: '', page: 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const STATUS_LABEL = {
  '-1': { tone: '', label: '종료' },
  0: { tone: 'low', label: '진행중' },
  1: { tone: 'mid', label: '예정' }
}
function statusOf(s) {
  return STATUS_LABEL[String(s)] || { tone: '', label: '–' }
}

function fmt(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function syncFromRoute() {
  query.keyword = route.query.keyword || ''
  query.status = route.query.status || ''
  query.rule_type = route.query.rule_type || ''
  query.page = parseInt(route.query.page) || 1
}

async function load() {
  loading.value = true
  try {
    const params = {
      offset: (query.page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE
    }
    if (query.keyword) params.keyword = query.keyword
    if (query.status !== '') params.status = query.status
    if (query.rule_type) params.rule_type = query.rule_type
    const data = await getContestList(params)
    items.value = data?.results || []
    total.value = data?.total || 0
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function pushRouter() {
  const q = {}
  if (query.keyword) q.keyword = query.keyword
  if (query.status !== '') q.status = query.status
  if (query.rule_type) q.rule_type = query.rule_type
  if (query.page > 1) q.page = String(query.page)
  router.push({ name: 'contest-list', query: q })
}

function setStatus(v) { query.status = v; query.page = 1; pushRouter() }
function applyKeyword() { query.page = 1; pushRouter() }
function setPage(p) {
  if (p < 1 || p > totalPages.value || p === query.page) return
  query.page = p
  pushRouter()
}

onMounted(() => { syncFromRoute(); load() })
watch(() => route.query, () => { syncFromRoute(); load() })
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">CONTESTS</div>
      <h1 class="title">콘테스트</h1>
      <p class="subtitle">진행 중인 콘테스트와 다가오는 일정을 확인하세요.</p>
    </header>

    <div class="surface controls">
      <div class="tabs">
        <button :class="['tab', query.status === '' && 'tab-active']" @click="setStatus('')">전체</button>
        <button :class="['tab', query.status === '0' && 'tab-active']" @click="setStatus('0')">진행중</button>
        <button :class="['tab', query.status === '1' && 'tab-active']" @click="setStatus('1')">예정</button>
        <button :class="['tab', query.status === '-1' && 'tab-active']" @click="setStatus('-1')">종료</button>
      </div>
      <div class="search-wrap">
        <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
        <input v-model="query.keyword" class="search" placeholder="제목 검색" @keyup.enter="applyKeyword" />
      </div>
      <select v-model="query.rule_type" class="select" @change="() => { query.page = 1; pushRouter() }">
        <option value="">룰 전체</option>
        <option value="ACM">ACM</option>
        <option value="OI">OI</option>
      </select>
    </div>

    <div v-if="loading && !items.length" class="surface empty">불러오는 중…</div>
    <div v-else-if="!items.length" class="surface empty">콘테스트가 없습니다.</div>

    <section v-for="c in items" :key="c.id" class="surface contest-card">
      <div class="card-left">
        <div class="mono c-meta">
          <span :class="['chip', `chip-${statusOf(c.status).tone}`]">{{ statusOf(c.status).label }}</span>
          <span>{{ c.rule_type }}</span>
          <span>·</span>
          <span>{{ fmt(c.start_time) }} ~ {{ fmt(c.end_time) }}</span>
        </div>
        <h2 class="c-title">{{ c.title }}</h2>
      </div>
      <router-link :to="`/contest/${c.id}/`" class="btn btn-primary">
        {{ c.status === -1 ? '결과 보기 →' : '참가하기 →' }}
      </router-link>
    </section>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="query.page <= 1" @click="setPage(query.page - 1)">←</button>
      <span class="mono pager-info">{{ query.page }} / {{ totalPages }}</span>
      <button class="btn btn-sm" :disabled="query.page >= totalPages" @click="setPage(query.page + 1)">→</button>
    </nav>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 16px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0 0 6px; color: var(--ink); }
.subtitle { font-size: 14px; color: var(--ink-2); margin: 0; }

.controls { display: flex; gap: 12px; align-items: center; padding: 12px 14px; flex-wrap: wrap; }
.tabs { display: inline-flex; gap: 4px; padding: 4px; background: var(--sunken); border-radius: var(--r-md); }
.tab { padding: 6px 14px; font-size: 12px; font-weight: 500; color: var(--ink-3); background: transparent; border: none; border-radius: var(--r-sm); cursor: pointer; font-family: inherit; }
.tab-active { background: var(--surface); color: var(--ink); font-weight: 600; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-3); }
.search { width: 100%; height: 32px; padding: 0 10px 0 32px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.select { height: 32px; padding: 0 10px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; }

.contest-card { padding: 20px 24px; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
.c-meta { font-size: 11px; color: var(--ink-3); display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.c-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--ink); }
.empty { padding: 40px; text-align: center; color: var(--ink-3); }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
