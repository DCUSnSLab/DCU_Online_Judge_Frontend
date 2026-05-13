<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiMagnify, mdiRefresh, mdiShuffleVariant } from '@mdi/js'
import { getProblemList, getProblemTagList, pickone } from '~/api/oj'
import { useNotice } from '~/composables/useNotice'
import AppChip from '~/components/AppChip.vue'
import StatusDot from '~/components/StatusDot.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const PAGE_SIZE = 20
const items = ref([])
const tags = ref([])
const total = ref(0)
const loading = ref(false)
const showTags = ref(false)

const query = reactive({ keyword: '', difficulty: '', tag: '', page: 1 })
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

function diffTone(d) {
  if (d === 'Low') return 'low'
  if (d === 'High') return 'high'
  return 'mid'
}
function acRate(a, s) {
  if (!s) return '0%'
  return Math.round((a / s) * 100) + '%'
}

function syncFromRoute() {
  query.keyword = route.query.keyword || ''
  query.difficulty = route.query.difficulty || ''
  query.tag = route.query.tag || ''
  query.page = parseInt(route.query.page) || 1
  if (query.page < 1) query.page = 1
}

async function load() {
  loading.value = true
  try {
    const offset = (query.page - 1) * PAGE_SIZE
    const data = await getProblemList(offset, PAGE_SIZE, {
      keyword: query.keyword || undefined,
      difficulty: query.difficulty || undefined,
      tag: query.tag || undefined
    })
    items.value = data?.results || []
    total.value = data?.total || 0
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  try {
    const data = await getProblemTagList()
    tags.value = Array.isArray(data) ? data : data?.results || []
  } catch {
    tags.value = []
  }
}

function pushRouter() {
  const q = {}
  if (query.keyword) q.keyword = query.keyword
  if (query.difficulty) q.difficulty = query.difficulty
  if (query.tag) q.tag = query.tag
  if (query.page > 1) q.page = String(query.page)
  router.push({ name: 'problem-list', query: q })
}

function applyKeyword() { query.page = 1; pushRouter() }
function setDifficulty(d) { query.difficulty = d; query.page = 1; pushRouter() }
function setTag(name) { query.tag = query.tag === name ? '' : name; query.page = 1; pushRouter() }
function setPage(p) {
  if (p < 1 || p > totalPages.value || p === query.page) return
  query.page = p
  pushRouter()
}
function reset() { query.keyword = ''; query.difficulty = ''; query.tag = ''; query.page = 1; pushRouter() }

async function pickRandom() {
  try {
    const data = await pickone()
    if (data) {
      notice.success('Good luck!')
      router.push({ name: 'problem-details', params: { problemID: data } })
    }
  } catch (err) {
    notice.error(err?.message || '랜덤 문제 선택에 실패했습니다.')
  }
}

onMounted(() => { syncFromRoute(); loadTags(); load() })
watch(() => route.query, () => { syncFromRoute(); load() })
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">PROBLEMS</div>
      <h1 class="title">문제 목록</h1>
      <p class="subtitle">총 {{ total }}개의 문제가 공개되어 있어요.</p>
    </header>

    <div class="grid">
      <div class="main">
        <div class="surface controls">
          <div class="search-wrap">
            <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
            <input v-model="query.keyword" class="search" placeholder="제목·번호 검색" @keyup.enter="applyKeyword" />
          </div>
          <select :value="query.difficulty" class="select" @change="(e) => setDifficulty(e.target.value)">
            <option value="">난이도 전체</option>
            <option value="Low">Low</option>
            <option value="Mid">Mid</option>
            <option value="High">High</option>
          </select>
          <label class="toggle-row">
            <input v-model="showTags" type="checkbox" /><span class="mono">태그 표시</span>
          </label>
          <button class="btn" @click="reset">
            <v-icon :icon="mdiRefresh" size="14" /><span>초기화</span>
          </button>
        </div>

        <section class="surface table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-status"></th>
                <th class="col-id">번호</th>
                <th>제목</th>
                <th v-if="showTags">태그</th>
                <th class="col-diff">난이도</th>
                <th class="col-total">제출</th>
                <th class="col-ac">정답률</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading && !items.length"><td colspan="7" class="empty">불러오는 중…</td></tr>
              <tr v-else-if="!items.length"><td colspan="7" class="empty">문제가 없습니다.</td></tr>
              <tr v-for="p in items" :key="p.id">
                <td class="col-status">
                  <status-dot v-if="p.my_status === 0" status="ac" />
                  <status-dot v-else-if="p.my_status > 0" status="wa" />
                </td>
                <td class="mono col-id">#{{ p._id }}</td>
                <td>
                  <router-link :to="`/problem/${p._id}`" class="title-link">{{ p.title }}</router-link>
                </td>
                <td v-if="showTags">
                  <span v-for="t in (p.tags || [])" :key="t" class="chip mono">{{ t }}</span>
                </td>
                <td class="col-diff"><app-chip :tone="diffTone(p.difficulty)">{{ p.difficulty }}</app-chip></td>
                <td class="mono col-total">{{ p.submission_number }}</td>
                <td class="mono col-ac">{{ acRate(p.accepted_number, p.submission_number) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <nav v-if="totalPages > 1" class="pager">
          <button class="btn btn-sm" :disabled="query.page <= 1" @click="setPage(query.page - 1)">←</button>
          <span class="mono pager-info">{{ query.page }} / {{ totalPages }}</span>
          <button class="btn btn-sm" :disabled="query.page >= totalPages" @click="setPage(query.page + 1)">→</button>
        </nav>
      </div>

      <aside class="side">
        <section class="surface side-card">
          <h2 class="side-title">태그</h2>
          <div v-if="tags.length" class="tag-cloud">
            <button
              v-for="t in tags" :key="t.name"
              :class="['tag-btn', query.tag === t.name && 'tag-btn-on']"
              @click="setTag(t.name)"
            >{{ t.name }}</button>
          </div>
          <div v-else class="mono t-muted">태그 없음</div>
          <button class="btn btn-primary pick-btn" @click="pickRandom">
            <v-icon :icon="mdiShuffleVariant" size="14" /><span>랜덤 문제</span>
          </button>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 16px; }
.hero { margin-bottom: 4px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0 0 6px; color: var(--ink); }
.subtitle { font-size: 14px; color: var(--ink-2); margin: 0; }

.grid { display: grid; grid-template-columns: 1fr 240px; gap: 16px; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
.main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

.controls { display: flex; gap: 12px; padding: 14px 16px; align-items: center; }
.search-wrap { position: relative; flex: 1; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-3); }
.search { width: 100%; height: 34px; padding: 0 10px 0 32px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.search:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.select { height: 34px; padding: 0 10px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; }
.toggle-row { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-2); }
.toggle-row input { accent-color: var(--accent); }

.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-status { width: 40px; }
.col-id { width: 90px; color: var(--ink-3); }
.col-diff { width: 90px; }
.col-total, .col-ac { width: 80px; color: var(--ink-2); }
.title-link { color: var(--ink); font-weight: 500; text-decoration: none; }
.title-link:hover { color: var(--accent); }
.chip { margin-right: 4px; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.side-card { padding: 18px; }
.side-title { font-size: 12px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; }
.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.tag-btn { padding: 4px 10px; background: var(--sunken); border: 1px solid var(--line); border-radius: var(--r-pill); font-size: 12px; color: var(--ink-2); cursor: pointer; font-family: inherit; }
.tag-btn:hover { background: var(--surface); }
.tag-btn-on { background: var(--accent); color: #fff; border-color: var(--accent); }
.pick-btn { width: 100%; justify-content: center; }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
