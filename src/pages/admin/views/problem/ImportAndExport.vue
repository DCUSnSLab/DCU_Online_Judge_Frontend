<script setup>
import { ref } from 'vue'
import { mdiCloudDownloadOutline, mdiCloudUploadOutline } from '@mdi/js'
import { exportProblems, importProblems } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const notice = useNotice()
const fileInput = ref(null)
const exportIds = ref('')
const importing = ref(false)
const exporting = ref(false)

function pick() {
  fileInput.value?.click()
}

async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  importing.value = true
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    await importProblems(parsed)
    notice.success('가져오기를 완료했습니다.')
  } catch (err) {
    notice.error(err?.message || '가져오기에 실패했습니다.')
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function runExport() {
  const ids = exportIds.value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!ids.length) {
    notice.error('내보낼 문제 ID를 입력하세요.')
    return
  }
  exporting.value = true
  try {
    const data = await exportProblems(ids.join(','))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `problems-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    notice.success('내보냈습니다.')
  } catch (err) {
    notice.error(err?.message || '내보내기에 실패했습니다.')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <page-header eyebrow="Admin / Problem" title="문제 가져오기 / 내보내기" />

  <div class="content">
    <section class="surface card">
      <h2 class="card-title">FPS / JSON 가져오기</h2>
      <p class="hint">FPS 형식 또는 OJ 내보내기 JSON 파일을 업로드해 문제를 일괄 등록합니다.</p>
      <input ref="fileInput" type="file" accept=".json,.xml" hidden @change="onFile" />
      <button class="btn btn-primary" :disabled="importing" @click="pick">
        <v-icon :icon="mdiCloudUploadOutline" size="14" />
        <span>{{ importing ? '업로드 중…' : '파일 선택' }}</span>
      </button>
    </section>

    <section class="surface card">
      <h2 class="card-title">선택 문제 내보내기</h2>
      <p class="hint">문제 ID를 콤마나 공백으로 구분해 입력하면 JSON 파일로 받아집니다.</p>
      <label class="field">
        <span class="mono field-label">문제 ID 목록</span>
        <textarea v-model="exportIds" class="input textarea" rows="3" placeholder="예: 1, 2, 3 또는 줄바꿈으로 구분" />
      </label>
      <div class="actions">
        <button class="btn" :disabled="exporting" @click="runExport">
          <v-icon :icon="mdiCloudDownloadOutline" size="14" />
          <span>{{ exporting ? '내보내는 중…' : '내보내기' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; max-width: 720px; }
.card { padding: 22px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0 0 8px; }
.hint { font-size: 13px; color: var(--ink-2); margin: 0 0 14px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
.textarea { font-family: var(--font-mono); resize: vertical; line-height: 1.5; }
.actions { display: flex; justify-content: flex-end; }
</style>
