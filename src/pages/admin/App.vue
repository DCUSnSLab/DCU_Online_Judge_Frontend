<script setup>
import { computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { themeNameFor, applyHtmlTheme } from '~/plugins/vuetify'
import AppSnackbarHost from '~/components/AppSnackbarHost.vue'
import SideMenu from '@admin/components/SideMenu.vue'

const route = useRoute()
const theme = useTheme()
const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)

watch(
  themeMode,
  (m) => {
    theme.global.name.value = themeNameFor(m)
    applyHtmlTheme(m)
  },
  { immediate: true }
)

// 로그인 등 "plain" 페이지는 사이드바 없이 전체 화면 노출.
const isPlain = computed(() => Boolean(route.meta?.plain))
</script>

<template>
  <v-app>
    <router-view v-if="isPlain" />
    <div v-else class="admin-shell">
      <side-menu />
      <main class="admin-main">
        <router-view />
      </main>
    </div>
    <app-snackbar-host />
  </v-app>
</template>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 232px 1fr;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}
.admin-main {
  min-width: 0;
  overflow-x: hidden;
}
</style>
