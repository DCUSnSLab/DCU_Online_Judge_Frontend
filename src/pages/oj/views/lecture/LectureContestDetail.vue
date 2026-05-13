<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getContest } from '~/api/oj'
import { useNotice } from '~/composables/useNotice'

const route = useRoute()
const notice = useNotice()

const contest = ref(null)
const now = ref(new Date())
let tick = null

const lectureID = computed(() => route.params.lectureID)
const contestID = computed(() => route.params.contestID)

const base = computed(() => `/CourseList/${lectureID.value}/${contestID.value}`)

const menu = computed(() => [
  { label: '개요', to: `${base.value}/` },
  { label: '문제', to: `${base.value}/problems` },
  { label: '제출', to: `${base.value}/submissions` },
  { label: '순위', to: `${base.value}/rank` },
  { label: '공지', to: `${base.value}/announcements` },
  { label: 'Q&A', to: `${base.value}/question` },
  { label: '도우미', to: `${base.value}/helper` },
  { label: '퇴실', to: `${base.value}/exit` }
])

const phase = computed(() => {
  if (!contest.value) return null
  const start = new Date(contest.value.start_time)
  const end = new Date(contest.value.end_time)
  if (now.value < start) return { tone: 'mid', label: '예정', remaining: start - now.value }
  if (now.value > end) return { tone: '', label: '종료', remaining: 0 }
  return { tone: 'low', label: '진행중', remaining: end - now.value }
})

function fmtDuration(ms) {
  if (!ms || ms <= 0) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

async function load() {
  try {
    contest.value = await getContest(contestID.value)
  } catch (err) {
    notice.error(err?.message || '콘테스트를 불러오지 못했습니다.')
  }
}

onMounted(() => {
  load()
  tick = setInterval(() => { now.value = new Date() }, 1000)
})
onBeforeUnmount(() => { if (tick) clearInterval(tick) })
watch(() => route.params.contestID, () => { contest.value = null; load() })
</script>

<template>
  <div class="layout">
    <aside class="surface side">
      <div class="head">
        <div class="mono eyebrow">강의 #{{ lectureID }} · 콘테스트 #{{ contestID }}</div>
        <h1 class="c-title">{{ contest?.title || '로딩 중…' }}</h1>
        <div v-if="contest" class="mono meta">
          {{ contest.lecture_contest_type || '' }} · {{ contest.rule_type }}
        </div>
        <div v-if="phase" class="surface countdown">
          <span :class="['chip', `chip-${phase.tone}`]">{{ phase.label }}</span>
          <div v-if="phase.remaining > 0" class="mono cd-time">{{ fmtDuration(phase.remaining) }}</div>
        </div>
      </div>
      <nav class="side-nav">
        <router-link
          v-for="m in menu" :key="m.to"
          :to="m.to"
          class="side-item"
          active-class="side-item-active"
          :exact-active-class="m.label === '개요' ? 'side-item-active' : ''"
        >{{ m.label }}</router-link>
      </nav>
    </aside>

    <main class="main">
      <router-view v-if="$route.matched.length > 1" :key="$route.fullPath" />
      <section v-else class="surface overview">
        <h2>개요</h2>
        <div v-if="contest" v-html="contest.description" class="rich" />
        <div v-else class="t-muted">불러오는 중…</div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.layout { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; display: grid; grid-template-columns: 260px 1fr; gap: 20px; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
.side { padding: 0; align-self: start; overflow: hidden; }
.head { padding: 20px 22px; border-bottom: 1px solid var(--line); }
.eyebrow { font-size: 10px; color: var(--ink-3); letter-spacing: 1.2px; text-transform: uppercase; }
.c-title { font-size: 16px; font-weight: 600; margin: 6px 0 4px; }
.meta { font-size: 11px; color: var(--ink-3); }
.countdown { margin-top: 14px; padding: 12px; text-align: center; background: var(--sunken); }
.cd-time { font-size: 22px; font-weight: 700; color: var(--accent); margin-top: 6px; }
.side-nav { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.side-item { padding: 9px 14px; font-size: 13px; font-weight: 500; color: var(--ink-2); border-radius: var(--r-md); text-decoration: none; }
.side-item:hover { background: var(--sunken); color: var(--ink); }
.side-item-active { background: var(--sunken); color: var(--ink); font-weight: 600; }
.main { min-width: 0; }
.overview { padding: 22px 24px; }
.overview h2 { font-size: 15px; font-weight: 600; margin: 0 0 12px; }
.rich { font-size: 13px; color: var(--ink-2); line-height: 1.6; }
.rich :deep(p) { margin: 0 0 8px; }
</style>
