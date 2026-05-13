<script setup>
import { storeToRefs } from 'pinia'
import { mdiMagnify, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'
import UserMenu from './UserMenu.vue'

const items = [
  { key: 'home', label: '홈', to: '/' },
  { key: 'problem', label: '문제', to: '/problem' },
  { key: 'contest', label: '콘테스트', to: '/contest' },
  { key: 'lecture', label: '수강과목', to: '/CourseList' },
  { key: 'rank', label: '랭킹', to: '/acm-rank' },
  { key: 'status', label: '제출현황', to: '/status' }
]

const userStore = useUserStore()
const { isAuthenticated } = storeToRefs(userStore)
const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)
</script>

<template>
  <header class="navbar">
    <router-link to="/" class="brand">
      <span class="brand-mark mono">D</span>
      <span class="brand-name">DCUCODE</span>
    </router-link>

    <nav class="nav-items">
      <router-link
        v-for="item in items"
        :key="item.key"
        :to="item.to"
        class="nav-link"
        :active-class="item.key === 'home' ? '__no-active' : 'nav-link-active'"
        :exact-active-class="item.key === 'home' ? 'nav-link-active' : '__no-exact'"
      >
        {{ item.label }}
      </router-link>
    </nav>

    <div class="navbar-end">
      <button class="search">
        <v-icon :icon="mdiMagnify" size="14" />
        <span>문제 / 강의 검색</span>
        <span class="kbd mono">⌘K</span>
      </button>

      <button
        class="theme-toggle"
        :aria-label="themeMode === 'dark' ? '라이트 모드' : '다크 모드'"
        @click="appStore.toggleTheme()"
      >
        <v-icon :icon="themeMode === 'dark' ? mdiWhiteBalanceSunny : mdiWeatherNight" size="16" />
      </button>

      <user-menu v-if="isAuthenticated" />
      <router-link v-else to="/login" class="btn btn-sm">로그인</router-link>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 32px;
  gap: 32px;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 50;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--ink);
}
.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: var(--r-md);
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
}
.brand-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.nav-items {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 8px 14px;
  border-radius: var(--r-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  text-decoration: none;
  border: 1px solid transparent;
  transition: background var(--t-fast) var(--ease-out);
}
.nav-link:hover {
  background: var(--sunken);
}
.nav-link-active {
  color: var(--ink);
  font-weight: 600;
  background: var(--surface);
  border-color: var(--line);
}

.navbar-end {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  height: 32px;
  padding: 0 10px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-md);
  color: var(--ink-3);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}
.search:hover {
  border-color: var(--ink-3);
}
.kbd {
  margin-left: auto;
  font-size: 10px;
  padding: 1px 5px;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--ink-3);
}

.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
}
.theme-toggle:hover {
  background: var(--sunken);
}
</style>
