<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiDeleteOutline, mdiMagnify, mdiPencilOutline, mdiPlus, mdiRefresh } from '@mdi/js'
import {
  deleteContestProblem,
  deleteProblem,
  getContestProblemList,
  getProblemList
} from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'
import AppChip from '~/components/AppChip.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const PAGE_SIZE = 15
const items = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const loading = ref(false)

const contestId = computed(() => route.params.contestId || null)
const headerTitle = computed(() =>
  contestId.value ? `콘테스트 #${contestId.value} 문제` : '문제 목록'
)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

async function load() {
  loading.value = true
  try {
    const params = {
      paging: true,
      offset: (page.value - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      keyword: keyword.value || undefined
    }
    let data
    if (contestId.value) {
      params.contest_id = contestId.value
      data = await getContestProblemList(params)
    } else {
      data = await getProblemList(params)
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

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  load()
}

function goCreate() {
  if (contestId.value) router.push(`/contest/${contestId.value}/problem/create`)
  else router.push('/problem/create')
}

function goEdit(row) {
  if (contestId.value) router.push(`/contest/${contestId.value}/problem/${row.id}/edit`)
  else router.push(`/problem/edit/${row.id}`)
}

async function remove(row) {
  if (!confirm(`문제 "${row._id} ${row.title}" 를 삭제할까요?`)) return
  try {
    if (contestId.value) await deleteContestProblem(row.id)
    else await deleteProblem(row.id)
    notice.success('삭제했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

function difficultyTone(d) {
  if (!d) return null
  const x = d.toString().toLowerCase()
  if (x === 'low' || x === '쉬움') return 'low'
  if (x === 'high' || x === '어려움') return 'high'
  return 'mid'
}

onMounted(load)
watch(() => route.params, load)
</script>

<template>
  <page-header eyebrow="Admin / Problem" :title="headerTitle">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
      <button v-if="!contestId" class="btn" @click="router.push('/problem/batch_ops')">
        <span>FPS 가져오기</span>
      </button>
      <button class="btn btn-primary" @click="goCreate">
        <v-icon :icon="mdiPlus" size="14" /><span>새 문제</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <div class="surface controls">
      <div class="search-wrap">
        <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
        <input v-model="keyword" type="text" class="search" placeholder="제목·display ID 검색" @keyup.enter="(() => { page = 1; load() })()" />
      </div>
      <button class="btn" @click="() => { page = 1; load() }">검색</button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">Display ID</th>
            <th>제목</th>
            <th class="col-diff">난이도</th>
            <th class="col-visible">노출</th>
            <th class="col-author">작성자</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="6" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="6" class="empty">문제가 없습니다.</td></tr>
          <tr v-for="p in items" :key="p.id">
            <td class="mono col-id">#{{ p._id || p.id }}</td>
            <td class="title-cell">{{ p.title }}</td>
            <td class="col-diff">
              <app-chip v-if="p.difficulty" :tone="difficultyTone(p.difficulty)">{{ p.difficulty }}</app-chip>
              <span v-else class="t-muted">–</span>
            </td>
            <td class="col-visible">
              <span :class="['chip', p.visible ? 'chip-low' : 'chip-high']">{{ p.visible ? '공개' : '숨김' }}</span>
            </td>
            <td class="col-author">{{ p.created_by?.username || '–' }}</td>
            <td class="col-actions">
              <button class="icon-btn" title="수정" @click="goEdit(p)">
                <v-icon :icon="mdiPencilOutline" size="14" />
              </button>
              <button class="icon-btn icon-btn-danger" title="삭제" @click="remove(p)">
                <v-icon :icon="mdiDeleteOutline" size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="page <= 1" @click="setPage(page - 1)">←</button>
      <span class="mono pager-info">{{ page }} / {{ totalPages }} · 총 {{ total }}개</span>
      <button class="btn btn-sm" :disabled="page >= totalPages" @click="setPage(page + 1)">→</button>
    </nav>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; }
.controls { display: flex; gap: 8px; align-items: center; padding: 14px 16px; }
.search-wrap { position: relative; flex: 1; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-3); pointer-events: none; }
.search { width: 100%; height: 34px; padding: 0 10px 0 32px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.search:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }

.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); white-space: nowrap; }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-id { width: 110px; color: var(--ink-3); }
.col-diff { width: 100px; }
.col-visible { width: 80px; }
.col-author { width: 120px; color: var(--ink-2); }
.col-actions { width: 100px; text-align: right; }
.title-cell { color: var(--ink); font-weight: 500; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.icon-btn { background: transparent; border: none; cursor: pointer; width: 28px; height: 28px; border-radius: var(--r-sm); color: var(--ink-2); display: inline-grid; place-items: center; margin-left: 4px; }
.icon-btn:hover { background: var(--sunken); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
