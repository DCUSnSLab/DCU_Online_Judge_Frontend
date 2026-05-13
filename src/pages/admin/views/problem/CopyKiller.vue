<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiPlay } from '@mdi/js'
import { runCopyKiller } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const notice = useNotice()

const tab = ref('single') // 'single' | 'multi'
const keyword = ref('')
const running = ref(false)
const result = ref(null) // { download_url, summary }

const contestId = computed(() => route.params.contestId || null)

async function run() {
  if (tab.value === 'single' && !contestId.value) {
    notice.error('콘테스트 컨텍스트가 필요합니다.')
    return
  }
  running.value = true
  try {
    const data = await runCopyKiller({
      keyword: keyword.value || undefined,
      id: contestId.value,
      mode: tab.value
    })
    result.value = data || {}
    notice.success('검사가 완료되었습니다.')
  } catch (err) {
    notice.error(err?.message || '검사에 실패했습니다.')
  } finally {
    running.value = false
  }
}
</script>

<template>
  <page-header eyebrow="Admin / Problem" :title="`표절 검사 (콘테스트 #${contestId})`">
    <template #actions>
      <button class="btn" @click="router.push(`/contest/${contestId}/problems`)">
        <v-icon :icon="mdiArrowLeft" size="14" /><span>문제 목록</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface card">
      <div class="tabs">
        <button :class="['tab', tab === 'single' && 'tab-active']" @click="tab = 'single'">단일 강의</button>
        <button :class="['tab', tab === 'multi' && 'tab-active']" @click="tab = 'multi'">다중 강의</button>
      </div>

      <p class="hint">
        제출된 코드들 사이의 유사도를 검사합니다. 다중 강의 모드는 과거 학기를 포함한 전체 데이터에서 비교합니다.
      </p>

      <label class="field">
        <span class="mono field-label">키워드 (선택)</span>
        <input v-model="keyword" class="input" placeholder="특정 문자열 매칭으로 좁히기" />
      </label>

      <div class="actions">
        <button class="btn btn-primary" :disabled="running" @click="run">
          <v-icon :icon="mdiPlay" size="14" /><span>{{ running ? '실행 중…' : '검사 실행' }}</span>
        </button>
      </div>
    </section>

    <section v-if="result" class="surface card">
      <h3 class="card-title">결과</h3>
      <pre class="mono result">{{ JSON.stringify(result, null, 2) }}</pre>
      <a v-if="result.download_url" :href="result.download_url" class="btn">결과 파일 다운로드</a>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; max-width: 800px; }
.card { padding: 22px; }
.tabs { display: inline-flex; gap: 4px; padding: 4px; background: var(--sunken); border-radius: var(--r-md); margin-bottom: 14px; }
.tab { padding: 8px 16px; font-size: 13px; font-weight: 500; color: var(--ink-3); background: transparent; border: none; border-radius: var(--r-sm); cursor: pointer; font-family: inherit; }
.tab-active { background: var(--surface); color: var(--ink); font-weight: 600; }
.hint { font-size: 13px; color: var(--ink-2); margin: 0 0 14px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.actions { display: flex; justify-content: flex-end; }
.card-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; }
.result { background: var(--sunken); padding: 12px; border-radius: var(--r-md); font-size: 12px; max-height: 400px; overflow: auto; white-space: pre-wrap; }
</style>
