<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useNotice } from '~/composables/useNotice'

const router = useRouter()
const userStore = useUserStore()
const notice = useNotice()

onMounted(async () => {
  try {
    await userStore.logout()
  } catch {
    /* logout endpoint failures should still clear local state */
  }
  notice.info('로그아웃되었습니다.')
  router.replace('/')
})
</script>

<template>
  <div class="logout-stub">로그아웃 중…</div>
</template>

<style scoped>
.logout-stub {
  display: grid;
  place-items: center;
  min-height: calc(100vh - 56px);
  color: var(--ink-3);
  font-size: 13px;
}
</style>
