<script setup>
import { onMounted, reactive, ref } from 'vue'
import { mdiContentSave } from '@mdi/js'
import { getUserInfo, updateProfile } from '~/api/oj'
import { useNotice } from '~/composables/useNotice'
import { useUserStore } from '~/stores/user'

const notice = useNotice()
const userStore = useUserStore()

const form = reactive({
  realname: '',
  school: '',
  major: '',
  mood: '',
  github: '',
  blog: '',
  schoolssn: ''
})
const saving = ref(false)

async function load() {
  try {
    const p = await getUserInfo()
    Object.assign(form, {
      realname: p.real_name || p.user?.realname || '',
      school: p.school || '',
      major: p.major || '',
      mood: p.mood || '',
      github: p.github || '',
      blog: p.blog || '',
      schoolssn: p.user?.schoolssn || ''
    })
  } catch {
    /* */
  }
}

async function save() {
  saving.value = true
  try {
    await updateProfile({ ...form })
    notice.success('프로필을 저장했습니다.')
    await userStore.fetchProfile({ silent: true })
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="surface card">
    <header class="card-head">
      <div>
        <h2 class="card-title">프로필</h2>
        <p class="card-sub">다른 사용자에게 보여지는 정보입니다</p>
      </div>
    </header>

    <form class="form" @submit.prevent="save">
      <div class="grid-2">
        <label class="field">
          <span class="mono field-label">실명</span>
          <input v-model="form.realname" class="input" />
        </label>
        <label class="field">
          <span class="mono field-label">학번</span>
          <input v-model="form.schoolssn" class="input mono" />
        </label>
      </div>
      <div class="grid-2">
        <label class="field">
          <span class="mono field-label">학교</span>
          <input v-model="form.school" class="input" />
        </label>
        <label class="field">
          <span class="mono field-label">학과</span>
          <input v-model="form.major" class="input" />
        </label>
      </div>
      <label class="field">
        <span class="mono field-label">한 줄 소개</span>
        <textarea v-model="form.mood" class="input textarea" rows="3" />
      </label>
      <div class="grid-2">
        <label class="field">
          <span class="mono field-label">GitHub</span>
          <input v-model="form.github" class="input mono" placeholder="github.com/username" />
        </label>
        <label class="field">
          <span class="mono field-label">블로그</span>
          <input v-model="form.blog" class="input mono" placeholder="https://…" />
        </label>
      </div>
      <div class="actions">
        <button type="button" class="btn" @click="load">취소</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <v-icon :icon="mdiContentSave" size="14" /><span>{{ saving ? '저장 중…' : '저장' }}</span>
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.card { padding: 24px; }
.card-head { margin-bottom: 16px; }
.card-title { font-size: 16px; font-weight: 600; margin: 0; }
.card-sub { font-size: 12px; color: var(--ink-3); margin: 4px 0 0; }
.form { display: flex; flex-direction: column; gap: 14px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.textarea { resize: vertical; line-height: 1.5; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
</style>
