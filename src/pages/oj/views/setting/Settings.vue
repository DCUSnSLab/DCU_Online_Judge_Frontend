<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'

const route = useRoute()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const menu = [
  { name: 'profile-setting', label: '프로필', to: '/setting/profile' },
  { name: 'account-setting', label: '계정', to: '/setting/account' },
  { name: 'security-setting', label: '보안', to: '/setting/security' }
]

const initials = computed(() => {
  const n = user.value?.username || user.value?.real_name
  return n ? n.slice(0, 2).toUpperCase() : '?'
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">SETTINGS</div>
      <h1 class="title">설정</h1>
    </header>

    <div class="layout">
      <aside class="surface side">
        <router-link
          v-for="m in menu"
          :key="m.to"
          :to="m.to"
          class="side-item"
          active-class="side-item-active"
        >
          {{ m.label }}
        </router-link>
      </aside>

      <main class="main">
        <router-view />
      </main>

      <aside class="surface preview">
        <div class="mono preview-label">아바타</div>
        <div class="big-avatar mono">{{ initials }}</div>
        <button class="btn full-w">이미지 업로드</button>
        <div class="mono drag-hint">드래그 & 드롭 지원</div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px; }
.hero { margin-bottom: 24px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0; color: var(--ink); }

.layout { display: grid; grid-template-columns: 220px 1fr 220px; gap: 20px; }
@media (max-width: 960px) { .layout { grid-template-columns: 200px 1fr; } .preview { display: none; } }
@media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }

.side { padding: 8px; display: flex; flex-direction: column; gap: 2px; align-self: start; }
.side-item { padding: 10px 14px; font-size: 13px; font-weight: 500; color: var(--ink-2); border-radius: var(--r-md); text-decoration: none; }
.side-item:hover { background: var(--sunken); color: var(--ink); }
.side-item-active { background: var(--sunken); color: var(--ink); font-weight: 600; }

.main { min-width: 0; }

.preview { padding: 20px; text-align: center; align-self: start; }
.preview-label { font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.big-avatar { width: 140px; height: 140px; border-radius: 50%; background: oklch(0.78 0.10 60); color: #fff; margin: 0 auto; display: grid; place-items: center; font-size: 48px; font-weight: 600; }
.full-w { width: 100%; margin-top: 16px; justify-content: center; }
.drag-hint { font-size: 11px; color: var(--ink-3); margin-top: 8px; }
</style>
