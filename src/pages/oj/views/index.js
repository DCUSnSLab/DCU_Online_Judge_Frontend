import ProblemList from './problem/ProblemList.vue'
import Logout from './user/Logout.vue'
import Login_ from './user/Login_.vue'
import UserHome from './user/UserHome.vue'
import About from './help/About.vue'
import FAQ from './help/FAQ.vue'
import NotFound from './general/404.vue'
import Home from './general/Home.vue'
import Announcements from './general/Announcements.vue'
import Container from './container/Container.vue'

// Grouping Components in the Same Chunk
const SubmissionList = () => import(/* webpackChunkName: "submission" */ '@oj/views/submission/SubmissionList.vue')
const SubmissionDetails = () => import(/* webpackChunkName: "submission" */ '@oj/views/submission/SubmissionDetails.vue')

const ACMRank = () => import(/* webpackChunkName: "userRank" */ '@oj/views/rank/ACMRank.vue')
const OIRank = () => import(/* webpackChunkName: "userRank" */ '@oj/views/rank/OIRank.vue')

const ApplyResetPassword = () => import(/* webpackChunkName: "password" */ '@oj/views/user/ApplyResetPassword.vue')
const ResetPassword = () => import(/* webpackChunkName: "password" */ '@oj/views/user/ResetPassword.vue')

const Problem = () => import(/* webpackChunkName: "Problem" */ '@oj/views/problem/Problem.vue')
const ProblemQnA = () => import(/* webpackChunkName: "Problem" */ '@oj/views/qna/ProblemQnAList.vue')
const ProblemQnADetail = () => import(/* webpackChunkName: "Problem" */ '@oj/views/qna/ProblemQnADetail.vue')

const LectureContestExit = () => import(/* webpackChunkName: "submission" */ '@oj/views/lecture/LectureContestExit.vue')  // working by soojung

export {
  Home, NotFound, Announcements,
  Login_, Logout, UserHome, About, FAQ, Container,
  ProblemList, Problem,
  ACMRank, OIRank,
  SubmissionList, SubmissionDetails, LectureContestExit,
  ApplyResetPassword, ResetPassword, ProblemQnA, ProblemQnADetail
}
/* 组件导出分为两类, 一类常用的直接导出，另一类诸如Login, Logout等用懒加载,懒加载不在此处导出
 *   在对应的route内加载
 *   见https://router.vuejs.org/en/advanced/lazy-loading.html
 */
