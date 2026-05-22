import Vue from 'vue'
import store from '@/store'
import axios from 'axios'

Vue.prototype.$http = axios
axios.defaults.baseURL = '/api'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

// ─── dcu-sso 전환: JWT-only 인증 ───
// 모든 요청에 localStorage 의 access_token 을 Authorization 헤더로 자동 부착.
// Django sessionid 쿠키 의존을 끊기 위함. 세션 인프라는 그대로 — 살릴 때는 이 interceptor 만 제거.
axios.interceptors.request.use(config => {
  const access = localStorage.getItem('access_token')
  if (access) {
    config.headers = config.headers || {}
    config.headers.Authorization = 'Bearer ' + access
  }
  return config
})

// 401 → refresh_token 으로 새 access 발급 후 원 요청 재시도. 실패 시 토큰 폐기.
let _refreshing = null
axios.interceptors.response.use(undefined, async (err) => {
  const orig = err.config || {}
  if (!err.response || err.response.status !== 401 || orig._ssoRetried) {
    return Promise.reject(err)
  }
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return Promise.reject(err)
  try {
    if (!_refreshing) {
      _refreshing = axios.post('token_refresh', { refresh_token: refresh }, { _ssoRetried: true })
        .finally(() => { _refreshing = null })
    }
    const r = await _refreshing
    const newAccess = r.data && r.data.data && r.data.data.access_token
    if (!newAccess) throw new Error('no_access_token_in_refresh_response')
    localStorage.setItem('access_token', newAccess)
    orig._ssoRetried = true
    orig.headers = orig.headers || {}
    orig.headers.Authorization = 'Bearer ' + newAccess
    return axios(orig)
  } catch (e) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return Promise.reject(err)
  }
})

export default {
  getTAList (lecture) {
    return ajax('lecture/talist', 'get', {
      params: {
        lecture_id: lecture
      }
    })
  },
  getLectureScorePermission (lectureId) {
    return ajax('lecture/score_permission', 'get', {
      params: { lecture_id: lectureId }
    })
  },
  getlectureid (data) {
    return ajax('lecture', 'post', {
      data
    })
  },
  tokenRefresh (data) {
    return ajax('token_refresh', 'post', {
      data
    })
  },
  getAIhelperflag (data) {
    return ajax('lecture/aihelperflag', 'post', {
      data
    })
  },
  getLLMChatSessions () {
    return ajax('llm/chat/sessions', 'get')
  },
  createLLMChatSession (data) {
    return ajax('llm/chat/sessions', 'post', {
      data
    })
  },
  updateLLMChatSession (data) {
    return ajax('llm/chat/sessions', 'put', {
      data
    })
  },
  deleteLLMChatSession (id) {
    return ajax('llm/chat/sessions', 'delete', {
      params: { id }
    })
  },
  getLLMChatMessages (sessionId, offset = 0, limit = 100) {
    return ajax('llm/chat/messages', 'get', {
      params: {
        session_id: sessionId,
        offset,
        limit
      }
    })
  },
  deleteComment (id) {
    return ajax('comment', 'delete', {
      params: {
        id
      }
    })
  },
  getQnACommentList (params) {
    return ajax('comment', 'get', {
      params
    })
  },
  writeComment (data) {
    return ajax('comment', 'post', {
      data
    })
  },
  changeQnA2Open (params) {
    return ajax('qapostdetail', 'put', {
      params
    })
  },
  getQnAPostDetail (params) {
    return ajax('qapostdetail', 'get', {
      params
    })
  },
  solvedQuestion (data) {
    return ajax('qapostdetail', 'post', {
      data
    })
  },
  deletePost (questionID) {
    return ajax('qapostdetail', 'delete', {
      params: {
        questionID
      }
    })
  },
  PostListPushSerializer (data) {
    console.log(data)
    return ajax('qapost', 'put', {
      data
    })
  },
  writeQnAPost (data) {
    return ajax('qapost', 'post', {
      data
    })
  },
  getQnAPost (params) {
    return ajax('qapost', 'get', {
      params
    })
  },
  getDashboardinfo (data) {
    return ajax('userprogress', 'get', {
      data
    })
  },
  pushgithub (params) {
    return ajax('githubpush', 'get', {
      params
    })
  },
  askQuAAI (params) {
    return ajax('aihelper', 'get', {
      params
    })
  },
  // askAI (data) {
  //   return ajax('aihelper', 'post', {
  //     data
  //   })
  // },
  // getAIresponse (data) {
  //   return ajax('aihelper', 'get', {
  //     data
  //   })
  // },
  getWebsiteConf (params) {
    return ajax('website', 'get', {
      params
    })
  },
  getAnnouncementList (offset, limit) {
    let params = {
      offset: offset,
      limit: limit
    }
    return ajax('announcement', 'get', {
      params
    })
  },
  getPublicKey () {
    return ajax('get_public_key', 'get')
  },
  login (data) {
    return ajax('login', 'post', {
      data
    })
  },
  checkUsernameOrEmail (username, email, schoolssn) {
    return ajax('check_username_or_email', 'post', {
      data: {
        username,
        email,
        schoolssn
      }
    })
  },
  checkSchoolssn (schoolssn) {
    return ajax('check_schoolssn', 'post', {
      data: {
        schoolssn
      }
    })
  },
  // 注册
  register (data) {
    return ajax('register', 'post', {
      data
    })
  },
  logout () {
    return ajax('logout', 'get')
  },
  getCaptcha () {
    return ajax('captcha', 'get')
  },
  getUserInfo (username = undefined) {
    return ajax('profile', 'get', {
      params: {
        username
      }
    })
  },
  // dcu-sso 통합 (Phase A) — 로그인 버튼 클릭 시 호출.
  // 브라우저를 backend 의 /api/auth/oidc/start 로 직접 이동 → SSO authorize 페이지로 redirect.
  startSsoLogin (next = '/') {
    const url = '/api/auth/oidc/start?next=' + encodeURIComponent(next)
    window.location.href = url
  },
  // 회원가입 버튼 클릭 시 호출. backend 가 SSO /signup 페이지로 302.
  startSsoSignup () {
    window.location.href = '/api/auth/signup'
  },
  updateProfile (profile) {
    return ajax('profile', 'put', {
      data: profile
    })
  },
  freshDisplayID (userID) {
    return ajax('profile/fresh_display_id', 'get', {
      params: {
        user_id: userID
      }
    })
  },
  twoFactorAuth (method, data) {
    return ajax('two_factor_auth', method, {
      data
    })
  },
  tfaRequiredCheck (username) {
    return ajax('tfa_required', 'post', {
      data: {
        username
      }
    })
  },
  getSessions () {
    return ajax('sessions', 'get')
  },
  deleteSession (sessionKey) {
    return ajax('sessions', 'delete', {
      params: {
        session_key: sessionKey
      }
    })
  },
  applyResetPassword (data) {
    return ajax('apply_reset_password', 'post', {
      data
    })
  },
  resetPassword (data) {
    return ajax('reset_password', 'post', {
      data
    })
  },
  changePassword (data) {
    return ajax('change_password', 'post', {
      data
    })
  },
  changeEmail (data) {
    return ajax('change_email', 'post', {
      data
    })
  },
  getLanguages () {
    return ajax('languages', 'get')
  },
  getProblemTagList () {
    return ajax('problem/tags', 'get')
  },
  getProblemList (offset, limit, searchParams) {
    let params = {
      paging: true,
      offset,
      limit
    }
    Object.keys(searchParams).forEach((element) => {
      if (searchParams[element]) {
        params[element] = searchParams[element]
      }
    })
    return ajax('problem', 'get', {
      params: params
    })
  },
  pickone () {
    return ajax('pickone', 'get')
  },
  getProblem (problemID) {
    console.log('call')
    return ajax('problem', 'get', {
      params: {
        problem_id: problemID
      }
    })
  }, // lecture API 시작
  getTakingLectureList (offset, limit, searchParams, yearSort, subjSort, profSort) {
    let params = {
      offset,
      limit,
      searchParams,
      yearSort,
      subjSort,
      profSort
    }
    if (searchParams !== undefined) {
      Object.keys(searchParams).forEach((element) => {
        if (searchParams[element]) {
          params[element] = searchParams[element]
        }
      })
    }
    return ajax('takinglec', 'get', {
      params
    })
  },
  getLectureList (offset, limit, searchParams, sortYear, sortSemester) {
    let params = {
      offset,
      limit,
      sortYear,
      sortSemester
    }
    if (searchParams !== undefined) {
      Object.keys(searchParams).forEach((element) => {
        if (searchParams[element]) {
          params[element] = searchParams[element]
        }
      })
    }
    return ajax('lectures', 'get', {
      params
    })
  },
  getLecture (id) {
    return ajax('lecture', 'get', {
      params: {
        id
      }
    })
  }, // lecture API 끝
  applyLecture (data) {
    return ajax('lectureapply', 'post', {
      data
    })
  },
  getContestList (offset, limit, searchParams) {
    let params = {
      offset,
      limit
    }
    if (searchParams !== undefined) {
      Object.keys(searchParams).forEach((element) => {
        if (searchParams[element]) {
          params[element] = searchParams[element]
        }
      })
    }
    return ajax('contests', 'get', {
      params
    })
  },
  getContest (id) {
    return ajax('contest', 'get', {
      params: {
        id
      }
    })
  },
  getContestAccess (contestID) {
    return ajax('contest/access', 'get', {
      params: {
        contest_id: contestID
      }
    })
  },
  checkContestPassword (contestID, password) {
    return ajax('contest/password', 'post', {
      data: {
        contest_id: contestID,
        password
      }
    })
  },
  getContestAnnouncementList (contestId) {
    return ajax('contest/announcement', 'get', {
      params: {
        contest_id: contestId
      }
    })
  },
  getContestProblemList (contestId) {
    console.log(contestId)
    return ajax('contest/problem', 'get', {
      params: {
        contest_id: contestId
      }
    })
  },
  getContestProblem (problemID, contestID) {
    return ajax('contest/problem', 'get', {
      params: {
        contest_id: contestID,
        problem_id: problemID
      }
    })
  },
  submitCode (data) {
    return ajax('submission', 'post', {
      data
    })
  },
  checkSubmissionLog (params) {
    return ajax('submissionslog', 'get', {
      params
    })
  },
  getSubmissionList (offset, limit, params) {
    params.limit = limit
    params.offset = offset
    return ajax('submissions', 'get', {
      params
    })
  },
  getContestSubmissionList (offset, limit, params) {
    params.limit = limit
    params.offset = offset
    return ajax('contest_submissions', 'get', {
      params
    })
  },
  getSubmission (id) {
    return ajax('submission', 'get', {
      params: {
        id
      }
    })
  },
  submissionExists (problemID, lectureID, contestID) {
    return ajax('submission_exists', 'get', {
      params: {
        problem_id: problemID,
        lecture_id: lectureID,
        contest_id: contestID
      }
    })
  },
  problemResponsible (problemID, lectureID, contestID) {
    return ajax('problemResponsible', 'get', {
      params: {
        problem_id: problemID,
        lecture_id: lectureID,
        contest_id: contestID
      }
    })
  },
  submissionRejudge (id) {
    return ajax('admin/submission/rejudge', 'get', {
      params: {
        id
      }
    })
  },
  updateSubmission (data) {
    return ajax('submission', 'put', {
      data
    })
  },
  getUserRank (offset, limit, rule = 'acm') {
    let params = {
      offset,
      limit,
      rule
    }
    return ajax('user_rank', 'get', {
      params
    })
  },
  getContestRank (params) {
    return ajax('contest_rank', 'get', {
      params
    })
  },
  getACMACInfo (params) {
    return ajax('admin/contest/acm_helper', 'get', {
      params
    })
  },
  updateACInfoCheckedStatus (data) {
    return ajax('admin/contest/acm_helper', 'put', {
      data
    })
  },
  // 수강신청한 학생들에 대한 함수
  acceptStudent (data) {
    return ajax('admin/signupstudent', 'post', {
      data
    })
  },
  getContestExit (contestId) {  // working by soojung
    return ajax('contest/exit', 'get', {
      params: {
        contest_id: contestId
      }
    })
  },
  // getContestTimeOverExit (contestId) {  // working by soojung
  //   return ajax('contest/time_over_exit', 'get', {
  //     params: {
  //       contest_id: contestId
  //     }
  //   })
  // },
  checkContestExitManage (contestId, userId) {    // working by soojung
    return ajax('lecture/contest_exit_manage', 'get', {
      params: {
        contest_id: contestId,
        user_id: userId
      }
    })
  },
  exitStudent (data) {  // working by soojung
    return ajax('contest/exit_student', 'post', {
      data
    })
  },
  checkInContest (data) {
    return ajax('contest/check_in', 'post', {
      data
    })
  },
  checkContestExit (contestId) {
    return ajax('problem/contest_exit_info', 'get', {
      params: {
        contest_id: contestId
      }
    })
  },
  checkContestScore (contestId) {    // working by soojung
    return ajax('contest/score_info', 'get', {
      params: {
        contest_id: contestId
      }
    })
  },
  getLectureUserList (offset, limit, keyword, lectureid, contestid) {  // working by soojung
    let params = { paging: true, offset, limit }
    if (keyword) {
      params.keyword = keyword
    }
    if (lectureid) {
      params.lectureid = lectureid
    }
    if (contestid) {
      params.contestid = contestid
    }
    return ajax('contest/user', 'get', {
      params: params
    })
  },
  logUserEvent (problemID, ruleType, contestID, focusing, copied) {
    return ajax('/user/event_log', 'post', {
      data: {
        problem_id: problemID,
        rule_type: ruleType,
        contest_id: contestID,
        focusing: focusing,
        copied: copied
      }
    })
  }
}

/**
 * @param url
 * @param method get|post|put|delete...
 * @param params like queryString. if a url is index?a=1&b=2, params = {a: '1', b: '2'}
 * @param data post data, use for method put|post
 * @returns {Promise}
 */
function ajax (url, method, options) {
  if (options !== undefined) {
    var { params = {}, data = {} } = options
  } else {
    params = data = {}
  }
  return new Promise((resolve, reject) => {
    axios({
      url,
      method,
      params,
      data
    }).then(res => {
      // API正常返回(status=20x), 是否错误通过有无error判断
      if (res.data.error !== null) {
        Vue.prototype.$error(res.data.data)
        reject(res)
        // dcu-sso 전환: 'Please login' 응답이 와도 자동으로 SSO redirect 하지 않음.
        // 사용자가 명시적으로 '로그인' 버튼을 누르면 그때 SSO 로 이동.
        // (페이지 첫 로드 시 자동 모달이 뜨던 문제 해결)
      } else {
        resolve(res)
        // if (method !== 'get') {
        //   Vue.prototype.$success('Succeeded')
        // }
      }
    }, err => {
      // API请求异常，一般为Server error 或 network error
      reject(err)
      if (err.response && err.response.data && err.response.data.data) {
        Vue.prototype.$error(err.response.data.data)
      } else if (err.response && err.response.data && err.response.data.error) {
        Vue.prototype.$error(err.response.data.error)
      } else {
        Vue.prototype.$error('서버 오류가 발생했습니다.')
      }
    })
  })
}
