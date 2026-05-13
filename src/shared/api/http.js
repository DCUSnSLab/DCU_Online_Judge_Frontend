import axios from 'axios'

// Mirrors the legacy `ajax()` helper in DCU_Online_Judge_Frontend/src/pages/oj/api.js.
//
// The Django backend wraps every response in { error, data } where:
//   error === null  → success, payload is in `data`
//   error !== null  → failure, error message is in `data`
//
// We unwrap that into a normal axios success/reject so callers can just do
//   const { data } = await http.get('foo')
// and read the inner payload directly.
//
// Pass `{ silent: true }` in the axios config to suppress the global snackbar
// AND the global unauthenticated-redirect for a single request — handy for
// initial profile probes where "not signed in" is an expected outcome.

const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfHeaderName: 'X-CSRFToken',
  xsrfCookieName: 'csrftoken',
  timeout: 30000
})

let onUnauthenticated = null

export function onUnauthorized(cb) {
  onUnauthenticated = cb
}

let onApiError = null

export function onError(cb) {
  onApiError = cb
}

function isSilent(config) {
  return Boolean(config && config.silent)
}

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && Object.prototype.hasOwnProperty.call(body, 'error')) {
      if (body.error !== null) {
        const message = typeof body.data === 'string' ? body.data : 'Request failed'
        if (!isSilent(res.config)) {
          if (typeof message === 'string' && message.startsWith('Please login')) {
            onUnauthenticated?.()
          }
          if (onApiError) onApiError(message)
        }
        return Promise.reject({ message, raw: res })
      }
      return { ...res, data: body.data }
    }
    return res
  },
  (err) => {
    const cfg = err.config
    if (!isSilent(cfg)) {
      if (err.response?.status === 401) {
        onUnauthenticated?.()
      }
      const msg =
        err.response?.data?.data ||
        err.response?.data?.error ||
        err.message ||
        'Network error'
      if (onApiError && msg) onApiError(typeof msg === 'string' ? msg : 'Network error')
    }
    return Promise.reject(err)
  }
)

export default http
