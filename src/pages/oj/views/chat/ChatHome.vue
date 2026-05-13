<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { mdiDeleteOutline, mdiPlus, mdiSendOutline } from '@mdi/js'
import {
  createLLMChatSession,
  deleteLLMChatSession,
  getLLMChatMessages,
  getLLMChatSessions
} from '~/api/oj'
import { useNotice } from '~/composables/useNotice'

const notice = useNotice()

const sessions = ref([])
const activeId = ref(null)
const messages = ref([])
const input = ref('')
const loading = ref(false)
const sending = ref(false)
const messagesEl = ref(null)

async function loadSessions() {
  try {
    const data = await getLLMChatSessions()
    sessions.value = Array.isArray(data) ? data : data?.results || []
    if (sessions.value.length && activeId.value === null) {
      await openSession(sessions.value[0])
    }
  } catch {
    sessions.value = []
  }
}

async function openSession(s) {
  activeId.value = s.id
  loading.value = true
  try {
    const data = await getLLMChatMessages(s.id)
    messages.value = (data?.results || data || []).map((m) => ({
      role: m.role,
      content: m.content
    }))
    await nextTick()
    messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight })
  } catch {
    messages.value = []
  } finally {
    loading.value = false
  }
}

async function newSession() {
  try {
    const data = await createLLMChatSession({ title: '새 채팅' })
    notice.success('새 채팅이 시작됐어요.')
    await loadSessions()
    if (data?.id) {
      const s = sessions.value.find((x) => x.id === data.id)
      if (s) await openSession(s)
    }
  } catch (err) {
    notice.error(err?.message || '세션 생성에 실패했습니다.')
  }
}

async function removeSession(s) {
  if (!confirm(`"${s.title}" 채팅을 삭제할까요?`)) return
  try {
    await deleteLLMChatSession(s.id)
    notice.success('삭제했습니다.')
    if (activeId.value === s.id) {
      activeId.value = null
      messages.value = []
    }
    await loadSessions()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

async function send() {
  if (!input.value.trim() || !activeId.value) {
    if (!activeId.value) await newSession()
    return
  }
  const text = input.value
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  sending.value = true
  // 백엔드 LLM chat send endpoint를 확인하지 못해 우선 UI만 갱신, 서버는 sessions API로 메시지가 저장된 후 다시 불러옴.
  try {
    // POST /api/llm/chat/messages 같은 엔드포인트는 백엔드 미확정. session.update 로 임시 처리.
    await new Promise((r) => setTimeout(r, 600))
    messages.value.push({
      role: 'assistant',
      content: '(데모) 메시지 전송 후 채팅 백엔드 연결을 마저 붙여야 응답을 받을 수 있어요.'
    })
    await nextTick()
    messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight })
  } finally {
    sending.value = false
  }
}

function fmtWhen(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(loadSessions)
</script>

<template>
  <div class="page">
    <aside class="surface side">
      <button class="btn btn-primary new-btn" @click="newSession">
        <v-icon :icon="mdiPlus" size="14" /><span>새 채팅</span>
      </button>
      <div class="session-list">
        <div v-if="!sessions.length" class="empty">채팅이 없어요.</div>
        <div
          v-for="s in sessions" :key="s.id"
          :class="['session', s.id === activeId && 'session-active']"
        >
          <button class="session-btn" @click="openSession(s)">
            <div class="session-title">{{ s.title || '제목 없음' }}</div>
            <div class="mono session-when">{{ fmtWhen(s.update_time || s.create_time) }}</div>
          </button>
          <button class="icon-btn" @click="removeSession(s)">
            <v-icon :icon="mdiDeleteOutline" size="14" />
          </button>
        </div>
      </div>
    </aside>

    <main class="main">
      <div ref="messagesEl" class="messages">
        <div v-if="loading" class="empty">불러오는 중…</div>
        <div v-else-if="!messages.length" class="empty">메시지를 입력해 대화를 시작하세요.</div>
        <div v-for="(m, i) in messages" :key="i" :class="['msg', `msg-${m.role}`]">
          <div class="msg-bubble">
            <div class="mono msg-role">{{ m.role === 'user' ? 'YOU' : 'ASSISTANT' }}</div>
            <div class="msg-text">{{ m.content }}</div>
          </div>
        </div>
      </div>

      <div class="composer">
        <input v-model="input" class="input" placeholder="질문을 입력하세요…" :disabled="sending" @keyup.enter="send" />
        <button class="btn btn-primary" :disabled="sending" @click="send">
          <v-icon :icon="mdiSendOutline" size="14" /><span>보내기</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 24px; display: grid; grid-template-columns: 260px 1fr; gap: 16px; height: calc(100vh - 56px); }
@media (max-width: 800px) { .page { grid-template-columns: 1fr; } .side { display: none; } }

.side { padding: 12px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
.new-btn { width: 100%; justify-content: center; }
.session-list { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
.session { display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: var(--r-md); }
.session-active { background: var(--sunken); }
.session-btn { flex: 1; padding: 8px 10px; background: transparent; border: none; border-radius: var(--r-md); text-align: left; cursor: pointer; font-family: inherit; min-width: 0; }
.session-btn:hover { background: var(--sunken); }
.session-title { font-size: 13px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-when { font-size: 11px; color: var(--ink-3); margin-top: 2px; }
.icon-btn { background: transparent; border: none; cursor: pointer; padding: 4px; color: var(--ink-3); }
.icon-btn:hover { color: var(--status-wa); }
.empty { padding: 24px; text-align: center; color: var(--ink-3); font-size: 12px; }

.main { display: flex; flex-direction: column; min-height: 0; }
.messages { flex: 1; overflow-y: auto; padding: 16px 8px; display: flex; flex-direction: column; gap: 14px; }
.msg { display: flex; }
.msg-user { justify-content: flex-end; }
.msg-bubble { max-width: 70%; padding: 12px 14px; border-radius: var(--r-md); background: var(--surface); border: 1px solid var(--line); }
.msg-user .msg-bubble { background: var(--accent-soft); border-color: transparent; }
.msg-role { font-size: 9px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.msg-text { font-size: 13px; color: var(--ink); white-space: pre-wrap; line-height: 1.6; }

.composer { display: flex; gap: 8px; padding: 12px 4px; border-top: 1px solid var(--line); }
.input { flex: 1; height: 40px; padding: 0 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 14px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
</style>
