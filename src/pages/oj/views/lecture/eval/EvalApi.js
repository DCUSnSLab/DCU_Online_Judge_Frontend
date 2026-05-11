// Eval API client.
// PR 4: 사이드카 /eval-api → 본 서버 /api/eval 으로 전환. SSE 제거 (폴링 only).
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
  triggerEval: (contestId, force) =>
    unwrap(evalAxios.post(`/contests/${contestId}/qualitative-eval`, { force: !!force })),
  // Export 는 브라우저가 직접 GET (세션 쿠키 자동) — URL 만 제공
  contestExportUrl: (contestId, fmt) => `/api/eval/contests/${contestId}/score_export?format=${fmt}`,
  lectureExportUrl: (lectureId, fmt) => `/api/eval/lectures/${lectureId}/score_export?format=${fmt}`
}
