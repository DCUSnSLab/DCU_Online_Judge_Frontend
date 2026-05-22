<template>
</template>

<script>
  import api from '@oj/api'
  export default {
    mounted () {
      // dcu-sso 전환: /login 진입 시 즉시 SSO authorize 로 redirect.
      const next = this.$route.query.next || '/'
      api.startSsoLogin(next)
    }
  }
</script>
