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
  // PR 4: SSE 제거. 진행률은 Vuex evalQueue 폴링(3초)만 사용.
  import { mapGetters } from 'vuex'
  import EvalApi from './EvalApi'

  export default {
    name: 'EvalControls',
    props: {
      contestId: { type: [String, Number], required: true },
      // PR 4 부터는 attach-job-id 무시 — 폴링이 동일 효과 제공.
      // 하위 호환을 위해 prop 은 유지하되 미사용.
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
      contestId () {
        this.status = ''
      },
      // job 이 큐에서 사라지면 (=done) 매트릭스 재로드 시그널
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
        this.status = '대기 중…'
        EvalApi.triggerEval(this.contestId, force)
          .then(r => {
            this.status = r.joined_existing
              ? `기존 작업 합류 (대기 ${r.queue_position || 0})`
              : `시작 — ${r.n_to_run}/${r.n_total} 평가 예정`
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
