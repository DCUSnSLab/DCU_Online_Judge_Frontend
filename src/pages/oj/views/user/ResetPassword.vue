<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCaptcha, resetPassword } from '~/api/auth'
import { useNotice } from '~/composables/useNotice'
import AuthCard from './AuthCard.vue'
import AuthField from './AuthField.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const form = reactive({
  password: '',
  passwordAgain: '',
  captcha: '',
  token: ''
})
const errors = reactive({ password: '', passwordAgain: '', captcha: '' })
const captchaSrc = ref('')
const submitting = ref(false)
const resetSuccess = ref(false)

async function refreshCaptcha() {
  try {
    captchaSrc.value = await getCaptcha()
  } catch {
    /* */
  }
}

onMounted(() => {
  form.token = String(route.params.token || '')
  refreshCaptcha()
})

function validatePassword() {
  if (!form.password) {
    errors.password = '새 비밀번호를 입력하세요.'
    return false
  }
  if (form.password.length < 6 || form.password.length > 20) {
    errors.password = '비밀번호는 6~20자여야 합니다.'
    return false
  }
  errors.password = ''
  return true
}

function validatePasswordAgain() {
  if (form.passwordAgain !== form.password) {
    errors.passwordAgain = '비밀번호가 일치하지 않습니다.'
    return false
  }
  errors.passwordAgain = ''
  return true
}

function validateCaptcha() {
  if (!form.captcha) {
    errors.captcha = '캡차를 입력하세요.'
    return false
  }
  errors.captcha = ''
  return true
}

async function handleSubmit() {
  if (![validatePassword(), validatePasswordAgain(), validateCaptcha()].every(Boolean)) return
  submitting.value = true
  try {
    await resetPassword({
      password: form.password,
      captcha: form.captcha,
      token: form.token
    })
    resetSuccess.value = true
  } catch (err) {
    notice.error(err?.message || '비밀번호 변경에 실패했습니다.')
    form.captcha = ''
    refreshCaptcha()
  } finally {
    submitting.value = false
  }
}

function goLogin() {
  router.push('/login')
}
</script>

<template>
  <auth-card title="새 비밀번호 설정" subtitle="이메일 링크로 인증되었습니다">
    <template v-if="!resetSuccess">
      <form @submit.prevent="handleSubmit">
        <auth-field
          v-model="form.password"
          label="새 비밀번호"
          type="password"
          help="8자 이상, 영문/숫자/특수문자 조합 권장 (6~20자)"
          autocomplete="new-password"
          :error="errors.password"
          @blur="validatePassword"
        />
        <auth-field
          v-model="form.passwordAgain"
          label="비밀번호 확인"
          type="password"
          autocomplete="new-password"
          :error="errors.passwordAgain"
          @blur="validatePasswordAgain"
        />

        <div class="captcha-row">
          <div class="captcha-input">
            <auth-field
              v-model="form.captcha"
              label="캡차"
              placeholder="이미지에 표시된 문자"
              :error="errors.captcha"
              @blur="validateCaptcha"
            />
          </div>
          <button
            type="button"
            class="captcha-img"
            aria-label="캡차 새로고침"
            @click="refreshCaptcha"
          >
            <img v-if="captchaSrc" :src="captchaSrc" alt="captcha" />
            <span v-else class="mono captcha-fallback">CAPTCHA</span>
          </button>
        </div>

        <div class="token-hint">
          <span class="token-tick">✓</span>
          토큰이 유효합니다
        </div>

        <button type="submit" class="btn btn-primary submit" :disabled="submitting">
          {{ submitting ? '변경 중…' : '비밀번호 변경' }}
        </button>
      </form>
    </template>

    <template v-else>
      <div class="success">
        <div class="success-icon">✓</div>
        <div class="success-title">비밀번호가 변경되었습니다</div>
        <div class="success-desc">새 비밀번호로 다시 로그인해주세요.</div>
        <button class="btn btn-primary success-btn" @click="goLogin">로그인 화면으로</button>
      </div>
    </template>
  </auth-card>
</template>

<style scoped>
.captcha-row {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 10px;
  align-items: end;
}
.captcha-input {
  margin-bottom: 0;
}
.captcha-img {
  height: 38px;
  border-radius: var(--r-md);
  border: 1px dashed var(--line-strong);
  background: var(--sunken);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  margin-bottom: 14px;
}
.captcha-img img {
  height: 100%;
  width: 100%;
  object-fit: contain;
  border-radius: var(--r-md);
}
.captcha-fallback {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 4px;
}

.token-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: oklch(0.96 0.04 150);
  border-radius: var(--r-md);
  font-size: 12px;
  color: oklch(0.32 0.14 150);
  margin-bottom: 14px;
}
[data-theme='dark'] .token-hint {
  background: oklch(0.30 0.08 150 / 0.4);
  color: oklch(0.78 0.14 150);
}
.token-tick {
  font-weight: 700;
}

.submit {
  width: 100%;
  height: 42px;
  justify-content: center;
  font-size: 14px;
}

.success {
  text-align: center;
  padding: 16px 0;
}
.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--status-ac);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 28px;
  margin: 0 auto 12px;
}
.success-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}
.success-desc {
  font-size: 13px;
  color: var(--ink-2);
  margin-top: 4px;
}
.success-btn {
  margin-top: 18px;
  width: 100%;
  height: 42px;
  justify-content: center;
}
</style>
