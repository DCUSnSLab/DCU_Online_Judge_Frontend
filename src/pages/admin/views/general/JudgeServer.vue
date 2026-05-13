<script setup>
import { onMounted, ref } from 'vue'
import { mdiContentCopy, mdiDeleteOutline, mdiRefresh } from '@mdi/js'
import { deleteJudgeServer, getJudgeServers, updateJudgeServer } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const notice = useNotice()
const token = ref('')
const servers = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getJudgeServers()
    token.value = data?.token || ''
    servers.value = data?.servers || []
  } catch {
    servers.value = []
  } finally {
    loading.value = false
  }
}

async function toggleDisabled(row) {
  try {
    await updateJudgeServer({ id: row.id, is_disabled: !row.is_disabled })
    notice.success(row.is_disabled ? '활성화되었습니다.' : '비활성화되었습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '변경에 실패했습니다.')
  }
}

async function remove(row) {
  if (!confirm(`${row.hostname} 서버를 삭제할까요?`)) return
  try {
    await deleteJudgeServer(row.hostname)
    notice.success('삭제했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

function copyToken() {
  navigator.clipboard?.writeText(token.value)
  notice.success('토큰을 복사했습니다.')
}

function fmtTime(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function statusTone(s) {
  return s?.status === 'normal' ? 'ac' : 'wa'
}

onMounted(load)
</script>

<template>
  <page-header eyebrow="Admin / General" title="채점 서버">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface token-card">
      <div>
        <div class="mono section-label">Judge Token</div>
        <div class="mono token">{{ token || '–' }}</div>
      </div>
      <button class="btn" :disabled="!token" @click="copyToken">
        <v-icon :icon="mdiContentCopy" size="14" /><span>복사</span>
      </button>
    </section>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>호스트명</th>
            <th>IP</th>
            <th>버전</th>
            <th>CPU</th>
            <th>메모리</th>
            <th>태스크</th>
            <th>마지막 하트비트</th>
            <th>상태</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !servers.length"><td colspan="9" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!servers.length"><td colspan="9" class="empty">등록된 채점 서버가 없습니다.</td></tr>
          <tr v-for="s in servers" :key="s.id" :class="{ disabled: s.is_disabled }">
            <td class="mono">{{ s.hostname }}</td>
            <td class="mono">{{ s.ip || '–' }}</td>
            <td class="mono">{{ s.judger_version || '–' }}</td>
            <td class="mono">{{ s.cpu_usage?.toFixed?.(1) ?? s.cpu_usage ?? '–' }}%</td>
            <td class="mono">{{ s.memory_usage?.toFixed?.(1) ?? s.memory_usage ?? '–' }}%</td>
            <td class="mono">{{ s.task_number ?? 0 }}</td>
            <td class="mono">{{ fmtTime(s.last_heartbeat) }}</td>
            <td>
              <span :class="['dot', `dot-${statusTone(s)}`]" />
              <span class="status-text">{{ s.status || 'unknown' }}{{ s.is_disabled ? ' · 비활성' : '' }}</span>
            </td>
            <td class="col-actions">
              <button class="icon-btn" :title="s.is_disabled ? '활성화' : '비활성화'" @click="toggleDisabled(s)">
                {{ s.is_disabled ? '▶' : '⏸' }}
              </button>
              <button class="icon-btn icon-btn-danger" title="삭제" @click="remove(s)">
                <v-icon :icon="mdiDeleteOutline" size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; }
.token-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; }
.section-label { font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.token { font-size: 14px; color: var(--ink); word-break: break-all; }

.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); white-space: nowrap; }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-actions { width: 100px; text-align: right; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
.disabled { opacity: 0.5; }
.status-text { margin-left: 6px; color: var(--ink-2); }

.icon-btn { background: transparent; border: none; cursor: pointer; width: 28px; height: 28px; border-radius: var(--r-sm); color: var(--ink-2); display: inline-grid; place-items: center; margin-left: 4px; }
.icon-btn:hover { background: var(--sunken); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }
</style>
