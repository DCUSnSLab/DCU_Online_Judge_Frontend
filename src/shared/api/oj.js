import http from './http'

// ===== Misc / config =====
export function getWebsiteConfig() {
  return http.get('website', { silent: true }).then((r) => r.data)
}
export function getLanguages() {
  return http.get('languages').then((r) => r.data)
}
export function getCaptcha() {
  return http.get('captcha', { silent: true }).then((r) => r.data)
}
export function getAnnouncements(params = {}, { silent = false } = {}) {
  return http.get('announcement', { params, silent }).then((r) => r.data)
}

// ===== Problem =====
export function getProblemList(offset, limit, search = {}) {
  const params = { offset, limit }
  for (const k of Object.keys(search)) {
    if (search[k]) params[k] = search[k]
  }
  return http.get('problem', { params }).then((r) => r.data)
}
export function getProblem(problemID) {
  return http.get('problem', { params: { problem_id: problemID } }).then((r) => r.data)
}
export function pickone() {
  return http.get('pickone').then((r) => r.data)
}
export function getProblemTagList() {
  return http.get('problem/tags', { silent: true }).then((r) => r.data)
}

// ===== Submission =====
export function submitCode(data) {
  return http.post('submission', data).then((r) => r.data)
}
export function checkSubmissionLog(params) {
  return http.get('submission', { params, silent: true }).then((r) => r.data)
}
export function getSubmissionList(params = {}, { silent = false } = {}) {
  return http.get('submissions', { params, silent }).then((r) => r.data)
}
export function getContestSubmissionList(offset, limit, params = {}) {
  return http
    .get('contest_submissions', { params: { offset, limit, ...params } })
    .then((r) => r.data)
}
export function getSubmission(id) {
  return http.get('submission', { params: { id } }).then((r) => r.data)
}
export function submissionRejudge(id) {
  return http.get('admin/submission/rejudge', { params: { id } }).then((r) => r.data)
}

// ===== Rank =====
export function getUserRank(offset, limit, rule = 'acm') {
  return http.get('user_rank', { params: { offset, limit, rule } }).then((r) => r.data)
}
export function getContestRank(params = {}) {
  return http.get('contest_rank', { params, silent: true }).then((r) => r.data)
}

// ===== Contest =====
export function getContestList(params = {}, { silent = false } = {}) {
  return http.get('contests', { params, silent }).then((r) => r.data)
}
export function getContest(id) {
  return http.get('contest', { params: { id } }).then((r) => r.data)
}
export function getContestAccess(contestID) {
  return http
    .get('contest/access', { params: { contest_id: contestID }, silent: true })
    .then((r) => r.data)
}
export function checkContestPassword(contestID, password) {
  return http
    .post('contest/password', { contest_id: contestID, password })
    .then((r) => r.data)
}
export function getContestAnnouncementList(contestId) {
  return http
    .get('contest/announcement', { params: { contest_id: contestId } })
    .then((r) => r.data)
}
export function getContestProblemList(contestId) {
  return http
    .get('contest/problem', { params: { contest_id: contestId } })
    .then((r) => r.data)
}
export function getContestProblem(problemID, contestID) {
  return http
    .get('contest/problem', { params: { problem_id: problemID, contest_id: contestID } })
    .then((r) => r.data)
}
export function getACMACInfo(params = {}) {
  return http.get('admin/contest/acm_helper', { params, silent: true }).then((r) => r.data)
}
export function getContestExit(contestId) {
  return http.get('contest/exit', { params: { contest_id: contestId } }).then((r) => r.data)
}
export function exitStudent(data) {
  return http.post('contest/exit_student', data).then((r) => r.data)
}

// ===== Lecture =====
export function getTakingLectures(params = {}) {
  return http.get('takinglec', { params }).then((r) => r.data)
}
export function getOpenLectures(params = {}) {
  return http.get('lectures', { params }).then((r) => r.data)
}
export function getLecture(id) {
  return http.get('lecture', { params: { id } }).then((r) => r.data)
}
export function getUserProgress(params = {}) {
  return http.get('userprogress', { params, silent: true }).then((r) => r.data)
}
export function applyLecture(data) {
  return http.post('lectureapply', data).then((r) => r.data)
}

// ===== User profile / sessions =====
export function getUserInfo(username) {
  return http.get('profile', { params: username ? { username } : {} }).then((r) => r.data)
}
export function updateProfile(profile) {
  return http.put('profile', profile).then((r) => r.data)
}
export function freshDisplayID(userID) {
  return http
    .get('profile/fresh_display_id', { params: { user_id: userID } })
    .then((r) => r.data)
}
export function getSessions() {
  return http.get('sessions').then((r) => r.data)
}
export function deleteSession(sessionKey) {
  return http
    .delete('sessions', { params: { session_key: sessionKey } })
    .then((r) => r.data)
}
export function changePassword(data) {
  return http.post('change_password', data).then((r) => r.data)
}
export function changeEmail(data) {
  return http.post('change_email', data).then((r) => r.data)
}
export function twoFactorAuth(method, data) {
  return http({ url: 'two_factor_auth', method, data }).then((r) => r.data)
}

// ===== Q&A =====
export function getQnAPost(params = {}) {
  return http.get('question', { params }).then((r) => r.data)
}
export function getQnAPostDetail(params = {}) {
  return http.get('question_detail', { params }).then((r) => r.data)
}
export function writeQnAPost(data) {
  return http.post('question', data).then((r) => r.data)
}
export function deletePost(questionID) {
  return http.delete('question', { params: { id: questionID } }).then((r) => r.data)
}
export function solvedQuestion(data) {
  return http.put('question_solved', data).then((r) => r.data)
}
export function getQnACommentList(params = {}) {
  return http.get('question_comment', { params }).then((r) => r.data)
}
export function writeComment(data) {
  return http.post('question_comment', data).then((r) => r.data)
}
export function deleteComment(id) {
  return http.delete('question_comment', { params: { id } }).then((r) => r.data)
}

// ===== LLM Chat =====
export function getLLMChatSessions() {
  return http.get('llm/chat/sessions').then((r) => r.data)
}
export function createLLMChatSession(data) {
  return http.post('llm/chat/sessions', data).then((r) => r.data)
}
export function updateLLMChatSession(data) {
  return http.put('llm/chat/sessions', data).then((r) => r.data)
}
export function deleteLLMChatSession(id) {
  return http.delete('llm/chat/sessions', { params: { id } }).then((r) => r.data)
}
export function getLLMChatMessages(sessionId, offset = 0, limit = 100) {
  return http
    .get('llm/chat/messages', { params: { session_id: sessionId, offset, limit } })
    .then((r) => r.data)
}

// ===== Misc =====
export function checkUsernameOrEmail(username, email, schoolssn) {
  return http
    .post('check_username_or_email', { username, email, schoolssn })
    .then((r) => r.data)
}
