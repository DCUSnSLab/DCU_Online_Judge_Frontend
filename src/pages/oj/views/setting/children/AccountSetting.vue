<template>
  <div class="setting-main">
    <p class="section-title">{{$t('m.Account')}}</p>
    <div class="sso-redirect">
      <p class="desc">
        비밀번호 · 이메일 · 2단계 인증 등 계정 보안 설정은 통합 계정(DCUCODE SSO)에서 관리합니다.
      </p>
      <p class="moving">SSO 계정 관리 페이지로 이동합니다…</p>
      <Button type="primary" @click="goSso">SSO 계정 관리로 이동</Button>
    </div>
  </div>
</template>

<script>
  // dcu-sso 전환: 계정(비번/이메일/2FA) 관리는 SSO /account 로 일원화.
  // 진입 즉시 backend(/api/auth/oidc/account)로 이동 → SSO 가 SSO_ISSUER/account 로 302.
  // (기존 비밀번호 변경 · 이메일 변경 폼은 제거됨 — SSO 에서 처리)
  export default {
    created () {
      this.goSso()
    },
    methods: {
      goSso () {
        window.location.href = '/api/auth/oidc/account'
      }
    }
  }
</script>

<style lang="less" scoped>
  .sso-redirect {
    padding: 10px 4px;
    .desc {
      font-size: 14px;
      color: #57606a;
      line-height: 1.6;
      margin-bottom: 14px;
    }
    .moving {
      font-size: 13px;
      color: #8a929e;
      margin-bottom: 18px;
    }
  }
</style>
