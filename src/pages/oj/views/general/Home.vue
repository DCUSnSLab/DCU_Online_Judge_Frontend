<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import GuestHome from './_GuestHome.vue'
import StudentHome from './_StudentHome.vue'
import StaffHome from './_StaffHome.vue'

const userStore = useUserStore()
const { isAuthenticated, isAdmin, isSuperAdmin } = storeToRefs(userStore)

// ADMIN(교수) / SUPER_ADMIN(관리자)은 Staff 변형 — 본인 콘솔 위주
// REGULAR_USER(학생) / TA_ADMIN(TA/RA)은 Student 변형 — 학습 위주
const isStaff = computed(() => isAdmin.value || isSuperAdmin.value)
</script>

<template>
  <guest-home v-if="!isAuthenticated" />
  <staff-home v-else-if="isStaff" />
  <student-home v-else />
</template>
