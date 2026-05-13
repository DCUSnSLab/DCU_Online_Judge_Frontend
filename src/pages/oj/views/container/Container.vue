<script setup>
import { ref } from 'vue'
import { mdiClose, mdiPlus } from '@mdi/js'

const tabs = ref([
  { id: 1, name: 'DCU Shell 1', active: true },
  { id: 2, name: 'DCU Shell 2', active: false }
])

const activeTab = ref(1)

const terminalLines = [
  { prompt: 'jisoo@dcu-shell:~$', text: 'ls -la' },
  { text: 'total 24', dim: true },
  { text: 'drwxr-xr-x  4 jisoo jisoo 4096 May 13 09:32 .', dim: true },
  { text: 'drwxr-xr-x  3 root  root  4096 May 13 09:30 ..', dim: true },
  { text: 'drwxr-xr-x  2 jisoo jisoo 4096 May 13 09:32 src', dim: true },
  { text: '-rw-r--r--  1 jisoo jisoo  158 May 13 09:32 main.c', dim: true },
  { prompt: 'jisoo@dcu-shell:~$', text: 'gcc main.c -o main' },
  { prompt: 'jisoo@dcu-shell:~$', text: './main' },
  { text: 'Hello, DCUCODE!', dim: false },
  { prompt: 'jisoo@dcu-shell:~$', text: '', cursor: true }
]

function switchTab(id) {
  activeTab.value = id
  tabs.value.forEach((t) => (t.active = t.id === id))
}

function addTab() {
  const id = Math.max(0, ...tabs.value.map((t) => t.id)) + 1
  tabs.value.push({ id, name: `DCU Shell ${id}`, active: false })
  switchTab(id)
}

function closeTab(id) {
  tabs.value = tabs.value.filter((t) => t.id !== id)
  if (activeTab.value === id && tabs.value.length) switchTab(tabs.value[0].id)
}
</script>

<template>
  <div class="page">
    <header class="bar">
      <div class="tabs">
        <button
          v-for="t in tabs" :key="t.id"
          :class="['tab', t.active && 'tab-active']"
          @click="switchTab(t.id)"
        >
          <span>{{ t.name }}</span>
          <span class="close" @click.stop="closeTab(t.id)">
            <v-icon :icon="mdiClose" size="12" />
          </span>
        </button>
        <button class="tab tab-add" @click="addTab">
          <v-icon :icon="mdiPlus" size="14" />
        </button>
      </div>
      <div class="mono status">● 연결됨 · ssh-server.dcucode.local:32022</div>
    </header>

    <div class="terminal mono">
      <div v-for="(line, i) in terminalLines" :key="i" :class="['line', line.dim && 'line-dim']">
        <span v-if="line.prompt" class="prompt">{{ line.prompt }}</span>
        <span class="text">{{ line.text }}</span>
        <span v-if="line.cursor" class="cursor">█</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { height: calc(100vh - 56px); display: flex; flex-direction: column; background: var(--bg); }

.bar { display: flex; align-items: center; gap: 16px; padding: 6px 12px; border-bottom: 1px solid var(--line); }
.tabs { display: flex; gap: 2px; flex: 1; }
.tab { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: transparent; border: none; border-radius: var(--r-sm); font-size: 12px; color: var(--ink-3); cursor: pointer; font-family: inherit; }
.tab:hover { background: var(--sunken); color: var(--ink); }
.tab-active { background: #0E0E12; color: #E0E0DC; }
.tab-add { padding: 6px 8px; }
.close { display: inline-grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; }
.close:hover { background: rgba(255,255,255,0.15); }
.status { font-size: 11px; color: var(--ink-3); }

.terminal { flex: 1; padding: 20px; background: #0E0E12; color: #E0E0DC; font-size: 13px; overflow-y: auto; line-height: 1.6; }
.line { display: flex; gap: 8px; }
.line-dim { color: #888; }
.prompt { color: #6FE07A; flex-shrink: 0; }
.cursor { background: #E0E0DC; color: #0E0E12; }
</style>
