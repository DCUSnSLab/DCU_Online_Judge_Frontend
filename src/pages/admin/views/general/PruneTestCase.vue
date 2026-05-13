<script setup>
import { onMounted, ref } from 'vue'
import { mdiDeleteOutline, mdiRefresh } from '@mdi/js'
import { getInvalidTestCaseList, pruneTestCase } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const notice = useNotice()
const items = ref([])
const loading = ref(false)
const removing = ref(null)

async function load() {
  loading.value = true
  try {
    const data = await getInvalidTestCaseList()
    items.value = Array.isArray(data) ? data : data?.results || []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

async function remove(id) {
  if (!confirm(`테스트 케이스 ${id} 를 삭제할까요?`)) return
  removing.value = id
  try {
    await pruneTestCase(id)
    notice.success('삭제했습니다.')
    items.value = items.value.filter((x) => x !== id && x.id !== id)
  } catch (err) {
    notice.error(err?.message || '삭제에 실패했습니다.')
  } finally {
    removing.value = null
  }
}

async function removeAll() {
  if (!items.value.length) return
  if (!confirm(`${items.value.length}개를 모두 삭제할까요?`)) return
  for (const it of [...items.value]) {
    try {
      await pruneTestCase(typeof it === 'string' ? it : it.id)
    } catch {
      /* */
    }
  }
  notice.success('모두 삭제했습니다.')
  await load()
}

onMounted(load)
</script>

<template>
  <page-header eyebrow="Admin / General" title="테스트케이스 정리">
    <template #actions>
      <button class="btn" @click="load">
        <v-icon :icon="mdiRefresh" size="14" /><span>새로고침</span>
      </button>
      <button class="btn" :disabled="!items.length" @click="removeAll">
        <v-icon :icon="mdiDeleteOutline" size="14" /><span>전체 삭제</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface info-card">
      <p>
        어떤 문제에도 속하지 않은 <strong>고아 테스트 케이스 디렉토리</strong>를 안전하게 삭제합니다.
        이 작업은 되돌릴 수 없습니다.
      </p>
    </section>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>테스트 케이스 ID</th>
            <th class="col-actions">동작</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length"><td colspan="2" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!items.length"><td colspan="2" class="empty">정리 대상이 없습니다. 깨끗합니다.</td></tr>
          <tr v-for="it in items" :key="typeof it === 'string' ? it : it.id">
            <td class="mono">{{ typeof it === 'string' ? it : it.id }}</td>
            <td class="col-actions">
              <button
                class="icon-btn icon-btn-danger"
                :disabled="removing === (typeof it === 'string' ? it : it.id)"
                @click="remove(typeof it === 'string' ? it : it.id)"
              >
                <v-icon :icon="mdiDeleteOutline" size="14" /><span>삭제</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; max-width: 800px; }
.info-card { padding: 16px 20px; font-size: 13px; color: var(--ink-2); }
.info-card strong { color: var(--ink); }
.table-wrap { overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-actions { width: 130px; text-align: right; }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
.icon-btn { background: transparent; border: none; cursor: pointer; padding: 6px 10px; border-radius: var(--r-sm); color: var(--ink-2); display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
.icon-btn:hover { background: var(--sunken); color: var(--ink); }
.icon-btn-danger:hover { color: var(--status-wa); }
</style>
