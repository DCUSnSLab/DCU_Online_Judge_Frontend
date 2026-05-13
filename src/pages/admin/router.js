import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ---------- Auth ----------
  {
    path: '/login',
    name: 'admin-login',
    component: () => import('./views/general/Login.vue'),
    meta: { plain: true }
  },

  // ---------- General ----------
  {
    path: '/',
    name: 'dashboard',
    component: () => import('./views/general/Dashboard.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/announcement',
    name: 'announcement',
    component: () => import('./views/general/Announcement.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/:contestId/announcement',
    name: 'contest-announcement',
    component: () => import('./views/general/Announcement.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/user',
    name: 'user',
    component: () => import('./views/general/User.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/student',
    name: 'student-list',
    component: () => import('./views/general/User.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/conf',
    name: 'conf',
    component: () => import('./views/general/Conf.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/judge-server',
    name: 'judge-server',
    component: () => import('./views/general/JudgeServer.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/llm-keys',
    name: 'llm-keys',
    component: () => import('./views/general/LLMKeys.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/prune-test-case',
    name: 'prune-test-case',
    component: () => import('./views/general/PruneTestCase.vue'),
    meta: { requiresAdmin: true }
  },

  // ---------- Problem ----------
  {
    path: '/problems',
    name: 'problem-list',
    component: () => import('./views/problem/ProblemList.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/problem/create',
    name: 'create-problem',
    component: () => import('./views/problem/Problem.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/problem/edit/:problemId',
    name: 'edit-problem',
    component: () => import('./views/problem/Problem.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/problem/batch_ops',
    name: 'problem-batch-ops',
    component: () => import('./views/problem/ImportAndExport.vue'),
    meta: { requiresAdmin: true }
  },

  // ---------- Contest ----------
  {
    path: '/contest',
    name: 'contest-list',
    component: () => import('./views/contest/ContestList.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/create',
    name: 'create-contest',
    component: () => import('./views/contest/Contest.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/:contestId/edit',
    name: 'edit-contest',
    component: () => import('./views/contest/Contest.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/:contestId/problems',
    name: 'contest-problem-list',
    component: () => import('./views/problem/ProblemList.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/:contestId/problem/create',
    name: 'create-contest-problem',
    component: () => import('./views/problem/Problem.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/:contestId/problem/:problemId/edit',
    name: 'edit-contest-problem',
    component: () => import('./views/problem/Problem.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/:contestId/problems/copykiller',
    name: 'copy-killer',
    component: () => import('./views/problem/CopyKiller.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/contest/:contestId/students',
    name: 'contest-student-list',
    component: () => import('./views/lecture/StudentList.vue'),
    meta: { requiresAdmin: true }
  },

  // ---------- Lecture ----------
  {
    path: '/lecture',
    name: 'lecture-list',
    component: () => import('./views/lecture/LectureList.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/lecture/create',
    name: 'create-lecture',
    component: () => import('./views/lecture/Lecture.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/lecture/:lectureId/edit',
    name: 'edit-lecture',
    component: () => import('./views/lecture/Lecture.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/lecture/:lectureId/contests',
    name: 'lecture-contest-list',
    component: () => import('./views/contest/ContestList.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/lecture/:lectureId/contests/create',
    name: 'create-lecture-contest',
    component: () => import('./views/contest/Contest.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/lecture/:lectureId/students',
    name: 'lecture-student-list',
    component: () => import('./views/lecture/StudentList.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/lecture/batch-migrate',
    name: 'batch-migrate',
    component: () => import('./views/lecture/BatchMigrate.vue'),
    meta: { requiresAdmin: true, requireSuperAdmin: true }
  },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export default router
