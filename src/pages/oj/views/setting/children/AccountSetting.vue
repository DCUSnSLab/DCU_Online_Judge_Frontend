<script setup>
import { onMounted, reactive, ref } from 'vue'
import JSEncrypt from 'jsencrypt'
import { changeEmail, changePassword, getUserInfo } from '~/api/oj'
import { getPublicKey } from '~/api/auth'
import { useNotice } from '~/composables/useNotice'

const notice = useNotice()

const pw = reactive({ old_password: '', new_password: '', confirm: '', tfa_code: '' })
const email = reactive({ current: '', password: '', new_email: '', tfa_code: '' })
const savingPw = ref(false)
const savingEmail = ref(false)

async function loadEmail() {
  try {
    const p = await getUserInfo()
    email.current = p.user?.email || ''
  } catch {
    /* */
  }
}

async function encryptPassword(pwd) {
  const { public_key: pk } = await getPublicKey()
  const e = new JSEncrypt()
  e.setPublicKey(pk)
  return e.encrypt(pwd)
}

async function submitPw() {
  if (!pw.old_password || !pw.new_password) {
    notice.error('현재/새 비밀번호를 입력하세요.')
    return
  }
  if (pw.new_password !== pw.confirm) {
    notice.error('새 비밀번호가 일치하지 않습니다.')
    return
  }
  savingPw.value = true
  try {
    const oldEnc = await encryptPassword(pw.old_password)
    const newEnc = await encryptPassword(pw.new_password)
    await changePassword({ old_password: oldEnc, new_password: newEnc, tfa_code: pw.tfa_code || undefined })
    notice.success('비밀번호를 변경했습니다.')
    pw.old_password = ''
    pw.new_password = ''
    pw.confirm = ''
    pw.tfa_code = ''
  } catch (err) {
    notice.error(err?.message || '변경에 실패했습니다.')
  } finally {
    savingPw.value = false
  }
}

async function submitEmail() {
  if (!email.password || !email.new_email) {
    notice.error('비밀번호와 새 이메일을 입력하세요.')
    return
  }
  savingEmail.value = true
  try {
    const enc = await encryptPassword(email.password)
    await changeEmail({ password: enc, new_email: email.new_email, tfa_code: email.tfa_code || undefined })
    notice.success('이메일을 변경했습니다.')
    email.password = ''
    email.new_email = ''
    email.tfa_code = ''
    await loadEmail()
  } catch (err) {
    notice.error(err?.message || '변경에 실패했습니다.')
  } finally {
    savingEmail.value = false
  }
}

onMounted(loadEmail)
</script>

<template>
  <div class="stack">
    <section class="surface card">
      <h2 class="card-title">비밀번호 변경</h2>
      <form class="form" @submit.prevent="submitPw">
        <label class="field"><span class="mono field-label">현재 비밀번호</span>
          <input v-model="pw.old_password" type="password" class="input" /></label>
        <label class="field"><span class="mono field-label">새 비밀번호</span>
          <input v-model="pw.new_password" type="password" class="input" /></label>
        <label class="field"><span class="mono field-label">새 비밀번호 확인</span>
          <input v-model="pw.confirm" type="password" class="input" /></label>
        <div class="actions">
          <button class="btn btn-primary" :disabled="savingPw">{{ savingPw ? '저장 중…' : '비밀번호 변경' }}</button>
        </div>
      </form>
    </section>

    <section class="surface card">
      <h2 class="card-title">이메일 변경</h2>
      <form class="form" @submit.prevent="submitEmail">
        <label class="field"><span class="mono field-label">현재 이메일</span>
          <input :value="email.current" type="email" class="input mono" readonly /></label>
        <label class="field"><span class="mono field-label">비밀번호</span>
          <input v-model="email.password" type="password" class="input" /></label>
        <label class="field"><span class="mono field-label">새 이메일</span>
          <input v-model="email.new_email" type="email" class="input mono" /></label>
        <div class="actions">
          <button class="btn" :disabled="savingEmail">{{ savingEmail ? '저장 중…' : '변경' }}</button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 14px; }
.card { padding: 24px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0 0 14px; }
.form { display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.actions { display: flex; justify-content: flex-end; margin-top: 4px; }
</style>
