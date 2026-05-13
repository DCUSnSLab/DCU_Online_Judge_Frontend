<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiPlus } from '@mdi/js'
import { getQnAPost } from '~/api/oj'

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 20
const items = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ solved: false, page: 1 })

const contestID = computed(() => route.params.contestID || null)
const lectureID = computed(() => route.params.lectureID || null)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

function detailRoute(q) {
  if (contestID.value && lectureID.value) return `/CourseList/${lectureID.value}/${contestID.value}/question/${q.id}`
  if (contestID.value) return `/contest/${contestID.value}/question/${q.id}`
  return `/question/${q.id}`
}

async function load() {
  loading.value = true
  try {
    const params = {
      offset: (query.page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE
    }
    if (query.solved) params.solved = 'true'
    if (contestID.value) params.contest_id = contestID.value
    if (lectureID.value) params.lecture_id = lectureID.value
    const data = await getQnAPost(params)
    items.value = data?.results || []
    total.value = data?.total || 0
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function fmt(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === query.page) return
  query.page = p
  load()
}

onMounted(load)
watch(() => query.solved, () => { query.page = 1; load() })
watch(() => route.params, () => { query.page = 1; load() })
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">Q&amp;A</div>
      <h1 class="title">질문과 답변</h1>
    </header>

    <div class="surface controls">
      <label class="toggle-row">
        <input v-model="query.solved" type="checkbox" /><span>해결된 질문만 보기</span>
      </label>
      <button class="btn btn-primary" @click="router.push(contestID ? `/contest/${contestID}/question/new` : '/question/new')">
        <v-icon :icon="mdiPlus" size="14" /><span>새 질문</span>
      </button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead><tr><th>상태</th><th>제목</th><th>작성자</th><th>답변</th><th>시간</th></tr></thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="5" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="5" class="empty">질문이 없습니다.</td></tr>
          <tr v-for="q in items" :key="q.id">
            <td>
              <span :class="['chip', q.solved ? 'chip-low' : 'chip-mid']">
                {{ q.solved ? '해결' : '대기' }}
              </span>
            </td>
            <td>
              <router-link :to="detailRoute(q)" class="title-link">{{ q.title }}</router-link>
            </td>
            <td class="mono">{{ q.author?.username || q.username || '–' }}</td>
            <td class="mono">{{ q.comment_count ?? 0 }}</td>
            <td class="mono t-muted">{{ fmt(q.create_time) }}</td>
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
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 16px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0; color: var(--ink); }
.controls { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; }
.toggle-row { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }
.toggle-row input { accent-color: var(--accent); }
.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.title-link { color: var(--ink); font-weight: 500; text-decoration: none; }
.title-link:hover { color: var(--accent); }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
