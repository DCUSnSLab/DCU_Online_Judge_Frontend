<template>
  <div class="eval-detail-panel" :class="{ open: visible }">
    <div class="panel-header">
      <div class="panel-title">
        <span class="student">{{ studentName }}</span>
        <span class="sep">·</span>
        <span class="problem">{{ problemLabel }}</span>
      </div>
      <button class="close-btn" @click="$emit('close')" aria-label="close">
        <Icon type="close"/>
      </button>
    </div>
    <div class="panel-body">
      <Spin fix v-if="loading"/>
      <div v-else-if="error" class="error">{{ error }}</div>
      <Tabs v-else value="judge" class="detail-tabs">
        <TabPane :label="$t('m.EvalDetail_Judge')" name="judge">
          <div v-if="data && data.submission">
            <div class="kv">
              <div><b>결과</b><Tag>{{ data.submission.result_label }}</Tag></div>
              <div><b>점수</b>{{ submissionScore }}</div>
              <div><b>언어</b>{{ data.submission.language }}</div>
              <div><b>시간</b>{{ submissionTime }} ms</div>
              <div><b>메모리</b>{{ submissionMemory }} KB</div>
              <div><b>제출시각</b>{{ data.submission.create_time }}</div>
            </div>
            <h4>학생 코드</h4>
            <pre class="code">{{ data.submission.code }}</pre>
          </div>
          <div v-else class="muted">제출 없음</div>
        </TabPane>
        <TabPane :label="$t('m.EvalDetail_Qualitative')"
                 name="qual"
                 v-if="data && data.qualitative">
          <div v-if="data.qualitative.error" class="eval-error-banner">
            <Icon type="alert-circled"/>
            <div>
              <div class="title">정성평가 실패</div>
              <div class="msg">{{ data.qualitative.error }}</div>
              <div class="hint">‘재평가’ 버튼으로 다시 시도하실 수 있습니다.</div>
            </div>
          </div>
          <div class="kv">
            <div><b>Overall</b>{{ data.qualitative.overall }}</div>
            <div><b>제안 부분점수</b>{{ data.qualitative.suggested_partial_score }}</div>
            <div v-if="data.qualitative.model_used"><b>Model</b>{{ data.qualitative.model_used }}</div>
          </div>
          <table class="rubric">
            <thead>
              <tr><th>축</th><th>점수</th><th>현재</th><th>개선</th></tr>
            </thead>
            <tbody>
              <tr v-for="ax in axes" :key="ax">
                <td>{{ axisLabel(ax) }}</td>
                <td class="num">{{ data.qualitative.scores ? data.qualitative.scores[ax] : '-' }}</td>
                <td>{{ data.qualitative.comments && data.qualitative.comments[ax] ? data.qualitative.comments[ax].assessment : '-' }}</td>
                <td>{{ data.qualitative.comments && data.qualitative.comments[ax] ? data.qualitative.comments[ax].suggestion : '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="data.qualitative.summary" class="summary">
            <h4>요약</h4>
            <p>{{ data.qualitative.summary }}</p>
          </div>
        </TabPane>
        <TabPane :label="$t('m.EvalDetail_AIUsage')"
                 name="ai"
                 v-if="data && data.ai_usage_assessment">
          <div v-if="data.ai_usage_assessment.error" class="eval-error-banner">
            <Icon type="alert-circled"/>
            <div>
              <div class="title">AI 사용 평가 실패</div>
              <div class="msg">{{ data.ai_usage_assessment.error }}</div>
              <div class="hint">‘재평가’ 버튼으로 다시 시도하실 수 있습니다.</div>
            </div>
          </div>
          <div class="kv">
            <div><b>Likelihood</b>{{ data.ai_usage_assessment.likelihood_score }}</div>
            <div><b>Confidence</b>{{ data.ai_usage_assessment.confidence }}</div>
          </div>
          <h4>Signals</h4>
          <ul class="signals">
            <li v-for="(sig, i) in (data.ai_usage_assessment.signals || [])" :key="'s'+i">
              <Tag>{{ sig.category }}</Tag>
              <span class="weight" :class="'w-' + sig.weight">{{ sig.weight }}</span>
              <span class="obs">{{ sig.observation }}</span>
            </li>
          </ul>
          <h4>Counter-signals</h4>
          <ul class="counter-signals">
            <li v-for="(c, i) in (data.ai_usage_assessment.counter_signals || [])" :key="'c'+i">{{ c }}</li>
          </ul>
          <p v-if="data.ai_usage_assessment.summary" class="summary">{{ data.ai_usage_assessment.summary }}</p>
          <p class="disclaimer" v-if="data.ai_usage_assessment.disclaimer">
            <Icon type="alert-circled"/>{{ data.ai_usage_assessment.disclaimer }}
          </p>
        </TabPane>
        <TabPane :label="$t('m.EvalDetail_Problem')"
                 name="problem"
                 v-if="data && data.problem">
          <h3>{{ data.problem.label }}. {{ data.problem.title }}</h3>
          <div class="kv">
            <div><b>총점</b>{{ data.problem.total_score }}</div>
            <div><b>난이도</b>{{ data.problem.difficulty }}</div>
            <div><b>시간제한</b>{{ data.problem.time_limit }} ms</div>
            <div><b>메모리제한</b>{{ data.problem.memory_limit }} MB</div>
          </div>
          <h4>설명</h4>
          <div class="problem-desc" v-html="data.problem.description"></div>
        </TabPane>
      </Tabs>
    </div>
  </div>
</template>

<script>
  import EvalApi from './EvalApi'

  export default {
    name: 'DetailPanel',
    props: {
      visible: { type: Boolean, default: false },
      contestId: { type: [String, Number], required: true },
      userId: { type: [String, Number], default: null },
      problemId: { type: [String, Number], default: null },
      studentName: { type: String, default: '' },
      problemLabel: { type: String, default: '' }
    },
    data () {
      return {
        loading: false,
        error: '',
        data: null,
        axes: ['correctness', 'algorithm', 'readability', 'problem_understanding']
      }
    },
    computed: {
      submissionScore () {
        const si = this.data && this.data.submission && this.data.submission.statistic_info
        return si && (si.score !== undefined) ? si.score : '-'
      },
      submissionTime () {
        const si = this.data && this.data.submission && this.data.submission.statistic_info
        return si && si.time_cost !== undefined ? si.time_cost : '-'
      },
      submissionMemory () {
        const si = this.data && this.data.submission && this.data.submission.statistic_info
        return si && si.memory_cost !== undefined ? si.memory_cost : '-'
      }
    },
    watch: {
      visible: { immediate: true, handler (v) { if (v) this.fetch() } },
      problemId () { if (this.visible) this.fetch() },
      userId () { if (this.visible) this.fetch() }
    },
    methods: {
      axisLabel (ax) {
        return {
          correctness: '정확성',
          algorithm: '알고리즘',
          readability: '가독성',
          problem_understanding: '문제이해'
        }[ax] || ax
      },
      fetch () {
        if (!this.userId || !this.problemId) return
        this.loading = true
        this.error = ''
        EvalApi.getCellDetail(this.contestId, this.userId, this.problemId)
          .then(d => { this.data = d })
          .catch(e => { this.error = (e && e.detail) || '셀 상세 로드 실패' })
          .finally(() => { this.loading = false })
      }
    }
  }
</script>

<style lang="less" scoped>
  .eval-error-banner {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0 0 14px;
    padding: 10px 12px;
    background: #fef0f0;
    border: 1px solid #fbc4c4;
    border-radius: 8px;
    color: #b94a48;
    font-size: 12px;
    i { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
    .title { font-weight: 700; margin-bottom: 2px; }
    .msg {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      word-break: break-all;
      max-height: 80px;
      overflow-y: auto;
      opacity: 0.85;
    }
    .hint { font-size: 11px; opacity: 0.75; margin-top: 4px; }
  }
  // layout/positioning 은 부모(ByContestTab .floating-panel)가 책임짐 — viewport fixed.
  // 본 컴포넌트는 시각적 카드(배경/테두리/그림자) + 내부 스크롤만 담당.
  .eval-detail-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--panel-border-color);
    background: var(--table-head-backgound);
    .panel-title {
      font-size: 14px;
      .student { font-weight: 600; color: var(--text-color); }
      .sep { margin: 0 8px; opacity: 0.45; }
      .problem { color: var(--text-hover-color); font-weight: 600; }
    }
    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-color);
      opacity: 0.7;
      font-size: 18px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background-color 0.12s, opacity 0.12s;
      &:hover { background: var(--list-border-bottom); opacity: 1; }
    }
  }
  .panel-body {
    flex: 1;
    overflow: auto;
    padding: 16px 18px;
    .error { color: #ed4014; padding: 16px; }
    .muted { opacity: 0.6; padding: 12px 0; }
  }
  .detail-tabs {
    /deep/ .ivu-tabs-bar {
      margin-bottom: 14px;
      border-bottom: 1px solid var(--panel-border-color);
    }
    /deep/ .ivu-tabs-tab {
      padding: 8px 14px;
      color: var(--text-color);
      opacity: 0.65;
      &.ivu-tabs-tab-active { color: var(--text-hover-color); opacity: 1; font-weight: 600; }
    }
    /deep/ .ivu-tabs-ink-bar { background: var(--text-hover-color); height: 2px; }
  }
  .kv {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 14px;
    margin-bottom: 16px;
    font-size: 13px;
    div {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--table-bottom-color);
      border-radius: 8px;
    }
    b { font-weight: 500; opacity: 0.65; min-width: 60px; }
  }
  pre.code {
    background: var(--problem-example-box-color);
    padding: 14px;
    border-radius: 10px;
    overflow: auto;
    max-height: 360px;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
  }
  table.rubric {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 12px;
    th, td {
      border: 1px solid var(--table-border-color);
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th { background: var(--table-head-backgound); font-weight: 600; }
    td.num { text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; }
  }
  .summary { margin-top: 14px; padding: 12px 14px; background: var(--table-bottom-color); border-radius: 10px; }
  ul.signals, ul.counter-signals {
    list-style: none;
    padding-left: 0;
    margin-bottom: 12px;
    li {
      padding: 8px 12px;
      margin-bottom: 6px;
      background: var(--table-bottom-color);
      border-radius: 8px;
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      .obs { flex: 1; }
      .weight {
        display: inline-block;
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        background: #95a5a6;
        color: #fff;
        font-weight: 600;
        text-transform: uppercase;
        &.w-high { background: #ed4014; }
        &.w-medium { background: #ff9900; }
        &.w-low { background: #95a5a6; }
      }
    }
  }
  .disclaimer {
    margin-top: 16px;
    padding: 10px 14px;
    background: #fff8e1;
    color: #b8860b;
    border-radius: 8px;
    font-size: 11px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.45;
  }
  .problem-desc { font-size: 13px; line-height: 1.6; }
  h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 600; }
  h4 { margin: 16px 0 8px 0; font-size: 13px; opacity: 0.75; font-weight: 600; }
</style>
