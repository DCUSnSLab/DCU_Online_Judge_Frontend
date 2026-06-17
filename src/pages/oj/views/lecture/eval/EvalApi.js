// Eval API client. 본 서버 eval app endpoint 호출. 진행률은 폴링만 사용 (SSE 없음).
import axios from 'axios'

const evalAxios = axios.create({
  baseURL: '/api/eval',
  xsrfHeaderName: 'X-CSRFToken',
  xsrfCookieName: 'csrftoken'
})

function unwrap (p) {
  return p.then(r => r.data).catch(err => {
    if (err.response && err.response.data) throw err.response.data
    throw err
  })
}

// Export URL 생성: 가중치 (examWeights) / 그룹만점 (groupScaleMax) 을 JSON query 로 첨부.
// backend 는 ?weights=...&scales=... 를 받아 환산 컬럼 생성에 사용한다.
function exportQuery (fmt, opts) {
  const params = new URLSearchParams()
  params.set('format', fmt)
  if (opts && opts.weights && Object.keys(opts.weights).length) {
    params.set('weights', JSON.stringify(opts.weights))
  }
  if (opts && opts.scales && Object.keys(opts.scales).length) {
    params.set('scales', JSON.stringify(opts.scales))
  }
  if (opts && opts.useQual && Object.keys(opts.useQual).length) {
    params.set('use_qual', JSON.stringify(opts.useQual))
  }
  // order: {group_key: [user_id...]} — 화면 표 정렬 순서. active_group: 종합 시트 정렬 기준 그룹.
  if (opts && opts.order && Object.keys(opts.order).length) {
    params.set('order', JSON.stringify(opts.order))
  }
  if (opts && opts.activeGroup) {
    params.set('active_group', opts.activeGroup)
  }
  return params.toString()
}

export default {
  listYears: () => unwrap(evalAxios.get('/years')),
  listSemesters: (year) => unwrap(evalAxios.get(`/years/${year}/semesters`)),
  listLectures: (year, sem) => unwrap(evalAxios.get(`/years/${year}/semesters/${sem}/lectures`)),
  getLecture: (lectureId) => unwrap(evalAxios.get(`/lectures/${lectureId}`)),
  listContests: (lectureId) => unwrap(evalAxios.get(`/lectures/${lectureId}/contests`)),
  getScoreboard: (contestId) => unwrap(evalAxios.get(`/contests/${contestId}/scoreboard`)),
  getCellDetail: (contestId, userId, problemId) =>
    unwrap(evalAxios.get(`/contests/${contestId}/students/${userId}/problems/${problemId}`)),
  getEvalStatus: (contestId) => unwrap(evalAxios.get(`/contests/${contestId}/eval-status`)),
  getQueue: () => unwrap(evalAxios.get('/queue')),
  getJob: (jobId) => unwrap(evalAxios.get(`/jobs/${jobId}`)),
  triggerEval: (contestId, force, mode) => {
    // mode 가 명시되면 우선 (pending|all|failed). 미지정 시 force boolean 으로 폴백.
    const body = mode ? { mode } : { force: !!force }
    return unwrap(evalAxios.post(`/contests/${contestId}/qualitative-eval`, body))
  },
  cancelJob: (jobId) => unwrap(evalAxios.post(`/jobs/${jobId}/cancel`)),
  contestExportUrl: (contestId, fmt, opts) =>
    `/api/eval/contests/${contestId}/score_export?${exportQuery(fmt, opts)}`,
  lectureExportUrl: (lectureId, fmt, opts) =>
    `/api/eval/lectures/${lectureId}/score_export?${exportQuery(fmt, opts)}`
}
