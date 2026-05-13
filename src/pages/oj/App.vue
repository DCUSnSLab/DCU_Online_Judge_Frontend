<script setup>
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { themeNameFor, applyHtmlTheme } from '~/plugins/vuetify'
import AppSnackbarHost from '~/components/AppSnackbarHost.vue'
import NavBar from '@oj/components/NavBar.vue'

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
</script>

<template>
  <v-app>
    <nav-bar />
    <v-main>
      <div class="oj-content">
        <router-view />
      </div>
    </v-main>
    <app-snackbar-host />
  </v-app>
</template>

<style scoped>
.oj-content {
  min-height: calc(100vh - 56px);
  background: var(--bg);
  color: var(--ink);
}
</style>
