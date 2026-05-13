<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mdiArrowLeft } from '@mdi/js'
import { getSubmission } from '~/api/oj'
import { useNotice } from '~/composables/useNotice'
import StatusDot from '~/components/StatusDot.vue'

const route = useRoute()
const notice = useNotice()

const sub = ref(null)

const STATUS_MAP = {
  '-2': { code: 'CE', tone: 'ce', label: 'Compile Error' },
  '-1': { code: 'WA', tone: 'wa', label: 'Wrong Answer' },
  0: { code: 'AC', tone: 'ac', label: 'Accepted' },
  1: { code: 'TLE', tone: 'tle', label: 'Time Limit' },
  2: { code: 'TLE', tone: 'tle', label: 'Time Limit' },
  3: { code: 'MLE', tone: 'mle', label: 'Memory Limit' },
  4: { code: 'RE', tone: 'wa', label: 'Runtime Error' },
  5: { code: 'SE', tone: 'ce', label: 'System Error' },
  6: { code: 'PE', tone: 'wa', label: 'Partially Accepted' },
  7: { code: 'PA', tone: 'tle', label: 'Partially Accepted' },
  8: { code: 'PEND', tone: 'pending', label: 'Pending' },
  9: { code: 'JUDGE', tone: 'judging', label: 'Judging' }
}
function statusOf(r) { return STATUS_MAP[String(r)] || { code: '?', tone: 'pending', label: 'Unknown' } }

function fmtTime(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

async function load() {
  try {
    sub.value = await getSubmission(route.params.id)
  } catch (err) {
    notice.error(err?.message || '제출 정보를 불러오지 못했습니다.')
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="page">
    <header class="hero">
      <router-link to="/status" class="back">
        <v-icon :icon="mdiArrowLeft" size="14" /><span>제출 목록</span>
      </router-link>
      <h1 class="title">제출 #{{ route.params.id }}</h1>
    </header>

    <div v-if="!sub" class="surface empty">불러오는 중…</div>
    <template v-else>
      <div class="grid">
        <section class="surface card">
          <h2 class="card-title">개요</h2>
          <dl class="meta-list">
            <div><dt>문제</dt><dd>
              <router-link v-if="sub.problem" :to="`/problem/${sub.problem}`" class="link">{{ sub.problem }}</router-link>
              <span v-else>–</span>
            </dd></div>
            <div><dt>제출자</dt><dd class="mono">{{ sub.username }}</dd></div>
            <div><dt>언어</dt><dd><span class="chip mono">{{ sub.language }}</span></dd></div>
            <div><dt>결과</dt><dd><status-dot :status="statusOf(sub.result).tone" :label="statusOf(sub.result).label" /></dd></div>
            <div><dt>시간</dt><dd class="mono">{{ sub.statistic_info?.time_cost ?? '–' }} ms</dd></div>
            <div><dt>메모리</dt><dd class="mono">{{ sub.statistic_info?.memory_cost ? Math.round(sub.statistic_info.memory_cost / 1024) : '–' }} KB</dd></div>
            <div><dt>제출 시각</dt><dd class="mono">{{ fmtTime(sub.create_time) }}</dd></div>
          </dl>
        </section>

        <section v-if="sub.info && sub.info.length" class="surface card">
          <h2 class="card-title">테스트 케이스 결과</h2>
          <table class="data-table">
            <thead><tr><th>#</th><th>결과</th><th>시간</th><th>메모리</th></tr></thead>
            <tbody>
              <tr v-for="(t, i) in sub.info" :key="i">
                <td class="mono">#{{ t.test_case }}</td>
                <td><status-dot :status="statusOf(t.result).tone" :label="statusOf(t.result).code" /></td>
                <td class="mono">{{ t.cpu_time ?? '–' }} ms</td>
                <td class="mono">{{ t.memory ? Math.round(t.memory / 1024) : '–' }} KB</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <section v-if="sub.statistic_info?.err_info" class="surface card">
        <h2 class="card-title">에러 출력</h2>
        <pre class="code mono">{{ sub.statistic_info.err_info }}</pre>
      </section>

      <section class="surface card">
        <h2 class="card-title">소스코드</h2>
        <pre class="code mono">{{ sub.code }}</pre>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 16px; }
.hero { display: flex; align-items: center; gap: 16px; }
.back { display: inline-flex; align-items: center; gap: 4px; color: var(--ink-3); font-size: 12px; text-decoration: none; }
.back:hover { color: var(--ink); }
.title { font-size: 24px; font-weight: 600; letter-spacing: -0.4px; margin: 0; color: var(--ink); }
.empty { padding: 40px; text-align: center; color: var(--ink-3); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
.card { padding: 20px 24px; }
.card-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-3); }
.meta-list { display: flex; flex-direction: column; gap: 10px; margin: 0; }
.meta-list > div { display: grid; grid-template-columns: 100px 1fr; gap: 12px; font-size: 13px; }
.meta-list dt { color: var(--ink-3); margin: 0; }
.meta-list dd { margin: 0; color: var(--ink); }
.link { color: var(--accent); text-decoration: none; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 8px 12px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.code { background: var(--sunken); padding: 16px; border-radius: var(--r-md); font-size: 12.5px; margin: 0; overflow: auto; line-height: 1.5; color: var(--ink); }
[data-theme='dark'] .code { background: var(--bg); }
</style>
