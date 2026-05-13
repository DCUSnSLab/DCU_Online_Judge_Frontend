<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  mdiAccountCircleOutline,
  mdiCogOutline,
  mdiLogout,
  mdiShieldAccountOutline
} from '@mdi/js'
import { useUserStore } from '~/stores/user'

const router = useRouter()
const userStore = useUserStore()
const { user, roleLabel, isAdminRole } = storeToRefs(userStore)

const initials = computed(() => {
  const name = user.value?.username || user.value?.real_name
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
})

const displayName = computed(
  () => user.value?.real_name || user.value?.username || 'You'
)

const items = computed(() => {
  const list = [
    { id: 'profile', label: '프로필', icon: mdiAccountCircleOutline, to: '/user-home' },
    { id: 'setting', label: '설정', icon: mdiCogOutline, to: '/setting' }
  ]
  if (isAdminRole.value) {
    list.push({
      id: 'admin',
      label: '관리자 콘솔',
      icon: mdiShieldAccountOutline,
      href: '/admin.html'
    })
  }
  list.push({ id: 'logout', label: '로그아웃', icon: mdiLogout, to: '/logout', danger: true })
  return list
})

function go(item) {
  if (item.href) {
    window.location.href = item.href
  } else if (item.to) {
    router.push(item.to)
  }
}
</script>

<template>
  <v-menu offset="8" location="bottom end" :close-on-content-click="true">
    <template #activator="{ props }">
      <button v-bind="props" class="avatar mono" type="button" aria-label="사용자 메뉴">
        {{ initials }}
      </button>
    </template>

    <div class="menu">
      <header class="menu-head">
        <div class="menu-avatar mono">{{ initials }}</div>
        <div class="menu-meta">
          <div class="menu-name">{{ displayName }}</div>
          <div class="mono menu-role">{{ roleLabel }}</div>
        </div>
      </header>
      <div class="menu-divider" />
      <button
        v-for="item in items"
        :key="item.id"
        :class="['menu-item', item.danger && 'menu-item-danger']"
        type="button"
        @click="go(item)"
      >
        <v-icon :icon="item.icon" size="16" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </v-menu>
</template>

<style scoped>
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: oklch(0.78 0.10 60);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 12px;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-mono);
}

.menu {
  width: 220px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px;
  box-shadow: var(--shadow-pop);
  display: flex;
  flex-direction: column;
}

.menu-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
}
.menu-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: oklch(0.78 0.10 60);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
}
.menu-meta {
  min-width: 0;
  flex: 1;
}
.menu-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-role {
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.menu-divider {
  height: 1px;
  background: var(--line);
  margin: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--ink-2);
  background: transparent;
  border: none;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background var(--t-fast) var(--ease-out);
}
.menu-item:hover {
  background: var(--sunken);
  color: var(--ink);
}
.menu-item-danger:hover {
  color: var(--status-wa);
}
</style>
