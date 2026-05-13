import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import JSEncrypt from 'jsencrypt'
import {
  getProfile,
  getPublicKey,
  loginRequest,
  logoutRequest,
  tfaRequiredCheck
} from '~/api/auth'

// Mirrors backend account.models.AdminType
export const ADMIN_TYPE = {
  REGULAR_USER: 'Regular User',
  TA_ADMIN: 'TA_Admin',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin'
}

// UI labels by role.
const ROLE_LABELS = {
  [ADMIN_TYPE.REGULAR_USER]: '학생',
  [ADMIN_TYPE.TA_ADMIN]: 'TA/RA',
  [ADMIN_TYPE.ADMIN]: '교수',
  [ADMIN_TYPE.SUPER_ADMIN]: '관리자'
}

const PROBLEM_PERMISSION = {
  NONE: 'None',
  SEMI: 'Semi',
  OWN: 'Own',
  ALL: 'All'
}

const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token'
}

export const useUserStore = defineStore('user', () => {
  // profile shape mirrors the legacy backend:
  // { user: { username, admin_type, ... }, accepted_number, total_score, ... }
  const profile = ref(null)
  const tfaRequired = ref(false)

  const user = computed(() => profile.value?.user || {})
  const isAuthenticated = computed(() => Boolean(user.value?.id))
  const adminType = computed(() => user.value?.admin_type || ADMIN_TYPE.REGULAR_USER)

  const isStudent = computed(() => adminType.value === ADMIN_TYPE.REGULAR_USER)
  const isSemiAdmin = computed(() => adminType.value === ADMIN_TYPE.TA_ADMIN)
  const isAdmin = computed(() => adminType.value === ADMIN_TYPE.ADMIN)
  const isSuperAdmin = computed(() => adminType.value === ADMIN_TYPE.SUPER_ADMIN)
  // 백엔드 is_admin_role()와 동일 — admin/ta/super 셋다 true
  const isAdminRole = computed(() =>
    [ADMIN_TYPE.ADMIN, ADMIN_TYPE.TA_ADMIN, ADMIN_TYPE.SUPER_ADMIN].includes(adminType.value)
  )

  const roleLabel = computed(
    () => (isAuthenticated.value ? ROLE_LABELS[adminType.value] || '학생' : '게스트')
  )

  const hasProblemPermission = computed(
    () =>
      user.value?.problem_permission && user.value.problem_permission !== PROBLEM_PERMISSION.NONE
  )

  function setProfile(p) {
    profile.value = p || null
  }

  function clear() {
    profile.value = null
    tfaRequired.value = false
    localStorage.removeItem(TOKEN_KEYS.ACCESS)
    localStorage.removeItem(TOKEN_KEYS.REFRESH)
  }

  async function checkTfa(username) {
    if (!username) {
      tfaRequired.value = false
      return false
    }
    try {
      const data = await tfaRequiredCheck(username)
      tfaRequired.value = Boolean(data?.result)
      return tfaRequired.value
    } catch {
      tfaRequired.value = false
      return false
    }
  }

  async function login(input) {
    const { public_key: publicKey } = await getPublicKey()
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(publicKey)
    const encryptedPassword = encryptor.encrypt(input.password)

    const payload = {
      username: input.username,
      password: encryptedPassword
    }
    if (tfaRequired.value && input.tfa_code) {
      payload.tfa_code = input.tfa_code
    }

    const data = await loginRequest(payload)
    if (data?.tokens?.access) localStorage.setItem(TOKEN_KEYS.ACCESS, data.tokens.access)
    if (data?.tokens?.refresh) localStorage.setItem(TOKEN_KEYS.REFRESH, data.tokens.refresh)

    await fetchProfile()
    return data
  }

  async function fetchProfile({ silent = false } = {}) {
    try {
      const data = await getProfile({ silent })
      setProfile(data || null)
      return data
    } catch (err) {
      setProfile(null)
      throw err
    }
  }

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      clear()
    }
  }

  return {
    profile,
    user,
    tfaRequired,
    isAuthenticated,
    adminType,
    roleLabel,
    isStudent,
    isSemiAdmin,
    isAdmin,
    isSuperAdmin,
    isAdminRole,
    hasProblemPermission,
    setProfile,
    clear,
    checkTfa,
    login,
    fetchProfile,
    logout
  }
})
