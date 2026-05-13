<script setup>
import { onMounted, reactive, ref } from 'vue'
import { applyResetPassword, checkUsernameOrEmail, getCaptcha } from '~/api/auth'
import { useNotice } from '~/composables/useNotice'
import AuthCard from './AuthCard.vue'
import AuthField from './AuthField.vue'

const notice = useNotice()

const form = reactive({ email: '', captcha: '' })
const errors = reactive({ email: '', captcha: '' })
const captchaSrc = ref('')
const submitting = ref(false)
const successApply = ref(false)

async function refreshCaptcha() {
  try {
    captchaSrc.value = await getCaptcha()
  } catch {
    /* */
  }
}

onMounted(refreshCaptcha)

function validateEmailFormat() {
  if (!form.email) {
    errors.email = '이메일을 입력하세요.'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '이메일 형식이 올바르지 않습니다.'
    return false
  }
  errors.email = ''
  return true
}

async function checkEmailExists() {
  if (!validateEmailFormat()) return
  try {
    const data = await checkUsernameOrEmail(undefined, form.email, undefined)
    if (data?.email === false) errors.email = '등록되지 않은 이메일입니다.'
  } catch {
    /* */
  }
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
  if (![validateEmailFormat(), validateCaptcha()].every(Boolean)) return
  submitting.value = true
  try {
    await applyResetPassword({ email: form.email, captcha: form.captcha })
    successApply.value = true
  } catch (err) {
    notice.error(err?.message || '재설정 메일 발송에 실패했습니다.')
    form.captcha = ''
    refreshCaptcha()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <auth-card
    title="비밀번호 재설정"
    subtitle="가입 시 등록한 이메일로 재설정 링크를 보내드립니다"
  >
    <template v-if="!successApply">
      <form @submit.prevent="handleSubmit">
        <auth-field
          v-model="form.email"
          label="이메일"
          type="email"
          placeholder="예: name@cu.ac.kr"
          autocomplete="email"
          :error="errors.email"
          @blur="checkEmailExists"
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

        <button type="submit" class="btn btn-primary submit" :disabled="submitting">
          {{ submitting ? '발송 중…' : '재설정 링크 보내기' }}
        </button>
      </form>
    </template>

    <template v-else>
      <div class="success">
        <div class="success-icon">✓</div>
        <div class="success-title">메일을 발송했어요</div>
        <div class="success-desc">
          <span class="mono">{{ form.email }}</span> 로 비밀번호 재설정 링크를 보냈습니다. 메일을
          확인해주세요.
        </div>
      </div>
    </template>

    <div class="foot">
      <router-link to="/login" class="link-strong">← 로그인으로 돌아가기</router-link>
    </div>
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
.submit {
  width: 100%;
  height: 42px;
  justify-content: center;
  font-size: 14px;
  margin-top: 6px;
}

.success {
  padding: 16px 18px;
  background: oklch(0.96 0.04 150);
  border-radius: var(--r-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
[data-theme='dark'] .success {
  background: oklch(0.30 0.08 150 / 0.4);
}
.success-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--status-ac);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}
.success-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.success-desc {
  font-size: 12px;
  color: var(--ink-2);
}

.foot {
  text-align: center;
  margin-top: 18px;
  font-size: 12px;
  color: var(--ink-3);
}
.link-strong {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}
</style>
