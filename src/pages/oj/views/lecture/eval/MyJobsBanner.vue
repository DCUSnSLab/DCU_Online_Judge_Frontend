<template>
  <div v-show="show" class="my-jobs-banner">
    <div class="lead">
      <Icon type="ios-flash" class="lead-icon"/>
      <span class="lead-label">{{ $t('m.EvalMyJobs') }}</span>
      <span class="slot-pill">
        {{ $t('m.EvalSlots') }} {{ slotsInUse }}/{{ slotsTotal }}
      </span>
      <span class="slot-pill">
        {{ $t('m.EvalQueue') }} {{ queueSize }}
      </span>
    </div>
    <div class="jobs">
      <span v-for="j in myRunningJobs"
            :key="'r' + j.job_id"
            class="job-pill running"
            :title="fullTitleFor(j)">
        <span class="pill-body" @click="goTo(j)">
          <span class="lec">{{ lectureNameFor(j) }}</span>
          <span class="sep">›</span>
          <span class="ttl">{{ contestNameFor(j) }}</span>
          <span class="prog">{{ j.n_done }}/{{ j.n_total }}</span>
          <span class="pct">{{ pctOf(j) }}%</span>
          <span v-if="j.n_failed > 0"
                class="failed"
                :title="`정성평가 실패: ${j.n_failed}건`">
            실패 {{ j.n_failed }}
          </span>
          <span v-if="(j.requester_ids || []).length > 1"
                class="multi"
                :title="$t('m.EvalMyJobs')">
            +{{ (j.requester_ids || []).length - 1 }}
          </span>
        </span>
        <Poptip confirm
                transfer
                placement="bottom-end"
                :title="cancelConfirmTitle(j)"
                ok-text="중지"
                cancel-text="취소"
                @on-ok="cancel(j)">
          <span class="cancel-x" title="이 정성평가 중지">
            <Icon type="close"/>
          </span>
        </Poptip>
      </span>
      <span v-for="j in myPendingJobs"
            :key="'p' + j.job_id"
            class="job-pill pending"
            :title="fullTitleFor(j)">
        <span class="pill-body" @click="goTo(j)">
          <span class="lec">{{ lectureNameFor(j) }}</span>
          <span class="sep">›</span>
          <span class="ttl">{{ contestNameFor(j) }}</span>
          <span class="prog">{{ waitingLabel(j) }}</span>
        </span>
        <Poptip confirm
                transfer
                placement="bottom-end"
                :title="cancelConfirmTitle(j)"
                ok-text="중지"
                cancel-text="취소"
                @on-ok="cancel(j)">
          <span class="cancel-x" title="이 정성평가 중지">
            <Icon type="close"/>
          </span>
        </Poptip>
      </span>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import EvalApi from './EvalApi'

  export default {
    name: 'MyJobsBanner',
    computed: {
      ...mapGetters(['user', 'isAuthenticated', 'isAdminRole']),
      ...mapGetters('evalQueue', [
        'myRunningJobs',
        'myPendingJobs',
        'myJobsCount',
        'evalSlotsTotal',
        'evalSlotsInUse',
        'evalQueueSize',
        'evalLectureTitle'
      ]),
      slotsTotal () { return this.evalSlotsTotal },
      slotsInUse () { return this.evalSlotsInUse },
      queueSize () { return this.evalQueueSize },
      show () {
        return this.isAuthenticated && this.isAdminRole && this.myJobsCount > 0
      }
    },
    watch: {
      isAuthenticated: {
        immediate: true,
        handler (v) {
          if (v && this.isAdminRole) this.bootPolling()
          else this.shutdownPolling()
        }
      },
      isAdminRole (v) {
        if (v && this.isAuthenticated) this.bootPolling()
        else this.shutdownPolling()
      }
    },
    beforeDestroy () { this.shutdownPolling() },
    methods: {
      bootPolling () {
        if (this._booted) return
        this._booted = true
        this.$store.dispatch('evalQueue/init', this.user.id)
        this.$store.dispatch('evalQueue/startPolling')
      },
      shutdownPolling () {
        if (!this._booted) return
        this._booted = false
        this.$store.dispatch('evalQueue/stopPolling')
      },
      lectureNameFor (j) {
        // Backend 가 lecture_title 동봉 — 옛 응답 호환 위해 Vuex 캐시 fallback
        const t = j.lecture_title || this.evalLectureTitle(j.lecture_id)
        if (!t) return `강의 ${j.lecture_id}`
        return t.length > 18 ? t.slice(0, 16) + '…' : t
      },
      contestNameFor (j) {
        const t = j.contest_title
        if (!t) return `#${j.contest_id}`
        return t.length > 22 ? t.slice(0, 20) + '…' : t
      },
      fullTitleFor (j) {
        // 마우스 오버 시 전체 텍스트
        const lec = j.lecture_title || this.evalLectureTitle(j.lecture_id) || `강의 ${j.lecture_id}`
        const con = j.contest_title || `#${j.contest_id}`
        return `${lec} › ${con}`
      },
      pctOf (j) {
        if (!j.n_total) return 0
        return Math.min(100, Math.round((j.n_done / j.n_total) * 100))
      },
      waitingLabel (j) {
        const tmpl = this.$t('m.EvalWaitingNth')
        return tmpl.replace('{n}', j.queue_position)
      },
      goTo (j) {
        // 같은 route + 같은 query 면 vue-router 가 NavigationDuplicated 를 throw — 무시.
        this.$router.push({
          name: 'lecture-details',
          params: { lectureID: j.lecture_id },
          query: { tab: 'by-contest', contest: j.contest_id }
        }).catch(() => {})
      },
      cancelConfirmTitle (j) {
        const remaining = Math.max(0, (j.n_total || 0) - (j.n_done || 0) - (j.n_failed || 0))
        const con = j.contest_title || `컨테스트 ${j.contest_id}`
        return `‘${con}’ 정성평가를 중지하시겠습니까? 남은 ${remaining}건이 취소됩니다.`
      },
      cancel (j) {
        EvalApi.cancelJob(j.job_id)
          .then(() => this.$store.dispatch('evalQueue/refreshOnce'))
          .catch(e => {
            this.$Message.error((e && e.detail) || '중지 실패')
          })
      }
    }
  }
</script>

<style lang="less" scoped>
  .my-jobs-banner {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    padding: 10px 18px;
    margin: 0 12px 12px;
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-left: 3px solid var(--text-hover-color);
    border-radius: 10px;
    font-size: 12px;
    color: var(--text-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }
  .lead {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    .lead-icon {
      font-size: 16px;
      color: var(--text-hover-color);
    }
    .lead-label {
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .slot-pill {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--table-bottom-color);
      opacity: 0.85;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
  }
  .jobs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .job-pill {
    display: inline-flex;
    align-items: stretch;
    border-radius: 16px;
    border: 1px solid var(--panel-border-color);
    background: var(--panelBackground);
    transition: filter 0.12s, transform 0.12s, box-shadow 0.12s;
    font-size: 12px;
    line-height: 1.2;
    overflow: hidden;
    &:hover {
      filter: brightness(1.04);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .pill-body {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px 5px 12px;
      cursor: pointer;
    }
    .cancel-x {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 9px;
      cursor: pointer;
      border-left: 1px solid var(--panel-border-color);
      color: var(--text-color);
      opacity: 0.55;
      font-size: 14px;
      transition: background 0.12s, opacity 0.12s, color 0.12s;
      &:hover {
        background: #fef0f0;
        color: #c0392b;
        opacity: 1;
      }
    }
    .failed {
      font-size: 10px;
      padding: 1px 7px;
      border-radius: 9px;
      background: #fef0f0;
      color: #c0392b;
      font-weight: 700;
    }
    .lec {
      font-size: 11px;
      opacity: 0.7;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sep { opacity: 0.45; font-size: 11px; }
    .ttl {
      font-weight: 600;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .prog { opacity: 0.85; font-variant-numeric: tabular-nums; font-weight: 600; }
    .pct { opacity: 0.65; font-variant-numeric: tabular-nums; font-size: 11px; }
    .multi {
      font-size: 10px;
      padding: 1px 6px;
      background: var(--text-hover-color);
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
    }
    &.running {
      border-left: 3px solid #19be6b;
      .ttl { color: var(--text-color); }
    }
    &.pending {
      border-left: 3px solid #ff9900;
      opacity: 0.92;
    }
  }
</style>
