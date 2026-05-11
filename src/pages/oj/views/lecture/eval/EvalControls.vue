<template>
  <div class="eval-controls">
    <div class="btn-row">
      <Button :disabled="primaryDisabled"
              @click="trigger(false)"
              type="primary"
              size="small"
              class="primary-btn">
        <Icon type="ios-flash"/>
        {{ primaryLabel }}
      </Button>
      <Button :disabled="forceDisabled"
              @click="trigger(true)"
              size="small">
        {{ $t('m.EvalReevaluate') }}
      </Button>
    </div>
    <div v-if="status || effectiveTotal > 0" class="status-row">
      <Progress v-if="effectiveTotal > 0"
                :percent="progressPercent"
                :stroke-width="4"
                hide-info
                status="active"
                class="prog"/>
      <span class="status" v-if="status" :title="status">{{ status }}</span>
      <span v-if="effectiveTotal > 0" class="prog-text">
        {{ effectiveDone }}/{{ effectiveTotal }} ({{ progressPercent }}%)
      </span>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import EvalApi from './EvalApi'

  export default {
    name: 'EvalControls',
    props: {
      contestId: { type: [String, Number], required: true },
      attachJobId: { type: String, default: null }
    },
    data () {
      return {
        triggering: false,
        status: '',
        es: null,
        sseDone: 0,
        sseTotal: 0,
        attachedJobId: null
      }
    },
    computed: {
      ...mapGetters('evalQueue', ['jobByContestId']),
      activeJob () { return this.jobByContestId(this.contestId) },
      isActive () { return !!this.activeJob },
      primaryDisabled () { return this.triggering || this.isActive },
      forceDisabled () { return this.triggering || this.isActive },
      primaryLabel () {
        if (this.triggering) return this.$t('m.EvalRequesting')
        if (this.isActive) return this.$t('m.EvalInProgress')
        return this.$t('m.EvalRunQualitative')
      },
      effectiveTotal () {
        if (this.sseTotal > 0) return this.sseTotal
        if (this.activeJob && this.activeJob.n_total) return this.activeJob.n_total
        return 0
      },
      effectiveDone () {
        if (this.sseTotal > 0) return this.sseDone
        if (this.activeJob && this.activeJob.n_done !== undefined) return this.activeJob.n_done
        return 0
      },
      progressPercent () {
        if (!this.effectiveTotal) return 0
        return Math.min(100, Math.round((this.effectiveDone / this.effectiveTotal) * 100))
      }
    },
    watch: {
      contestId () {
        this.closeStream()
        this.status = ''
        this.sseDone = 0
        this.sseTotal = 0
        this.maybeAttach()
      },
      attachJobId () { this.maybeAttach() },
      activeJob: {
        immediate: false,
        handler (job) {
          if (job && !this.es && job.job_id !== this.attachedJobId) {
            this.openStream(job.job_id)
          }
        }
      }
    },
    mounted () { this.maybeAttach() },
    beforeDestroy () { this.closeStream() },
    methods: {
      maybeAttach () {
        const jid = this.attachJobId || (this.activeJob && this.activeJob.job_id)
        if (jid && this.attachedJobId !== jid) this.openStream(jid)
      },
      trigger (force) {
        this.triggering = true
        this.status = '대기 중…'
        this.sseDone = 0
        this.sseTotal = 0
        EvalApi.triggerEval(this.contestId, force)
          .then(r => {
            this.status = r.joined_existing
              ? `기존 작업 합류 (대기 ${r.queue_position || 0})`
              : `시작 — ${r.n_to_run}/${r.n_total} 평가 예정`
            this.openStream(r.job_id)
            this.$store.dispatch('evalQueue/refreshOnce')
          })
          .catch(e => { this.status = (e && e.detail) || '트리거 실패' })
          .finally(() => { this.triggering = false })
      },
      openStream (jobId) {
        if (!jobId) return
        if (this.attachedJobId === jobId && this.es) return
        this.closeStream()
        const url = EvalApi.streamJobUrl(jobId)
        const es = new EventSource(url, { withCredentials: true })
        this.es = es
        this.attachedJobId = jobId
        es.addEventListener('queued', (ev) => {
          const d = JSON.parse(ev.data)
          this.status = `대기 ${d.queue_position}/${d.queue_size}`
        })
        es.addEventListener('queue-update', (ev) => {
          const d = JSON.parse(ev.data)
          this.status = `대기 갱신: ${d.queue_position}`
        })
        es.addEventListener('started', (ev) => {
          const d = JSON.parse(ev.data)
          this.status = `시작 — ${d.n_total}건`
          this.sseTotal = d.n_total || 0
          this.sseDone = 0
        })
        es.addEventListener('stage', (ev) => {
          const d = JSON.parse(ev.data)
          this.status = `Stage: ${d.name}`
        })
        es.addEventListener('progress', (ev) => {
          const d = JSON.parse(ev.data)
          this.sseDone = d.n
          this.sseTotal = d.total || this.sseTotal
          this.status = `${d.current_user}@${d.current_problem}`
        })
        es.addEventListener('done', (ev) => {
          const d = JSON.parse(ev.data)
          this.status = d.skipped
            ? '이미 모두 평가됨'
            : `완료 — ${d.n_evaluated} 평가, ${d.n_failed} 실패`
          this.$emit('done')
          this.$store.dispatch('evalQueue/refreshOnce')
          this.closeStream()
        })
        es.addEventListener('error', () => {
          this.status = '스트림 오류 — 폴링으로 진행 추적'
          this.closeStream()
        })
      },
      closeStream () {
        if (this.es) {
          try { this.es.close() } catch (e) {}
          this.es = null
        }
        this.attachedJobId = null
      }
    }
  }
</script>

<style lang="less" scoped>
  .eval-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    min-width: 0;
    max-width: 520px;
    width: 100%;
    .btn-row {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .primary-btn { font-weight: 600; }
    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-width: 0;
      .prog {
        flex: 1;
        min-width: 60px;
        max-width: 200px;
      }
      .status {
        font-size: 11px;
        color: var(--text-color);
        opacity: 0.75;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 0 1 auto;
        min-width: 0;
      }
      .prog-text {
        font-size: 11px;
        opacity: 0.75;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }
    }
  }
</style>
