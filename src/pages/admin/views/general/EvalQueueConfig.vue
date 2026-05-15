<template>
  <div>
    <Panel :title="'LLM 정성평가 큐 설정'">
      <div class="eval-queue-config">
        <p class="hint">
          정성평가는 LLM 호출 비용이 큰 작업입니다.
          <strong>슬롯 수</strong>는 동시에 진행 가능한 평가 요청(Job) 수,
          <strong>요청당 워커 수</strong>는 한 평가 요청 안에서 동시 처리되는 pair (LLM 호출) 수입니다.
          시스템 전체 동시 LLM 호출 한도는 두 값의 곱이며, dramatiq 워커 thread 수 이하여야 throughput 손실 없습니다.
          한도 변경은 즉시 적용됩니다.
        </p>

        <div v-if="loading" class="placeholder">
          <i class="el-icon-loading"></i> 로드 중…
        </div>
        <div v-else-if="error" class="placeholder error">{{ error }}</div>
        <div v-else>
          <div class="status">
            <div class="stat">
              <div class="lbl">슬롯 한도</div>
              <div class="val">{{ snapshot.slots_total }}</div>
            </div>
            <div class="stat" :class="{ busy: snapshot.slots_in_use >= snapshot.slots_total }">
              <div class="lbl">진행 중 요청</div>
              <div class="val">{{ snapshot.slots_in_use }} / {{ snapshot.slots_total }}</div>
            </div>
            <div class="stat">
              <div class="lbl">요청당 워커</div>
              <div class="val">{{ snapshot.pair_workers_per_job }}</div>
            </div>
            <div class="stat">
              <div class="lbl">대기 큐</div>
              <div class="val">{{ snapshot.queue_size }}</div>
            </div>
          </div>

          <div class="form">
            <div class="form-row">
              <label class="label">슬롯 수 (동시 요청)</label>
              <el-input-number v-model="newSlots" :min="1" :max="64" size="small" style="width: 140px;"></el-input-number>
            </div>
            <div class="form-row">
              <label class="label">요청당 워커 (Job 내 동시 LLM 호출)</label>
              <el-input-number v-model="newPairWorkers" :min="1" :max="16" size="small" style="width: 140px;"></el-input-number>
            </div>
            <div class="form-row">
              <el-button type="primary" size="small"
                         :loading="saving"
                         :disabled="!hasChanges"
                         @click="save">
                적용
              </el-button>
              <span v-if="hasChanges" class="apply-hint">
                <span v-if="newSlots !== snapshot.slots_total">
                  슬롯 {{ snapshot.slots_total }} → {{ newSlots }}
                </span>
                <span v-if="newSlots !== snapshot.slots_total && newPairWorkers !== snapshot.pair_workers_per_job"> / </span>
                <span v-if="newPairWorkers !== snapshot.pair_workers_per_job">
                  요청당 워커 {{ snapshot.pair_workers_per_job }} → {{ newPairWorkers }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Panel>

    <Panel v-if="!loading" :title="'진행 중 / 대기 작업'" style="margin-top: 16px;">
      <div v-if="snapshot.running.length === 0 && snapshot.pending.length === 0" class="placeholder muted">
        활성 작업이 없습니다.
      </div>
      <div v-else>
        <h4 v-if="snapshot.running.length">진행 중 ({{ snapshot.running.length }})</h4>
        <el-table v-if="snapshot.running.length"
                  :data="snapshot.running"
                  border size="small" style="width: 100%; margin-bottom: 16px;">
          <el-table-column prop="id" label="Job" width="70"></el-table-column>
          <el-table-column label="강의">
            <template slot-scope="s">{{ s.row.lecture_title || ('강의 ' + s.row.lecture_id) }}</template>
          </el-table-column>
          <el-table-column label="컨테스트">
            <template slot-scope="s">
              <span style="font-weight:600;">{{ s.row.contest_title || ('#' + s.row.contest_id) }}</span>
              <span v-if="s.row.contest_type" class="ctype">{{ s.row.contest_type }}</span>
            </template>
          </el-table-column>
          <el-table-column label="진행률" width="240">
            <template slot-scope="s">
              <el-progress :percentage="pct(s.row)" :status="s.row.n_failed > 0 ? 'warning' : 'success'"></el-progress>
              <span class="tabnum">{{ s.row.n_done }} + {{ s.row.n_failed }} / {{ s.row.n_total }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="started_at" label="시작" :formatter="fmtTime" width="150"></el-table-column>
          <el-table-column label="로그" width="80" align="center">
            <template slot-scope="s">
              <el-button size="mini" @click="openLog(s.row.id)">로그</el-button>
            </template>
          </el-table-column>
        </el-table>

        <h4 v-if="snapshot.pending.length">대기 중 ({{ snapshot.pending.length }})</h4>
        <el-table v-if="snapshot.pending.length"
                  :data="snapshot.pending"
                  border size="small" style="width: 100%;">
          <el-table-column prop="id" label="Job" width="70"></el-table-column>
          <el-table-column label="강의">
            <template slot-scope="s">{{ s.row.lecture_title || ('강의 ' + s.row.lecture_id) }}</template>
          </el-table-column>
          <el-table-column label="컨테스트">
            <template slot-scope="s">
              <span style="font-weight:600;">{{ s.row.contest_title || ('#' + s.row.contest_id) }}</span>
              <span v-if="s.row.contest_type" class="ctype">{{ s.row.contest_type }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="n_total" label="예정" width="80"></el-table-column>
          <el-table-column prop="enqueued_at" label="enqueue" :formatter="fmtTime" width="150"></el-table-column>
          <el-table-column label="로그" width="80" align="center">
            <template slot-scope="s">
              <el-button size="mini" @click="openLog(s.row.id)">로그</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </Panel>

    <eval-job-log-drawer :job-id="logJobId" :visible="logVisible" @close="logVisible = false" />
  </div>
</template>

<script>
  import api from '../../api.js'
  import Panel from '../../components/Panel.vue'
  import EvalJobLogDrawer from '../../components/EvalJobLogDrawer.vue'

  export default {
    name: 'EvalQueueConfig',
    components: { Panel, EvalJobLogDrawer },
    data () {
      return {
        loading: true,
        saving: false,
        error: '',
        snapshot: { slots_total: 0, slots_in_use: 0, pair_workers_per_job: 0, queue_size: 0, running: [], pending: [] },
        newSlots: 3,
        newPairWorkers: 2,
        pollHandle: null,
        logVisible: false,
        logJobId: null
      }
    },
    computed: {
      hasChanges () {
        return this.newSlots !== this.snapshot.slots_total ||
               this.newPairWorkers !== this.snapshot.pair_workers_per_job
      }
    },
    mounted () {
      this.fetch()
      this.pollHandle = setInterval(() => this.fetch(true), 3000)
    },
    beforeDestroy () {
      if (this.pollHandle) clearInterval(this.pollHandle)
    },
    methods: {
      fetch (silent) {
        if (!silent) this.loading = true
        this.error = ''
        api.getEvalQueueConfig().then(res => {
          if (res.data.error) {
            this.error = res.data.data || '로드 실패'
          } else {
            const wasSlots = this.snapshot.slots_total
            const wasPairs = this.snapshot.pair_workers_per_job
            this.snapshot = res.data.data
            // 사용자가 아직 input 을 만지지 않았으면 서버 값으로 동기화
            if (this.newSlots === wasSlots || wasSlots === 0) {
              this.newSlots = this.snapshot.slots_total
            }
            if (this.newPairWorkers === wasPairs || wasPairs === 0) {
              this.newPairWorkers = this.snapshot.pair_workers_per_job
            }
          }
        }).catch(() => {
          this.error = '큐 정보 로드 실패'
        }).finally(() => {
          if (!silent) this.loading = false
        })
      },
      save () {
        if (this.saving || !this.hasChanges) return
        this.saving = true
        this.error = ''
        const payload = {}
        if (this.newSlots !== this.snapshot.slots_total) payload.max_concurrent_jobs = this.newSlots
        if (this.newPairWorkers !== this.snapshot.pair_workers_per_job) payload.pair_workers_per_job = this.newPairWorkers
        api.setEvalQueueConfig(payload).then(res => {
          if (res.data.error) {
            this.error = res.data.data
          } else {
            const d = res.data.data
            this.snapshot = {
              slots_total: d.slots_total,
              slots_in_use: d.slots_in_use,
              pair_workers_per_job: d.pair_workers_per_job,
              queue_size: d.queue_size,
              running: d.running,
              pending: d.pending
            }
            this.newSlots = this.snapshot.slots_total
            this.newPairWorkers = this.snapshot.pair_workers_per_job
            this.$Message.success(`적용됨: 슬롯 ${this.snapshot.slots_total} / 요청당 워커 ${this.snapshot.pair_workers_per_job}`)
          }
        }).catch(e => {
          this.error = (e && e.data) || '변경 실패'
        }).finally(() => {
          this.saving = false
        })
      },
      pct (row) {
        if (!row.n_total) return 0
        return Math.min(100, Math.round(((row.n_done + row.n_failed) / row.n_total) * 100))
      },
      fmtTime (row, col, val) {
        if (!val) return '-'
        const d = new Date(val)
        return d.toLocaleString('ko-KR', { hour12: false })
      },
      openLog (id) {
        this.logJobId = id
        this.logVisible = true
      }
    }
  }
</script>

<style lang="less" scoped>
  .eval-queue-config {
    padding: 8px 4px;
    .hint {
      font-size: 13px;
      color: #555;
      line-height: 1.6;
      margin-bottom: 18px;
      strong { color: #2d8cf0; }
    }
    .placeholder { padding: 24px; text-align: center; }
    .placeholder.error { color: #ed4014; }
    .placeholder.muted { opacity: 0.6; }

    .status {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
      .stat {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 14px 16px;
        transition: border-color 0.15s;
        .lbl { font-size: 11px; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .val { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
        &.busy { border-color: #ff9900; .val { color: #ff9900; } }
      }
    }

    .form {
      padding: 16px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      .form-row {
        display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        margin-bottom: 10px;
        &:last-child { margin-bottom: 0; }
      }
      .label { display: inline-block; font-size: 12px; font-weight: 600; color: #495057; min-width: 200px; }
      .apply-hint {
        font-size: 12px; color: #666;
        .warn { color: #ff9900; margin-left: 4px; }
      }
    }
  }

  h4 { margin: 12px 0 8px; font-size: 13px; color: #495057; }
  .tabnum { display: inline-block; margin-left: 8px; font-size: 11px; color: #666; font-variant-numeric: tabular-nums; }
  .ctype {
    display: inline-block;
    margin-left: 6px;
    font-size: 10px;
    padding: 1px 6px;
    background: #f0f2f5;
    color: #606266;
    border-radius: 8px;
  }
</style>
