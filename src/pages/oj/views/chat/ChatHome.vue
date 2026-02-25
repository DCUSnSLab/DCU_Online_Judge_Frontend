<template>
  <div class="llm-chat-page">
    <aside class="chat-sidebar">
      <div class="sidebar-head">
        <Button type="primary" long @click="createSession">새 채팅</Button>
      </div>
      <div class="session-list">
        <button
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === activeSessionId }"
          @click="selectSession(session.id)">
          <div class="session-title">{{ session.title || '제목 없음' }}</div>
          <div class="session-time">{{ formatTime(session.updated_at) }}</div>
        </button>
      </div>
    </aside>

    <section class="chat-main">
      <header class="chat-top">
        <h2>{{ activeSession ? activeSession.title : '새 채팅' }}</h2>
      </header>

      <main ref="chatScroll" class="chat-scroll">
        <div v-if="!activeMessages.length" class="empty-state">
          <h3>무엇을 도와드릴까요?</h3>
          <p>코딩, 아키텍처, 디버깅 관련 질문을 입력해보세요.</p>
        </div>

        <article
          v-for="msg in activeMessages"
          :key="msg.id"
          class="msg-row"
          :class="msg.role === 'user' ? 'msg-user' : 'msg-assistant'">
          <div class="msg-card">
            <div class="msg-role">{{ msg.role === 'user' ? '나' : 'AI' }}</div>
            <div class="msg-content" v-html="renderMarkdown(msg.content)"></div>
          </div>
        </article>
      </main>

      <footer class="chat-input-wrap">
        <textarea
          v-model="inputText"
          class="chat-input"
          rows="1"
          placeholder="메시지를 입력하세요..."
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <div class="chat-actions">
          <div>
            <Button v-if="loading" type="warning" ghost @click="stopStreaming">중지</Button>
            <Button type="primary" :loading="loading" @click="sendMessage">보내기</Button>
          </div>
        </div>
      </footer>
    </section>
  </div>
</template>

<script>
import api from '@oj/api'

function nowISO () {
  return new Date().toISOString()
}

function makeId () {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function getCookie (name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return ''
}

export default {
  name: 'ChatHome',
  data () {
    return {
      sessions: [],
      activeSessionId: '',
      activeMessages: [],
      inputText: '',
      loading: false,
      abortController: null
    }
  },
  computed: {
    activeSession () {
      return this.sessions.find(s => s.id === this.activeSessionId) || null
    }
  },
  async mounted () {
    await this.loadSessions()
    if (!this.sessions.length) {
      await this.createSession()
    } else {
      await this.selectSession(this.sessions[0].id)
    }
    this.scrollToBottom()
  },
  methods: {
    async loadSessions () {
      const res = await api.getLLMChatSessions()
      this.sessions = res.data.data || []
      if (this.activeSessionId && !this.sessions.some(s => s.id === this.activeSessionId)) {
        this.activeSessionId = ''
        this.activeMessages = []
      }
    },
    async createSession () {
      const res = await api.createLLMChatSession({
        title: ''
      })
      const session = res.data.data
      this.activeSessionId = session.id
      await this.loadSessions()
      this.activeMessages = []
      this.inputText = ''
      this.$nextTick(this.scrollToBottom)
    },
    async selectSession (id) {
      if (this.loading) return
      this.activeSessionId = id
      await this.loadMessages(id)
      this.$nextTick(this.scrollToBottom)
    },
    async loadMessages (sessionId) {
      if (!sessionId) {
        this.activeMessages = []
        return
      }
      const res = await api.getLLMChatMessages(sessionId, 0, 200)
      this.activeMessages = (res.data.data && res.data.data.results) || []
    },
    formatTime (iso) {
      if (!iso) return ''
      const d = new Date(iso)
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    async sendMessage () {
      const content = this.inputText.trim()
      if (!content || this.loading) return
      if (!this.activeSessionId) {
        await this.createSession()
      }
      if (!this.activeSessionId) return

      const userMsg = { id: makeId(), role: 'user', content, createdAt: nowISO() }
      const assistantMsg = { id: makeId(), role: 'assistant', content: '', createdAt: nowISO() }

      this.inputText = ''
      this.loading = true

      this.activeMessages = [...this.activeMessages, userMsg, assistantMsg]

      this.$nextTick(this.scrollToBottom)

      const payload = {
        session_id: this.activeSessionId,
        content,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
      }

      const controller = window.AbortController ? new window.AbortController() : null
      this.abortController = controller

      try {
        const csrfToken = getCookie('csrftoken')
        const response = await fetch('/api/llm/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify(payload),
          signal: controller ? controller.signal : undefined
        })

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let full = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const raw of lines) {
            const line = raw.trim()
            if (!line || !line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (data === '[DONE]') continue
            try {
              const chunk = JSON.parse(data)
              const delta = chunk.choices && chunk.choices[0] && chunk.choices[0].delta
              if (delta && delta.content) {
                full += delta.content
                this.patchLastAssistant(full)
              }
            } catch (e) {
              // ignore partial chunks
            }
          }
        }

        if (!full) {
          this.patchLastAssistant('응답이 생성되지 않았습니다. 다시 시도해주세요.')
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          this.patchLastAssistant('(중지됨)')
        } else {
          this.patchLastAssistant('LLM 서비스에 연결하지 못했습니다.')
        }
      } finally {
        this.loading = false
        this.abortController = null
        await this.loadSessions()
        this.$nextTick(this.scrollToBottom)
      }
    },
    stopStreaming () {
      if (this.abortController) {
        this.abortController.abort()
      }
    },
    patchLastAssistant (content) {
      const idx = this.activeMessages.length - 1
      if (idx >= 0 && this.activeMessages[idx].role === 'assistant') {
        this.$set(this.activeMessages, idx, {
          ...this.activeMessages[idx],
          content
        })
      } else {
        this.activeMessages.push({
          id: makeId(),
          role: 'assistant',
          content,
          createdAt: nowISO()
        })
      }
    },
    renderMarkdown (text) {
      if (!text) return ''
      const escapeHtml = (str) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

      let result = text
      result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
        const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ''
        return `<div class="md-code">${label}<pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`
      })
      result = result.replace(/`([^`]+)`/g, '<code class="md-inline">$1</code>')
      result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      result = result.replace(/\n/g, '<br>')
      return result
    },
    scrollToBottom () {
      const el = this.$refs.chatScroll
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    },
    async deleteCurrentSession () {
      if (this.loading || !this.activeSessionId) return
      await api.deleteLLMChatSession(this.activeSessionId)
      this.activeSessionId = ''
      this.activeMessages = []
      await this.loadSessions()
      if (this.sessions.length) {
        await this.selectSession(this.sessions[0].id)
      } else {
        await this.createSession()
      }
    }
  }
}
</script>

<style lang="less" scoped>
.llm-chat-page {
  display: flex;
  gap: 14px;
  height: calc(100vh - 140px);
  min-height: 580px;
}

.chat-sidebar {
  width: 260px;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--panelBackground);
  display: flex;
  flex-direction: column;
}

.sidebar-head {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.session-list {
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  width: 100%;
  text-align: left;
  background: var(--table-body-background);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: pointer;
}

.session-item.active {
  border-color: var(--text-hover-color);
  box-shadow: 0 0 0 1px var(--text-hover-color) inset;
}

.session-title {
  color: var(--text-color);
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  margin-top: 4px;
  color: var(--qna-text-color);
  opacity: 0.8;
  font-size: 11px;
}

.chat-main {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--panelBackground);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-top {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
}

.chat-top h2 {
  margin: 0;
  font-size: 16px;
  color: var(--text-color);
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--background-color2);
}

.empty-state {
  max-width: 520px;
  margin: 72px auto;
  text-align: center;
  color: var(--qna-text-color);
}

.empty-state h3 {
  color: var(--text-color);
  margin-bottom: 10px;
}

.msg-row {
  display: flex;
  margin-bottom: 14px;
}

.msg-user {
  justify-content: flex-end;
}

.msg-assistant {
  justify-content: flex-start;
}

.msg-card {
  width: 84%;
  max-width: 820px;
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  background: var(--table-body-background);
}

.msg-user .msg-card {
  border-color: var(--text-hover-color);
  box-shadow: 0 0 0 1px rgba(45, 140, 240, 0.12) inset;
}

.msg-role {
  font-size: 11px;
  color: var(--qna-text-color);
  opacity: 0.85;
  margin-bottom: 6px;
}

.msg-content {
  color: var(--text-color);
  line-height: 1.65;
  word-break: break-word;
}

.chat-input-wrap {
  border-top: 1px solid var(--border-color);
  padding: 12px;
  background: var(--panelBackground);
}

.chat-input {
  width: 100%;
  min-height: 52px;
  max-height: 180px;
  border: 1px solid var(--search-box-border-color);
  background: var(--search-box-color);
  color: var(--text-color);
  border-radius: 10px;
  padding: 10px 12px;
  resize: vertical;
  outline: none;
  font: inherit;
}

.chat-input::placeholder {
  color: var(--qna-text-color);
  opacity: 0.7;
}

.chat-input:focus {
  border-color: var(--text-hover-color);
}

.chat-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.md-inline {
  background: var(--problem-example-box-color);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--text-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.md-code {
  margin: 8px 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: #0f172a;
}

.code-lang {
  display: block;
  font-size: 11px;
  color: var(--text-hover-color);
  background: #111827;
  padding: 4px 8px;
}

.md-code pre {
  margin: 0;
  padding: 10px;
  overflow-x: auto;
}

.md-code code {
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}

@media (max-width: 900px) {
  .llm-chat-page {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 140px);
  }

  .chat-sidebar {
    width: 100%;
    max-height: 220px;
  }

  .msg-card {
    max-width: 96%;
  }
}
</style>
