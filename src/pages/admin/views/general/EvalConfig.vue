<template>
  <Panel :title="'정성평가 GPU 슬롯 설정'">
    <div class="eval-config">
      <p class="hint">
        정성평가는 LLM 호출이 비싸고 동시 실행할 수 있는 양이 GPU 자원에 따라 제한됩니다.
        <strong>슬롯 수</strong>는 한 번에 동시 처리할 수 있는 평가 작업의 최대 개수입니다.
        값을 바꾸면 즉시 적용되며, 사이드카가 재시작되어도 같은 값을 유지합니다.
      </p>
      <div v-if="loading" class="loading">
        <i class="el-icon-loading"></i> 로드 중…
      </div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else>
        <div class="status">
          <div class="stat">
            <div class="lbl">현재 슬롯 수</div>
            <div class="val">{{ slots.slots_total }}</div>
          </div>
          <div class="stat">
            <div class="lbl">사용 중</div>
            <div class="val">{{ slots.slots_in_use }} / {{ slots.slots_total }}</div>
          </div>
          <div class="stat">
            <div class="lbl">대기 큐</div>
            <div class="val">{{ slots.queue_size }}</div>
          </div>
        </div>

        <div class="form">
          <label class="label">슬롯 수 변경</label>
          <div class="row">
            <el-input-number v-model="newValue"
                             :min="1"
                             :max="16"
                             size="small"
                             style="width: 140px;"></el-input-number>
            <el-button type="primary"
                       size="small"
                       :loading="saving"
                       :disabled="newValue === slots.slots_total"
                       @click="save">
              적용
            </el-button>
            <span class="apply-hint" v-if="newValue !== slots.slots_total">
              {{ slots.slots_total }} → {{ newValue }} 으로 변경됩니다.
              <span v-if="newValue < slots.slots_total" class="warn">
                감소 시 현재 실행 중인 작업이 끝난 뒤 점진적으로 적용됩니다.
              </span>
            </span>
          </div>
        </div>

        <div class="meta">
          <p>
            <strong>변경 흐름:</strong> Django → 사이드카 즉시 반영 → eval-dashboard <code>.env</code> 동기화
            <span v-if="lastResult && lastResult.env_synced" class="ok">✓ env 동기화 완료</span>
            <span v-else-if="lastResult && lastResult.env_synced === false" class="warn">⚠ env 동기화 실패 (재시작 시 값 유실)</span>
          </p>
          <p class="hint-mini">
            토큰 변경 등 .env 의 다른 값은 사이드카 수동 재시작이 필요합니다.
            <code>./devstack/scripts/stop.sh && ./devstack/scripts/start.sh</code>
          </p>
        </div>
      </div>
    </div>
  </Panel>
</template>

<script>
  import api from '../../api.js'
  import Panel from '../../components/Panel.vue'

  export default {
    name: 'EvalConfig',
    components: { Panel },
    data () {
      return {
        loading: true,
        saving: false,
        error: '',
        slots: { slots_total: 0, slots_in_use: 0, queue_size: 0 },
        newValue: 3,
        lastResult: null,
        pollHandle: null
      }
    },
    mounted () {
      this.fetch()
      // 사용량 라이브 갱신
      this.pollHandle = setInterval(() => this.fetch(true), 4000)
    },
    beforeDestroy () {
      if (this.pollHandle) clearInterval(this.pollHandle)
    },
    methods: {
      fetch (silent) {
        if (!silent) this.loading = true
        this.error = ''
        api.getEvalSlots().then(res => {
          if (res.data.error) {
            this.error = res.data.data || '슬롯 정보 로드 실패'
          } else {
            const wasSlots = this.slots.slots_total
            this.slots = res.data.data
            // 사용자가 수동 입력 중이 아니면 newValue를 현재 값으로 동기화
            if (this.newValue === wasSlots || wasSlots === 0) {
              this.newValue = this.slots.slots_total
            }
          }
        }).catch(() => {
          this.error = '슬롯 정보 로드 실패 (사이드카 미가동?)'
        }).finally(() => {
          if (!silent) this.loading = false
        })
      },
      save () {
        if (this.saving) return
        this.saving = true
        this.error = ''
        api.setEvalSlots(this.newValue).then(res => {
          if (res.data.error) {
            this.error = res.data.data
          } else {
            this.lastResult = res.data.data
            this.slots = {
              slots_total: res.data.data.slots_total,
              slots_in_use: res.data.data.slots_in_use,
              queue_size: res.data.data.queue_size
            }
            this.newValue = this.slots.slots_total
            this.$Message.success(`슬롯 수가 ${this.slots.slots_total}로 변경되었습니다.`)
          }
        }).catch(e => {
          this.error = (e && e.data) || '변경 실패'
        }).finally(() => {
          this.saving = false
        })
      }
    }
  }
</script>

<style lang="less" scoped>
  .eval-config {
    padding: 8px 4px;
    .hint {
      font-size: 13px;
      color: #555;
      line-height: 1.6;
      margin-bottom: 18px;
      strong { color: #2d8cf0; }
    }
    .loading, .error { padding: 24px; text-align: center; }
    .error { color: #ed4014; }

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
        .lbl { font-size: 11px; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .val { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
      }
    }

    .form {
      padding: 16px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 16px;
      .label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #495057;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        .apply-hint {
          font-size: 12px;
          color: #666;
          .warn { color: #ff9900; margin-left: 4px; }
        }
      }
    }

    .meta {
      font-size: 12px;
      color: #666;
      p { margin: 6px 0; line-height: 1.5; }
      code {
        padding: 2px 6px;
        background: #f3f4f6;
        border-radius: 4px;
        font-size: 11px;
      }
      .ok { color: #19be6b; margin-left: 8px; font-weight: 600; }
      .warn { color: #ff9900; margin-left: 8px; font-weight: 600; }
      .hint-mini { opacity: 0.75; }
    }
  }
</style>
