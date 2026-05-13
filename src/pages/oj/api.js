import http from '~/api/http'

export default {
  // Placeholder. 페이지별 API는 Phase 3에서 옮긴다.
  ping() {
    return http.get('website')
  }
}
