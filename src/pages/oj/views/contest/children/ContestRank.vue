<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getContestRank } from '~/api/oj'

const route = useRoute()
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const PAGE_SIZE = 30

const contestID = computed(() => route.params.contestID)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

async function load() {
  loading.value = true
  try {
    const data = await getContestRank({
      contest_id: contestID.value,
      offset: (page.value - 1) * PAGE_SIZE,
      limit: PAGE_SIZE
    })
    rows.value = data?.results || []
    total.value = data?.total || 0
  } catch {
    rows.value = []
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

onMounted(load)
watch(() => route.params.contestID, () => { page.value = 1; load() })
</script>

<template>
  <section class="surface table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-rank">#</th>
          <th>참가자</th>
          <th>해결</th>
          <th>점수</th>
          <th>패널티</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading && !rows.length"><td colspan="5" class="empty">불러오는 중…</td></tr>
        <tr v-else-if="!rows.length"><td colspan="5" class="empty">랭킹 데이터가 없습니다.</td></tr>
        <tr v-for="(r, i) in rows" :key="r.id || i">
          <td class="mono col-rank">{{ (page - 1) * PAGE_SIZE + i + 1 }}</td>
          <td class="mono">{{ r.user?.username || r.username || '–' }}</td>
          <td class="mono solved">{{ r.accepted_number ?? r.solved ?? 0 }}</td>
          <td class="mono">{{ r.total_score ?? '–' }}</td>
          <td class="mono t-muted">{{ r.total_time ?? r.penalty ?? '–' }}</td>
        </tr>
      </tbody>
    </table>
    <nav v-if="totalPages > 1" class="pager">
      <button class="btn btn-sm" :disabled="page <= 1" @click="setPage(page - 1)">←</button>
      <span class="mono pager-info">{{ page }} / {{ totalPages }}</span>
      <button class="btn btn-sm" :disabled="page >= totalPages" @click="setPage(page + 1)">→</button>
    </nav>
  </section>
</template>

<style scoped>
.table-wrap { overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.col-rank { width: 60px; color: var(--ink); font-weight: 600; }
.solved { font-weight: 700; color: var(--accent); }
.empty { text-align: center; color: var(--ink-3); padding: 32px 0; }
.pager { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; }
.pager-info { font-size: 12px; color: var(--ink-3); }
</style>
