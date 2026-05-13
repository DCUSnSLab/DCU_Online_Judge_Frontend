<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mdiDeleteOutline, mdiPencilOutline, mdiPlus, mdiRefresh } from '@mdi/js'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementList,
  updateAnnouncement
} from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const notice = useNotice()

const PAGE_SIZE = 15
const items = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const dialogOpen = ref(false)
const dialogMode = ref('create') // 'create' | 'edit'

const draft = reactive({
  id: null,
  title: '',
  content: '',
  visible: true
})

const contestId = computed(() => route.params.contestId || null)
const headerTitle = computed(() =>
  contestId.value ? `콘테스트 #${contestId.value} 공지` : '공지사항'
)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

async function load() {
  loading.value = true
  try {
    const data = await getAnnouncementList((page.value - 1) * PAGE_SIZE, PAGE_SIZE)
    items.value = data?.results || []
    total.value = data?.total || 0
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  load()
}

function openCreate() {
  dialogMode.value = 'create'
  Object.assign(draft, { id: null, title: '', content: '', visible: true })
  dialogOpen.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  Object.assign(draft, {
    id: row.id,
    title: row.title,
    content: row.content,
    visible: row.visible
  })
  dialogOpen.value = true
}

async function submit() {
  if (!draft.title.trim()) {
    notice.error('제목을 입력하세요.')
    return
  }
  if (!draft.content.trim()) {
    notice.error('본문을 입력하세요.')
    return
  }
  try {
    if (dialogMode.value === 'create') {
      await createAnnouncement({
        title: draft.title,
        content: draft.content,
        visible: draft.visible
      })
      notice.success('공지를 생성했습니다.')
    } else {
      await updateAnnouncement({
        id: draft.id,
        title: draft.title,
        content: draft.content,
        visible: draft.visible
      })
      notice.success('공지를 수정했습니다.')
    }
    dialogOpen.value = false
    await load()
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  }
}

async function toggleVisible(row) {
  try {
    await updateAnnouncement({
      id: row.id,
      title: row.title,
      content: row.content,
      visible: !row.visible
    })
    notice.success('노출 설정을 변경했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '변경에 실패했습니다.')
  }
}

async function remove(row) {
  if (!confirm(`공지 "${row.title}" 를 삭제할까요?`)) return
  try {
    await deleteAnnouncement(row.id)
    notice.success('공지를 삭제했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

function fmtTime(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(load)
watch(() => route.params, load)
</script>

<template>
  <page-header eyebrow="Admin / General" :title="headerTitle">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" />
        <span>새로고침</span>
      </button>
      <button class="btn btn-primary" @click="openCreate">
        <v-icon :icon="mdiPlus" size="14" />
        <span>새 공지</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th>제목</th>
            <th class="col-time">작성</th>
            <th class="col-time">수정</th>
            <th class="col-author">작성자</th>
            <th class="col-visible">노출</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length">
            <td colspan="7" class="empty">불러오는 중…</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="7" class="empty">공지가 없습니다.</td>
          </tr>
          <tr v-for="row in items" :key="row.id">
            <td class="mono col-id">#{{ row.id }}</td>
            <td class="title-cell">{{ row.title }}</td>
            <td class="mono col-time">{{ fmtTime(row.create_time) }}</td>
            <td class="mono col-time">{{ fmtTime(row.last_update_time) }}</td>
            <td class="col-author">{{ row.created_by?.username || '–' }}</td>
            <td class="col-visible">
              <button
                type="button"
                :class="['toggle', row.visible && 'toggle-on']"
                @click="toggleVisible(row)"
              >
                <span class="toggle-dot" />
              </button>
            </td>
            <td class="col-actions">
              <button class="icon-btn" title="수정" @click="openEdit(row)">
                <v-icon :icon="mdiPencilOutline" size="14" />
              </button>
              <button class="icon-btn icon-btn-danger" title="삭제" @click="remove(row)">
                <v-icon :icon="mdiDeleteOutline" size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="page <= 1" @click="setPage(page - 1)">←</button>
      <span class="mono pager-info">{{ page }} / {{ totalPages }} · 총 {{ total }}건</span>
      <button class="btn btn-sm" :disabled="page >= totalPages" @click="setPage(page + 1)">→</button>
    </nav>

    <!-- Edit / Create dialog -->
    <div v-if="dialogOpen" class="dialog-scrim" @click.self="dialogOpen = false">
      <div class="surface dialog">
        <header class="dialog-head">
          <h2 class="dialog-title">
            {{ dialogMode === 'create' ? '새 공지 작성' : `공지 #${draft.id} 수정` }}
          </h2>
          <button class="icon-btn" @click="dialogOpen = false">×</button>
        </header>
        <form class="dialog-body" @submit.prevent="submit">
          <label class="field">
            <span class="mono field-label">제목</span>
            <input v-model="draft.title" type="text" class="input" placeholder="공지 제목" />
          </label>
          <label class="field">
            <span class="mono field-label">본문</span>
            <textarea
              v-model="draft.content"
              class="textarea"
              rows="10"
              placeholder="공지 내용 (마크다운 지원)"
            />
          </label>
          <label class="visible-row">
            <input v-model="draft.visible" type="checkbox" />
            <span>학생에게 노출</span>
          </label>
          <div class="dialog-actions">
            <button type="button" class="btn" @click="dialogOpen = false">취소</button>
            <button type="submit" class="btn btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-wrap {
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: 10px 14px;
  border-top: 1px solid var(--line);
}
.data-table th {
  background: var(--sunken);
  border-top: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.col-id {
  width: 80px;
  color: var(--ink-3);
}
.col-time {
  width: 160px;
  color: var(--ink-2);
}
.col-author {
  width: 120px;
  color: var(--ink-2);
}
.col-visible {
  width: 80px;
}
.col-actions {
  width: 100px;
  text-align: right;
}
.title-cell {
  color: var(--ink);
  font-weight: 500;
}
.empty {
  text-align: center;
  color: var(--ink-3);
  padding: 32px 0;
}

.toggle {
  width: 32px;
  height: 18px;
  background: var(--line-strong);
  border-radius: 9px;
  border: none;
  position: relative;
  cursor: pointer;
  padding: 0;
  transition: background var(--t-fast) var(--ease-out);
}
.toggle-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: left var(--t-fast) var(--ease-out);
}
.toggle-on {
  background: var(--accent);
}
.toggle-on .toggle-dot {
  left: 16px;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  color: var(--ink-2);
  display: inline-grid;
  place-items: center;
  margin-left: 4px;
}
.icon-btn:hover {
  background: var(--sunken);
  color: var(--ink);
}
.icon-btn-danger:hover {
  color: var(--status-wa);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.pager-info {
  font-size: 12px;
  color: var(--ink-3);
}

/* Dialog */
.dialog-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
}
.dialog {
  width: 100%;
  max-width: 600px;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--line);
}
.dialog-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.dialog-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.input,
.textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  resize: vertical;
}
.input:focus,
.textarea:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}
.textarea {
  font-family: var(--font-mono);
  line-height: 1.6;
}
.visible-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-2);
}
.visible-row input {
  accent-color: var(--accent);
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
