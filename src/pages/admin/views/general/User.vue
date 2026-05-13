<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  mdiDeleteOutline,
  mdiMagnify,
  mdiPencilOutline,
  mdiRefresh
} from '@mdi/js'
import { deleteUsers, editUser, getUser, getUserList } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const notice = useNotice()

const PAGE_SIZE = 15
const items = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const loading = ref(false)
const selected = ref(new Set())
const dialogOpen = ref(false)

const ADMIN_TYPE_OPTIONS = [
  { value: 'Regular User', label: '학생' },
  { value: 'TA_Admin', label: 'TA/RA' },
  { value: 'Admin', label: '교수' },
  { value: 'Super Admin', label: '관리자' }
]

const PROBLEM_PERMISSION_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'Own', label: 'Own' },
  { value: 'Semi', label: 'Semi' },
  { value: 'All', label: 'All' }
]

const draft = reactive({
  id: null,
  username: '',
  realname: '',
  email: '',
  admin_type: 'Regular User',
  problem_permission: 'None',
  password: '',
  open_api: false,
  two_factor_auth: false,
  is_disabled: false
})

const studentOnly = computed(() => route.name === 'student-list')
const headerTitle = computed(() => (studentOnly.value ? '학생 관리' : '사용자 관리'))

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const isAllSelected = computed(
  () => items.value.length > 0 && items.value.every((u) => selected.value.has(u.id))
)
const selectedIds = computed(() => Array.from(selected.value))

async function load() {
  loading.value = true
  try {
    const data = await getUserList((page.value - 1) * PAGE_SIZE, PAGE_SIZE, keyword.value || undefined)
    items.value = data?.results || []
    total.value = data?.total || 0
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
    selected.value = new Set()
  }
}

function setPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  load()
}

function applySearch() {
  page.value = 1
  load()
}

function toggleRow(id) {
  const s = new Set(selected.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selected.value = s
}

function toggleAll() {
  if (isAllSelected.value) selected.value = new Set()
  else selected.value = new Set(items.value.map((u) => u.id))
}

async function openEdit(row) {
  try {
    const data = await getUser(row.id)
    Object.assign(draft, {
      id: data.id,
      username: data.username,
      realname: data.realname || '',
      email: data.email || '',
      admin_type: data.admin_type,
      problem_permission: data.problem_permission,
      password: '',
      open_api: !!data.open_api,
      two_factor_auth: !!data.two_factor_auth,
      is_disabled: !!data.is_disabled
    })
    dialogOpen.value = true
  } catch (err) {
    notice.error(err?.message || '사용자 정보를 불러오지 못했습니다.')
  }
}

async function submit() {
  if (!draft.username.trim()) {
    notice.error('아이디를 입력하세요.')
    return
  }
  const payload = {
    id: draft.id,
    username: draft.username,
    realname: draft.realname,
    email: draft.email,
    admin_type: draft.admin_type,
    problem_permission: draft.problem_permission,
    open_api: draft.open_api,
    two_factor_auth: draft.two_factor_auth,
    is_disabled: draft.is_disabled
  }
  // 백엔드 EditUserSerializer는 password가 optional이고 빈 문자열도 허용함.
  if (draft.password) payload.password = draft.password
  try {
    await editUser(payload)
    notice.success('사용자 정보를 저장했습니다.')
    dialogOpen.value = false
    await load()
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  }
}

async function removeOne(row) {
  if (!confirm(`사용자 "${row.username}" 를 삭제할까요?`)) return
  try {
    await deleteUsers([row.id])
    notice.success('사용자를 삭제했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

async function removeSelected() {
  if (!selectedIds.value.length) return
  if (!confirm(`선택한 ${selectedIds.value.length}명을 삭제할까요?`)) return
  try {
    await deleteUsers(selectedIds.value)
    notice.success('선택한 사용자를 삭제했습니다.')
    await load()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

function roleLabel(t) {
  return ADMIN_TYPE_OPTIONS.find((o) => o.value === t)?.label || t
}

function fmtTime(ts) {
  if (!ts) return '–'
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

onMounted(load)
watch(() => route.name, load)
</script>

<template>
  <page-header eyebrow="Admin / General" :title="headerTitle">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" />
        <span>새로고침</span>
      </button>
      <button
        v-if="selectedIds.length"
        class="btn"
        @click="removeSelected"
      >
        <v-icon :icon="mdiDeleteOutline" size="14" />
        <span>선택 삭제 ({{ selectedIds.length }})</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <div class="surface controls">
      <div class="search-wrap">
        <v-icon :icon="mdiMagnify" size="14" class="search-icon" />
        <input
          v-model="keyword"
          type="text"
          class="search"
          placeholder="이름·아이디·이메일·학번 검색"
          @keyup.enter="applySearch"
        />
      </div>
      <button class="btn" @click="applySearch">검색</button>
    </div>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" :checked="isAllSelected" @change="toggleAll" />
            </th>
            <th class="col-id">ID</th>
            <th>이름</th>
            <th>아이디</th>
            <th class="col-ssn">학번</th>
            <th>이메일</th>
            <th class="col-role">권한</th>
            <th class="col-time">가입</th>
            <th class="col-time">최근 접속</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length">
            <td colspan="10" class="empty">불러오는 중…</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="10" class="empty">사용자가 없습니다.</td>
          </tr>
          <tr
            v-for="row in items"
            :key="row.id"
            :class="{ disabled: row.is_disabled }"
          >
            <td class="col-check">
              <input
                type="checkbox"
                :checked="selected.has(row.id)"
                @change="toggleRow(row.id)"
              />
            </td>
            <td class="mono col-id">#{{ row.id }}</td>
            <td>{{ row.realname || '–' }}</td>
            <td class="mono">{{ row.username }}</td>
            <td class="mono col-ssn">{{ row.schoolssn || '–' }}</td>
            <td class="t-secondary">{{ row.email || '–' }}</td>
            <td class="col-role">
              <span :class="['chip', row.admin_type === 'Super Admin' ? 'chip-accent' : '']">
                {{ roleLabel(row.admin_type) }}
              </span>
            </td>
            <td class="mono col-time">{{ fmtTime(row.create_time) }}</td>
            <td class="mono col-time">{{ fmtTime(row.last_login) }}</td>
            <td class="col-actions">
              <button class="icon-btn" title="수정" @click="openEdit(row)">
                <v-icon :icon="mdiPencilOutline" size="14" />
              </button>
              <button class="icon-btn icon-btn-danger" title="삭제" @click="removeOne(row)">
                <v-icon :icon="mdiDeleteOutline" size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="page <= 1" @click="setPage(page - 1)">←</button>
      <span class="mono pager-info">{{ page }} / {{ totalPages }} · 총 {{ total }}명</span>
      <button class="btn btn-sm" :disabled="page >= totalPages" @click="setPage(page + 1)">→</button>
    </nav>

    <div v-if="dialogOpen" class="dialog-scrim" @click.self="dialogOpen = false">
      <div class="surface dialog">
        <header class="dialog-head">
          <h2 class="dialog-title">사용자 #{{ draft.id }} 수정</h2>
          <button class="icon-btn" @click="dialogOpen = false">×</button>
        </header>
        <form class="dialog-body" @submit.prevent="submit">
          <div class="grid-2">
            <label class="field">
              <span class="mono field-label">아이디</span>
              <input v-model="draft.username" class="input mono" />
            </label>
            <label class="field">
              <span class="mono field-label">이름</span>
              <input v-model="draft.realname" class="input" />
            </label>
          </div>
          <label class="field">
            <span class="mono field-label">이메일</span>
            <input v-model="draft.email" type="email" class="input" />
          </label>
          <div class="grid-2">
            <label class="field">
              <span class="mono field-label">권한</span>
              <select v-model="draft.admin_type" class="input">
                <option v-for="o in ADMIN_TYPE_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </label>
            <label class="field">
              <span class="mono field-label">문제 권한</span>
              <select v-model="draft.problem_permission" class="input">
                <option v-for="o in PROBLEM_PERMISSION_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </label>
          </div>
          <label class="field">
            <span class="mono field-label">새 비밀번호 (변경 시에만 입력)</span>
            <input v-model="draft.password" type="password" class="input" placeholder="공란 시 변경 안 함" />
          </label>
          <div class="flags">
            <label class="flag">
              <input v-model="draft.open_api" type="checkbox" />
              <span>Open API</span>
            </label>
            <label class="flag">
              <input v-model="draft.two_factor_auth" type="checkbox" />
              <span>2FA</span>
            </label>
            <label class="flag">
              <input v-model="draft.is_disabled" type="checkbox" />
              <span>계정 비활성</span>
            </label>
          </div>
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
.controls {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 14px 16px;
}
.search-wrap {
  position: relative;
  flex: 1;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
  pointer-events: none;
}
.search {
  width: 100%;
  height: 34px;
  padding: 0 10px 0 32px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
.search:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.table-wrap {
  overflow: auto;
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
  white-space: nowrap;
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
.col-check {
  width: 40px;
}
.col-id {
  width: 70px;
  color: var(--ink-3);
}
.col-ssn {
  width: 100px;
  color: var(--ink-2);
}
.col-role {
  width: 100px;
}
.col-time {
  width: 110px;
  color: var(--ink-2);
}
.col-actions {
  width: 100px;
  text-align: right;
}
.empty {
  text-align: center;
  color: var(--ink-3);
  padding: 32px 0;
}
.disabled {
  opacity: 0.55;
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
  max-width: 560px;
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
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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
.input {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}
.flags {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.flag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-2);
}
.flag input {
  accent-color: var(--accent);
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
