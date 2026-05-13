<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { mdiMagnify } from '@mdi/js'
import { applyLecture, getOpenLectures, getTakingLectures } from '~/api/oj'
import { useUserStore } from '~/stores/user'
import { useNotice } from '~/composables/useNotice'
import EmptyState from '~/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { user, isAuthenticated } = storeToRefs(userStore)
const notice = useNotice()

const PAGE_SIZE = 12

// ---------- 학기 계산 ----------
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = today.getMonth() + 1
function inferSemester() {
  if (currentMonth >= 3 && currentMonth <= 7) return 1
  if (currentMonth >= 8 && currentMonth <= 12) return 2
  return 3 // 입학 전 프로그램
}
const selectableYears = (() => {
  const list = []
  for (let y = currentYear; y >= currentYear - 5; y -= 1) list.push(y)
  return list
})()

// ---------- state ----------
const tab = ref(route.query.tab === 'open' ? 'open' : 'taking') // 'taking' | 'open'
const filters = reactive({
  year: parseInt(route.query.year) || currentYear,
  semester: parseInt(route.query.semester) || inferSemester(),
  keyword: route.query.keyword || ''
})
const page = ref(parseInt(route.query.page) || 1)

const items = ref([])
const total = ref(0)
const loading = ref(false)
const applying = ref(null) // lecture id currently being applied to

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

// ---------- 데이터 로드 ----------
async function load() {
  loading.value = true
  const offset = (page.value - 1) * PAGE_SIZE
  try {
    if (tab.value === 'taking') {
      const data = await getTakingLectures({
        offset,
        limit: PAGE_SIZE,
        yearSort: filters.year,
        subjSort: filters.semester,
        keyword: filters.keyword || undefined
      })
      // signup_class 객체 배열. lecture 필드를 가짐.
      items.value = (data?.results || []).map((row) => ({
        signupId: row.id,
        isAllow: row.isallow,
        lecture: row.lecture
      }))
      total.value = data?.total || 0
    } else {
      const data = await getOpenLectures({
        offset,
        limit: PAGE_SIZE,
        keyword: filters.keyword || undefined,
        sortYear: filters.year,
        sortSemester: filters.semester
      })
      items.value = (data?.results || []).map((lec) => ({
        signupId: null,
        isAllow: null,
        lecture: lec
      }))
      total.value = data?.total || 0
    }
  } catch (err) {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function syncRoute() {
  router.replace({
    path: '/CourseList',
    query: {
      tab: tab.value,
      year: String(filters.year),
      semester: String(filters.semester),
      keyword: filters.keyword || undefined,
      page: page.value > 1 ? String(page.value) : undefined
    }
  })
}

function switchTab(next) {
  if (next === tab.value) return
  tab.value = next
  page.value = 1
  syncRoute()
  load()
}

function setYear(y) {
  filters.year = y
  page.value = 1
  syncRoute()
  load()
}

function setSemester(s) {
  filters.semester = s
  page.value = 1
  syncRoute()
  load()
}

function applyKeyword() {
  page.value = 1
  syncRoute()
  load()
}

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  syncRoute()
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goLecture(lec) {
  router.push(`/CourseList/${lec.id}/`)
}

async function applyTo(lec) {
  if (!isAuthenticated.value) {
    notice.error('로그인이 필요합니다.')
    return
  }
  applying.value = lec.id
  try {
    await applyLecture({
      lecture_id: lec.id,
      user_id: user.value.id,
      user_realname: user.value.realname,
      user_schoolssn: user.value.schoolssn,
      status: false
    })
    notice.success('수강신청을 보냈어요.')
    await load()
  } catch (err) {
    notice.error(err?.message || '수강신청에 실패했습니다.')
  } finally {
    applying.value = null
  }
}

const semesterOptions = [
  { value: 1, label: '1학기' },
  { value: 2, label: '2학기' },
  { value: 3, label: '입학 전' }
]

function semesterLabel(s) {
  return semesterOptions.find((o) => o.value === s)?.label || `${s}학기`
}

onMounted(load)

// URL 직접 입력으로 진입 시 동기화
watch(
  () => route.query,
  (q) => {
    const newTab = q.tab === 'open' ? 'open' : 'taking'
    const newYear = parseInt(q.year) || currentYear
    const newSemester = parseInt(q.semester) || inferSemester()
    const newKeyword = q.keyword || ''
    const newPage = parseInt(q.page) || 1
    if (
      newTab !== tab.value ||
      newYear !== filters.year ||
      newSemester !== filters.semester ||
      newKeyword !== filters.keyword ||
      newPage !== page.value
    ) {
      tab.value = newTab
      filters.year = newYear
      filters.semester = newSemester
      filters.keyword = newKeyword
      page.value = newPage
      load()
    }
  }
)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div class="mono eyebrow">DCU LECTURES</div>
      <h1 class="title">수강과목</h1>
      <p class="subtitle">현재 수강 중인 강의와 새로 신청할 수 있는 강의를 한 곳에서 확인하세요.</p>
    </header>

    <div class="surface controls">
      <div class="tabs">
        <button
          type="button"
          :class="['tab', tab === 'taking' && 'tab-active']"
          @click="switchTab('taking')"
        >
          수강 중
        </button>
        <button
          type="button"
          :class="['tab', tab === 'open' && 'tab-active']"
          @click="switchTab('open')"
        >
          수강신청
        </button>
      </div>

      <div class="filters">
        <div class="filter">
          <label class="mono filter-label">연도</label>
          <select :value="filters.year" class="select" @change="(e) => setYear(Number(e.target.value))">
            <option v-for="y in selectableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="filter">
          <label class="mono filter-label">학기</label>
          <select
            :value="filters.semester"
            class="select"
            @change="(e) => setSemester(Number(e.target.value))"
          >
            <option v-for="opt in semesterOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="filter filter-grow">
          <label class="mono filter-label">검색</label>
          <div class="search-wrap">
            <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
            <input
              v-model="filters.keyword"
              type="text"
              class="search"
              placeholder="과목명 또는 키워드"
              @keyup.enter="applyKeyword"
            />
          </div>
        </div>
        <button class="btn" @click="applyKeyword">적용</button>
      </div>
    </div>

    <div class="meta-row">
      <span class="mono t-muted">총 {{ total }}개</span>
      <span v-if="loading" class="mono t-muted">불러오는 중…</span>
    </div>

    <div v-if="items.length" class="lecture-grid">
      <article
        v-for="row in items"
        :key="row.signupId || `open-${row.lecture.id}`"
        class="surface lecture-card"
      >
        <div class="card-head">
          <span class="mono card-meta">
            {{ row.lecture.year }}/{{ semesterLabel(row.lecture.semester) }}
          </span>
          <span v-if="tab === 'taking' && row.isAllow === false" class="chip chip-mid">대기중</span>
          <span v-else-if="tab === 'taking'" class="chip">수강 중</span>
        </div>
        <h2 class="card-title">{{ row.lecture.title }}</h2>
        <div class="card-prof mono">
          {{ row.lecture.created_by?.realname || row.lecture.created_by?.username || '담당 미정' }}
        </div>

        <div class="card-actions">
          <template v-if="tab === 'taking'">
            <button
              class="btn btn-primary"
              :disabled="row.isAllow === false"
              @click="goLecture(row.lecture)"
            >
              {{ row.isAllow === false ? '승인 대기' : '강의 들어가기 →' }}
            </button>
          </template>
          <template v-else>
            <button
              class="btn btn-primary"
              :disabled="applying === row.lecture.id"
              @click="applyTo(row.lecture)"
            >
              {{ applying === row.lecture.id ? '신청 중…' : '수강신청' }}
            </button>
          </template>
        </div>
      </article>
    </div>

    <empty-state
      v-else-if="!loading"
      :title="tab === 'taking' ? '아직 수강 중인 강의가 없어요' : '신청 가능한 강의가 없어요'"
      :description="
        tab === 'taking'
          ? '수강신청 탭에서 새 강의를 찾아보세요.'
          : '필터를 바꿔서 다시 검색해보세요.'
      "
    >
      <template v-if="tab === 'taking'" #action>
        <button class="btn btn-primary" @click="switchTab('open')">수강신청 보기 →</button>
      </template>
    </empty-state>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="page <= 1" @click="setPage(page - 1)">←</button>
      <span class="mono pager-info">{{ page }} / {{ totalPages }}</span>
      <button class="btn btn-sm" :disabled="page >= totalPages" @click="setPage(page + 1)">→</button>
    </nav>
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 32px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
@media (max-width: 720px) {
  .page {
    padding: 24px;
  }
}

.eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.title {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.8px;
  margin: 0 0 6px;
  color: var(--ink);
}
.subtitle {
  font-size: 14px;
  color: var(--ink-2);
  margin: 0;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px;
}

.tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--sunken);
  border-radius: var(--r-md);
  align-self: flex-start;
}
.tab {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
  background: transparent;
  border: none;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-family: inherit;
  transition: background var(--t-fast) var(--ease-out);
}
.tab-active {
  background: var(--surface);
  color: var(--ink);
  font-weight: 600;
}

.filters {
  display: grid;
  grid-template-columns: 120px 130px 1fr auto;
  gap: 12px;
  align-items: flex-end;
}
@media (max-width: 720px) {
  .filters {
    grid-template-columns: 1fr 1fr;
  }
}
.filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-grow {
  grid-column: span 1;
}
@media (max-width: 720px) {
  .filter-grow {
    grid-column: span 2;
  }
}
.filter-label {
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.select {
  height: 34px;
  padding: 0 10px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-family: inherit;
  font-size: 13px;
  outline: none;
}
.select:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.search-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
  pointer-events: none;
}
.search {
  width: 100%;
  height: 34px;
  padding: 0 10px 0 32px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-family: inherit;
  font-size: 13px;
  outline: none;
}
.search:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  padding: 0 4px;
}

.lecture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.lecture-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color var(--t-fast) var(--ease-out);
}
.lecture-card:hover {
  border-color: var(--line-strong);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-meta {
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
  margin: 0;
  color: var(--ink);
}
.card-prof {
  font-size: 12px;
  color: var(--ink-2);
}
.card-actions {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
}
.card-actions .btn {
  flex: 1;
  justify-content: center;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}
.pager-info {
  font-size: 12px;
  color: var(--ink-3);
}
</style>
