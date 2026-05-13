<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="page">
    <div class="content">
      <div class="mono code">404</div>
      <div class="mono eyebrow">NOT FOUND · 페이지를 찾을 수 없습니다</div>
      <p class="desc">요청하신 페이지가 존재하지 않거나, 접근 권한이 없습니다.</p>
      <div class="actions">
        <button class="btn btn-primary" @click="router.push('/')">← 홈으로</button>
        <button class="btn" @click="router.back()">이전 페이지</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { display: grid; place-items: center; min-height: calc(100vh - 56px); padding: 40px; }
.content { text-align: center; max-width: 420px; }
.code { font-size: 88px; font-weight: 700; letter-spacing: -3px; color: var(--accent); line-height: 1; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 2px; text-transform: uppercase; margin-top: 8px; }
.desc { font-size: 16px; color: var(--ink-2); margin: 24px 0; }
.actions { display: flex; gap: 8px; justify-content: center; }
</style>
