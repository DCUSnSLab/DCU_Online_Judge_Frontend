<template>
  <div class="eval-controls">
    <!-- 진행 상태 (활성 job 있을 때만) — 버튼 왼쪽에 inline -->
    <div v-if="effectiveTotal > 0 || status" class="eval-status">
      <Progress v-if="effectiveTotal > 0"
                :percent="progressPercent"
                :stroke-width="4"
                hide-info
                status="active"
                class="prog"/>
      <span v-if="effectiveTotal > 0" class="prog-text">
        {{ effectiveDone }}/{{ effectiveTotal }}
        <span class="prog-pct">({{ progressPercent }}%)</span>
      </span>
      <span v-if="status" class="status-text" :title="status">{{ status }}</span>
    </div>
    <Button :disabled="primaryDisabled"
            @click="trigger(false)"
            type="primary"
            size="small"
            class="btn primary-btn">
      <Icon type="ios-flash"/>
      {{ primaryLabel }}
    </Button>
    <Button :disabled="forceDisabled"
            @click="trigger(true)"
            size="small"
            class="btn">
      {{ $t('m.EvalReevaluate') }}
    </Button>
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
        status: ''
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
        return (this.activeJob && this.activeJob.n_total) || 0
      },
      effectiveDone () {
        return (this.activeJob && this.activeJob.n_done !== undefined) ? this.activeJob.n_done : 0
      },
      progressPercent () {
        if (!this.effectiveTotal) return 0
        return Math.min(100, Math.round((this.effectiveDone / this.effectiveTotal) * 100))
      }
    },
    watch: {
      contestId () { this.status = '' },
      activeJob (job, oldJob) {
        if (oldJob && !job) {
          this.status = '완료'
          this.$emit('done')
          this.$store.dispatch('evalQueue/refreshOnce')
        }
      }
    },
    methods: {
      trigger (force) {
        this.triggering = true
        this.status = '요청 중…'
        EvalApi.triggerEval(this.contestId, force)
          .then(r => {
            this.status = r.joined_existing
              ? `기존 작업 합류 (대기 ${r.queue_position || 0})`
              : `시작 — ${r.n_to_run}/${r.n_total} 예정`
            this.$store.dispatch('evalQueue/refreshOnce')
          })
          .catch(e => { this.status = (e && e.detail) || '트리거 실패' })
          .finally(() => { this.triggering = false })
      }
    }
  }
</script>

<style lang="less" scoped>
  .eval-controls {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
  }
  .eval-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: var(--table-bottom-color);
    border-radius: 14px;
    height: 28px;
    .prog {
      width: 80px;
      flex-shrink: 0;
    }
    .prog-text {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      color: var(--text-color);
      opacity: 0.9;
      white-space: nowrap;
      .prog-pct { opacity: 0.65; font-weight: 500; margin-left: 2px; }
    }
    .status-text {
      font-size: 11px;
      color: var(--text-color);
      opacity: 0.75;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
  }
  .btn {
    flex-shrink: 0;
    height: 28px;
  }
  .primary-btn { font-weight: 600; }
</style>
