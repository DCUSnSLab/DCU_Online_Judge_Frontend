import http from '~/api/http'

export default {
  // Placeholder. 페이지별 API는 Phase 4에서 옮긴다.
  judgeServer() {
    return http.get('admin/judge_server')
  }
}
