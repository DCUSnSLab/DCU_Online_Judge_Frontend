<template>
  <div class="auth-callback">
    <div class="card">
      <template v-if="error">
        <h2>로그인 실패</h2>
        <p class="muted">{{ errorMessage }}</p>
        <router-link to="/">홈으로</router-link>
      </template>
      <template v-else>
        <h2>로그인 처리 중...</h2>
        <p class="muted">잠시만 기다려주세요.</p>
      </template>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'

const ERROR_LABELS = {
  invalid_state: '인증 상태가 일치하지 않습니다. 다시 로그인해주세요.',
  missing_code: '인증 코드가 누락되었습니다.',
  missing_verifier: '인증 정보가 만료되었습니다. 다시 로그인해주세요.',
  token_exchange_failed: '인증 서버와의 토큰 교환에 실패했습니다.',
  token_invalid: '인증 토큰이 올바르지 않습니다.',
  account_disabled: '비활성화된 계정입니다.',
  access_denied: '로그인이 취소되었습니다.'
}

export default {
  name: 'AuthCallback',
  data () {
    return { error: '', errorMessage: '' }
  },
  mounted () {
    const err = this.$route.query.error
    if (err) {
      this.error = err
      this.errorMessage = ERROR_LABELS[err] || err
      return
    }

    // 1) backend 가 발급한 짧은 쿠키에서 토큰 추출
    const access = this.readCookie('sso_access_token')
    const refresh = this.readCookie('sso_refresh_token')
    if (access) localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)

    // 2) 쿠키 즉시 폐기 (max-age=0)
    this.expireCookie('sso_access_token')
    this.expireCookie('sso_refresh_token')

    // 3) 프로필 가져오고 next 로 이동
    api.getUserInfo().then(res => {
      this.$store.commit('CHANGE_PROFILE', { profile: res.data.data || {} })
      const next = this.$route.query.next || '/'
      this.$router.replace(next)
    }).catch(() => {
      this.error = 'profile_failed'
      this.errorMessage = '프로필을 불러오지 못했습니다.'
    })
  },
  methods: {
    readCookie (name) {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
      return m ? decodeURIComponent(m[1]) : ''
    },
    expireCookie (name) {
      document.cookie = name + '=; Max-Age=0; Path=/'
    }
  }
}
</script>

<style scoped>
.auth-callback {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  background: #fff;
  padding: 40px 48px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-align: center;
  min-width: 320px;
}
.card h2 { margin: 0 0 12px; }
.muted { color: #6b7280; margin: 0 0 16px; }
</style>
