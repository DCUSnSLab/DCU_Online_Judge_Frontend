<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiSendOutline } from '@mdi/js'
import {
  deleteComment,
  getQnACommentList,
  getQnAPostDetail,
  solvedQuestion,
  writeComment
} from '~/api/oj'
import { useNotice } from '~/composables/useNotice'
import { useUserStore } from '~/stores/user'

const route = useRoute()
const router = useRouter()
const notice = useNotice()
const userStore = useUserStore()

const post = ref(null)
const comments = ref([])
const loading = ref(false)
const replyText = ref('')

const questionID = computed(() => route.params.questionID)

async function loadAll() {
  loading.value = true
  try {
    const [p, c] = await Promise.all([
      getQnAPostDetail({ id: questionID.value }),
      getQnACommentList({ question_id: questionID.value })
    ])
    post.value = p
    comments.value = Array.isArray(c) ? c : c?.results || []
  } catch (err) {
    notice.error(err?.message || '질문을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function submitReply() {
  if (!replyText.value.trim()) {
    notice.error('내용을 입력하세요.')
    return
  }
  try {
    await writeComment({ question_id: questionID.value, content: replyText.value })
    replyText.value = ''
    notice.success('답변을 등록했어요.')
    await loadAll()
  } catch (err) {
    notice.error(err?.message || '등록에 실패했습니다.')
  }
}

async function removeComment(id) {
  if (!confirm('이 댓글을 삭제할까요?')) return
  try {
    await deleteComment(id)
    notice.success('삭제했습니다.')
    await loadAll()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

async function markSolved() {
  try {
    await solvedQuestion({ id: questionID.value, solved: true })
    notice.success('해결로 표시했습니다.')
    await loadAll()
  } catch (err) {
    notice.error(err?.message || '처리에 실패했습니다.')
  }
}

function fmt(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const canMarkSolved = computed(() => post.value && !post.value.solved && (userStore.isAdminRole || post.value.author?.id === userStore.user.id))

onMounted(loadAll)
watch(() => route.params.questionID, loadAll)
</script>

<template>
  <div class="page">
    <router-link to="/question" class="back">
      <v-icon :icon="mdiArrowLeft" size="14" /><span>목록</span>
    </router-link>

    <div v-if="!post" class="surface empty">불러오는 중…</div>
    <template v-else>
      <section class="surface qna-card">
        <header class="qna-head">
          <span :class="['chip', post.solved ? 'chip-low' : 'chip-mid']">{{ post.solved ? '해결' : '대기' }}</span>
          <span class="mono qna-meta">#{{ post.id }} · {{ fmt(post.create_time) }} · @{{ post.author?.username }}</span>
          <button v-if="canMarkSolved" class="btn btn-sm" @click="markSolved">해결로 표시</button>
        </header>
        <h1 class="qna-title">{{ post.title }}</h1>
        <div class="qna-body rich" v-html="post.content" />
      </section>

      <section v-for="c in comments" :key="c.id" class="surface comment">
        <header class="comment-head">
          <span class="mono comment-author">@{{ c.author?.username }}</span>
          <span v-if="c.author?.admin_type !== 'Regular User'" class="chip chip-accent">조교</span>
          <span class="mono t-muted">{{ fmt(c.create_time) }}</span>
          <button v-if="userStore.isAdminRole || c.author?.id === userStore.user.id" class="link" @click="removeComment(c.id)">삭제</button>
        </header>
        <div class="comment-body rich" v-html="c.content" />
      </section>

      <section class="surface reply-box">
        <h3 class="reply-title">답변 작성</h3>
        <textarea v-model="replyText" class="reply-area mono" rows="5" placeholder="마크다운 지원" />
        <div class="reply-actions">
          <button class="btn btn-primary" @click="submitReply">
            <v-icon :icon="mdiSendOutline" size="14" /><span>답변 등록</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 800px; margin: 0 auto; padding: 32px 24px 80px; display: flex; flex-direction: column; gap: 12px; }
.back { display: inline-flex; align-items: center; gap: 4px; color: var(--ink-3); font-size: 12px; text-decoration: none; margin-bottom: 8px; }
.back:hover { color: var(--ink); }
.empty { padding: 40px; text-align: center; color: var(--ink-3); }

.qna-card { padding: 24px; }
.qna-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.qna-meta { font-size: 11px; color: var(--ink-3); }
.qna-title { font-size: 20px; font-weight: 600; margin: 0 0 16px; color: var(--ink); }
.qna-body { font-size: 14px; color: var(--ink-2); line-height: 1.6; }
.rich :deep(p) { margin: 0 0 8px; }
.rich :deep(pre) { background: var(--sunken); padding: 12px; border-radius: var(--r-sm); font-size: 12px; overflow: auto; }
.rich :deep(code) { background: var(--sunken); padding: 1px 4px; border-radius: 3px; font-family: var(--font-mono); font-size: 12px; }

.comment { padding: 16px 20px; }
.comment-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.comment-author { font-size: 12px; font-weight: 600; color: var(--ink); }
.comment-body { font-size: 13px; color: var(--ink-2); margin: 0; line-height: 1.6; }

.reply-box { padding: 18px 20px; }
.reply-title { font-size: 13px; font-weight: 600; margin: 0 0 10px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.reply-area { width: 100%; padding: 10px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--bg); color: var(--ink); font-size: 13px; font-family: var(--font-mono); outline: none; resize: vertical; line-height: 1.5; }
.reply-area:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.reply-actions { display: flex; justify-content: flex-end; margin-top: 10px; }

.link { background: none; border: none; color: var(--status-wa); cursor: pointer; font-size: 12px; padding: 0; }
</style>
