<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAnnouncements, getContestAnnouncementList } from '~/api/oj'

const route = useRoute()
const items = ref([])
const loading = ref(false)
const expanded = ref(new Set())

const contestID = computed(() => route.params.contestID || null)

async function load() {
  loading.value = true
  try {
    let data
    if (contestID.value) {
      data = await getContestAnnouncementList(contestID.value)
      items.value = Array.isArray(data) ? data : data?.results || []
    } else {
      data = await getAnnouncements({ limit: 50 }, { silent: true })
      items.value = data?.results || []
    }
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function toggle(id) {
  const s = new Set(expanded.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expanded.value = s
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
  <section class="card surface">
    <header class="card-head">
      <h2 class="card-title">공지사항</h2>
      <span class="mono t-muted">{{ items.length }}건</span>
    </header>
    <div v-if="loading && !items.length" class="empty">불러오는 중…</div>
    <div v-else-if="!items.length" class="empty">공지가 없습니다.</div>
    <ul v-else class="ann-list">
      <li v-for="a in items" :key="a.id" class="ann-item">
        <button class="ann-head" @click="toggle(a.id)">
          <span class="ann-title">{{ a.title }}</span>
          <span class="mono ann-meta">{{ a.created_by?.username || '관리자' }} · {{ fmtTime(a.create_time) }}</span>
        </button>
        <div v-if="expanded.has(a.id)" class="ann-body rich" v-html="a.content" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.card { padding: 0; }
.card-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.card-title { font-size: 14px; font-weight: 600; margin: 0; }
.ann-list { list-style: none; margin: 0; padding: 0; }
.ann-item { border-bottom: 1px solid var(--line); }
.ann-item:last-child { border-bottom: none; }
.ann-head { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 18px; background: transparent; border: none; cursor: pointer; text-align: left; font-family: inherit; }
.ann-head:hover { background: var(--sunken); }
.ann-title { font-size: 13px; font-weight: 500; color: var(--ink); }
.ann-meta { font-size: 11px; color: var(--ink-3); }
.ann-body { padding: 12px 18px 18px; font-size: 13px; color: var(--ink-2); line-height: 1.6; background: var(--sunken); }
.rich :deep(p) { margin: 0 0 8px; }
.empty { padding: 32px; text-align: center; color: var(--ink-3); }
</style>
