<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { mdiAccountGroupOutline, mdiCalendarMonth, mdiDeleteOutline, mdiMagnify, mdiPencilOutline, mdiPlus, mdiRefresh } from '@mdi/js'
import { deleteLecture, getAdminLectures } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const router = useRouter()
const notice = useNotice()

const PAGE_SIZE = 15
const items = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const loading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

async function load() {
  loading.value = true
  try {
    const data = await getAdminLectures({
      paging: true,
      offset: (page.value - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      keyword: keyword.value || undefined
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

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  load()
}

function goCreate() {
  router.push('/lecture/create')
}

function goEdit(row) {
  router.push(`/lecture/${row.id}/edit`)
}

function goContests(row) {
  router.push(`/lecture/${row.id}/contests`)
}

function goStudents(row) {
  router.push(`/lecture/${row.id}/students`)
}

async function remove(row) {
  if (!confirm(`강의 "${row.title}" 를 삭제할까요? 안에 있는 콘테스트도 함께 사라집니다.`)) return
  try {
    await deleteLecture(row.id)
    notice.success('삭제했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

onMounted(load)
</script>

<template>
  <page-header eyebrow="Admin / Lecture" title="강의 목록">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
      <button class="btn" @click="router.push('/lecture/batch-migrate')">
        <v-icon :icon="mdiCalendarMonth" size="14" /><span>학기 일괄</span>
      </button>
      <button class="btn btn-primary" @click="goCreate">
        <v-icon :icon="mdiPlus" size="14" /><span>새 강의</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <div class="surface controls">
      <div class="search-wrap">
        <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
        <input v-model="keyword" type="text" class="search" placeholder="과목명 검색" @keyup.enter="(() => { page = 1; load() })()" />
      </div>
      <button class="btn" @click="() => { page = 1; load() }">검색</button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th>제목</th>
            <th class="col-year">연도</th>
            <th class="col-sem">학기</th>
            <th>담당</th>
            <th class="col-status">상태</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="7" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="7" class="empty">강의가 없습니다.</td></tr>
          <tr v-for="l in items" :key="l.id">
            <td class="mono col-id">#{{ l.id }}</td>
            <td class="title-cell">{{ l.title }}</td>
            <td class="mono col-year">{{ l.year }}</td>
            <td class="mono col-sem">{{ l.semester }}</td>
            <td>{{ l.created_by?.realname || l.created_by?.username || '–' }}</td>
            <td class="col-status">
              <span :class="['chip', l.status ? 'chip-low' : 'chip-high']">{{ l.status ? '열림' : '닫힘' }}</span>
            </td>
            <td class="col-actions">
              <button class="icon-btn" title="콘테스트" @click="goContests(l)">콘테스트</button>
              <button class="icon-btn" title="학생" @click="goStudents(l)">
                <v-icon :icon="mdiAccountGroupOutline" size="14" />
              </button>
              <button class="icon-btn" title="수정" @click="goEdit(l)"><v-icon :icon="mdiPencilOutline" size="14" /></button>
              <button class="icon-btn icon-btn-danger" title="삭제" @click="remove(l)"><v-icon :icon="mdiDeleteOutline" size="14" /></button>
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
.col-year, .col-sem { width: 70px; }
.col-status { width: 80px; }
.col-actions { width: 240px; text-align: right; }
.title-cell { color: var(--ink); font-weight: 500; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.icon-btn { background: transparent; border: none; cursor: pointer; padding: 4px 8px; border-radius: var(--r-sm); color: var(--ink-2); margin-left: 4px; font-size: 12px; display: inline-flex; align-items: center; }
.icon-btn:hover { background: var(--sunken); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
