<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getContestList, getLecture } from '~/api/oj'
import AppChip from '~/components/AppChip.vue'

const route = useRoute()
const lecture = ref(null)
const contests = ref([])
const loading = ref(false)
const ruleFilter = ref('')

const lectureID = computed(() => route.params.lectureID)

const STATUS_MAP = {
  '-1': { tone: '', label: '종료' },
  0: { tone: 'low', label: '진행중' },
  1: { tone: 'mid', label: '예정' }
}
function statusOf(s) { return STATUS_MAP[String(s)] || { tone: '', label: '–' } }

function fmt(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function load() {
  loading.value = true
  try {
    const [lec, con] = await Promise.all([
      getLecture(lectureID.value),
      getContestList({ lectureid: lectureID.value, limit: 50 })
    ])
    lecture.value = lec
    let list = con?.results || []
    if (ruleFilter.value) list = list.filter((c) => c.rule_type === ruleFilter.value)
    contests.value = list
  } catch {
    contests.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.lectureID, load)
watch(ruleFilter, load)
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow" v-if="lecture">강의 #{{ lectureID }} · {{ lecture.year }}/{{ lecture.semester }}학기</div>
      <h1 class="title">{{ lecture?.title || '로딩 중…' }}</h1>
      <p v-if="lecture" class="subtitle">
        담당: {{ lecture.created_by?.realname || lecture.created_by?.username || '–' }}
        · 콘테스트 {{ contests.length }}개
      </p>
    </header>

    <div class="filter-bar">
      <span class="mono t-muted">{{ contests.length }}개의 콘테스트</span>
      <select v-model="ruleFilter" class="select">
        <option value="">전체 룰</option>
        <option value="ACM">ACM</option>
        <option value="OI">OI</option>
      </select>
    </div>

    <div v-if="loading && !contests.length" class="surface empty">불러오는 중…</div>
    <div v-else-if="!contests.length" class="surface empty">콘테스트가 없습니다.</div>

    <section v-for="c in contests" :key="c.id" class="surface contest-card">
      <div>
        <div class="mono c-meta">
          <span :class="['chip', `chip-${statusOf(c.status).tone}`]">{{ statusOf(c.status).label }}</span>
          <app-chip v-if="c.lecture_contest_type">{{ c.lecture_contest_type }}</app-chip>
          <span>{{ c.rule_type }}</span>
          <span>·</span>
          <span>{{ fmt(c.start_time) }} ~ {{ fmt(c.end_time) }}</span>
        </div>
        <h2 class="c-title">{{ c.title }}</h2>
      </div>
      <router-link :to="`/CourseList/${lectureID}/${c.id}/`" class="btn btn-primary">
        들어가기 →
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 14px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0 0 6px; color: var(--ink); }
.subtitle { font-size: 14px; color: var(--ink-2); margin: 0; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
.select { height: 30px; padding: 0 10px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 12px; font-family: inherit; }
.contest-card { padding: 20px 24px; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
.c-meta { font-size: 11px; color: var(--ink-3); display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.c-title { font-size: 17px; font-weight: 600; margin: 0; color: var(--ink); }
.empty { padding: 40px; text-align: center; color: var(--ink-3); }
</style>
