<template>
  <div>
    <Panel :title="'LLM 정성평가 큐 설정'">
      <div class="eval-queue-config">
        <p class="hint">
          정성평가는 LLM 호출 비용이 큰 작업입니다. <strong>슬롯 수</strong>는 동시에 LLM 게이트웨이로
          호출 가능한 평가 작업 수입니다. 값을 바꾸면 즉시 적용되며 (Redis 갱신 + DB 영구화),
          현재 실행 중인 작업은 끝까지 진행한 뒤 새 한도가 적용됩니다.
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
              <div class="lbl">사용 중</div>
              <div class="val">{{ snapshot.slots_in_use }} / {{ snapshot.slots_total }}</div>
            </div>
            <div class="stat">
              <div class="lbl">대기 큐</div>
              <div class="val">{{ snapshot.queue_size }}</div>
            </div>
            <div class="stat">
              <div class="lbl">진행 중 job</div>
              <div class="val">{{ snapshot.running.length }}</div>
            </div>
          </div>

          <div class="form">
            <label class="label">슬롯 수 변경</label>
            <div class="row">
              <el-input-number v-model="newValue" :min="1" :max="32" size="small" style="width: 140px;"></el-input-number>
              <el-button type="primary" size="small"
                         :loading="saving"
                         :disabled="newValue === snapshot.slots_total"
                         @click="save">
                적용
              </el-button>
              <span v-if="newValue !== snapshot.slots_total" class="apply-hint">
                {{ snapshot.slots_total }} → {{ newValue }} 으로 변경
                <span v-if="newValue < snapshot.slots_total" class="warn">
                  감소 시 현재 실행 중인 평가가 끝난 뒤 점진 적용
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
        </el-table>
      </div>
    </Panel>
  </div>
</template>

<script>
  import api from '../../api.js'
  import Panel from '../../components/Panel.vue'

  export default {
    name: 'EvalQueueConfig',
    components: { Panel },
    data () {
      return {
        loading: true,
        saving: false,
        error: '',
        snapshot: { slots_total: 0, slots_in_use: 0, queue_size: 0, running: [], pending: [] },
        newValue: 3,
        pollHandle: null
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
            this.snapshot = res.data.data
            if (this.newValue === wasSlots || wasSlots === 0) {
              this.newValue = this.snapshot.slots_total
            }
          }
        }).catch(() => {
          this.error = '큐 정보 로드 실패'
        }).finally(() => {
          if (!silent) this.loading = false
        })
      },
      save () {
        if (this.saving) return
        this.saving = true
        this.error = ''
        api.setEvalQueueConfig(this.newValue).then(res => {
          if (res.data.error) {
            this.error = res.data.data
          } else {
            this.snapshot = {
              slots_total: res.data.data.slots_total,
              slots_in_use: res.data.data.slots_in_use,
              queue_size: res.data.data.queue_size,
              running: res.data.data.running,
              pending: res.data.data.pending
            }
            this.newValue = this.snapshot.slots_total
            this.$Message.success(`슬롯이 ${this.snapshot.slots_total} 으로 변경됨`)
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
      .label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #495057; }
      .row {
        display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        .apply-hint {
          font-size: 12px; color: #666;
          .warn { color: #ff9900; margin-left: 4px; }
        }
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
