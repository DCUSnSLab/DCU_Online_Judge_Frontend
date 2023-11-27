import Vue from 'vue'
import router from './router'
import axios from 'axios'
import utils from '@/utils/utils'

Vue.prototype.$http = axios
axios.defaults.baseURL = '/api'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

export default {
  // 登录
  login (username, password) {
    return ajax('login', 'post', {
      data: {
        username,
        password
      }
    })
  },
  logout () {
    return ajax('logout', 'get')
  },
  getProfile () {
    return ajax('profile', 'get')
  },
  // 获取公告列表
  getAnnouncementList (offset, limit) {
    return ajax('admin/announcement', 'get', {
      params: {
        paging: true,
        offset,
        limit
      }
    })
  },
  // 删除公告
  deleteAnnouncement (id) {
    return ajax('admin/announcement', 'delete', {
      params: {
        id
      }
    })
  },
  // 修改公告
  updateAnnouncement (data) {
    return ajax('admin/announcement', 'put', {
      data
    })
  },
  // 添加公告
  createAnnouncement (data) {
    return ajax('admin/announcement', 'post', {
      data
    })
  },
  getProfessorList () {
    let params = {}
    params.admin_type = 'Admin'
    params.limit = 250
    return ajax('admin/user', 'get', {
      params: params
    })
  },
  getUserList (offset, limit, keyword) {
    let params = {paging: true, offset, limit}
    if (keyword) {
      params.keyword = keyword
    }
    return ajax('admin/user', 'get', {
      params: params
    })
  },
  migrateLecture (data) {
    return ajax('admin/migratelecture', 'put', {
      data
    })
  },
  getLectureUserList (offset, limit, keyword, lectureid) {
    let params = {paging: true, offset, limit}
    if (keyword) {
      params.keyword = keyword
    }
    if (lectureid) {
      params.lectureid = lectureid
    }
    return ajax('admin/user', 'get', {
      params: params
    })
  },
  getContestUserList (offset, limit, keyword, contestid) {
    let params = {paging: true, offset, limit}
    if (keyword) {
      params.keyword = keyword
    }
    console.log(contestid)
    if (contestid) {
      console.log(contestid)
      params.contestid = contestid
    }
    return ajax('admin/user', 'get', {
      params: params
    })
  },
  getPublicContestUserList (offset, limit, contestid) {
    let params = {paging: true, offset, limit, contest_id: contestid}
    return ajax('admin/publicContest', 'get', {
      params: params
    })
  },
  // 获取单个用户信息
  getUser (id) {
    return ajax('admin/user', 'get', {
      params: {
        id
      }
    })
  },
  // 编辑用户
  editUser (data) {
    return ajax('admin/user', 'put', {
      data
    })
  },
  deleteUsers (id) {
    return ajax('admin/user', 'delete', {
      params: {
        id
      }
    })
  },
  importUsers (users) {
    return ajax('admin/user', 'post', {
      data: {
        users
      }
    })
  },
  importStudents (users) {
    return ajax('admin/waitstudent', 'post', {
      data: {
        users
      }
    })
  },
  generateUser (data) {
    return ajax('admin/generate_user', 'post', {
      data
    })
  },
  getLanguages () {
    return ajax('languages', 'get')
  },
  getSMTPConfig () {
    return ajax('admin/smtp', 'get')
  },
  createSMTPConfig (data) {
    return ajax('admin/smtp', 'post', {
      data
    })
  },
  editSMTPConfig (data) {
    return ajax('admin/smtp', 'put', {
      data
    })
  },
  testSMTPConfig (email) {
    return ajax('admin/smtp_test', 'post', {
      data: {
        email
      }
    })
  },
  getWebsiteConfig () {
    return ajax('admin/website', 'get')
  },
  editWebsiteConfig (data) {
    return ajax('admin/website', 'post', {
      data
    })
  },
  getJudgeServer () {
    return ajax('admin/judge_server', 'get')
  },
  deleteJudgeServer (hostname) {
    return ajax('admin/judge_server', 'delete', {
      params: {
        hostname: hostname
      }
    })
  },
  updateJudgeServer (data) {
    return ajax('admin/judge_server', 'put', {
      data
    })
  },
  getInvalidTestCaseList () {
    return ajax('admin/prune_test_case', 'get')
  },
  pruneTestCase (id) {
    return ajax('admin/prune_test_case', 'delete', {
      params: {
        id
      }
    })
  },

  // TA/RA 인원 추가를 위한 함수
  getUserInfo (data) {
    console.log(data)
    console.log('getUserInfo called')
    return ajax('admin/tauser', 'post', {
      data
    })
  },
  getTAUserList (lecture) {
    return ajax('admin/tauser', 'get', {
      params: {
        lecture_id: lecture
      }
    })
  },
  updateTAuserPermit (permit, ssn, lectureID) {
    let params = {permit: permit, ssn: ssn, lecture_id: lectureID}
    console.log(params)
    return ajax('admin/tauser', 'put', {
      params
    })
  },
  deleteTAUser (ssn, lectureID) {
    return ajax('admin/tauser', 'delete', {
      params: {
        ssn: ssn,
        lecture_id: lectureID
      }
    })
  },
  // Contest를 포함하는 강의 테이블 생성을 위한 함수
  createLecture (data) {
    return ajax('admin/lecture', 'post', {
      data
    })
  },
  getLecture (id) {
    return ajax('admin/lecture', 'get', {
      params: {
        id
      }
    })
  },
  editLecture (data) {
    return ajax('admin/lecture', 'put', {
      data
    })
  },
  deleteLecture (id) {
    return ajax('admin/lecture', 'delete', {
      params: {
        id
      }
    })
  },
  getLectureList (offset, limit, keyword) {
    let params = {paging: true, offset, limit}
    if (keyword) {
      params.keyword = keyword
    }
    return ajax('admin/lecture', 'get', {
      params: params
    })
  },
  // 임의 함수 종료
  // 수강신청한 학생들에 대한 함수
  acceptStudent (data) {
    return ajax('admin/signupstudent', 'post', {
      data
    })
  },
  denyContStudent (id, contestId) {
    return ajax('admin/signupstudent', 'delete', {
      params: {
        id,
        contestId
      }
    })
  },
  denyStudent (id, lectureid) {
    return ajax('admin/signupstudent', 'delete', {
      params: {
        id,
        lectureid
      }
    })
  },
  // 수강신청한 학생들에 대한 함수 종료
  getContestAnnouncementList (contestID) {
    return ajax('admin/contest/announcement', 'get', {
      params: {
        contest_id: contestID
      }
    })
  },
  createContestAnnouncement (data) {
    return ajax('admin/contest/announcement', 'post', {
      data
    })
  },
  deleteContestAnnouncement (id) {
    return ajax('admin/contest/announcement', 'delete', {
      params: {
        id
      }
    })
  },
  updateContestAnnouncement (data) {
    return ajax('admin/contest/announcement', 'put', {
      data
    })
  },
  getProblemTagList () {
    return ajax('problem/tags', 'get')
  },
  compileSPJ (data) {
    return ajax('admin/compile_spj', 'post', {
      data
    })
  },
  createContest (data) {
    return ajax('admin/contest', 'post', {
      data
    })
  },
  getContest (id) {
    return ajax('admin/contest', 'get', {
      params: {
        id
      }
    })
  },
  editContest (data) {
    console.log(data)
    return ajax('admin/contest', 'put', {
      data
    })
  },
  deleteContest (id) {
    return ajax('admin/contest', 'delete', {
      params: {
        id
      }
    })
  },
  getContestList (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/contest', 'get', {
      params
    })
  },
  getLectureContestList (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/lecture/contest', 'get', {
      params
    })
  },
  createProblem (data) {
    return ajax('admin/problem', 'post', {
      data
    })
  },
  editProblem (data) {
    return ajax('admin/problem', 'put', {
      data
    })
  },
  deleteProblem (id) {
    return ajax('admin/problem', 'delete', {
      params: {
        id
      }
    })
  },
  getProblem (id) {
    return ajax('admin/problem', 'get', {
      params: {
        id
      }
    })
  },
  getProblemList (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/problem', 'get', {
      params
    })
  },
  getContProblemList (id) {
    console.log(id)
    return ajax('admin/contest/contproblem', 'get', {
      params: {
        id
      }
    })
  },
  copy_killer (keyword, id) {
    return ajax('admin/problem/copykiller', 'post', {
      data: {
        keyword: keyword,
        id: id
      }
    })
  },
  getContestProblemList (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/contest/problem', 'get', {
      params
    })
  },
  getContestProblem (id) {
    return ajax('admin/contest/problem', 'get', {
      params: {
        id
      }
    })
  },
  createContestProblem (data) {
    return ajax('admin/contest/problem', 'post', {
      data
    })
  },
  editContestProblem (data) {
    return ajax('admin/contest/problem', 'put', {
      data
    })
  },
  deleteContestProblem (id) {
    return ajax('admin/contest/problem', 'delete', {
      params: {
        id
      }
    })
  },
  makeContestProblemPublic (data) {
    return ajax('admin/contest_problem/make_public', 'post', {
      data
    })
  },
  addProblemFromPublic (data) {
    return ajax('admin/contest/add_problem_from_public', 'post', {
      data
    })
  },
  addContestFromPublic (data) {
    return ajax('admin/lecture/add_contest_from_public', 'post', {
      data
    })
  },
  addLectureCopy (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/lecture/add_lecture_copy', 'get', {
      params
    })
  },
  LectureCopy (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/lecture/add_lecture_copy', 'post', {
      params
    })
  },
  getReleaseNotes () {
    return ajax('admin/versions', 'get')
  },
  getDashboardInfo () {
    return ajax('admin/dashboard_info', 'get')
  },
  getSessions () {
    return ajax('sessions', 'get')
  },
  exportProblems (data) {
    return ajax('export_problem', 'post', {
      data
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
        // // 若后端返回为登录，则为session失效，应退出当前登录用户
        if (res.data.data.startsWith('Please login')) {
          router.push({name: 'login'})
        }
      } else {
        resolve(res)
        if (method !== 'get') {
          Vue.prototype.$success('Succeeded')
        }
      }
    }, res => {
      // API请求异常，一般为Server error 或 network error
      reject(res)
      Vue.prototype.$error(res.data.data)
    })
  })
}
