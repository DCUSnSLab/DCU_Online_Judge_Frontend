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
      <span v-if="effectiveFailed > 0"
            class="failed-pill"
            :title="`정성평가 실패: ${effectiveFailed}건. 클릭해 ‘재평가’ 시 다시 시도합니다.`">
        실패 {{ effectiveFailed }}
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
    <Poptip v-if="isActive"
            confirm
            transfer
            placement="bottom-end"
            :title="cancelConfirmTitle"
            ok-text="중지"
            cancel-text="취소"
            @on-ok="cancel">
      <Button size="small" type="error" ghost :loading="cancelling" class="btn">
        중지
      </Button>
    </Poptip>
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
        cancelling: false,
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
      effectiveFailed () {
        return (this.activeJob && this.activeJob.n_failed) || 0
      },
      progressPercent () {
        if (!this.effectiveTotal) return 0
        // 진행률은 완료 + 실패 모두 포함 — 사용자가 전체 진행도를 직관적으로 파악
        const handled = this.effectiveDone + this.effectiveFailed
        return Math.min(100, Math.round((handled / this.effectiveTotal) * 100))
      },
      cancelConfirmTitle () {
        if (!this.activeJob) return ''
        const remaining = Math.max(0, this.effectiveTotal - this.effectiveDone - this.effectiveFailed)
        return `이 정성평가를 중지하시겠습니까? 남은 ${remaining}건이 취소됩니다.`
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
      },
      cancel () {
        const job = this.activeJob
        if (!job || this.cancelling) return
        this.cancelling = true
        this.status = '중지 요청 중…'
        EvalApi.cancelJob(job.job_id)
          .then(() => {
            this.status = '중지됨'
            this.$store.dispatch('evalQueue/refreshOnce')
          })
          .catch(e => {
            this.status = (e && e.detail) || '중지 실패'
          })
          .finally(() => { this.cancelling = false })
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
    .failed-pill {
      font-size: 10px;
      padding: 1px 7px;
      border-radius: 9px;
      background: #fef0f0;
      color: #c0392b;
      font-weight: 700;
      cursor: help;
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
