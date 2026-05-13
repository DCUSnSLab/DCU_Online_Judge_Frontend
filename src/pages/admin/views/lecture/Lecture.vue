<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiContentSave } from '@mdi/js'
import { createLecture, editLecture, getAdminLecture } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const isEdit = computed(() => Boolean(route.params.lectureId))
const headerTitle = computed(() => (isEdit.value ? '강의 수정' : '강의 생성'))

const currentYear = new Date().getFullYear()
const form = reactive({
  title: '',
  description: '',
  year: currentYear,
  semester: 1,
  status: true,
  aihelper_status: false,
  password: '',
  created_by_id: null
})

const submitting = ref(false)

async function loadIfEdit() {
  if (!isEdit.value) return
  try {
    const data = await getAdminLecture(route.params.lectureId)
    if (data) Object.assign(form, data, { password: '' })
  } catch (err) {
    notice.error(err?.message || '강의를 불러오지 못했습니다.')
  }
}

async function submit() {
  if (!form.title) {
    notice.error('과목명을 입력하세요.')
    return
  }
  submitting.value = true
  try {
    const payload = { ...form }
    if (isEdit.value) {
      payload.id = Number(route.params.lectureId)
      await editLecture(payload)
      notice.success('강의를 수정했습니다.')
    } else {
      await createLecture(payload)
      notice.success('강의를 생성했습니다.')
    }
    router.push('/lecture')
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

onMounted(loadIfEdit)
</script>

<template>
  <page-header eyebrow="Admin / Lecture" :title="headerTitle">
    <template #actions>
      <button class="btn" @click="router.push('/lecture')">
        <v-icon :icon="mdiArrowLeft" size="14" /><span>목록</span>
      </button>
      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        <v-icon :icon="mdiContentSave" size="14" /><span>{{ submitting ? '저장 중…' : '저장' }}</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface card">
      <div class="form">
        <label class="field">
          <span class="mono field-label">과목명</span>
          <input v-model="form.title" class="input" />
        </label>
        <label class="field">
          <span class="mono field-label">설명</span>
          <textarea v-model="form.description" class="input textarea" rows="4" />
        </label>
        <div class="grid-2">
          <label class="field">
            <span class="mono field-label">연도</span>
            <input v-model.number="form.year" type="number" class="input mono" />
          </label>
          <label class="field">
            <span class="mono field-label">학기</span>
            <select v-model.number="form.semester" class="input">
              <option :value="1">1학기</option>
              <option :value="2">2학기</option>
              <option :value="3">입학 전</option>
            </select>
          </label>
        </div>
        <label class="field">
          <span class="mono field-label">비밀번호 (선택)</span>
          <input v-model="form.password" class="input mono" placeholder="공란 시 비밀번호 없음" />
        </label>
        <div class="flags">
          <label class="flag"><input v-model="form.status" type="checkbox" /><span>수강신청 열림</span></label>
          <label class="flag"><input v-model="form.aihelper_status" type="checkbox" /><span>AI 도우미 활성</span></label>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px 80px; display: flex; flex-direction: column; gap: 16px; max-width: 720px; }
.card { padding: 22px; }
.form { display: flex; flex-direction: column; gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.textarea { font-family: var(--font-mono); resize: vertical; line-height: 1.5; }
.flags { display: flex; gap: 16px; flex-wrap: wrap; }
.flag { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }
.flag input { accent-color: var(--accent); }
</style>
