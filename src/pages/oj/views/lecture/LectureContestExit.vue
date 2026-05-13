<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mdiMagnify, mdiRefresh } from '@mdi/js'
import { exitStudent, getContestExit } from '~/api/oj'
import { useNotice } from '~/composables/useNotice'

const route = useRoute()
const notice = useNotice()

const students = ref([])
const keyword = ref('')
const loading = ref(false)

const contestID = computed(() => route.params.contestID)

async function load() {
  loading.value = true
  try {
    const data = await getContestExit(contestID.value)
    students.value = Array.isArray(data) ? data : data?.results || []
  } catch {
    students.value = []
  } finally {
    loading.value = false
  }
}

const filtered = computed(() =>
  keyword.value
    ? students.value.filter(
        (s) =>
          (s.realname || '').includes(keyword.value) ||
          (s.username || '').includes(keyword.value) ||
          String(s.schoolssn || '').includes(keyword.value)
      )
    : students.value
)

async function doExit(s) {
  if (!confirm(`${s.realname || s.username} 학생을 퇴실 처리할까요?`)) return
  try {
    await exitStudent({ contest_id: contestID.value, user_id: s.user_id || s.id })
    notice.success('퇴실 처리됐습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '퇴실 처리에 실패했습니다.')
  }
}

function fmt(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(load)
watch(() => route.params.contestID, load)
</script>

<template>
  <div class="stack">
    <div class="surface controls">
      <div class="search-wrap">
        <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
        <input v-model="keyword" class="search" placeholder="이름·학번·아이디 검색" />
      </div>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead><tr><th>이름</th><th>학번</th><th>아이디</th><th>입실</th><th>퇴실</th><th>상태</th><th class="col-actions">동작</th></tr></thead>
        <tbody>
          <tr v-if="loading && !students.length"><td colspan="7" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="7" class="empty">학생이 없습니다.</td></tr>
          <tr v-for="s in filtered" :key="s.user_id || s.id">
            <td>{{ s.realname || '–' }}</td>
            <td class="mono">{{ s.schoolssn || '–' }}</td>
            <td class="mono">{{ s.username || '–' }}</td>
            <td class="mono t-muted">{{ fmt(s.start_time) }}</td>
            <td class="mono t-muted">{{ fmt(s.end_time) }}</td>
            <td>
              <span :class="['chip', s.end_time ? '' : 'chip-low']">
                {{ s.end_time ? '퇴실' : '응시 중' }}
              </span>
            </td>
            <td class="col-actions">
              <button v-if="!s.end_time" class="btn btn-sm" @click="doExit(s)">퇴실 처리</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 12px; }
.controls { display: flex; gap: 8px; padding: 12px 14px; align-items: center; }
.search-wrap { position: relative; flex: 1; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-3); }
.search { width: 100%; height: 32px; padding: 0 10px 0 32px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-actions { width: 110px; text-align: right; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
</style>
