<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiSendOutline } from '@mdi/js'
import {
  checkSubmissionLog,
  getContestProblem,
  getLanguages,
  getProblem,
  submitCode
} from '~/api/oj'
import { useNotice } from '~/composables/useNotice'
import AppChip from '~/components/AppChip.vue'
import StatusDot from '~/components/StatusDot.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const problem = ref(null)
const submitting = ref(false)
const lastStatus = ref(null)
const languages = ref(['C', 'C++', 'Python3', 'Java'])
const language = ref('Python3')
const code = ref('')

const contestID = computed(() => route.params.contestID || null)

const STATUS_MAP = {
  '-2': { code: 'CE', tone: 'ce' },
  '-1': { code: 'WA', tone: 'wa' },
  0: { code: 'AC', tone: 'ac' },
  1: { code: 'TLE', tone: 'tle' },
  2: { code: 'TLE', tone: 'tle' },
  3: { code: 'MLE', tone: 'mle' },
  4: { code: 'RE', tone: 'wa' },
  5: { code: 'SE', tone: 'ce' },
  6: { code: 'PE', tone: 'wa' },
  7: { code: 'PA', tone: 'tle' },
  8: { code: 'PEND', tone: 'pending' },
  9: { code: 'JUDGING', tone: 'judging' }
}
function statusOf(r) { return STATUS_MAP[String(r)] || { code: '?', tone: 'pending' } }
function diffTone(d) {
  if (d === 'Low') return 'low'
  if (d === 'High') return 'high'
  return 'mid'
}

async function load() {
  try {
    const id = route.params.problemID
    const data = contestID.value
      ? await getContestProblem(id, contestID.value)
      : await getProblem(id)
    problem.value = data
  } catch (err) {
    notice.error(err?.message || '문제를 불러오지 못했습니다.')
  }
}

async function loadLanguages() {
  try {
    const data = await getLanguages()
    const langs = (data?.languages || []).map((l) => l.name)
    if (langs.length) languages.value = langs
  } catch {
    /* */
  }
}

let pollTimer = null
function pollSubmission(id) {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(async () => {
    try {
      const data = await checkSubmissionLog({ id })
      const r = data?.result
      lastStatus.value = r
      if (r === 8 || r === 9) pollSubmission(id)
      else {
        submitting.value = false
        notice.success(`채점 완료: ${statusOf(r).code}`)
      }
    } catch (err) {
      submitting.value = false
      notice.error(err?.message || '채점 상태 확인 실패')
    }
  }, 2000)
}

async function submit() {
  if (!code.value.trim()) {
    notice.error('코드를 입력하세요.')
    return
  }
  submitting.value = true
  lastStatus.value = null
  try {
    const payload = { problem_id: problem.value.id, language: language.value, code: code.value }
    if (contestID.value) payload.contest_id = Number(contestID.value)
    const data = await submitCode(payload)
    const subId = data?.submission_id
    if (!subId) {
      notice.success('제출했습니다.')
      submitting.value = false
      return
    }
    notice.info('제출 중… 채점을 기다립니다.')
    pollSubmission(subId)
  } catch (err) {
    notice.error(err?.message || '제출에 실패했습니다.')
    submitting.value = false
  }
}

onMounted(() => { loadLanguages(); load() })
watch(() => route.params.problemID, () => { problem.value = null; load() })
</script>

<template>
  <div class="page">
    <header class="problem-bar">
      <router-link :to="contestID ? `/contest/${contestID}/problems` : '/problem'" class="back">
        <v-icon :icon="mdiArrowLeft" size="14" /><span>목록</span>
      </router-link>
      <div class="bar-meta">
        <span class="mono prob-id">#{{ problem?._id || route.params.problemID }}</span>
        <h1 class="prob-title">{{ problem?.title || '로딩 중…' }}</h1>
        <app-chip v-if="problem?.difficulty" :tone="diffTone(problem.difficulty)">{{ problem.difficulty }}</app-chip>
        <span v-if="problem" class="mono t-muted">⏱ {{ problem.time_limit }}ms · {{ problem.memory_limit }}MB</span>
      </div>
    </header>

    <div class="split">
      <section class="left">
        <div v-if="!problem" class="empty">불러오는 중…</div>
        <template v-else>
          <div class="prob-section">
            <h2>문제</h2>
            <div class="rich" v-html="problem.description" />
          </div>
          <div v-if="problem.input_description" class="prob-section">
            <h2>입력</h2>
            <div class="rich" v-html="problem.input_description" />
          </div>
          <div v-if="problem.output_description" class="prob-section">
            <h2>출력</h2>
            <div class="rich" v-html="problem.output_description" />
          </div>
          <div v-if="problem.samples?.length" class="prob-section">
            <h2>예제</h2>
            <div v-for="(s, i) in problem.samples" :key="i" class="sample">
              <div class="sample-half">
                <div class="mono sample-label">입력 {{ i + 1 }}</div>
                <pre class="mono sample-pre">{{ s.input }}</pre>
              </div>
              <div class="sample-half">
                <div class="mono sample-label">출력 {{ i + 1 }}</div>
                <pre class="mono sample-pre">{{ s.output }}</pre>
              </div>
            </div>
          </div>
          <div v-if="problem.hint" class="prob-section">
            <h2>힌트</h2>
            <div class="rich" v-html="problem.hint" />
          </div>
        </template>
      </section>

      <section class="right">
        <div class="editor-head">
          <select v-model="language" class="select">
            <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
          </select>
          <div class="editor-actions">
            <span v-if="lastStatus !== null" class="status-bar">
              <status-dot :status="statusOf(lastStatus).tone" />
              <span class="mono">{{ statusOf(lastStatus).code }}</span>
            </span>
            <button class="btn btn-primary btn-sm" :disabled="submitting" @click="submit">
              <v-icon :icon="mdiSendOutline" size="14" />
              <span>{{ submitting ? '채점 중…' : '제출' }}</span>
            </button>
          </div>
        </div>
        <textarea v-model="code" class="editor mono" spellcheck="false" placeholder="여기에 코드를 작성하세요." />
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { height: calc(100vh - 56px); display: flex; flex-direction: column; }
.problem-bar { display: flex; align-items: center; gap: 16px; padding: 12px 24px; border-bottom: 1px solid var(--line); background: var(--bg); }
.back { display: inline-flex; align-items: center; gap: 4px; color: var(--ink-3); font-size: 12px; text-decoration: none; }
.back:hover { color: var(--ink); }
.bar-meta { flex: 1; display: flex; align-items: center; gap: 12px; min-width: 0; }
.prob-id { font-size: 12px; color: var(--ink-3); }
.prob-title { font-size: 16px; font-weight: 600; margin: 0; color: var(--ink); }

.split { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); overflow: hidden; }
@media (max-width: 1000px) { .split { grid-template-columns: 1fr; } }
.left { padding: 24px 32px; overflow-y: auto; background: var(--bg); }
.right { display: flex; flex-direction: column; background: var(--surface); min-width: 0; }
.empty { color: var(--ink-3); text-align: center; padding: 40px 0; }

.prob-section { margin-bottom: 24px; }
.prob-section h2 { font-size: 13px; font-weight: 600; margin: 0 0 8px; color: var(--ink); text-transform: uppercase; letter-spacing: 1px; }
.rich { font-size: 14px; color: var(--ink-2); line-height: 1.6; }
.rich :deep(p) { margin: 0 0 8px; }
.rich :deep(pre) { background: var(--sunken); padding: 10px; border-radius: var(--r-sm); overflow: auto; }
.rich :deep(code) { background: var(--sunken); padding: 1px 4px; border-radius: 3px; font-family: var(--font-mono); font-size: 12px; }
.sample { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.sample-label { font-size: 10px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.sample-pre { background: var(--sunken); padding: 10px 12px; border-radius: var(--r-sm); font-size: 12px; margin: 0; overflow: auto; }

.editor-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--line); }
.select { height: 28px; padding: 0 8px; border-radius: var(--r-sm); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 12px; }
.editor-actions { display: flex; gap: 10px; align-items: center; }
.status-bar { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }

.editor { flex: 1; min-height: 200px; padding: 12px; border: none; background: var(--surface); color: var(--ink); font-size: 13px; outline: none; resize: none; line-height: 1.6; font-family: var(--font-mono); }
[data-theme='dark'] .editor { background: var(--sunken); }
</style>
