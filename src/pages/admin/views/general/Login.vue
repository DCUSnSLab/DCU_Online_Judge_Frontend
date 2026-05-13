<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useNotice } from '~/composables/useNotice'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const notice = useNotice()

const username = ref('')
const password = ref('')
const tfaCode = ref('')
const submitting = ref(false)
const errorMsg = ref('')

async function handleUsernameBlur() {
  if (!username.value) return
  await userStore.checkTfa(username.value)
}

async function handleSubmit() {
  errorMsg.value = ''
  if (!username.value.trim() || !password.value) {
    errorMsg.value = '아이디와 비밀번호를 입력하세요.'
    return
  }
  submitting.value = true
  try {
    await userStore.login({
      username: username.value.trim(),
      password: password.value,
      tfa_code: tfaCode.value
    })
    // 권한 체크 — admin role 아니면 다시 OJ 홈으로
    if (!userStore.isAdminRole) {
      errorMsg.value = '관리자 권한이 없는 계정입니다.'
      await userStore.logout()
      return
    }
    notice.success('환영합니다.')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    errorMsg.value = err?.message || '로그인에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="admin-login">
    <form class="card" @submit.prevent="handleSubmit">
      <div class="mono eyebrow">DCU CODE / ADMIN</div>
      <h1 class="title">관리자 로그인</h1>
      <p class="subtitle">권한이 있는 계정만 접근할 수 있습니다.</p>

      <div class="fields">
        <label class="field">
          <span class="mono field-label">관리자 ID</span>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            class="input mono"
            placeholder="아이디"
            @blur="handleUsernameBlur"
          />
        </label>

        <label class="field">
          <span class="mono field-label">비밀번호</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="input"
            placeholder="••••••••"
          />
        </label>

        <label v-if="userStore.tfaRequired" class="field">
          <span class="mono field-label">2FA 코드</span>
          <input v-model="tfaCode" type="text" inputmode="numeric" class="input mono" placeholder="123456" />
        </label>
      </div>

      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

      <button type="submit" class="btn btn-primary submit" :disabled="submitting">
        {{ submitting ? '…' : '로그인' }}
      </button>

      <div class="warning mono">⚠ 최근 5회 로그인 실패 시 IP 차단</div>
    </form>
  </div>
</template>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: var(--sunken);
}
.card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 24px -8px rgba(0, 0, 0, 0.08);
}
.eyebrow {
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.title {
  font-size: 22px;
  font-weight: 600;
  margin: 4px 0 0;
  color: var(--ink);
}
.subtitle {
  font-size: 12px;
  color: var(--ink-3);
  margin: 0 0 12px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--bg);
  color: var(--ink);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.error {
  font-size: 12px;
  color: var(--status-wa);
  background: var(--diff-high-soft);
  padding: 8px 10px;
  border-radius: var(--r-sm);
}

.submit {
  width: 100%;
  height: 44px;
  font-size: 13px;
  justify-content: center;
  margin-top: 4px;
}

.warning {
  margin-top: 12px;
  padding: 10px 12px;
  background: oklch(0.96 0.04 28);
  color: oklch(0.42 0.18 28);
  border-left: 2px solid var(--status-wa);
  border-radius: var(--r-sm);
  font-size: 11px;
}
[data-theme='dark'] .warning {
  background: oklch(0.28 0.06 28 / 0.5);
  color: oklch(0.82 0.14 28);
}
</style>
