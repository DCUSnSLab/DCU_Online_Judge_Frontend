<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { mdiContentCopy, mdiContentSave, mdiPlus, mdiRefresh } from '@mdi/js'
import {
  createLLMKey,
  createLLMRoute,
  deleteLLMRoute,
  getLLMGatewayConfig,
  getLLMKeyList,
  getLLMRouteList,
  revokeLLMKey,
  saveLLMGatewayConfig,
  updateLLMRoute
} from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const notice = useNotice()
const PAGE_SIZE = 15

const cfg = reactive({ default_model: '', gateway_url: '' })
const keys = ref([])
const keysTotal = ref(0)
const keysPage = ref(1)
const routes = ref([])
const routesTotal = ref(0)
const routesPage = ref(1)
const showKeyDialog = ref(false)
const showRouteDialog = ref(false)
const keyDraft = reactive({ name: '', value: '', notes: '' })
const routeDraft = reactive({ id: null, model_name: '', key_id: null, weight: 1 })

const keysTotalPages = computed(() => Math.max(1, Math.ceil(keysTotal.value / PAGE_SIZE)))
const routesTotalPages = computed(() => Math.max(1, Math.ceil(routesTotal.value / PAGE_SIZE)))

async function loadAll() {
  try {
    const c = await getLLMGatewayConfig()
    if (c) Object.assign(cfg, c)
  } catch {
    /* */
  }
  loadKeys()
  loadRoutes()
}

async function loadKeys() {
  try {
    const data = await getLLMKeyList((keysPage.value - 1) * PAGE_SIZE, PAGE_SIZE)
    keys.value = data?.results || []
    keysTotal.value = data?.total || 0
  } catch {
    keys.value = []
  }
}

async function loadRoutes() {
  try {
    const data = await getLLMRouteList((routesPage.value - 1) * PAGE_SIZE, PAGE_SIZE)
    routes.value = data?.results || []
    routesTotal.value = data?.total || 0
  } catch {
    routes.value = []
  }
}

async function saveCfg() {
  try {
    await saveLLMGatewayConfig({ default_model: cfg.default_model, gateway_url: cfg.gateway_url })
    notice.success('LLM 기본 설정을 저장했습니다.')
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  }
}

function openKeyDialog() {
  Object.assign(keyDraft, { name: '', value: '', notes: '' })
  showKeyDialog.value = true
}

async function submitKey() {
  if (!keyDraft.name || !keyDraft.value) {
    notice.error('이름과 키 값을 입력하세요.')
    return
  }
  try {
    await createLLMKey({ ...keyDraft })
    notice.success('API 키를 등록했습니다.')
    showKeyDialog.value = false
    await loadKeys()
  } catch (err) {
    notice.error(err?.message || '등록에 실패했습니다.')
  }
}

async function revoke(row) {
  if (!confirm(`API 키 "${row.name}" 를 폐기할까요?`)) return
  try {
    await revokeLLMKey(row.id)
    notice.success('폐기되었습니다.')
    await loadKeys()
  } catch (err) {
    notice.error(err?.message || '폐기에 실패했습니다.')
  }
}

function maskKey(v) {
  if (!v) return '–'
  if (v.length <= 8) return '••••'
  return v.slice(0, 4) + '••••' + v.slice(-4)
}

function openRouteDialog(row = null) {
  if (row) Object.assign(routeDraft, { id: row.id, model_name: row.model_name, key_id: row.key_id, weight: row.weight ?? 1 })
  else Object.assign(routeDraft, { id: null, model_name: '', key_id: null, weight: 1 })
  showRouteDialog.value = true
}

async function submitRoute() {
  if (!routeDraft.model_name || !routeDraft.key_id) {
    notice.error('모델명과 키를 선택하세요.')
    return
  }
  try {
    if (routeDraft.id) {
      await updateLLMRoute({ ...routeDraft })
      notice.success('라우트를 수정했습니다.')
    } else {
      await createLLMRoute({ model_name: routeDraft.model_name, key_id: routeDraft.key_id, weight: routeDraft.weight })
      notice.success('라우트를 추가했습니다.')
    }
    showRouteDialog.value = false
    await loadRoutes()
  } catch (err) {
    notice.error(err?.message || '저장에 실패했습니다.')
  }
}

async function removeRoute(row) {
  if (!confirm(`${row.model_name} 라우트를 삭제할까요?`)) return
  try {
    await deleteLLMRoute(row.id)
    notice.success('삭제했습니다.')
    await loadRoutes()
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  }
}

function copy(s) {
  navigator.clipboard?.writeText(s)
  notice.success('복사했습니다.')
}

function setKeysPage(p) {
  if (p < 1 || p > keysTotalPages.value || p === keysPage.value) return
  keysPage.value = p
  loadKeys()
}

function setRoutesPage(p) {
  if (p < 1 || p > routesTotalPages.value || p === routesPage.value) return
  routesPage.value = p
  loadRoutes()
}

onMounted(loadAll)
</script>

<template>
  <page-header eyebrow="Admin / General" title="LLM API 키">
    <template #actions>
      <button class="btn" @click="loadAll">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface card">
      <header class="card-head"><h2 class="card-title">기본 설정</h2></header>
      <form class="form" @submit.prevent="saveCfg">
        <div class="grid-2">
          <label class="field">
            <span class="mono field-label">기본 모델</span>
            <input v-model="cfg.default_model" class="input mono" placeholder="예: gpt-4o-mini" />
          </label>
          <label class="field">
            <span class="mono field-label">Gateway URL</span>
            <input v-model="cfg.gateway_url" class="input mono" placeholder="http://llm-gateway:18000" />
          </label>
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary">
            <v-icon :icon="mdiContentSave" size="14" /><span>저장</span>
          </button>
        </div>
      </form>
    </section>

    <section class="surface card">
      <header class="card-head">
        <h2 class="card-title">API 키 ({{ keysTotal }})</h2>
        <button class="btn btn-primary btn-sm" @click="openKeyDialog">
          <v-icon :icon="mdiPlus" size="14" /><span>새 키</span>
        </button>
      </header>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th>이름</th>
            <th>키 (마스킹)</th>
            <th>메모</th>
            <th>상태</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!keys.length"><td colspan="6" class="empty">등록된 키가 없습니다.</td></tr>
          <tr v-for="k in keys" :key="k.id">
            <td class="mono col-id">#{{ k.id }}</td>
            <td>{{ k.name }}</td>
            <td class="mono">
              {{ maskKey(k.value) }}
              <button class="icon-btn" title="복사" @click="copy(k.value)">
                <v-icon :icon="mdiContentCopy" size="12" />
              </button>
            </td>
            <td class="t-secondary">{{ k.notes || '–' }}</td>
            <td>
              <span :class="['chip', k.revoked ? 'chip-high' : 'chip-low']">
                {{ k.revoked ? '폐기됨' : '활성' }}
              </span>
            </td>
            <td class="col-actions">
              <button v-if="!k.revoked" class="icon-btn icon-btn-danger" title="폐기" @click="revoke(k)">폐기</button>
            </td>
          </tr>
        </tbody>
      </table>
      <nav v-if="keysTotalPages > 1" class="pager">
        <button class="btn btn-sm" :disabled="keysPage <= 1" @click="setKeysPage(keysPage - 1)">←</button>
        <span class="mono pager-info">{{ keysPage }} / {{ keysTotalPages }}</span>
        <button class="btn btn-sm" :disabled="keysPage >= keysTotalPages" @click="setKeysPage(keysPage + 1)">→</button>
      </nav>
    </section>

    <section class="surface card">
      <header class="card-head">
        <h2 class="card-title">모델 라우팅 ({{ routesTotal }})</h2>
        <button class="btn btn-primary btn-sm" @click="openRouteDialog()">
          <v-icon :icon="mdiPlus" size="14" /><span>새 라우트</span>
        </button>
      </header>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th>모델</th>
            <th>키 ID</th>
            <th>가중치</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!routes.length"><td colspan="5" class="empty">라우트가 없습니다.</td></tr>
          <tr v-for="r in routes" :key="r.id">
            <td class="mono col-id">#{{ r.id }}</td>
            <td class="mono">{{ r.model_name }}</td>
            <td class="mono">#{{ r.key_id }}</td>
            <td class="mono">{{ r.weight ?? 1 }}</td>
            <td class="col-actions">
              <button class="icon-btn" @click="openRouteDialog(r)">수정</button>
              <button class="icon-btn icon-btn-danger" @click="removeRoute(r)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
      <nav v-if="routesTotalPages > 1" class="pager">
        <button class="btn btn-sm" :disabled="routesPage <= 1" @click="setRoutesPage(routesPage - 1)">←</button>
        <span class="mono pager-info">{{ routesPage }} / {{ routesTotalPages }}</span>
        <button class="btn btn-sm" :disabled="routesPage >= routesTotalPages" @click="setRoutesPage(routesPage + 1)">→</button>
      </nav>
    </section>

    <div v-if="showKeyDialog" class="dialog-scrim" @click.self="showKeyDialog = false">
      <div class="surface dialog">
        <header class="dialog-head"><h2 class="dialog-title">새 API 키</h2><button class="icon-btn" @click="showKeyDialog = false">×</button></header>
        <form class="dialog-body" @submit.prevent="submitKey">
          <label class="field">
            <span class="mono field-label">이름</span>
            <input v-model="keyDraft.name" class="input" />
          </label>
          <label class="field">
            <span class="mono field-label">키 값</span>
            <input v-model="keyDraft.value" type="password" class="input mono" />
          </label>
          <label class="field">
            <span class="mono field-label">메모</span>
            <textarea v-model="keyDraft.notes" class="input" rows="3" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="btn" @click="showKeyDialog = false">취소</button>
            <button type="submit" class="btn btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRouteDialog" class="dialog-scrim" @click.self="showRouteDialog = false">
      <div class="surface dialog">
        <header class="dialog-head"><h2 class="dialog-title">{{ routeDraft.id ? '라우트 수정' : '새 라우트' }}</h2><button class="icon-btn" @click="showRouteDialog = false">×</button></header>
        <form class="dialog-body" @submit.prevent="submitRoute">
          <label class="field">
            <span class="mono field-label">모델명</span>
            <input v-model="routeDraft.model_name" class="input mono" placeholder="gpt-4o-mini" />
          </label>
          <label class="field">
            <span class="mono field-label">키</span>
            <select v-model.number="routeDraft.key_id" class="input">
              <option :value="null">선택…</option>
              <option v-for="k in keys" :key="k.id" :value="k.id">#{{ k.id }} {{ k.name }}</option>
            </select>
          </label>
          <label class="field">
            <span class="mono field-label">가중치</span>
            <input v-model.number="routeDraft.weight" type="number" class="input mono" min="1" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="btn" @click="showRouteDialog = false">취소</button>
            <button type="submit" class="btn btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; }
.card { padding: 20px 24px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.form { display: flex; flex-direction: column; gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.actions { display: flex; justify-content: flex-end; }

.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); white-space: nowrap; }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-id { width: 70px; color: var(--ink-3); }
.col-actions { width: 140px; text-align: right; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }

.icon-btn { background: transparent; border: none; cursor: pointer; padding: 4px 8px; border-radius: var(--r-sm); color: var(--ink-2); display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
.icon-btn:hover { background: var(--sunken); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }

.pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }

.dialog-scrim { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 100; display: grid; place-items: center; padding: 20px; }
.dialog { width: 100%; max-width: 480px; padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.dialog-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--line); }
.dialog-title { font-size: 16px; font-weight: 600; margin: 0; }
.dialog-body { padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
</style>
