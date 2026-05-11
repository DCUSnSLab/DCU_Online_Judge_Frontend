/*
 * 글로벌 정성평가 큐 상태 모듈.
 *
 * eval-dashboard FastAPI 의 GET /eval-api/queue 를 3초 간격으로 폴링해
 * 사이드카가 들고 있는 running[] / pending[] 스냅샷을 Vue 트리 어디서든 조회하게 한다.
 *
 * - observer ref count 로 mount/unmount 시 자동 시작·정지
 * - 비로그인이거나 점수 권한 없는 사용자는 init() 자체가 호출되지 않아 폴링 발생 X
 * - SSE 는 이 모듈을 사용하지 않는다 (포커스된 contest 1개에 한해서만 컴포넌트가 직접 EventSource)
 */
import EvalApi from '@oj/views/lecture/eval/EvalApi'

const POLL_MS = 3000

const state = {
  snapshot: {
    running: [],
    pending: [],
    slots_total: 0,
    slots_in_use: 0,
    queue_size: 0
  },
  lectureTitles: {},
  pollHandle: null,
  observers: 0,
  myUserId: null,
  initialized: false,
  lastError: ''
}

const getters = {
  evalSnapshot: s => s.snapshot,
  evalSlotsTotal: s => s.snapshot.slots_total,
  evalSlotsInUse: s => s.snapshot.slots_in_use,
  evalQueueSize: s => s.snapshot.queue_size,
  evalLectureTitle: s => lectureId => s.lectureTitles[lectureId] || '',
  myRunningJobs: s => {
    if (!s.myUserId) return []
    return s.snapshot.running.filter(j => (j.requester_ids || []).indexOf(s.myUserId) !== -1)
  },
  myPendingJobs: s => {
    if (!s.myUserId) return []
    return s.snapshot.pending.filter(j => (j.requester_ids || []).indexOf(s.myUserId) !== -1)
  },
  jobByContestId: s => contestId => {
    const cid = parseInt(contestId)
    return s.snapshot.running.find(j => j.contest_id === cid) ||
           s.snapshot.pending.find(j => j.contest_id === cid) ||
           null
  },
  isContestActive: (s, g) => contestId => !!g.jobByContestId(contestId),
  myJobsCount: (s, g) => g.myRunningJobs.length + g.myPendingJobs.length
}

const mutations = {
  EVAL_SET_USER (state, userId) {
    state.myUserId = userId
    state.initialized = true
  },
  EVAL_SET_SNAPSHOT (state, snap) {
    state.snapshot = snap
    state.lastError = ''
  },
  EVAL_SET_ERROR (state, msg) {
    state.lastError = msg
  },
  EVAL_SET_LECTURE_TITLE (state, { lectureId, title }) {
    // Vue 2 reactivity: object key add
    const next = Object.assign({}, state.lectureTitles)
    next[lectureId] = title
    state.lectureTitles = next
  },
  EVAL_INC_OBSERVER (state) { state.observers += 1 },
  EVAL_DEC_OBSERVER (state) { state.observers = Math.max(0, state.observers - 1) },
  EVAL_SET_HANDLE (state, h) { state.pollHandle = h }
}

const actions = {
  init ({ state, commit }, userId) {
    if (state.initialized) return
    commit('EVAL_SET_USER', userId || null)
  },
  reset ({ state, commit, dispatch }) {
    if (state.pollHandle) {
      clearInterval(state.pollHandle)
      commit('EVAL_SET_HANDLE', null)
    }
    commit('EVAL_SET_SNAPSHOT', {
      running: [], pending: [], slots_total: 0, slots_in_use: 0, queue_size: 0
    })
    commit('EVAL_SET_USER', null)
    state.initialized = false
  },
  startPolling ({ state, commit, dispatch }) {
    commit('EVAL_INC_OBSERVER')
    if (state.pollHandle || !state.myUserId) return
    dispatch('refreshOnce')
    const h = setInterval(() => { dispatch('refreshOnce') }, POLL_MS)
    commit('EVAL_SET_HANDLE', h)
  },
  stopPolling ({ state, commit }) {
    commit('EVAL_DEC_OBSERVER')
    if (state.observers === 0 && state.pollHandle) {
      clearInterval(state.pollHandle)
      commit('EVAL_SET_HANDLE', null)
    }
  },
  refreshOnce ({ state, commit, dispatch }) {
    if (!state.myUserId) return
    return EvalApi.getQueue().then(snap => {
      commit('EVAL_SET_SNAPSHOT', snap || {
        running: [], pending: [], slots_total: 0, slots_in_use: 0, queue_size: 0
      })
      const need = new Set()
      ;(snap.running || []).forEach(j => need.add(j.lecture_id))
      ;(snap.pending || []).forEach(j => need.add(j.lecture_id))
      need.forEach(lid => {
        if (!state.lectureTitles[lid]) dispatch('fetchLectureTitle', lid)
      })
    }).catch(e => {
      commit('EVAL_SET_ERROR', (e && e.detail) || 'queue fetch failed')
    })
  },
  fetchLectureTitle ({ state, commit }, lectureId) {
    if (!lectureId || state.lectureTitles[lectureId]) return
    return EvalApi.getLecture(lectureId).then(lec => {
      if (lec && lec.title) {
        commit('EVAL_SET_LECTURE_TITLE', { lectureId, title: lec.title })
      }
    }).catch(() => {})
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
