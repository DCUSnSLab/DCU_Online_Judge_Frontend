<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getContestProblemList } from '~/api/oj'
import AppChip from '~/components/AppChip.vue'
import StatusDot from '~/components/StatusDot.vue'

const route = useRoute()
const problems = ref([])
const loading = ref(false)

const contestID = computed(() => route.params.contestID)
const inLecture = computed(() => Boolean(route.params.lectureID))
const linkBase = computed(() =>
  inLecture.value
    ? `/CourseList/${route.params.lectureID}/${contestID.value}/problem`
    : `/contest/${contestID.value}/problem`
)

function diffTone(d) {
  if (d === 'Low') return 'low'
  if (d === 'High') return 'high'
  return 'mid'
}

async function load() {
  loading.value = true
  try {
    const data = await getContestProblemList(contestID.value)
    problems.value = Array.isArray(data) ? data : data?.results || []
  } catch {
    problems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.contestID, load)
</script>

<template>
  <section class="surface table-wrap">
    <table class="data-table">
      <thead><tr><th>상태</th><th>표시</th><th>제목</th><th>난이도</th><th>제출</th><th>정답률</th></tr></thead>
      <tbody>
        <tr v-if="loading && !problems.length"><td colspan="6" class="empty">불러오는 중…</td></tr>
        <tr v-else-if="!problems.length"><td colspan="6" class="empty">문제가 없습니다.</td></tr>
        <tr v-for="p in problems" :key="p.id">
          <td>
            <status-dot v-if="p.my_status === 0" status="ac" />
            <status-dot v-else-if="p.my_status > 0" status="wa" />
          </td>
          <td class="mono prob-letter">{{ p._id }}</td>
          <td>
            <router-link :to="`${linkBase}/${p._id}`" class="title-link">{{ p.title }}</router-link>
          </td>
          <td v-if="p.difficulty"><app-chip :tone="diffTone(p.difficulty)">{{ p.difficulty }}</app-chip></td>
          <td v-else class="t-muted">–</td>
          <td class="mono">{{ p.submission_number }}</td>
          <td class="mono">{{ p.submission_number ? Math.round((p.accepted_number / p.submission_number) * 100) : 0 }}%</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.prob-letter { font-size: 14px; font-weight: 700; color: var(--accent); width: 80px; }
.title-link { color: var(--ink); font-weight: 500; text-decoration: none; }
.title-link:hover { color: var(--accent); }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
</style>
