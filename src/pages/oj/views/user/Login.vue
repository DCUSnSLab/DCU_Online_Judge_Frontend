<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '~/stores/user'
import { useNotice } from '~/composables/useNotice'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
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
    errorMsg.value = t('auth.loginFailed')
    return
  }
  submitting.value = true
  try {
    await userStore.login({
      username: username.value.trim(),
      password: password.value,
      tfa_code: tfaCode.value
    })
    notice.success(t('auth.welcomeBack'))
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    errorMsg.value = err?.message || t('auth.loginFailed')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Blurred backdrop hint -->
    <div class="backdrop" aria-hidden="true">
      <div class="backdrop-title">홈</div>
      <div class="backdrop-grid">
        <div v-for="i in 6" :key="i" class="backdrop-card" />
      </div>
    </div>
    <div class="scrim" aria-hidden="true" />

    <!-- Modal-shaped card centered -->
    <div class="modal-wrap">
      <form class="modal" @submit.prevent="handleSubmit">
        <header class="modal-head">
          <div class="brand-mark mono">D</div>
          <div>
            <div class="modal-title">{{ t('auth.loginTitle') }}</div>
            <div class="modal-sub">{{ t('auth.loginSubtitle') }}</div>
          </div>
        </header>

        <div class="fields">
          <label class="field">
            <span class="mono field-label">{{ t('auth.usernameLabel') }}</span>
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
            <span class="mono field-label">{{ t('auth.passwordLabel') }}</span>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="input"
              placeholder="비밀번호"
            />
          </label>

          <label v-if="userStore.tfaRequired" class="field">
            <span class="mono field-label">{{ t('auth.tfaLabel') }}</span>
            <input
              v-model="tfaCode"
              type="text"
              inputmode="numeric"
              class="input mono"
              placeholder="123456"
            />
          </label>
        </div>

        <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary submit" :disabled="submitting">
          <span v-if="submitting">…</span>
          <span v-else>{{ t('auth.loginButton') }}</span>
        </button>

        <div class="foot">
          <router-link to="/apply-reset-password" class="link">
            {{ t('auth.forgotPassword') }}
          </router-link>
          <router-link to="/register" class="link link-strong">
            {{ t('auth.register') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: calc(100vh - 56px);
  background: var(--bg);
}

/* Backdrop hint */
.backdrop {
  padding: 32px 56px;
  filter: blur(2px);
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}
.backdrop-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--ink);
}
.backdrop-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 960px;
}
.backdrop-card {
  height: 120px;
  background: var(--sunken);
  border-radius: 8px;
}

.scrim {
  position: absolute;
  inset: 0;
  background: rgba(26, 26, 26, 0.45);
}
[data-theme='dark'] .scrim {
  background: rgba(0, 0, 0, 0.6);
}

.modal-wrap {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 36px;
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 16px;
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--ink);
}
.modal-sub {
  font-size: 12px;
  color: var(--ink-3);
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
  background: var(--surface);
  color: var(--ink);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition:
    border-color var(--t-fast) var(--ease-out),
    box-shadow var(--t-fast) var(--ease-out);
}
.input::placeholder {
  color: var(--ink-4);
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
  font-size: 14px;
  justify-content: center;
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--ink-3);
}
.link {
  color: var(--ink-3);
  text-decoration: none;
}
.link:hover {
  color: var(--ink);
}
.link-strong {
  color: var(--accent);
  font-weight: 600;
}
</style>
