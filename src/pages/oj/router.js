import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ---------- General ----------
  { path: '/', name: 'home', component: () => import('./views/general/Home.vue') },
  { path: '/about', name: 'about', component: () => import('./views/help/About.vue') },
  { path: '/faq', name: 'faq', component: () => import('./views/help/FAQ.vue') },
  { path: '/404', name: 'not-found', component: () => import('./views/general/NotFound.vue') },

  // ---------- Auth ----------
  { path: '/login', name: 'login', component: () => import('./views/user/Login.vue') },
  { path: '/logout', name: 'logout', component: () => import('./views/user/Logout.vue') },
  { path: '/register', name: 'register', component: () => import('./views/user/Register.vue') },
  { path: '/apply-reset-password', name: 'apply-reset-password', component: () => import('./views/user/ApplyResetPassword.vue') },
  { path: '/reset-password/:token', name: 'reset-password', component: () => import('./views/user/ResetPassword.vue') },
  { path: '/user-home', name: 'user-home', component: () => import('./views/user/UserHome.vue') },

  // ---------- Settings ----------
  {
    path: '/setting',
    component: () => import('./views/setting/Settings.vue'),
    children: [
      { path: '', name: 'default-setting', redirect: '/setting/profile' },
      { path: 'profile', name: 'profile-setting', component: () => import('./views/setting/children/ProfileSetting.vue') },
      { path: 'account', name: 'account-setting', component: () => import('./views/setting/children/AccountSetting.vue') },
      { path: 'security', name: 'security-setting', component: () => import('./views/setting/children/SecuritySetting.vue') }
    ]
  },

  // ---------- Problem & Submission ----------
  { path: '/problem', name: 'problem-list', component: () => import('./views/problem/ProblemList.vue') },
  { path: '/problem/:problemID', name: 'problem-details', component: () => import('./views/problem/Problem.vue') },
  { path: '/status', name: 'submission-list', component: () => import('./views/submission/SubmissionList.vue') },
  { path: '/status/:id', name: 'submission-details', component: () => import('./views/submission/SubmissionDetails.vue') },

  // ---------- Rank ----------
  { path: '/acm-rank', name: 'acm-rank', component: () => import('./views/rank/ACMRank.vue') },
  { path: '/oi-rank', name: 'oi-rank', component: () => import('./views/rank/ACMRank.vue') },

  // ---------- Contest ----------
  { path: '/contest', name: 'contest-list', component: () => import('./views/contest/ContestList.vue') },
  {
    path: '/contest/:contestID',
    component: () => import('./views/contest/ContestDetail.vue'),
    children: [
      { path: '', name: 'contest-details', component: { template: '<div />' } },
      { path: 'problems', name: 'contest-problem-list', component: () => import('./views/contest/children/ContestProblemList.vue') },
      { path: 'problem/:problemID', name: 'contest-problem-details', component: () => import('./views/problem/Problem.vue') },
      { path: 'submissions', name: 'contest-submission-list', component: () => import('./views/submission/SubmissionList.vue') },
      { path: 'rank', name: 'contest-rank', component: () => import('./views/contest/children/ContestRank.vue') },
      { path: 'announcements', name: 'contest-announcement-list', component: () => import('./views/general/Announcements.vue') },
      { path: 'helper', name: 'acm-helper', component: () => import('./views/contest/children/ACMHelper.vue') },
      { path: 'question', name: 'contest-qna', component: () => import('./views/qna/ProblemQnAList.vue') },
      { path: 'question/:questionID', name: 'contest-qna-detail', component: () => import('./views/qna/ProblemQnADetail.vue') }
    ]
  },

  // ---------- Lecture (수강과목 통합) ----------
  { path: '/CourseList', name: 'course-list', component: () => import('./views/lecture/CourseList.vue') },
  { path: '/lecture', redirect: { path: '/CourseList', query: { tab: 'open' } } },
  { path: '/CourseList/:lectureID/', name: 'lecture-details', component: () => import('./views/lecture/LectureDetail.vue') },
  {
    path: '/CourseList/:lectureID/:contestID',
    component: () => import('./views/lecture/LectureContestDetail.vue'),
    children: [
      { path: '', name: 'lecture-contest-details', component: { template: '<div />' } },
      { path: 'problems', name: 'lecture-contest-problem-list', component: () => import('./views/contest/children/ContestProblemList.vue') },
      { path: 'problem/:problemID', name: 'lecture-contest-problem-details', component: () => import('./views/problem/Problem.vue') },
      { path: 'submissions', name: 'lecture-contest-submission-list', component: () => import('./views/submission/SubmissionList.vue') },
      { path: 'rank', name: 'lecture-contest-rank', component: () => import('./views/contest/children/ContestRank.vue') },
      { path: 'announcements', name: 'lecture-contest-announcement-list', component: () => import('./views/general/Announcements.vue') },
      { path: 'helper', name: 'lecture-acm-helper', component: () => import('./views/contest/children/ACMHelper.vue') },
      { path: 'question', name: 'lecture-contest-qna', component: () => import('./views/qna/ProblemQnAList.vue') },
      { path: 'question/:questionID', name: 'lecture-contest-qna-detail', component: () => import('./views/qna/ProblemQnADetail.vue') },
      { path: 'exit', name: 'lecture-contest-exit', component: () => import('./views/lecture/LectureContestExit.vue') }
    ]
  },

  // ---------- Q&A / Chat / Container ----------
  { path: '/question', name: 'problem-qna-list', component: () => import('./views/qna/ProblemQnAList.vue') },
  { path: '/question/:questionID', name: 'problem-qna-detail', component: () => import('./views/qna/ProblemQnADetail.vue') },
  { path: '/chat', name: 'llm-chat', component: () => import('./views/chat/ChatHome.vue') },
  { path: '/container', name: 'container', component: () => import('./views/container/Container.vue') },

  // ---------- Misc ----------
  { path: '/demo', name: 'demo', component: () => import('./views/Demo.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export default router
