<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiContentSave } from '@mdi/js'
import {
  createContestProblem,
  createProblem,
  editContestProblem,
  editProblem,
  getContestProblem,
  getProblem
} from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const isEdit = computed(() => Boolean(route.params.problemId))
const contestId = computed(() => route.params.contestId || null)
const headerTitle = computed(() => `${isEdit.value ? '문제 수정' : '문제 생성'}${contestId.value ? ' (콘테스트)' : ''}`)

const form = reactive({
  _id: '',
  title: '',
  description: '',
  input_description: '',
  output_description: '',
  samples: [{ input: '', output: '' }],
  hint: '',
  source: '',
  time_limit: 1000,
  memory_limit: 256,
  difficulty: 'Mid',
  visible: true,
  share_submission: false,
  io_mode: { io_mode: 'Standard IO', input: '', output: '' },
  languages: ['C', 'C++', 'Python3'],
  template: {},
  spj: false,
  rule_type: 'ACM',
  test_case_score: [],
  test_case_id: '',
  tags: []
})

const submitting = ref(false)

async function loadIfEdit() {
  if (!isEdit.value) return
  try {
    const data = contestId.value
      ? await getContestProblem(route.params.problemId)
      : await getProblem(route.params.problemId)
    if (data) Object.assign(form, data, { samples: data.samples?.length ? data.samples : [{ input: '', output: '' }] })
  } catch (err) {
    notice.error(err?.message || '문제를 불러오지 못했습니다.')
  }
}

function addSample() {
  form.samples.push({ input: '', output: '' })
}
function removeSample(i) {
  if (form.samples.length <= 1) return
  form.samples.splice(i, 1)
}

async function submit() {
  if (!form._id || !form.title || !form.description) {
    notice.error('Display ID, 제목, 본문은 필수입니다.')
    return
  }
  submitting.value = true
  try {
    const payload = { ...form }
    if (contestId.value) payload.contest_id = Number(contestId.value)
    if (isEdit.value) {
      payload.id = Number(route.params.problemId)
      if (contestId.value) await editContestProblem(payload)
      else await editProblem(payload)
      notice.success('문제를 수정했습니다.')
    } else {
      if (contestId.value) await createContestProblem(payload)
      else await createProblem(payload)
      notice.success('문제를 생성했습니다.')
    }
    if (contestId.value) router.push(`/contest/${contestId.value}/problems`)
    else router.push('/problems')
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (contestId.value) router.push(`/contest/${contestId.value}/problems`)
  else router.push('/problems')
}

onMounted(loadIfEdit)
</script>

<template>
  <page-header eyebrow="Admin / Problem" :title="headerTitle">
    <template #actions>
      <button class="btn" @click="goBack">
        <v-icon :icon="mdiArrowLeft" size="14" /><span>목록</span>
      </button>
      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        <v-icon :icon="mdiContentSave" size="14" /><span>{{ submitting ? '저장 중…' : '저장' }}</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface card">
      <header class="card-head"><h2 class="card-title">기본 정보</h2></header>
      <div class="form">
        <div class="grid-2">
          <label class="field">
            <span class="mono field-label">Display ID</span>
            <input v-model="form._id" class="input mono" placeholder="예: 1024" />
          </label>
          <label class="field">
            <span class="mono field-label">난이도</span>
            <select v-model="form.difficulty" class="input">
              <option value="Low">Low</option>
              <option value="Mid">Mid</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>
        <label class="field">
          <span class="mono field-label">제목</span>
          <input v-model="form.title" class="input" />
        </label>
        <label class="field">
          <span class="mono field-label">본문 (마크다운)</span>
          <textarea v-model="form.description" class="input textarea" rows="6" />
        </label>
      </div>
    </section>

    <section class="surface card">
      <header class="card-head"><h2 class="card-title">입출력</h2></header>
      <div class="form">
        <label class="field">
          <span class="mono field-label">입력 설명</span>
          <textarea v-model="form.input_description" class="input textarea" rows="3" />
        </label>
        <label class="field">
          <span class="mono field-label">출력 설명</span>
          <textarea v-model="form.output_description" class="input textarea" rows="3" />
        </label>
        <label class="field">
          <span class="mono field-label">힌트 (선택)</span>
          <textarea v-model="form.hint" class="input textarea" rows="2" />
        </label>
      </div>
    </section>

    <section class="surface card">
      <header class="card-head">
        <h2 class="card-title">샘플 ({{ form.samples.length }})</h2>
        <button class="btn btn-sm" @click="addSample">+ 추가</button>
      </header>
      <div class="samples">
        <div v-for="(s, i) in form.samples" :key="i" class="sample">
          <div class="sample-head">
            <span class="mono section-label">샘플 {{ i + 1 }}</span>
            <button class="icon-btn icon-btn-danger" :disabled="form.samples.length <= 1" @click="removeSample(i)">제거</button>
          </div>
          <div class="grid-2">
            <label class="field">
              <span class="mono field-label">입력</span>
              <textarea v-model="s.input" class="input textarea mono" rows="3" />
            </label>
            <label class="field">
              <span class="mono field-label">출력</span>
              <textarea v-model="s.output" class="input textarea mono" rows="3" />
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="surface card">
      <header class="card-head"><h2 class="card-title">제한 / 옵션</h2></header>
      <div class="form">
        <div class="grid-3">
          <label class="field">
            <span class="mono field-label">시간 제한 (ms)</span>
            <input v-model.number="form.time_limit" type="number" class="input mono" />
          </label>
          <label class="field">
            <span class="mono field-label">메모리 제한 (MB)</span>
            <input v-model.number="form.memory_limit" type="number" class="input mono" />
          </label>
          <label class="field">
            <span class="mono field-label">채점 룰</span>
            <select v-model="form.rule_type" class="input">
              <option value="ACM">ACM</option>
              <option value="OI">OI</option>
            </select>
          </label>
        </div>
        <label class="field">
          <span class="mono field-label">테스트 케이스 ID</span>
          <input v-model="form.test_case_id" class="input mono" placeholder="업로드 후 채워지는 ID" />
        </label>
        <div class="flags">
          <label class="flag"><input v-model="form.visible" type="checkbox" /><span>공개</span></label>
          <label class="flag"><input v-model="form.share_submission" type="checkbox" /><span>제출 공유</span></label>
          <label class="flag"><input v-model="form.spj" type="checkbox" /><span>SPJ 사용</span></label>
        </div>
        <label class="field">
          <span class="mono field-label">출처 (선택)</span>
          <input v-model="form.source" class="input" />
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px 80px; display: flex; flex-direction: column; gap: 16px; max-width: 960px; }
.card { padding: 18px 22px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.section-label { font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }

.form { display: flex; flex-direction: column; gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 720px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.textarea { font-family: var(--font-mono); resize: vertical; line-height: 1.5; }
.flags { display: flex; gap: 16px; flex-wrap: wrap; }
.flag { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }
.flag input { accent-color: var(--accent); }

.samples { display: flex; flex-direction: column; gap: 16px; }
.sample { padding: 12px; background: var(--sunken); border-radius: var(--r-md); }
.sample-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }

.icon-btn { background: transparent; border: none; cursor: pointer; padding: 4px 8px; border-radius: var(--r-sm); color: var(--ink-2); font-size: 12px; }
.icon-btn:hover { background: var(--bg); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }
</style>
