<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import { getAnnouncements, getContestList, getSubmissionList, getUserProgress } from '~/api/oj'

const userStore = useUserStore()
const { profile, user, isSemiAdmin, roleLabel } = storeToRefs(userStore)

const lectures = ref([])
const announcements = ref([])
const contests = ref([])
const submissions = ref([])
const lecturesError = ref(false)

const displayName = computed(() => user.value?.real_name || user.value?.username || '')

const todayLabel = computed(() => {
  const d = new Date()
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${weekday}요일 · ${d.getMonth() + 1}월 ${d.getDate()}일`
})

const stats = computed(() => {
  const accepted = profile.value?.accepted_number ?? 0
  const submitted = profile.value?.submission_number ?? 0
  const ratio = submitted > 0 ? Math.round((accepted / submitted) * 100) : 0
  return [
    { label: '해결한 문제', value: String(accepted), help: '누적' },
    { label: '제출 수', value: String(submitted), help: '누적' },
    { label: '정답률', value: `${ratio}%`, help: '해결 / 제출' },
    { label: '총 점수', value: String(profile.value?.total_score ?? 0), help: 'OI 누적' }
  ]
})

const submissionStatusMap = {
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

function statusOf(result) {
  return submissionStatusMap[String(result)] || { code: '?', tone: 'pending' }
}

function relative(ts) {
  if (!ts) return ''
  const now = Date.now()
  const t = new Date(ts).getTime()
  const diff = Math.max(0, now - t)
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  const date = new Date(ts)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatTime(s) {
  if (!s) return ''
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  // 1. 이번 학기 강의 진행 — 학생/TA 전용
  try {
    const lec = await getUserProgress({ limit: 6, offset: 0 })
    lectures.value = Array.isArray(lec) ? [] : lec?.results || []
  } catch {
    lecturesError.value = true
  }
  // 2. 공지
  try {
    const a = await getAnnouncements({ limit: 4, offset: 0 })
    announcements.value = a?.results || []
  } catch {
    /* */
  }
  // 3. 다가오는/진행 중 콘테스트
  try {
    const c = await getContestList({ limit: 3, offset: 0, status: 0 })
    contests.value = c?.results || []
  } catch {
    /* */
  }
  // 4. 본인 제출
  try {
    const s = await getSubmissionList({ limit: 5, offset: 0, myself: 1 })
    submissions.value = s?.results || []
  } catch {
    /* */
  }
})
</script>

<template>
  <div class="home">
    <div class="home-grid">
      <!-- LEFT -->
      <div class="main-col">
        <section class="hero">
          <div class="mono hero-eyebrow">{{ todayLabel }} · {{ roleLabel }}</div>
          <h1 class="hero-title">
            {{ displayName || '안녕하세요' }}님,
            <template v-if="lectures.length">
              <br />이번 학기 <span class="hero-accent">{{ lectures.length }}개 강의</span>에 참여
              중이에요.
            </template>
            <template v-else><br />오늘도 즐겁게 풀어봐요.</template>
          </h1>
        </section>

        <section v-if="isSemiAdmin" class="surface admin-shortcut">
          <div>
            <div class="mono section-eyebrow">TA/RA 콘솔</div>
            <div class="admin-shortcut-title">보조하는 강의를 관리할 수 있어요</div>
          </div>
          <a href="/admin.html" class="btn btn-primary">관리자 콘솔 →</a>
        </section>

        <section v-if="lectures.length" class="block">
          <header class="block-header">
            <h2 class="block-title">이번 학기 진행</h2>
            <router-link to="/CourseList" class="block-more">전체 →</router-link>
          </header>
          <div class="lecture-grid">
            <router-link
              v-for="lec in lectures"
              :key="lec.id || lec.lecture?.id"
              :to="`/CourseList/${lec.lecture?.id}/`"
              class="surface lecture-card"
            >
              <div class="mono lecture-meta">
                {{ lec.lecture?.year }}/{{ lec.lecture?.semester }}학기
              </div>
              <div class="lecture-title">{{ lec.lecture?.title || '강의' }}</div>
              <div class="lecture-stats">
                <span>실습 {{ lec.solvePractice }}/{{ lec.totalPractice }}</span>
                <span class="dot-sep">·</span>
                <span>과제 {{ lec.solveAssign }}/{{ lec.totalAssign }}</span>
              </div>
              <div class="progress">
                <div
                  class="progress-bar"
                  :style="{ width: `${Math.min(100, Math.max(0, lec.progress || 0))}%` }"
                />
              </div>
              <div class="lecture-foot mono">
                평균 {{ Math.round((lec.avgScore || 0) * 10) / 10 }} ·
                {{ Math.round(lec.progress || 0) }}%
              </div>
            </router-link>
          </div>
        </section>

        <section v-else-if="!lecturesError" class="surface block-empty">
          <div class="mono section-eyebrow">이번 학기 진행</div>
          <p class="t-secondary">
            아직 수강 중인 강의가 없어요. 강의 페이지에서 수강 신청을 진행해주세요.
          </p>
          <router-link to="/lecture" class="btn">개설 강의 보기</router-link>
        </section>

        <section class="stats">
          <div v-for="s in stats" :key="s.label" class="surface stat">
            <div class="mono stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-help">{{ s.help }}</div>
          </div>
        </section>
      </div>

      <!-- RIGHT RAIL -->
      <aside class="rail">
        <section class="surface rail-card">
          <header class="rail-header">
            <div class="rail-title">공지사항</div>
            <span class="mono rail-pill">{{ announcements.length }}</span>
          </header>
          <ul v-if="announcements.length" class="rail-list">
            <li v-for="a in announcements" :key="a.id" class="rail-item">
              <div class="rail-item-title">{{ a.title }}</div>
              <div class="mono rail-item-meta">{{ formatTime(a.create_time) }}</div>
            </li>
          </ul>
          <div v-else class="rail-empty">공지가 없습니다.</div>
        </section>

        <section class="surface rail-card">
          <header class="rail-header">
            <div class="rail-title">다가오는 콘테스트</div>
          </header>
          <ul v-if="contests.length" class="rail-list">
            <li v-for="c in contests" :key="c.id" class="rail-item">
              <div class="rail-item-title">{{ c.title }}</div>
              <div class="mono rail-item-meta">
                {{ formatTime(c.start_time) }} ~ {{ formatTime(c.end_time) }}
              </div>
            </li>
          </ul>
          <div v-else class="rail-empty">예정된 콘테스트가 없어요.</div>
        </section>

        <section class="surface rail-card">
          <header class="rail-header">
            <div class="rail-title">내 최근 제출</div>
            <router-link to="/status" class="mono rail-more">전체 →</router-link>
          </header>
          <ul v-if="submissions.length" class="activity-list">
            <li v-for="s in submissions" :key="s.id" class="activity-item">
              <span
                :class="[
                  'activity-status',
                  `activity-status-${statusOf(s.result).tone}`,
                  'mono'
                ]"
                >{{ statusOf(s.result).code }}</span
              >
              <span class="activity-title">{{ s.problem || '문제' }}</span>
              <span class="mono t-muted">{{ relative(s.create_time) }}</span>
            </li>
          </ul>
          <div v-else class="rail-empty">제출 기록이 없습니다.</div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 40px 56px;
}
.home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 40px;
  max-width: 1400px;
  margin: 0 auto;
}
@media (max-width: 1100px) {
  .home {
    padding: 24px;
  }
  .home-grid {
    grid-template-columns: 1fr;
  }
}
.main-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.hero {
  margin-bottom: 8px;
}
.hero-eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.hero-title {
  font-size: 40px;
  font-weight: 600;
  letter-spacing: -1px;
  line-height: 1.15;
  margin: 0;
  color: var(--ink);
}
.hero-accent {
  color: var(--accent);
}

.admin-shortcut {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}
.section-eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 4px;
}
.admin-shortcut-title {
  font-size: 16px;
  font-weight: 600;
}

.block-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.block-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.block-more {
  font-size: 12px;
  color: var(--ink-3);
  text-decoration: none;
}
.block-empty {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.lecture-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
@media (max-width: 720px) {
  .lecture-grid {
    grid-template-columns: 1fr;
  }
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
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}
.lecture-stats {
  font-size: 12px;
  color: var(--ink-2);
  display: flex;
  gap: 6px;
  align-items: center;
}
.dot-sep {
  color: var(--ink-4);
}
.progress {
  height: 4px;
  background: var(--sunken);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.progress-bar {
  height: 100%;
  background: var(--accent);
}
.lecture-foot {
  font-size: 10px;
  color: var(--ink-3);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 720px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
.stat {
  padding: 18px;
}
.stat-label {
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin-top: 6px;
}
.stat-help {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 2px;
}

.rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.rail-card {
  padding: 20px;
}
.rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.rail-title {
  font-size: 13px;
  font-weight: 600;
}
.rail-pill {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 3px;
}
.rail-more {
  font-size: 11px;
  color: var(--ink-3);
  text-decoration: none;
}
.rail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rail-item {
  padding: 10px 0;
  border-top: 1px solid var(--line);
}
.rail-item:first-child {
  border-top: none;
  padding-top: 0;
}
.rail-item-title {
  font-size: 13px;
  font-weight: 500;
}
.rail-item-meta {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 2px;
}
.rail-empty {
  font-size: 12px;
  color: var(--ink-3);
  text-align: center;
  padding: 12px 0;
}

.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.activity-status {
  width: 40px;
  padding: 2px 0;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  color: #fff;
}
.activity-status-ac {
  background: var(--status-ac);
}
.activity-status-wa {
  background: var(--status-wa);
}
.activity-status-tle {
  background: var(--status-tle);
}
.activity-status-mle {
  background: var(--status-mle);
}
.activity-status-ce {
  background: var(--status-ce);
}
.activity-status-pending {
  background: var(--status-pending);
}
.activity-status-judging {
  background: var(--status-judging);
}
.activity-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
