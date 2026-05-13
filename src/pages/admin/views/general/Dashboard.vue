<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import {
  getAdminLectures,
  getDashboardInfo,
  getJudgeServers
} from '~/api/admin'
import PageHeader from '~/components/PageHeader.vue'

const userStore = useUserStore()
const {
  user,
  isAuthenticated,
  isAdmin,
  isAdminRole,
  isSemiAdmin,
  isSuperAdmin,
  roleLabel
} = storeToRefs(userStore)

const dashboardInfo = ref(null)
const judgeServers = ref([])
const lectures = ref([])

const displayName = computed(() => user.value?.real_name || user.value?.username || '관리자')

const userInitials = computed(() => {
  const n = user.value?.username || user.value?.real_name
  return n ? n.slice(0, 2).toUpperCase() : '?'
})

const adminStats = computed(() => {
  const d = dashboardInfo.value || {}
  return [
    { label: '전체 사용자', value: d.user_count ?? '–' },
    { label: '오늘 제출', value: d.today_submission_count ?? '–' },
    { label: '진행/예정 콘테스트', value: d.recent_contest_count ?? '–' },
    { label: '활성 채점 서버', value: d.judge_server_count ?? '–' }
  ]
})

const lectureLabel = computed(() => {
  if (isSuperAdmin.value) return '전체 강의'
  if (isAdmin.value) return '내가 만든 강의'
  if (isSemiAdmin.value) return '보조하는 강의'
  return '강의'
})

function refreshAll() {
  if (!isAdminRole.value) return
  loadLectures()
  if (isSuperAdmin.value) {
    loadDashboardInfo()
    loadJudgeServers()
  }
}

async function loadLectures() {
  try {
    const r = await getAdminLectures({ limit: 8, offset: 0 })
    lectures.value = r?.results || []
  } catch {
    lectures.value = []
  }
}

async function loadDashboardInfo() {
  try {
    dashboardInfo.value = await getDashboardInfo()
  } catch {
    /* */
  }
}

async function loadJudgeServers() {
  try {
    const r = await getJudgeServers()
    judgeServers.value = r?.servers || []
  } catch {
    judgeServers.value = []
  }
}

onMounted(() => {
  if (isAuthenticated.value) refreshAll()
})

function judgeServerStatusTone(s) {
  return s?.status === 'normal' ? 'ac' : 'wa'
}
</script>

<template>
  <page-header eyebrow="Admin / 개요" :title="`Dashboard`">
    <template #actions>
      <button class="btn" @click="refreshAll">새로고침</button>
    </template>
  </page-header>

  <div class="content">
    <!-- 권한 안내 -->
    <section v-if="!isAuthenticated" class="surface guard">
      <div class="mono section-label">로그인 필요</div>
      <p class="t-secondary">관리자 콘솔은 로그인 후 사용할 수 있습니다.</p>
      <a href="/login" class="btn btn-primary">로그인하러 가기</a>
    </section>

    <section v-else-if="!isAdminRole" class="surface guard">
      <div class="mono section-label">접근 권한 없음</div>
      <p class="t-secondary">
        현재 계정({{ roleLabel }})에는 관리자 콘솔 접근 권한이 없습니다. 학생 페이지로 돌아가주세요.
      </p>
      <a href="/" class="btn btn-primary">학생 페이지로 이동</a>
    </section>

    <template v-else>
      <!-- 사용자 카드 -->
      <section class="surface profile-card">
        <div class="profile-avatar mono">{{ userInitials }}</div>
        <div class="profile-meta">
          <div class="profile-name">{{ displayName }}</div>
          <div class="profile-chips">
            <span class="chip chip-accent">{{ roleLabel }}</span>
            <span class="chip">{{ user?.admin_type || 'Regular User' }}</span>
            <span v-if="user?.problem_permission" class="chip">
              문제 권한 · {{ user.problem_permission }}
            </span>
          </div>
          <div class="mono profile-sub">
            {{ user?.username }}<span v-if="user?.email"> · {{ user.email }}</span>
          </div>
        </div>
      </section>

      <!-- Super Admin only — 시스템 카운트 -->
      <section v-if="isSuperAdmin" class="stats">
        <div v-for="s in adminStats" :key="s.label" class="surface stat">
          <div class="mono stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
        </div>
      </section>

      <!-- 강의 카드 (admin/ta/super) -->
      <section class="block">
        <header class="block-header">
          <h2 class="block-title">{{ lectureLabel }}</h2>
          <router-link to="/lecture" class="block-more">전체 →</router-link>
        </header>
        <div v-if="lectures.length" class="lecture-grid">
          <router-link
            v-for="lec in lectures"
            :key="lec.id"
            :to="`/lecture/${lec.id}/edit`"
            class="surface lecture-card"
          >
            <div class="mono lecture-meta">{{ lec.year }}/{{ lec.semester }}학기</div>
            <div class="lecture-title">{{ lec.title }}</div>
            <div class="lecture-desc">
              {{ lec.description ? lec.description.slice(0, 80) : '설명 없음' }}
            </div>
          </router-link>
        </div>
        <div v-else class="surface lecture-empty">
          <p class="t-secondary">
            {{
              isSemiAdmin
                ? '아직 보조하는 강의가 없어요.'
                : '아직 만든 강의가 없어요. 새 강의를 만들어보세요.'
            }}
          </p>
          <router-link v-if="!isSemiAdmin" to="/lecture/create" class="btn btn-primary"
            >강의 생성</router-link
          >
        </div>
      </section>

      <!-- Super Admin only — 채점 서버 요약 -->
      <section v-if="isSuperAdmin" class="block">
        <header class="block-header">
          <h2 class="block-title">채점 서버 ({{ judgeServers.length }})</h2>
          <router-link to="/judge-server" class="block-more">전체 →</router-link>
        </header>
        <div class="surface server-list">
          <div v-if="!judgeServers.length" class="server-empty">
            <p class="t-secondary">등록된 채점 서버가 없습니다.</p>
          </div>
          <table v-else class="server-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>IP</th>
                <th>버전</th>
                <th>태스크</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in judgeServers" :key="s.id">
                <td>{{ s.hostname || s.name || '–' }}</td>
                <td class="mono">{{ s.ip || '–' }}</td>
                <td class="mono">{{ s.judger_version || '–' }}</td>
                <td class="mono">{{ s.task_number ?? 0 }}</td>
                <td>
                  <span :class="['dot', `dot-${judgeServerStatusTone(s)}`]" />
                  <span class="server-status">{{ s.status || 'unknown' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.content {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guard {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}
.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--ink-3);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}
.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 700;
}
.profile-meta {
  min-width: 0;
  flex: 1;
}
.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}
.profile-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 6px 0;
}
.profile-sub {
  font-size: 11px;
  color: var(--ink-3);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
.stat {
  padding: 16px;
}
.stat-label {
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-top: 4px;
}

.block-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.block-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.block-more {
  font-size: 11px;
  color: var(--ink-3);
  text-decoration: none;
}

.lecture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.lecture-card {
  padding: 16px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lecture-card:hover {
  border-color: var(--line-strong);
}
.lecture-meta {
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.lecture-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.lecture-desc {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.4;
}
.lecture-empty {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.server-list {
  overflow: hidden;
}
.server-empty {
  padding: 24px;
}
.server-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.server-table th,
.server-table td {
  text-align: left;
  padding: 10px 16px;
  border-top: 1px solid var(--line);
}
.server-table th {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: var(--sunken);
  border-top: none;
}
.server-table td {
  color: var(--ink);
}
.server-status {
  margin-left: 6px;
  color: var(--ink-2);
}
</style>
