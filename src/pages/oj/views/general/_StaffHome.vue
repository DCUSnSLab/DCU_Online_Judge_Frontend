<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import { getAnnouncements } from '~/api/oj'
import { getAdminLectures, getDashboardInfo } from '~/api/admin'

const userStore = useUserStore()
const { user, isSuperAdmin, roleLabel } = storeToRefs(userStore)

const lectures = ref([])
const announcements = ref([])
const dashboardInfo = ref(null)

const displayName = computed(() => user.value?.real_name || user.value?.username || '')

const todayLabel = computed(() => {
  const d = new Date()
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${weekday}요일 · ${d.getMonth() + 1}월 ${d.getDate()}일`
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

function formatTime(s) {
  if (!s) return ''
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  // 내 강의 (ADMIN: 본인이 만든 것, TA는 보조 강의 — 백엔드 자동 필터)
  try {
    const lec = await getAdminLectures({ limit: 6, offset: 0 })
    lectures.value = lec?.results || []
  } catch {
    /* */
  }
  // 공지
  try {
    const a = await getAnnouncements({ limit: 4, offset: 0 })
    announcements.value = a?.results || []
  } catch {
    /* */
  }
  // 슈퍼관리자만 시스템 카운트
  if (isSuperAdmin.value) {
    try {
      dashboardInfo.value = await getDashboardInfo()
    } catch {
      /* */
    }
  }
})
</script>

<template>
  <div class="home">
    <div class="home-grid">
      <div class="main-col">
        <section class="hero">
          <div class="mono hero-eyebrow">{{ todayLabel }} · {{ roleLabel }}</div>
          <h1 class="hero-title">
            {{ displayName || '안녕하세요' }}님,
            <template v-if="lectures.length">
              <br /><span class="hero-accent">{{ lectures.length }}개 강의</span>를 운영 중이에요.
            </template>
            <template v-else><br />관리 콘솔로 바로 이동할까요?</template>
          </h1>
        </section>

        <section class="surface admin-shortcut">
          <div>
            <div class="mono section-eyebrow">관리자 콘솔</div>
            <div class="admin-shortcut-title">강의·콘테스트·문제 관리</div>
            <div class="admin-shortcut-sub">
              {{
                isSuperAdmin
                  ? '시스템 설정, 채점 서버, 사용자 관리까지 모두 사용할 수 있어요.'
                  : '내가 만든 강의와 콘테스트를 한 곳에서 관리할 수 있어요.'
              }}
            </div>
          </div>
          <a href="/admin.html" class="btn btn-primary btn-lg">관리자 콘솔 →</a>
        </section>

        <section v-if="isSuperAdmin" class="stats">
          <div v-for="s in adminStats" :key="s.label" class="surface stat">
            <div class="mono stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
          </div>
        </section>

        <section v-if="lectures.length" class="block">
          <header class="block-header">
            <h2 class="block-title">내 강의</h2>
            <a href="/admin.html#/lecture" class="block-more">전체 →</a>
          </header>
          <div class="lecture-grid">
            <a
              v-for="lec in lectures"
              :key="lec.id"
              :href="`/admin.html#/lecture/${lec.id}/edit`"
              class="surface lecture-card"
            >
              <div class="mono lecture-meta">{{ lec.year }}/{{ lec.semester }}학기</div>
              <div class="lecture-title">{{ lec.title }}</div>
              <div class="lecture-desc">
                {{ lec.description ? lec.description.slice(0, 60) : '설명 없음' }}
              </div>
            </a>
          </div>
        </section>

        <section v-else class="surface block-empty">
          <div class="mono section-eyebrow">내 강의</div>
          <p class="t-secondary">
            아직 만든 강의가 없어요. 관리자 콘솔에서 새 강의를 생성할 수 있습니다.
          </p>
          <a href="/admin.html#/lecture/create" class="btn">강의 생성하기</a>
        </section>
      </div>

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

        <section v-if="isSuperAdmin" class="surface rail-card">
          <header class="rail-header">
            <div class="rail-title">빠른 액션</div>
          </header>
          <div class="quick-actions">
            <a href="/admin.html#/announcement" class="quick-action">공지 작성</a>
            <a href="/admin.html#/judge-server" class="quick-action">채점 서버</a>
            <a href="/admin.html#/user" class="quick-action">사용자 관리</a>
            <a href="/admin.html#/llm-keys" class="quick-action">LLM 키</a>
          </div>
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
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  padding: 24px;
  align-items: center;
}
.section-eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 6px;
}
.admin-shortcut-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
}
.admin-shortcut-sub {
  font-size: 13px;
  color: var(--ink-2);
  margin-top: 4px;
  max-width: 480px;
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
.lecture-desc {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.4;
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

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.quick-action {
  padding: 10px 12px;
  background: var(--sunken);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
  text-decoration: none;
  text-align: center;
}
.quick-action:hover {
  background: var(--surface);
  border-color: var(--line-strong);
  color: var(--ink);
}
</style>
