<script setup>
import { onMounted, ref } from 'vue'
import { getAnnouncements, getContestList } from '~/api/oj'

const announcements = ref([])
const contests = ref([])

onMounted(async () => {
  // 익명 사용자에게는 백엔드가 500을 줄 수 있는 엔드포인트들이라 silent로 호출.
  // 실패 시 빈 리스트로 폴백.
  try {
    const a = await getAnnouncements({ limit: 4, offset: 0 }, { silent: true })
    announcements.value = a?.results || []
  } catch {
    /* */
  }
  try {
    const c = await getContestList({ limit: 4, offset: 0, status: 0 }, { silent: true })
    contests.value = c?.results || []
  } catch {
    /* */
  }
})

function formatTime(s) {
  if (!s) return ''
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="guest">
    <section class="hero">
      <div class="mono hero-eyebrow">DCUCODE · 대구가톨릭대학교 온라인 저지</div>
      <h1 class="hero-title">
        강의에서 배운 알고리즘을<br />
        <span class="hero-accent">직접 풀어 확인하세요.</span>
      </h1>
      <p class="hero-sub">
        문제·콘테스트·강의 실습이 한 곳에서. 가입하면 학기 진행 상황과 채점 결과를 바로 확인할 수
        있어요.
      </p>
      <div class="cta-row">
        <router-link to="/login" class="btn btn-primary btn-lg">로그인</router-link>
        <router-link to="/register" class="btn btn-lg">회원가입</router-link>
      </div>
    </section>

    <div class="public-grid">
      <section class="surface card">
        <header class="card-head">
          <div class="card-title">진행 예정/중인 콘테스트</div>
          <router-link to="/contest" class="card-more">전체 →</router-link>
        </header>
        <ul v-if="contests.length" class="public-list">
          <li v-for="c in contests" :key="c.id" class="public-item">
            <div class="public-item-title">{{ c.title }}</div>
            <div class="mono public-item-meta">
              {{ formatTime(c.start_time) }} ~ {{ formatTime(c.end_time) }}
            </div>
          </li>
        </ul>
        <div v-else class="public-empty">표시할 콘테스트가 없습니다.</div>
      </section>

      <section class="surface card">
        <header class="card-head">
          <div class="card-title">공지사항</div>
        </header>
        <ul v-if="announcements.length" class="public-list">
          <li v-for="a in announcements" :key="a.id" class="public-item">
            <div class="public-item-title">{{ a.title }}</div>
            <div class="mono public-item-meta">{{ formatTime(a.create_time) }}</div>
          </li>
        </ul>
        <div v-else class="public-empty">표시할 공지가 없습니다.</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.guest {
  max-width: 1100px;
  margin: 0 auto;
  padding: 56px 40px 80px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}
.hero-eyebrow {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.hero-title {
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -1.2px;
  line-height: 1.1;
  margin: 0 0 16px;
  color: var(--ink);
}
.hero-accent {
  color: var(--accent);
}
.hero-sub {
  font-size: 15px;
  color: var(--ink-2);
  max-width: 600px;
  margin: 0 0 24px;
}
.cta-row {
  display: flex;
  gap: 12px;
}

.public-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 720px) {
  .public-grid {
    grid-template-columns: 1fr;
  }
}
.card {
  padding: 20px;
}
.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-title {
  font-size: 13px;
  font-weight: 600;
}
.card-more {
  font-size: 11px;
  color: var(--ink-3);
  text-decoration: none;
}
.public-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.public-item {
  padding: 10px 0;
  border-top: 1px solid var(--line);
}
.public-item:first-child {
  border-top: none;
}
.public-item-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}
.public-item-meta {
  font-size: 11px;
  color: var(--ink-3);
}
.public-empty {
  padding: 16px 0;
  font-size: 12px;
  color: var(--ink-3);
  text-align: center;
}
</style>
