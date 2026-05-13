<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiRefresh } from '@mdi/js'
import { getContestSubmissionList, getSubmissionList } from '~/api/oj'
import StatusDot from '~/components/StatusDot.vue'

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 20
const items = ref([])
const total = ref(0)
const loading = ref(false)

const query = reactive({
  myself: false,
  result: '',
  problem_id: '',
  page: 1
})

const contestID = computed(() => route.params.contestID || null)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const STATUS_MAP = {
  '-2': { code: 'CE', tone: 'ce' },
  '-1': { code: 'WA', tone: 'wa' },
  0: { code: 'AC', tone: 'ac' },
  1: { code: 'TLE', tone: 'tle' },
  2: { code: 'TLE', tone: 'tle' },
  3: { code: 'MLE', tone: 'mle' },
  4: { code: 'RE', tone: 'wa' },
  5: { code: 'SE', tone: 'ce' },
  6: { code: 'PE', tone: 'wa' },
  7: { code: 'PA', tone: 'tle' },
  8: { code: 'PEND', tone: 'pending' },
  9: { code: 'JUDGE', tone: 'judging' }
}
function statusOf(r) { return STATUS_MAP[String(r)] || { code: '?', tone: 'pending' } }

function syncFromRoute() {
  query.myself = route.query.myself === '1'
  query.result = route.query.result || ''
  query.problem_id = route.query.problem_id || ''
  query.page = parseInt(route.query.page) || 1
}

async function load() {
  loading.value = true
  try {
    const offset = (query.page - 1) * PAGE_SIZE
    const params = { offset, limit: PAGE_SIZE }
    if (query.myself) params.myself = 1
    if (query.result !== '') params.result = query.result
    if (query.problem_id) params.problem_id = query.problem_id
    let data
    if (contestID.value) {
      params.contest_id = contestID.value
      data = await getContestSubmissionList(offset, PAGE_SIZE, params)
    } else {
      data = await getSubmissionList(params)
    }
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
  if (query.myself) q.myself = '1'
  if (query.result !== '') q.result = String(query.result)
  if (query.problem_id) q.problem_id = query.problem_id
  if (query.page > 1) q.page = String(query.page)
  router.push({ query: q })
}

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === query.page) return
  query.page = p
  pushRouter()
}

function fmtTime(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => { syncFromRoute(); load() })
watch(() => route.query, () => { syncFromRoute(); load() })
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">SUBMISSIONS</div>
      <h1 class="title">제출 현황</h1>
    </header>

    <div class="surface controls">
      <label class="toggle-row">
        <input v-model="query.myself" type="checkbox" @change="() => { query.page = 1; pushRouter() }" /><span>내 제출만</span>
      </label>
      <select v-model="query.result" class="select" @change="() => { query.page = 1; pushRouter() }">
        <option value="">결과 전체</option>
        <option value="0">AC</option>
        <option value="-1">WA</option>
        <option value="1">TLE</option>
        <option value="3">MLE</option>
        <option value="-2">CE</option>
        <option value="4">RE</option>
      </select>
      <input v-model="query.problem_id" class="input" placeholder="문제 ID" @keyup.enter="() => { query.page = 1; pushRouter() }" />
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">번호</th>
            <th class="col-pid">문제</th>
            <th class="col-user">제출자</th>
            <th class="col-lang">언어</th>
            <th class="col-status">결과</th>
            <th class="col-perf">시간</th>
            <th class="col-perf">메모리</th>
            <th class="col-when">제출 시각</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="8" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="8" class="empty">제출 기록이 없습니다.</td></tr>
          <tr v-for="r in items" :key="r.id">
            <td class="mono col-id">
              <router-link :to="`/status/${r.id}`" class="id-link">#{{ r.id }}</router-link>
            </td>
            <td>
              <router-link v-if="r.problem" :to="`/problem/${r.problem}`" class="prob-link">{{ r.problem }}</router-link>
              <span v-else>–</span>
            </td>
            <td class="mono col-user">{{ r.username || '–' }}</td>
            <td class="col-lang"><span class="chip mono">{{ r.language }}</span></td>
            <td class="col-status"><status-dot :status="statusOf(r.result).tone" :label="statusOf(r.result).code" /></td>
            <td class="mono col-perf">{{ r.statistic_info?.time_cost ?? '–' }} ms</td>
            <td class="mono col-perf">{{ r.statistic_info?.memory_cost ? Math.round(r.statistic_info.memory_cost / 1024) : '–' }} KB</td>
            <td class="mono col-when">{{ fmtTime(r.create_time) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="query.page <= 1" @click="setPage(query.page - 1)">←</button>
      <span class="mono pager-info">{{ query.page }} / {{ totalPages }} · 총 {{ total }}건</span>
      <button class="btn btn-sm" :disabled="query.page >= totalPages" @click="setPage(query.page + 1)">→</button>
    </nav>
  </div>
</template>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 16px; }
.hero { margin-bottom: 4px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0; color: var(--ink); }

.controls { display: flex; gap: 12px; align-items: center; padding: 14px 16px; flex-wrap: wrap; }
.toggle-row { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }
.toggle-row input { accent-color: var(--accent); }
.select, .input { height: 32px; padding: 0 10px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input { width: 100px; }
.input:focus, .select:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }

.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); white-space: nowrap; }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-id { width: 90px; }
.id-link, .prob-link { color: var(--accent); text-decoration: none; }
.col-pid { width: 110px; }
.col-user { width: 100px; color: var(--ink-2); }
.col-lang { width: 100px; }
.col-status { width: 120px; }
.col-perf { width: 90px; color: var(--ink-2); }
.col-when { width: 130px; color: var(--ink-3); }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
