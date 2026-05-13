<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getContest } from '~/api/oj'
import { useNotice } from '~/composables/useNotice'

const route = useRoute()
const notice = useNotice()

const contest = ref(null)
const now = ref(new Date())

let tick = null

const contestId = computed(() => route.params.contestID)

async function load() {
  try {
    contest.value = await getContest(contestId.value)
  } catch (err) {
    notice.error(err?.message || '콘테스트를 불러오지 못했습니다.')
  }
}

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

const menu = computed(() => [
  { label: '개요', to: `/contest/${contestId.value}/` },
  { label: '문제', to: `/contest/${contestId.value}/problems` },
  { label: '제출', to: `/contest/${contestId.value}/submissions` },
  { label: '순위', to: `/contest/${contestId.value}/rank` },
  { label: '공지', to: `/contest/${contestId.value}/announcements` },
  { label: 'Q&A', to: `/contest/${contestId.value}/question` }
])

onMounted(() => {
  load()
  tick = setInterval(() => { now.value = new Date() }, 1000)
})

watch(() => route.params.contestID, () => { contest.value = null; load() })
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => { if (tick) clearInterval(tick) })
</script>

<template>
  <div class="layout">
    <aside class="surface side">
      <div class="contest-head">
        <div class="mono eyebrow">CONTEST #{{ contestId }}</div>
        <h1 class="c-title">{{ contest?.title || '로딩 중…' }}</h1>
        <div v-if="contest" class="mono meta">
          {{ contest.rule_type }} ·
          {{ new Date(contest.start_time).toLocaleString() }}
        </div>
        <div v-if="phase" class="surface countdown">
          <div class="mono cd-label">
            <span :class="['chip', `chip-${phase.tone}`]">{{ phase.label }}</span>
          </div>
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
.contest-head { padding: 20px 22px; border-bottom: 1px solid var(--line); }
.eyebrow { font-size: 10px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; }
.c-title { font-size: 16px; font-weight: 600; margin: 6px 0 4px; }
.meta { font-size: 11px; color: var(--ink-3); }
.countdown { margin-top: 14px; padding: 12px; text-align: center; background: var(--sunken); }
.cd-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
.cd-time { font-size: 22px; font-weight: 700; color: var(--accent); margin-top: 4px; }
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
