import Vue from 'vue'
import store from '@/store'
import axios from 'axios'

Vue.prototype.$http = axios
axios.defaults.baseURL = '/api'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

export default {
  getlectureid (data) {
    return ajax('lecture', 'post', {
      data
    })
  },
  getAIhelperflag (data) {
    return ajax('lecture/aihelperflag', 'post', {
      data
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
  checkContestExit (contestId) {    // working by soojung
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
    let params = {paging: true, offset, limit}
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
    var {params = {}, data = {}} = options
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
        // 若后端返回为登录，则为session失效，应退出当前登录用户
        if (res.data.data.startsWith('Please login')) {
          store.dispatch('changeModalStatus', {'mode': 'login', 'visible': true})
        }
      } else {
        resolve(res)
        // if (method !== 'get') {
        //   Vue.prototype.$success('Succeeded')
        // }
      }
    }, res => {
      // API请求异常，一般为Server error 或 network error
      reject(res)
      Vue.prototype.$error(res.data.data)
    })
  })
}
