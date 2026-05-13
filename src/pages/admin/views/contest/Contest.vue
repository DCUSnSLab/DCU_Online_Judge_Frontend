<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiContentSave } from '@mdi/js'
import { createContest, editContest, getAdminContest } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const isEdit = computed(() => Boolean(route.params.contestId))
const lectureId = computed(() => route.params.lectureId || null)
const headerTitle = computed(() => `${isEdit.value ? '콘테스트 수정' : '콘테스트 생성'}${lectureId.value ? ' (강의 자식)' : ''}`)

function defaultStart() {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d.toISOString().slice(0, 16)
}
function defaultEnd() {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 3)
  return d.toISOString().slice(0, 16)
}

const form = reactive({
  title: '',
  description: '',
  start_time: defaultStart(),
  end_time: defaultEnd(),
  rule_type: 'ACM',
  password: '',
  visible: true,
  real_time_rank: true,
  allowed_ip_ranges: [],
  contest_type: 'Public',
  lecture_id: null,
  lecture_contest_type: '실습'
})

const submitting = ref(false)

async function loadIfEdit() {
  if (!isEdit.value) {
    if (lectureId.value) form.lecture_id = Number(lectureId.value)
    return
  }
  try {
    const data = await getAdminContest(route.params.contestId)
    if (data) {
      Object.assign(form, data)
      form.start_time = data.start_time?.slice(0, 16) || form.start_time
      form.end_time = data.end_time?.slice(0, 16) || form.end_time
    }
  } catch (err) {
    notice.error(err?.message || '콘테스트를 불러오지 못했습니다.')
  }
}

async function submit() {
  if (!form.title) {
    notice.error('제목을 입력하세요.')
    return
  }
  submitting.value = true
  try {
    const payload = {
      ...form,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      password: form.password || null,
      allowed_ip_ranges: form.allowed_ip_ranges || []
    }
    if (isEdit.value) {
      payload.id = Number(route.params.contestId)
      await editContest(payload)
      notice.success('콘테스트를 수정했습니다.')
    } else {
      await createContest(payload)
      notice.success('콘테스트를 생성했습니다.')
    }
    if (lectureId.value) router.push(`/lecture/${lectureId.value}/contests`)
    else router.push('/contest')
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (lectureId.value) router.push(`/lecture/${lectureId.value}/contests`)
  else router.push('/contest')
}

onMounted(loadIfEdit)
</script>

<template>
  <page-header eyebrow="Admin / Contest" :title="headerTitle">
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
        <label class="field">
          <span class="mono field-label">제목</span>
          <input v-model="form.title" class="input" />
        </label>
        <label class="field">
          <span class="mono field-label">설명</span>
          <textarea v-model="form.description" class="input textarea" rows="4" />
        </label>
        <div class="grid-2">
          <label class="field">
            <span class="mono field-label">시작 시각</span>
            <input v-model="form.start_time" type="datetime-local" class="input mono" />
          </label>
          <label class="field">
            <span class="mono field-label">종료 시각</span>
            <input v-model="form.end_time" type="datetime-local" class="input mono" />
          </label>
        </div>
        <div class="grid-3">
          <label class="field">
            <span class="mono field-label">룰</span>
            <select v-model="form.rule_type" class="input">
              <option value="ACM">ACM</option>
              <option value="OI">OI</option>
            </select>
          </label>
          <label class="field">
            <span class="mono field-label">유형</span>
            <select v-model="form.contest_type" class="input">
              <option value="Public">공개</option>
              <option value="Password Protected">비밀번호</option>
            </select>
          </label>
          <label v-if="lectureId" class="field">
            <span class="mono field-label">강의 콘테스트 유형</span>
            <select v-model="form.lecture_contest_type" class="input">
              <option value="실습">실습</option>
              <option value="과제">과제</option>
              <option value="시험">시험</option>
              <option value="대회">대회</option>
            </select>
          </label>
        </div>
        <label v-if="form.contest_type === 'Password Protected'" class="field">
          <span class="mono field-label">비밀번호</span>
          <input v-model="form.password" type="text" class="input mono" />
        </label>
        <div class="flags">
          <label class="flag"><input v-model="form.visible" type="checkbox" /><span>공개</span></label>
          <label class="flag"><input v-model="form.real_time_rank" type="checkbox" /><span>실시간 랭킹</span></label>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px 80px; display: flex; flex-direction: column; gap: 16px; max-width: 880px; }
.card { padding: 18px 22px; }
.card-head { margin-bottom: 14px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
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
</style>
