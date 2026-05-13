<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiDeleteOutline, mdiMagnify, mdiPencilOutline, mdiPlus, mdiRefresh } from '@mdi/js'
import { deleteContest, getAdminContests } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const PAGE_SIZE = 15
const items = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const loading = ref(false)

const lectureId = computed(() => route.params.lectureId || null)
const headerTitle = computed(() =>
  lectureId.value ? `강의 #${lectureId.value} 콘테스트` : '콘테스트 목록'
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
    if (lectureId.value) params.lecture_id = lectureId.value
    const data = await getAdminContests(params)
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
  if (lectureId.value) router.push(`/lecture/${lectureId.value}/contests/create`)
  else router.push('/contest/create')
}

function goEdit(row) {
  router.push(`/contest/${row.id}/edit`)
}

function goProblems(row) {
  router.push(`/contest/${row.id}/problems`)
}

function goStudents(row) {
  router.push(`/contest/${row.id}/students`)
}

async function remove(row) {
  if (!confirm(`콘테스트 "${row.title}" 를 삭제할까요?`)) return
  try {
    await deleteContest(row.id)
    notice.success('삭제했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

function status(c) {
  const now = new Date()
  const start = new Date(c.start_time)
  const end = new Date(c.end_time)
  if (now < start) return { label: '예정', tone: 'mid' }
  if (now > end) return { label: '종료', tone: '' }
  return { label: '진행중', tone: 'low' }
}

function fmt(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(load)
watch(() => route.params, load)
</script>

<template>
  <page-header eyebrow="Admin / Contest" :title="headerTitle">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
      <button class="btn btn-primary" @click="goCreate">
        <v-icon :icon="mdiPlus" size="14" /><span>새 콘테스트</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <div class="surface controls">
      <div class="search-wrap">
        <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
        <input v-model="keyword" type="text" class="search" placeholder="제목 검색" @keyup.enter="(() => { page = 1; load() })()" />
      </div>
      <button class="btn" @click="() => { page = 1; load() }">검색</button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th>제목</th>
            <th class="col-rule">룰</th>
            <th class="col-status">상태</th>
            <th class="col-time">시작</th>
            <th class="col-time">종료</th>
            <th class="col-vis">노출</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="8" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="8" class="empty">콘테스트가 없습니다.</td></tr>
          <tr v-for="c in items" :key="c.id">
            <td class="mono col-id">#{{ c.id }}</td>
            <td class="title-cell">{{ c.title }}</td>
            <td class="mono col-rule">{{ c.rule_type }}</td>
            <td class="col-status">
              <span :class="['chip', `chip-${status(c).tone || ''}`]">{{ status(c).label }}</span>
            </td>
            <td class="mono col-time">{{ fmt(c.start_time) }}</td>
            <td class="mono col-time">{{ fmt(c.end_time) }}</td>
            <td class="col-vis"><span :class="['chip', c.visible ? 'chip-low' : 'chip-high']">{{ c.visible ? '공개' : '숨김' }}</span></td>
            <td class="col-actions">
              <button class="icon-btn" title="문제" @click="goProblems(c)">문제</button>
              <button class="icon-btn" title="학생" @click="goStudents(c)">학생</button>
              <button class="icon-btn" title="수정" @click="goEdit(c)"><v-icon :icon="mdiPencilOutline" size="14" /></button>
              <button class="icon-btn icon-btn-danger" title="삭제" @click="remove(c)"><v-icon :icon="mdiDeleteOutline" size="14" /></button>
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
.col-id { width: 70px; color: var(--ink-3); }
.col-rule { width: 60px; }
.col-status { width: 80px; }
.col-time { width: 150px; color: var(--ink-2); }
.col-vis { width: 70px; }
.col-actions { width: 220px; text-align: right; }
.title-cell { color: var(--ink); font-weight: 500; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.icon-btn { background: transparent; border: none; cursor: pointer; padding: 4px 8px; border-radius: var(--r-sm); color: var(--ink-2); margin-left: 4px; font-size: 12px; display: inline-flex; align-items: center; }
.icon-btn:hover { background: var(--sunken); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
