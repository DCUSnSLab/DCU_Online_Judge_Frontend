<template>
</template>

<script>
  import api from '../../api.js'

  export default {
    mounted () {
      api.logout().then(res => {
        this.$store.dispatch('clearProfile')
        // backend 가 sso_logout_url 을 함께 응답 → SSO end_session 까지 navigate.
        // 없으면 자체 routing 으로 fallback.
        var ssoLogout = ''
        if (res && res.data && res.data.data) {
          ssoLogout = res.data.data.sso_logout_url
        }
        if (ssoLogout) {
          window.location.href = ssoLogout
        } else {
          this.$router.replace({ path: '/' })
        }
      }).catch(() => {
        // backend 호출 실패해도 local profile 만이라도 정리
        this.$store.dispatch('clearProfile')
        this.$router.replace({ path: '/' })
      })
    }
  }
</script>
