<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { mdiLogout, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'
import { useNotice } from '~/composables/useNotice'

const router = useRouter()
const userStore = useUserStore()
const { user, roleLabel, isAdminRole, isSuperAdmin } = storeToRefs(userStore)
const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)
const notice = useNotice()

async function handleLogout() {
  await userStore.logout()
  notice.info('로그아웃되었습니다.')
  router.replace({ name: 'admin-login' })
}

// 백엔드 권한 매트릭스 기반 — Super Admin만 가능한 항목은 superOnly 표시.
const allGroups = [
  {
    label: 'General',
    items: [
      { id: 'user', label: '사용자', to: '/user', superOnly: true },
      { id: 'announcement', label: '공지사항', to: '/announcement' },
      { id: 'conf', label: '환경설정', to: '/conf', superOnly: true },
      { id: 'judge-server', label: '채점 서버', to: '/judge-server', superOnly: true },
      { id: 'llm-keys', label: 'LLM API 키', to: '/llm-keys', superOnly: true },
      { id: 'prune-test-case', label: '테스트케이스 정리', to: '/prune-test-case', superOnly: true }
    ]
  },
  {
    label: 'Problem',
    items: [
      { id: 'problems', label: '문제 목록', to: '/problems' },
      { id: 'problem-create', label: '문제 생성', to: '/problem/create' },
      { id: 'problem-import', label: '문제 가져오기', to: '/problem/batch_ops' }
    ]
  },
  {
    label: 'Contest',
    items: [
      { id: 'contest', label: '콘테스트 목록', to: '/contest' },
      { id: 'contest-create', label: '콘테스트 생성', to: '/contest/create' }
    ]
  },
  {
    label: 'Lecture',
    items: [
      { id: 'lecture', label: '강의 목록', to: '/lecture' },
      { id: 'lecture-create', label: '강의 생성', to: '/lecture/create' }
    ]
  }
]

const groups = computed(() =>
  allGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => isSuperAdmin.value || !it.superOnly)
    }))
    .filter((g) => g.items.length > 0)
)
</script>

<template>
  <aside class="side">
    <div class="brand">
      <div class="brand-eyebrow mono">DCU CODE</div>
      <div class="brand-title">관리자</div>
    </div>

    <nav class="nav">
      <router-link
        to="/"
        class="nav-item nav-top"
        active-class="__no-active"
        exact-active-class="nav-item-active"
      >
        <span class="nav-icon">◆</span>
        <span>Dashboard</span>
      </router-link>

      <div v-if="!isAdminRole" class="nav-note mono">
        관리자 권한이 없습니다.
      </div>

      <div v-for="group in groups" v-else :key="group.label" class="nav-group">
        <div class="nav-group-label mono">{{ group.label }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.id"
          :to="item.to"
          class="nav-item nav-sub"
          active-class="nav-item-active"
        >
          {{ item.label }}
        </router-link>
      </div>
    </nav>

    <div class="side-footer">
      <div class="user-avatar mono">
        {{ (user?.username || '?').slice(0, 2).toUpperCase() }}
      </div>
      <div class="user-meta">
        <div class="user-name">{{ user?.real_name || user?.username || '게스트' }}</div>
        <div class="user-role mono">{{ roleLabel }}</div>
      </div>
      <button
        class="theme-toggle"
        :aria-label="themeMode === 'dark' ? '라이트 모드' : '다크 모드'"
        @click="appStore.toggleTheme()"
      >
        <v-icon :icon="themeMode === 'dark' ? mdiWhiteBalanceSunny : mdiWeatherNight" size="14" />
      </button>
      <button class="theme-toggle" aria-label="로그아웃" @click="handleLogout">
        <v-icon :icon="mdiLogout" size="14" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.side {
  width: 232px;
  height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 0;
}

.brand {
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
}
.brand-eyebrow {
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.brand-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
  font-size: 13px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: var(--ink-2);
  text-decoration: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background var(--t-fast) var(--ease-out);
}
.nav-item:hover {
  background: var(--sunken);
}
.nav-item-active {
  color: var(--ink);
  background: var(--sunken);
  border-left-color: var(--accent);
  font-weight: 600;
}

.nav-icon {
  color: var(--accent);
}

.nav-sub {
  padding: 8px 20px 8px 32px;
  font-size: 12.5px;
}

.nav-group {
  margin-top: 14px;
}
.nav-note {
  padding: 12px 20px;
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
.nav-group-label {
  padding: 4px 20px;
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

.side-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
}
.user-meta {
  flex: 1;
  min-width: 0;
}
.user-name {
  font-size: 12px;
  color: var(--ink);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role {
  font-size: 10px;
  color: var(--ink-3);
}

.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-md);
  background: transparent;
  border: 1px solid transparent;
  color: var(--ink-2);
  cursor: pointer;
}
.theme-toggle:hover {
  background: var(--sunken);
}
</style>
