<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { mdiRefresh } from '@mdi/js'
import { freshDisplayID, getUserInfo } from '~/api/oj'
import { useUserStore } from '~/stores/user'
import { useNotice } from '~/composables/useNotice'

const route = useRoute()
const userStore = useUserStore()
const { user: currentUser, roleLabel } = storeToRefs(userStore)
const notice = useNotice()

const profile = ref(null)
const loading = ref(false)

const queryUsername = computed(() => route.query.username || null)
const isSelf = computed(() => !queryUsername.value || (currentUser.value && currentUser.value.username === queryUsername.value))

async function load() {
  loading.value = true
  try {
    profile.value = await getUserInfo(queryUsername.value || undefined)
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
}

const initials = computed(() => {
  const n = profile.value?.user?.username || profile.value?.real_name
  return n ? n.slice(0, 2).toUpperCase() : '?'
})

const stats = computed(() => {
  const accepted = profile.value?.accepted_number ?? 0
  const submitted = profile.value?.submission_number ?? 0
  const ratio = submitted > 0 ? Math.round((accepted / submitted) * 100) : 0
  return [
    { label: '해결 문제', value: accepted },
    { label: '전체 제출', value: submitted },
    { label: '정답률', value: `${ratio}%` },
    { label: '총 점수', value: profile.value?.total_score ?? 0 }
  ]
})

const solvedProblems = computed(() => {
  const probs = profile.value?.acm_problems_status?.problems
  if (!probs) return []
  return Object.values(probs)
    .filter((p) => p.status === 0)
    .map((p) => p._id)
})

async function refreshIds() {
  try {
    await freshDisplayID(profile.value?.user?.id)
    notice.success('문제 ID를 재생성했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '재생성에 실패했습니다.')
  }
}

onMounted(load)
watch(() => route.query, load)
</script>

<template>
  <div class="page">
    <div v-if="!profile" class="surface empty">불러오는 중…</div>
    <template v-else>
      <header class="profile-head">
        <div class="avatar mono">{{ initials }}</div>
        <div class="meta">
          <h1 class="name">{{ profile.real_name || profile.user?.username || '–' }}</h1>
          <div class="chips">
            <span class="chip chip-accent">{{ isSelf ? roleLabel : '학생' }}</span>
            <span v-if="profile.school" class="chip">{{ profile.school }}</span>
            <span v-if="profile.major" class="chip">{{ profile.major }}</span>
          </div>
          <div v-if="profile.mood" class="mood">"{{ profile.mood }}"</div>
          <div class="mono sub">@{{ profile.user?.username }}</div>
        </div>
        <div class="actions">
          <router-link v-if="isSelf" to="/setting" class="btn">설정 →</router-link>
          <button v-if="isSelf" class="btn" @click="refreshIds">
            <v-icon :icon="mdiRefresh" size="14" /><span>문제 ID 재생성</span>
          </button>
        </div>
      </header>

      <section class="stats">
        <div v-for="s in stats" :key="s.label" class="surface stat">
          <div class="mono stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
        </div>
      </section>

      <section v-if="solvedProblems.length" class="surface card">
        <header class="card-head">
          <h2 class="card-title">해결한 문제</h2>
          <span class="mono t-muted">{{ solvedProblems.length }}개</span>
        </header>
        <div class="solved-grid">
          <router-link
            v-for="id in solvedProblems" :key="id"
            :to="`/problem/${id}`"
            class="solved-chip mono"
          >#{{ id }}</router-link>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 960px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 20px; }
.empty { padding: 40px; text-align: center; color: var(--ink-3); }
.profile-head { display: flex; align-items: center; gap: 20px; }
.avatar { width: 80px; height: 80px; border-radius: 50%; background: oklch(0.78 0.10 60); color: #fff; display: grid; place-items: center; font-size: 28px; font-weight: 700; flex-shrink: 0; }
.meta { flex: 1; min-width: 0; }
.name { font-size: 24px; font-weight: 600; letter-spacing: -0.4px; margin: 0; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
.mood { font-size: 13px; color: var(--ink-2); margin: 4px 0; font-style: italic; }
.sub { font-size: 11px; color: var(--ink-3); }
.actions { display: flex; gap: 8px; }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 720px) { .stats { grid-template-columns: repeat(2, 1fr); } }
.stat { padding: 18px; }
.stat-label { font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1.2px; }
.stat-value { font-size: 28px; font-weight: 600; letter-spacing: -0.5px; margin-top: 6px; }

.card { padding: 22px 24px; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.solved-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.solved-chip { padding: 6px 10px; background: var(--sunken); border-radius: var(--r-sm); color: var(--ink-2); text-decoration: none; font-size: 12px; }
.solved-chip:hover { background: var(--accent-soft); color: var(--accent); }
</style>
