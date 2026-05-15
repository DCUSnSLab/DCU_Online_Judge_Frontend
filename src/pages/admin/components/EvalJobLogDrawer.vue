<template>
  <el-drawer
    :visible="visible"
    :with-header="false"
    :destroy-on-close="false"
    size="560px"
    direction="rtl"
    @update:visible="onVisibleChange">
    <div class="ejld">
      <div class="ejld-header">
        <div class="ejld-title">
          <span class="job-id">Job #{{ jobId || '-' }}</span>
          <el-tag size="mini" :type="statusTagType">{{ meta.status || '...' }}</el-tag>
          <span v-if="meta.contest_title" class="ctx">
            {{ meta.lecture_title || ('강의 ' + meta.lecture_id) }} ·
            <strong>{{ meta.contest_title }}</strong>
            <span v-if="meta.contest_type" class="ctype">{{ meta.contest_type }}</span>
          </span>
        </div>
        <div class="ejld-progress">
          <el-progress
            :percentage="pct"
            :status="meta.n_failed > 0 ? 'warning' : (statusFinished ? 'success' : null)"
            :stroke-width="8"></el-progress>
          <span class="counts">{{ meta.n_done || 0 }} + {{ meta.n_failed || 0 }} / {{ meta.n_total || 0 }}</span>
        </div>
        <div v-if="meta.error" class="ejld-toperr">
          <i class="el-icon-warning"></i> {{ meta.error }}
        </div>
        <div class="ejld-filter">
          <el-radio-group v-model="filter" size="mini" @change="onFilterChange">
            <el-radio-button label="all">전체</el-radio-button>
            <el-radio-button label="problem">경고/에러</el-radio-button>
            <el-radio-button label="progress">진행</el-radio-button>
          </el-radio-group>
          <span class="auto-refresh">
            자동 새로고침
            <el-switch v-model="autoRefresh" @change="onAutoRefreshChange"></el-switch>
          </span>
          <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="manualRefresh">새로고침</el-button>
        </div>
      </div>

      <div class="ejld-body">
        <div v-if="loading && events.length === 0" class="placeholder">
          <i class="el-icon-loading"></i> 이벤트 로드 중…
        </div>
        <div v-else-if="loadError" class="placeholder err">{{ loadError }}</div>
        <div v-else-if="events.length === 0" class="placeholder muted">이벤트 없음</div>
        <ul v-else class="timeline">
          <li v-for="(ev, idx) in events" :key="ev.ts + '-' + idx" :class="['ev', 'ev-' + ev.event_type]">
            <div class="ev-row" @click="toggle(idx)">
              <el-tag size="mini" :type="tagType(ev.event_type)" :effect="ev.event_type === 'error' ? 'dark' : 'plain'">
                {{ ev.event_type }}
              </el-tag>
              <span class="ts">{{ fmtTs(ev.ts) }}</span>
              <span class="summary">{{ summarize(ev) }}</span>
              <i :class="['el-icon-arrow-' + (expanded[idx] ? 'up' : 'down'), 'caret']"></i>
            </div>
            <pre v-if="expanded[idx]" class="ev-json">{{ stringify(ev.data) }}</pre>
          </li>
        </ul>
        <div v-if="truncated" class="placeholder muted small">
          최대 표시 한도(200건)에 도달했습니다. 이전 이벤트는 백엔드에 보존돼 있습니다.
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>
  import api from '../api.js'

  const FINISHED = new Set(['done', 'failed', 'cancelled'])
  const TAG_TYPES = {
    error: 'danger',
    warn: 'warning',
    progress: 'info',
    stage: 'primary',
    done: 'success',
    started: 'success',
    log: '',
    queued: 'info'
  }

  export default {
    name: 'EvalJobLogDrawer',
    props: {
      jobId: { type: [String, Number], default: null },
      visible: { type: Boolean, default: false }
    },
    data () {
      return {
        meta: {},
        events: [],
        expanded: {},
        lastTs: null,
        loading: false,
        loadError: '',
        truncated: false,
        filter: 'all',
        autoRefresh: true,
        pollTimer: null
      }
    },
    computed: {
      pct () {
        const n = this.meta.n_total || 0
        if (!n) return 0
        return Math.min(100, Math.round((((this.meta.n_done || 0) + (this.meta.n_failed || 0)) / n) * 100))
      },
      statusFinished () { return FINISHED.has(this.meta.status) },
      statusTagType () {
        const s = this.meta.status
        if (s === 'failed') return 'danger'
        if (s === 'cancelled') return 'warning'
        if (s === 'done') return 'success'
        if (s === 'running') return 'primary'
        return 'info'
      },
      typesParam () {
        if (this.filter === 'problem') return 'warn,error'
        if (this.filter === 'progress') return 'progress,stage,started,done'
        return null
      }
    },
    watch: {
      visible (v) {
        if (v) this.open()
        else this.stopPoll()
      },
      jobId (v, prev) {
        if (this.visible && v !== prev) this.open()
      }
    },
    beforeDestroy () { this.stopPoll() },
    methods: {
      open () {
        this.resetState()
        if (this.jobId == null) return
        this.fetch(true).then(() => {
          if (!this.statusFinished && this.autoRefresh) this.startPoll()
        })
      },
      resetState () {
        this.events = []
        this.expanded = {}
        this.lastTs = null
        this.loadError = ''
        this.truncated = false
      },
      startPoll () {
        this.stopPoll()
        this.pollTimer = setInterval(() => this.fetch(false), 2000)
      },
      stopPoll () {
        if (this.pollTimer) {
          clearInterval(this.pollTimer)
          this.pollTimer = null
        }
      },
      fetch (initial) {
        if (this.jobId == null) return Promise.resolve()
        if (initial) this.loading = true
        const params = { limit: initial ? 200 : 50 }
        if (!initial && this.lastTs) params.since = this.lastTs
        if (this.typesParam) params.types = this.typesParam
        return api.getEvalJob(this.jobId, params).then(res => {
          // eval/views/oj.py 의 _ok() 는 raw payload 를 그대로 반환 (admin 측의 {error,data} wrapper 없음)
          const d = res.data
          if (!d || d.detail) {
            this.loadError = (d && d.detail) || '응답 없음'
            return
          }
          this.meta = {
            status: d.status,
            lecture_id: d.lecture_id,
            lecture_title: d.lecture_title,
            contest_id: d.contest_id,
            contest_title: d.contest_title,
            contest_type: d.contest_type,
            n_done: d.n_done,
            n_failed: d.n_failed,
            n_total: d.n_total,
            error: d.error
          }
          const incoming = d.events || []
          if (initial) {
            this.events = incoming
            this.expanded = {}
          } else if (incoming.length) {
            // 응답은 -ts 정렬, 기존 events 앞에 prepend → 새 이벤트가 위로
            this.events = incoming.concat(this.events)
          }
          if (d.last_ts) this.lastTs = d.last_ts
          this.truncated = !!d.events_truncated
          if (this.statusFinished) this.stopPoll()
        }).catch(() => {
          this.loadError = '이벤트 로드 실패'
        }).finally(() => {
          if (initial) this.loading = false
        })
      },
      manualRefresh () { this.fetch(false) },
      onVisibleChange (v) { if (!v) this.$emit('close') },
      onFilterChange () { this.resetState(); this.fetch(true).then(() => { if (!this.statusFinished && this.autoRefresh) this.startPoll() }) },
      onAutoRefreshChange (v) {
        if (v && !this.statusFinished) this.startPoll()
        else this.stopPoll()
      },
      toggle (idx) { this.$set(this.expanded, idx, !this.expanded[idx]) },
      tagType (t) { return TAG_TYPES[t] != null ? TAG_TYPES[t] : '' },
      fmtTs (iso) {
        if (!iso) return '-'
        const d = new Date(iso)
        const hms = d.toLocaleTimeString('ko-KR', { hour12: false })
        const ms = String(d.getMilliseconds()).padStart(3, '0')
        return `${hms}.${ms}`
      },
      summarize (ev) {
        const t = ev.event_type
        const data = ev.data || {}
        if (t === 'progress') return `n_done=${data.n_done}, n_failed=${data.n_failed}`
        if (t === 'stage') return data.name || data.stage || data.message || ''
        if (t === 'error') return data.error || data.message || '에러 발생'
        if (t === 'warn') return data.message || data.warning || '경고'
        if (t === 'done') return data.message || '완료'
        if (t === 'started') return data.message || '시작'
        // generic fallback
        const k = Object.keys(data)[0]
        if (!k) return ''
        const v = data[k]
        const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
        return `${k}: ${str.length > 80 ? str.slice(0, 80) + '…' : str}`
      },
      stringify (obj) {
        try { return JSON.stringify(obj == null ? {} : obj, null, 2) } catch (e) { return String(obj) }
      }
    }
  }
</script>

<style lang="less" scoped>
  .ejld {
    display: flex;
    flex-direction: column;
    height: 100%;
    .ejld-header {
      padding: 16px 18px 12px;
      border-bottom: 1px solid #ebeef5;
      background: #fafbfc;
    }
    .ejld-title {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
      .job-id { font-weight: 700; font-size: 15px; }
      .ctx { font-size: 12px; color: #555; margin-left: 4px; }
      .ctype {
        display: inline-block; margin-left: 4px; font-size: 10px;
        padding: 1px 6px; background: #eef0f3; border-radius: 8px; color: #606266;
      }
    }
    .ejld-progress {
      display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
      .el-progress { flex: 1; }
      .counts { font-size: 12px; color: #606266; font-variant-numeric: tabular-nums; min-width: 80px; text-align: right; }
    }
    .ejld-toperr {
      background: #fff1f0; border: 1px solid #ffccc7; color: #cf1322;
      border-radius: 4px; padding: 6px 10px; font-size: 12px; margin-bottom: 8px;
      i { margin-right: 4px; }
    }
    .ejld-filter {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #606266;
      .auto-refresh { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; }
    }
    .ejld-body {
      flex: 1; overflow-y: auto; padding: 8px 0 16px;
    }
    .placeholder { padding: 32px 16px; text-align: center; color: #999; }
    .placeholder.err { color: #ed4014; }
    .placeholder.muted { opacity: 0.7; }
    .placeholder.small { font-size: 11px; padding: 12px; }
    .timeline { list-style: none; margin: 0; padding: 0; }
    .ev {
      border-bottom: 1px solid #f3f4f6;
      &.ev-error { background: #fff1f0; }
      &.ev-warn { background: #fffbe6; }
      .ev-row {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 18px;
        cursor: pointer;
        font-size: 12px;
        &:hover { background: rgba(0,0,0,0.02); }
        .ts {
          font-variant-numeric: tabular-nums;
          color: #909399;
          font-size: 11px;
          min-width: 90px;
        }
        .summary {
          flex: 1;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .caret { color: #c0c4cc; }
      }
      .ev-json {
        margin: 0;
        padding: 8px 18px 12px;
        background: #f8f9fa;
        font-size: 11px;
        line-height: 1.5;
        max-height: 320px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
</style>
