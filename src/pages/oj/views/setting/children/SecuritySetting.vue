<script setup>
import { onMounted, ref } from 'vue'
import { mdiRefresh } from '@mdi/js'
import { deleteSession, getSessions } from '~/api/oj'
import { useNotice } from '~/composables/useNotice'

const notice = useNotice()

const sessions = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getSessions()
    sessions.value = Array.isArray(data) ? data : data?.results || []
  } catch {
    sessions.value = []
  } finally {
    loading.value = false
  }
}

async function terminate(s) {
  if (!confirm('이 세션을 종료할까요? 해당 기기에서 로그아웃됩니다.')) return
  try {
    await deleteSession(s.session_key)
    notice.success('세션을 종료했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '종료에 실패했습니다.')
  }
}

function browserOf(s) {
  if (s.user_agent) {
    const ua = s.user_agent
    if (/Chrome/.test(ua)) return 'Chrome'
    if (/Safari/.test(ua)) return 'Safari'
    if (/Firefox/.test(ua)) return 'Firefox'
    if (/Edge/.test(ua)) return 'Edge'
  }
  return 'Unknown'
}

function fmt(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(load)
</script>

<template>
  <div class="stack">
    <section class="surface card">
      <header class="card-head">
        <h2 class="card-title">활성 세션</h2>
        <button class="btn btn-sm" @click="load">
          <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
        </button>
      </header>
      <table class="data-table">
        <thead><tr><th>브라우저</th><th>IP</th><th>최근 활동</th><th class="col-actions"></th></tr></thead>
        <tbody>
          <tr v-if="loading && !sessions.length"><td colspan="4" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!sessions.length"><td colspan="4" class="empty">활성 세션이 없습니다.</td></tr>
          <tr v-for="s in sessions" :key="s.session_key">
            <td>
              {{ browserOf(s) }}
              <span v-if="s.current_session" class="chip chip-accent">현재</span>
            </td>
            <td class="mono">{{ s.ip || '–' }}</td>
            <td class="mono">{{ fmt(s.last_activity) }}</td>
            <td class="col-actions">
              <button v-if="!s.current_session" class="btn btn-sm" @click="terminate(s)">종료</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 14px; }
.card { padding: 0; overflow: hidden; }
.card-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid var(--line); }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-actions { width: 80px; text-align: right; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
</style>
