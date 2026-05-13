import http from './http'

// ============================================================
// Admin API — mirrors legacy DCU_Online_Judge_Frontend/src/pages/admin/api.js
// ============================================================

// ----- Dashboard / system -----

export function getDashboardInfo() {
  return http.get('admin/dashboard_info', { silent: true }).then((r) => r.data)
}

export function getJudgeServers() {
  return http.get('admin/judge_server', { silent: true }).then((r) => r.data)
}

export function updateJudgeServer(data) {
  return http.put('admin/judge_server', data).then((r) => r.data)
}

export function deleteJudgeServer(hostname) {
  return http.delete('admin/judge_server', { params: { hostname } }).then((r) => r.data)
}

// ----- Announcement -----

export function getAnnouncementList(offset, limit) {
  return http
    .get('admin/announcement', { params: { paging: true, offset, limit } })
    .then((r) => r.data)
}

export function getAnnouncement(id) {
  return http.get('admin/announcement', { params: { id } }).then((r) => r.data)
}

export function createAnnouncement(data) {
  return http.post('admin/announcement', data).then((r) => r.data)
}

export function updateAnnouncement(data) {
  return http.put('admin/announcement', data).then((r) => r.data)
}

export function deleteAnnouncement(id) {
  return http.delete('admin/announcement', { params: { id } }).then((r) => r.data)
}

// ----- User -----

export function getUserList(offset, limit, keyword) {
  const params = { paging: true, offset, limit }
  if (keyword) params.keyword = keyword
  return http.get('admin/user', { params }).then((r) => r.data)
}

export function getUser(id) {
  return http.get('admin/user', { params: { id } }).then((r) => r.data)
}

export function editUser(data) {
  return http.put('admin/user', data).then((r) => r.data)
}

export function deleteUsers(ids) {
  return http.delete('admin/user', { params: { id: ids.join(',') } }).then((r) => r.data)
}

export function generateUser(data) {
  return http.post('admin/generate_user', data).then((r) => r.data)
}

// ----- Lecture (admin scope) -----

export function getAdminLectures(params = {}) {
  return http.get('admin/lecture', { params, silent: true }).then((r) => r.data)
}

export function getAdminLecture(id) {
  return http.get('admin/lecture', { params: { id } }).then((r) => r.data)
}

export function createLecture(data) {
  return http.post('admin/lecture', data).then((r) => r.data)
}

export function editLecture(data) {
  return http.put('admin/lecture', data).then((r) => r.data)
}

export function deleteLecture(id) {
  return http.delete('admin/lecture', { params: { id } }).then((r) => r.data)
}

// ----- Contest (admin scope) -----

export function getAdminContests(params = {}) {
  return http.get('admin/contest', { params, silent: true }).then((r) => r.data)
}

export function getAdminContest(id) {
  return http.get('admin/contest', { params: { id } }).then((r) => r.data)
}

export function createContest(data) {
  return http.post('admin/contest', data).then((r) => r.data)
}

export function editContest(data) {
  return http.put('admin/contest', data).then((r) => r.data)
}

export function deleteContest(id) {
  return http.delete('admin/contest', { params: { id } }).then((r) => r.data)
}

// ----- Problem (admin scope) -----

export function getProblemList(params = {}) {
  return http.get('admin/problem', { params, silent: true }).then((r) => r.data)
}

export function getProblem(id) {
  return http.get('admin/problem', { params: { id } }).then((r) => r.data)
}

export function createProblem(data) {
  return http.post('admin/problem', data).then((r) => r.data)
}

export function editProblem(data) {
  return http.put('admin/problem', data).then((r) => r.data)
}

export function deleteProblem(id) {
  return http.delete('admin/problem', { params: { id } }).then((r) => r.data)
}

// Contest problem (contest 자식 라우트에서 사용)
export function getContestProblemList(params = {}) {
  return http.get('admin/contest/problem', { params, silent: true }).then((r) => r.data)
}

export function getContestProblem(id) {
  return http.get('admin/contest/problem', { params: { id } }).then((r) => r.data)
}

export function createContestProblem(data) {
  return http.post('admin/contest/problem', data).then((r) => r.data)
}

export function editContestProblem(data) {
  return http.put('admin/contest/problem', data).then((r) => r.data)
}

export function deleteContestProblem(id) {
  return http.delete('admin/contest/problem', { params: { id } }).then((r) => r.data)
}

// FPS import / export
export function importProblems(data) {
  return http.post('admin/import_problem', data).then((r) => r.data)
}

export function exportProblems(ids) {
  return http.get('admin/export_problem', { params: { problem_id: ids } }).then((r) => r.data)
}

// 표절검사
export function runCopyKiller(data) {
  return http.post('admin/problem/copykiller', data).then((r) => r.data)
}

// Languages / Tags
export function getLanguages() {
  return http.get('languages').then((r) => r.data)
}

export function getProblemTagList() {
  return http.get('problem/tags').then((r) => r.data)
}

// Lecture-scoped user list
export function getLectureUserList(params = {}) {
  return http.get('admin/user', { params: { paging: true, ...params } }).then((r) => r.data)
}

// Batch migrate
export function getBatchMigrateLectures(year, semester) {
  return http
    .get('admin/batchmigrate', { params: { year, semester } })
    .then((r) => r.data)
}

export function batchMigrateLecture(data) {
  return http.put('admin/batchmigrate', data, { silent: true }).then((r) => r.data)
}

export function migrateLecture(data) {
  return http.put('admin/migratelecture', data).then((r) => r.data)
}

// Accept/deny student
export function acceptStudent(data) {
  return http.post('admin/accept_student', data).then((r) => r.data)
}

export function denyStudent(id, lectureid) {
  return http.delete('admin/student', { params: { id, lectureid } }).then((r) => r.data)
}

export function denyContStudent(id, contestId) {
  return http.delete('admin/contest_student', { params: { id, contest_id: contestId } }).then((r) => r.data)
}

// ----- SMTP / Website config -----

export function getSMTPConfig() {
  return http.get('admin/smtp').then((r) => r.data)
}

export function createSMTPConfig(data) {
  return http.post('admin/smtp', data).then((r) => r.data)
}

export function editSMTPConfig(data) {
  return http.put('admin/smtp', data).then((r) => r.data)
}

export function testSMTPConfig(email) {
  return http.post('admin/smtp_test', { email }).then((r) => r.data)
}

export function getAdminWebsiteConfig() {
  return http.get('admin/website').then((r) => r.data)
}

export function editWebsiteConfig(data) {
  return http.post('admin/website', data).then((r) => r.data)
}

// ----- LLM keys / routes -----

export function getLLMKeyList(offset, limit) {
  return http
    .get('admin/llm/keys', { params: { paging: true, offset, limit } })
    .then((r) => r.data)
}

export function createLLMKey(data) {
  return http.post('admin/llm/keys', data).then((r) => r.data)
}

export function revokeLLMKey(id) {
  return http.post('admin/llm/keys/revoke', { id }).then((r) => r.data)
}

export function getLLMGatewayConfig() {
  return http.get('admin/llm/gateway-config').then((r) => r.data)
}

export function saveLLMGatewayConfig(data) {
  return http.post('admin/llm/gateway-config', data).then((r) => r.data)
}

export function getLLMRouteList(offset, limit, modelName) {
  const params = { paging: true, offset, limit }
  if (modelName) params.model_name = modelName
  return http.get('admin/llm/routes', { params }).then((r) => r.data)
}

export function createLLMRoute(data) {
  return http.post('admin/llm/routes', data).then((r) => r.data)
}

export function updateLLMRoute(data) {
  return http.put('admin/llm/routes', data).then((r) => r.data)
}

export function deleteLLMRoute(id) {
  return http.delete('admin/llm/routes', { params: { id } }).then((r) => r.data)
}

// ----- Prune test case -----

export function getInvalidTestCaseList() {
  return http.get('admin/prune_test_case').then((r) => r.data)
}

export function pruneTestCase(id) {
  return http.delete('admin/prune_test_case', { params: { id } }).then((r) => r.data)
}
