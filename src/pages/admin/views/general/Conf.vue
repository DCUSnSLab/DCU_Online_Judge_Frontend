<script setup>
import { onMounted, reactive, ref } from 'vue'
import { mdiContentSave, mdiEmailOutline, mdiRefresh } from '@mdi/js'
import {
  createSMTPConfig,
  editSMTPConfig,
  editWebsiteConfig,
  getAdminWebsiteConfig,
  getSMTPConfig,
  testSMTPConfig
} from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const notice = useNotice()
const loading = ref(false)
const smtpExists = ref(false)

const smtp = reactive({
  server: '',
  port: 465,
  email: '',
  password: '',
  tls: true
})

const site = reactive({
  website_base_url: '',
  website_name: '',
  website_name_shortcut: '',
  website_footer: '',
  allow_register: true,
  submission_list_show_all: true
})

const testEmail = ref('')

async function load() {
  loading.value = true
  try {
    const s = await getSMTPConfig()
    if (s?.server) {
      smtpExists.value = true
      Object.assign(smtp, s, { password: '' })
    } else {
      smtpExists.value = false
    }
  } catch {
    smtpExists.value = false
  }
  try {
    const w = await getAdminWebsiteConfig()
    if (w) Object.assign(site, w)
  } catch {
    /* */
  }
  loading.value = false
}

async function saveSMTP() {
  try {
    if (smtpExists.value) {
      const payload = { ...smtp }
      if (!payload.password) delete payload.password
      await editSMTPConfig(payload)
    } else {
      await createSMTPConfig({ ...smtp })
    }
    notice.success('SMTP 설정을 저장했습니다.')
    smtpExists.value = true
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  }
}

async function testSMTP() {
  if (!testEmail.value) {
    notice.error('테스트 메일 주소를 입력하세요.')
    return
  }
  try {
    await testSMTPConfig(testEmail.value)
    notice.success('테스트 메일을 발송했습니다.')
  } catch (err) {
    notice.error(err?.message || '테스트 발송에 실패했습니다.')
  }
}

async function saveSite() {
  try {
    await editWebsiteConfig({ ...site })
    notice.success('사이트 설정을 저장했습니다.')
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  }
}

onMounted(load)
</script>

<template>
  <page-header eyebrow="Admin / General" title="환경 설정">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface card">
      <header class="card-head">
        <h2 class="card-title">SMTP 메일 설정</h2>
        <span v-if="smtpExists" class="chip">설정됨</span>
        <span v-else class="chip chip-mid">미설정</span>
      </header>
      <form class="form" @submit.prevent="saveSMTP">
        <div class="grid-2">
          <label class="field">
            <span class="mono field-label">SMTP 서버</span>
            <input v-model="smtp.server" class="input mono" placeholder="smtp.gmail.com" />
          </label>
          <label class="field">
            <span class="mono field-label">포트</span>
            <input v-model.number="smtp.port" type="number" class="input mono" />
          </label>
        </div>
        <label class="field">
          <span class="mono field-label">계정 이메일</span>
          <input v-model="smtp.email" type="email" class="input mono" />
        </label>
        <label class="field">
          <span class="mono field-label">비밀번호 (변경 시에만 입력)</span>
          <input v-model="smtp.password" type="password" class="input" placeholder="공란 시 변경 안 함" />
        </label>
        <label class="flag">
          <input v-model="smtp.tls" type="checkbox" /><span>TLS 사용</span>
        </label>
        <div class="actions">
          <button type="submit" class="btn btn-primary">
            <v-icon :icon="mdiContentSave" size="14" /><span>저장</span>
          </button>
        </div>
      </form>

      <div class="divider" />
      <div class="test-row">
        <input v-model="testEmail" type="email" class="input mono" placeholder="테스트 메일 수신 주소" />
        <button class="btn" @click="testSMTP">
          <v-icon :icon="mdiEmailOutline" size="14" /><span>테스트 발송</span>
        </button>
      </div>
    </section>

    <section class="surface card">
      <header class="card-head"><h2 class="card-title">사이트 설정</h2></header>
      <form class="form" @submit.prevent="saveSite">
        <div class="grid-2">
          <label class="field">
            <span class="mono field-label">Base URL</span>
            <input v-model="site.website_base_url" class="input mono" placeholder="https://oj.example.com" />
          </label>
          <label class="field">
            <span class="mono field-label">사이트 이름</span>
            <input v-model="site.website_name" class="input" />
          </label>
        </div>
        <div class="grid-2">
          <label class="field">
            <span class="mono field-label">단축 이름</span>
            <input v-model="site.website_name_shortcut" class="input mono" />
          </label>
          <label class="field">
            <span class="mono field-label">푸터</span>
            <input v-model="site.website_footer" class="input" />
          </label>
        </div>
        <div class="flags">
          <label class="flag">
            <input v-model="site.allow_register" type="checkbox" /><span>회원가입 허용</span>
          </label>
          <label class="flag">
            <input v-model="site.submission_list_show_all" type="checkbox" /><span>제출 목록 전체 공개</span>
          </label>
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary">
            <v-icon :icon="mdiContentSave" size="14" /><span>저장</span>
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; max-width: 800px; }
.card { padding: 20px 24px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.form { display: flex; flex-direction: column; gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.flag { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }
.flag input { accent-color: var(--accent); }
.flags { display: flex; gap: 16px; flex-wrap: wrap; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.divider { border-top: 1px solid var(--line); margin: 16px 0; }
.test-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
</style>
