import http from './http'

// Endpoints ported 1:1 from legacy DCU_Online_Judge_Frontend/src/pages/oj/api.js.

export function getPublicKey() {
  return http.get('get_public_key').then((r) => r.data)
}

export function tfaRequiredCheck(username) {
  return http.post('tfa_required', { username }).then((r) => r.data)
}

export function loginRequest(payload) {
  // payload: { username, password (RSA-encrypted), tfa_code? }
  return http.post('login', payload).then((r) => r.data)
}

export function logoutRequest() {
  return http.get('logout').then((r) => r.data)
}

export function getProfile({ silent = false } = {}) {
  return http.get('profile', { silent }).then((r) => r.data)
}

export function updateProfile(profile) {
  return http.put('profile', profile).then((r) => r.data)
}

export function getCaptcha() {
  return http.get('captcha').then((r) => r.data)
}

export function checkUsernameOrEmail(username, email, schoolssn) {
  return http
    .post('check_username_or_email', { username, email, schoolssn })
    .then((r) => r.data)
}

export function registerRequest(data) {
  return http.post('register', data).then((r) => r.data)
}

export function getWebsiteConfig() {
  return http.get('website').then((r) => r.data)
}

export function tokenRefresh(data) {
  return http.post('token_refresh', data).then((r) => r.data)
}

export function applyResetPassword(data) {
  return http.post('apply_reset_password', data).then((r) => r.data)
}

export function resetPassword(data) {
  return http.post('reset_password', data).then((r) => r.data)
}
