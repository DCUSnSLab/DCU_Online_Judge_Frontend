<script setup>
import { onMounted, ref } from 'vue'
import { mdiCalendarMonth, mdiPlay, mdiRefresh } from '@mdi/js'
import { batchMigrateLecture, getBatchMigrateLectures } from '~/api/admin'
import { useNotice } from '~/composables/useNotice'
import PageHeader from '~/components/PageHeader.vue'

const notice = useNotice()
const year = ref(new Date().getFullYear())
const semester = ref(1)
const lectures = ref([])
const loading = ref(false)
const running = ref(false)
const selected = ref(new Set())

const years = (() => {
  const list = []
  for (let y = new Date().getFullYear(); y >= 2018; y -= 1) list.push(y)
  return list
})()

async function search() {
  loading.value = true
  try {
    const data = await getBatchMigrateLectures(year.value, semester.value)
    lectures.value = Array.isArray(data) ? data : data?.results || []
    selected.value = new Set(lectures.value.map((l) => l.id))
  } catch (err) {
    lectures.value = []
    notice.error(err?.message || '강의 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function run() {
  if (!selected.value.size) {
    notice.error('재계산할 강의를 선택하세요.')
    return
  }
  if (!confirm(`${selected.value.size}개 강의의 성적을 재계산할까요? 시간이 걸릴 수 있습니다.`)) return
  running.value = true
  try {
    await batchMigrateLecture({
      year: year.value,
      semester: semester.value,
      lecture_ids: Array.from(selected.value)
    })
    notice.success('일괄 재계산을 시작했습니다.')
  } catch (err) {
    notice.error(err?.message || '재계산에 실패했습니다.')
  } finally {
    running.value = false
  }
}

function toggle(id) {
  const s = new Set(selected.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selected.value = s
}

onMounted(search)
</script>

<template>
  <page-header eyebrow="Admin / Lecture · Super" title="학기 일괄 재계산">
    <template #actions>
      <button class="btn" @click="search">
        <v-icon :icon="mdiRefresh" size="14" /><span>다시 검색</span>
      </button>
      <button class="btn btn-primary" :disabled="running || !selected.size" @click="run">
        <v-icon :icon="mdiPlay" size="14" /><span>{{ running ? '실행 중…' : '재계산 시작' }}</span>
      </button>
    </template>
  </page-header>

  <div class="content">
    <section class="surface card">
      <div class="filters">
        <label class="field">
          <span class="mono field-label">연도</span>
          <select v-model.number="year" class="input mono" @change="search">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </label>
        <label class="field">
          <span class="mono field-label">학기</span>
          <select v-model.number="semester" class="input" @change="search">
            <option :value="1">1학기</option>
            <option :value="2">2학기</option>
            <option :value="3">입학 전</option>
          </select>
        </label>
        <div class="meta mono">
          <v-icon :icon="mdiCalendarMonth" size="14" />
          {{ year }} / {{ semester === 3 ? '입학 전' : semester + '학기' }} · {{ lectures.length }}개
        </div>
      </div>
    </section>

    <section class="surface table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check">선택</th>
            <th class="col-id">ID</th>
            <th>제목</th>
            <th>담당</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !lectures.length"><td colspan="4" class="empty">불러오는 중…</td></tr>
          <tr v-else-if="!lectures.length"><td colspan="4" class="empty">대상 강의가 없습니다.</td></tr>
          <tr v-for="l in lectures" :key="l.id">
            <td class="col-check">
              <input type="checkbox" :checked="selected.has(l.id)" @change="toggle(l.id)" />
            </td>
            <td class="mono col-id">#{{ l.id }}</td>
            <td>{{ l.title }}</td>
            <td>{{ l.created_by?.realname || l.created_by?.username || '–' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.content { padding: 24px 32px; display: flex; flex-direction: column; gap: 16px; }
.card { padding: 18px 22px; }
.filters { display: flex; gap: 16px; align-items: end; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 6px; min-width: 120px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 1px; }
.input { width: 100%; padding: 8px 12px; border-radius: var(--r-md); border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 13px; font-family: inherit; outline: none; }
.meta { font-size: 12px; color: var(--ink-3); display: inline-flex; align-items: center; gap: 6px; padding-bottom: 8px; }

.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); white-space: nowrap; }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-check { width: 60px; }
.col-id { width: 70px; color: var(--ink-3); }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
</style>
