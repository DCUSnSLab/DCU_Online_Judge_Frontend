<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import JSEncrypt from 'jsencrypt'
import {
  checkUsernameOrEmail,
  getCaptcha,
  getPublicKey,
  registerRequest
} from '~/api/auth'
import { useNotice } from '~/composables/useNotice'
import AuthCard from './AuthCard.vue'
import AuthField from './AuthField.vue'

const router = useRouter()
const notice = useNotice()

const form = reactive({
  username: '',
  realname: '',
  email: '',
  password: '',
  passwordAgain: '',
  schoolssn: '',
  schoolssnAgain: '',
  captcha: ''
})

const errors = reactive({
  username: '',
  realname: '',
  email: '',
  password: '',
  passwordAgain: '',
  schoolssn: '',
  schoolssnAgain: '',
  captcha: ''
})

const captchaSrc = ref('')
const submitting = ref(false)

async function refreshCaptcha() {
  try {
    captchaSrc.value = await getCaptcha()
  } catch {
    /* */
  }
}

onMounted(refreshCaptcha)

function validateUsernameFormat() {
  if (!form.username) {
    errors.username = '아이디를 입력하세요.'
    return false
  }
  if (!/^[a-z0-9]+$/.test(form.username)) {
    errors.username = '소문자/숫자만 사용할 수 있습니다.'
    return false
  }
  errors.username = ''
  return true
}

function validateRealname() {
  if (!form.realname) {
    errors.realname = '이름을 입력하세요.'
    return false
  }
  if (/[0-9]/.test(form.realname)) {
    errors.realname = '이름에는 숫자를 사용할 수 없습니다.'
    return false
  }
  errors.realname = ''
  return true
}

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

function validatePassword() {
  if (!form.password) {
    errors.password = '비밀번호를 입력하세요.'
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

function validateSchoolssn() {
  if (!form.schoolssn) {
    errors.schoolssn = '학번을 입력하세요.'
    return false
  }
  if (form.schoolssn.length < 5 || form.schoolssn.length > 8) {
    errors.schoolssn = '학번은 5~8자여야 합니다.'
    return false
  }
  errors.schoolssn = ''
  return true
}

function validateSchoolssnAgain() {
  if (form.schoolssnAgain !== form.schoolssn) {
    errors.schoolssnAgain = '학번이 일치하지 않습니다.'
    return false
  }
  errors.schoolssnAgain = ''
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

async function checkUsernameUnique() {
  if (!validateUsernameFormat()) return
  try {
    const data = await checkUsernameOrEmail(form.username, undefined, undefined)
    if (data?.username === true) errors.username = '이미 사용 중인 아이디입니다.'
  } catch {
    /* */
  }
}

async function checkEmailUnique() {
  if (!validateEmailFormat()) return
  try {
    const data = await checkUsernameOrEmail(undefined, form.email, undefined)
    if (data?.email === true) errors.email = '이미 사용 중인 이메일입니다.'
  } catch {
    /* */
  }
}

async function checkSchoolssnUnique() {
  if (!validateSchoolssn()) return
  try {
    const data = await checkUsernameOrEmail(undefined, undefined, form.schoolssn)
    if (data?.schoolssn === true) errors.schoolssn = '이미 등록된 학번입니다.'
  } catch {
    /* */
  }
}

function validateAll() {
  return [
    validateUsernameFormat(),
    validateRealname(),
    validateEmailFormat(),
    validatePassword(),
    validatePasswordAgain(),
    validateSchoolssn(),
    validateSchoolssnAgain(),
    validateCaptcha()
  ].every(Boolean)
}

async function handleSubmit() {
  if (!validateAll()) return
  submitting.value = true
  try {
    const { public_key: publicKey } = await getPublicKey()
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(publicKey)
    const payload = {
      username: form.username,
      realname: form.realname,
      email: form.email,
      password: encryptor.encrypt(form.password),
      schoolssn: form.schoolssn,
      captcha: form.captcha
    }
    await registerRequest(payload)
    notice.success('가입이 완료되었어요. 로그인해주세요.')
    router.push({ path: '/login' })
  } catch (err) {
    notice.error(err?.message || '회원가입에 실패했습니다.')
    form.captcha = ''
    refreshCaptcha()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <auth-card title="회원가입" subtitle="대구가톨릭대학교 온라인 저지 계정 만들기">
    <form @submit.prevent="handleSubmit">
      <auth-field
        v-model="form.username"
        label="아이디 (영문/숫자)"
        placeholder="예: ojuser"
        autocomplete="username"
        :error="errors.username"
        @blur="checkUsernameUnique"
      />
      <auth-field
        v-model="form.realname"
        label="이름"
        :mono="false"
        placeholder="예: 김지수"
        autocomplete="name"
        :error="errors.realname"
        @blur="validateRealname"
      />
      <auth-field
        v-model="form.email"
        label="이메일"
        type="email"
        placeholder="예: name@cu.ac.kr"
        autocomplete="email"
        :error="errors.email"
        @blur="checkEmailUnique"
      />
      <auth-field
        v-model="form.password"
        label="비밀번호"
        type="password"
        help="6~20자"
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
      <auth-field
        v-model="form.schoolssn"
        label="학번"
        placeholder="예: 20231234"
        :error="errors.schoolssn"
        @blur="checkSchoolssnUnique"
      />
      <auth-field
        v-model="form.schoolssnAgain"
        label="학번 확인"
        :error="errors.schoolssnAgain"
        @blur="validateSchoolssnAgain"
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
        {{ submitting ? '가입 중…' : '가입하기' }}
      </button>
    </form>

    <div class="foot">
      이미 계정이 있으신가요?
      <router-link to="/login" class="link-strong">로그인</router-link>
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
  margin-top: 12px;
}
.foot {
  text-align: center;
  margin-top: 18px;
  font-size: 12px;
  color: var(--ink-3);
}
.link-strong {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
</style>
