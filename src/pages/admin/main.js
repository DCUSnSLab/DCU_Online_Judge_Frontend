import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { createAppVuetify } from '~/plugins/vuetify'
import { createAppI18n } from '~/plugins/i18n'
import { onError, onUnauthorized } from '~/api/http'
import { useUserStore } from '~/stores/user'
import { useSnackbarStore } from '~/stores/snackbar'

async function bootstrap() {
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.use(createAppVuetify())
  app.use(createAppI18n())

  const userStore = useUserStore()
  const snackbar = useSnackbarStore()

  onError((msg) => {
    if (msg) snackbar.error(msg)
  })

  onUnauthorized(() => {
    userStore.clear()
    const current = router.currentRoute.value
    if (current.name === 'admin-login') return
    router.replace({ name: 'admin-login', query: { redirect: current.fullPath } })
  })

  try {
    await userStore.fetchProfile({ silent: true })
  } catch {
    /* anonymous — guard below will redirect to login */
  }

  router.beforeEach((to) => {
    if (to.meta?.requiresAdmin) {
      if (!userStore.isAuthenticated) {
        return { name: 'admin-login', query: { redirect: to.fullPath } }
      }
      if (!userStore.isAdminRole) {
        // 학생이 admin URL 직접 진입 — Dashboard의 가드 화면이 처리
        return true
      }
    }
    return true
  })

  app.mount('#app')
}

bootstrap()
