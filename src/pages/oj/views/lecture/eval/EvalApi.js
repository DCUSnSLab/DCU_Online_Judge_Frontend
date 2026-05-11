import axios from 'axios'

const evalAxios = axios.create({
  baseURL: '/eval-api',
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
  // SSE는 EventSource 사용 — same-origin('/eval-api/...')이라 세션 쿠키 자동 첨부
  streamJobUrl: (jobId) => `/eval-api/jobs/${jobId}/stream`
}
