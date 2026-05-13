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
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(createAppVuetify())
  app.use(createAppI18n())

  // After Pinia is installed, wire global hooks.
  const userStore = useUserStore()
  const snackbar = useSnackbarStore()

  onUnauthorized(() => {
    userStore.clear()
    const current = router.currentRoute.value
    if (current.name === 'login') return
    router.replace({ name: 'login', query: { redirect: current.fullPath } })
  })

  onError((msg) => {
    if (msg) snackbar.error(msg)
  })

  // Best-effort profile restore on cold start — silent so anonymous users
  // landing on a public page don't get bounced to /login.
  try {
    await userStore.fetchProfile({ silent: true })
  } catch {
    /* not logged in — fine */
  }

  app.mount('#app')
}

bootstrap()
