<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mdiAccountCheckOutline, mdiAccountRemoveOutline, mdiMagnify, mdiRefresh } from '@mdi/js'
import {
  acceptStudent,
  denyContStudent,
  denyStudent,
  getLectureUserList,
  migrateLecture
} from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const notice = useNotice()

const PAGE_SIZE = 20
const items = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const loading = ref(false)

const lectureId = computed(() => route.params.lectureId || null)
const contestId = computed(() => route.params.contestId || null)
const headerTitle = computed(() =>
  contestId.value ? `콘테스트 #${contestId.value} 학생` : `강의 #${lectureId.value} 학생`
)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

async function load() {
  loading.value = true
  try {
    const params = {
      offset: (page.value - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      keyword: keyword.value || undefined
    }
    if (lectureId.value) params.lectureid = lectureId.value
    if (contestId.value) params.contestid = contestId.value
    const data = await getLectureUserList(params)
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

async function accept(row) {
  try {
    await acceptStudent({
      user_id: row.id,
      lecture_id: lectureId.value ? Number(lectureId.value) : undefined,
      contest_id: contestId.value ? Number(contestId.value) : undefined
    })
    notice.success('승인했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '승인에 실패했습니다.')
  }
}

async function deny(row) {
  if (!confirm(`${row.username} 학생을 거절/제외할까요?`)) return
  try {
    if (contestId.value) await denyContStudent(row.id, contestId.value)
    else await denyStudent(row.id, lectureId.value)
    notice.success('처리했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '처리에 실패했습니다.')
  }
}

async function migrate() {
  if (!lectureId.value) return
  if (!confirm('이 강의의 성적 데이터를 다시 계산할까요?')) return
  try {
    await migrateLecture({ lecture_id: lectureId.value })
    notice.success('재계산 요청을 보냈습니다.')
  } catch (err) {
    notice.error(err?.message || '재계산에 실패했습니다.')
  }
}

onMounted(load)
watch(() => route.params, load)
</script>

<template>
  <page-header eyebrow="Admin / Roster" :title="headerTitle">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
      <button v-if="lectureId && !contestId" class="btn" @click="migrate">성적 재계산</button>
    </template>
  </page-header>

  <div class="content">
    <div class="surface controls">
      <div class="search-wrap">
        <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
        <input v-model="keyword" class="search" placeholder="이름·학번·아이디 검색" @keyup.enter="(() => { page = 1; load() })()" />
      </div>
      <button class="btn" @click="() => { page = 1; load() }">검색</button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th>이름</th>
            <th>아이디</th>
            <th>학번</th>
            <th>이메일</th>
            <th class="col-status">상태</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="7" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="7" class="empty">학생이 없습니다.</td></tr>
          <tr v-for="u in items" :key="u.id">
            <td class="mono col-id">#{{ u.id }}</td>
            <td>{{ u.realname || '–' }}</td>
            <td class="mono">{{ u.username }}</td>
            <td class="mono">{{ u.schoolssn || '–' }}</td>
            <td class="t-secondary">{{ u.email || '–' }}</td>
            <td class="col-status">
              <span :class="['chip', u.isallow === false ? 'chip-mid' : 'chip-low']">
                {{ u.isallow === false ? '대기' : '수강중' }}
              </span>
            </td>
            <td class="col-actions">
              <button v-if="u.isallow === false" class="icon-btn" title="승인" @click="accept(u)">
                <v-icon :icon="mdiAccountCheckOutline" size="14" />
              </button>
              <button class="icon-btn icon-btn-danger" title="제외" @click="deny(u)">
                <v-icon :icon="mdiAccountRemoveOutline" size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="page <= 1" @click="setPage(page - 1)">←</button>
      <span class="mono pager-info">{{ page }} / {{ totalPages }} · 총 {{ total }}명</span>
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
.col-status { width: 90px; }
.col-actions { width: 100px; text-align: right; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.icon-btn { background: transparent; border: none; cursor: pointer; width: 28px; height: 28px; border-radius: var(--r-sm); color: var(--ink-2); display: inline-grid; place-items: center; margin-left: 4px; }
.icon-btn:hover { background: var(--sunken); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
