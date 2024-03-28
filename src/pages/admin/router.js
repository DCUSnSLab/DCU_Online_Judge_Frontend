import Vue from 'vue'
import VueRouter from 'vue-router'
// 引入 view 组件
import { Announcement, Conf, Contest, ContestList, Home, JudgeServer, Login,
  Problem, ProblemList, CopyKiller, User, PruneTestCase, Dashboard, ProblemImportOrExport, Lecture, LectureList, StudentList, ContStudentList } from './views'
Vue.use(VueRouter)

export default new VueRouter({
  mode: 'history',
  base: '/admin/',
  scrollBehavior: () => ({y: 0}),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/',
      component: Home,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: '/announcement',
          name: 'announcement',
          component: Announcement
        },
        {
          path: '/user',
          name: 'user',
          component: User
        },
        {
          path: '/conf',
          name: 'conf',
          component: Conf
        },
        {
          path: '/judge-server',
          name: 'judge-server',
          component: JudgeServer
        },
        {
          path: '/prune-test-case',
          name: 'prune-test-case',
          component: PruneTestCase
        },
        {
          path: '/problems',
          name: 'problem-list',
          component: ProblemList
        },
        {
          path: '/problem/create',
          name: 'create-problem',
          component: Problem
        },
        {
          path: '/problem/edit/:problemId',
          name: 'edit-problem',
          component: Problem
        },
        {
          path: '/problem/batch_ops',
          name: 'problem_batch_ops',
          component: ProblemImportOrExport
        },
        {
          path: '/contest/create',
          name: 'create-contest',
          component: Contest
        },
        {
          path: '/lecture/:lectureId/contests/create',
          name: 'create-lecture-contest',
          component: Contest
        },
        {
          path: '/contest',
          name: 'contest-list',
          component: ContestList
        },
        {
          path: '/contest/:contestId/edit',
          name: 'edit-contest',
          component: Contest
        },
        {
          path: '/contest/:contestId/announcement',
          name: 'contest-announcement',
          component: Announcement
        },
        {
          path: '/contest/:contestId/problems',
          name: 'contest-problem-list',
          component: ProblemList
        },
        {
          path: '/contest/:contestId/problems/copykiller',
          name: 'copyKiller',
          component: CopyKiller
        },
        {
          path: '/contest/:contestId/problem/create',
          name: 'create-contest-problem',
          component: Problem
        },
        {
          path: '/contest/:contestId/students',
          name: 'contest-student-list',
          component: ContStudentList
        },
        {
          path: '/contest/:contestId/problem/:problemId/edit',
          name: 'edit-contest-problem',
          component: Problem
        }, // 강의 페이지 경로 명시
        {
          path: '/lecture/create',
          name: 'create-lecture',
          component: Lecture
        },
        {
          path: '/lecture',
          name: 'lecture-list',
          component: LectureList
        },
        {
          path: '/lecture/:lectureId/contests',
          name: 'lecture-contest-list',
          component: ContestList
        },
        {
          path: '/lecture/:lectureId/students',
          name: 'lecture-student-list',
          component: StudentList
        },
        {
          path: '/lecture/:lectureId/edit',
          name: 'edit-lecture',
          component: Lecture
        }, // 강의 페이지 경로 끝
        { // 사용자 페이지 경로 명시
          path: '/student',
          name: 'student-list',
          component: User
        }
      ]
    },
    {
      path: '*', redirect: '/login'
    }
  ]
})
