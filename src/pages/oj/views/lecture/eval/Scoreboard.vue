<template>
  <div class="eval-scoreboard">
    <div v-if="loading" class="placeholder">
      <Spin fix size="large"/>
    </div>
    <div v-else-if="error" class="placeholder error">{{ error }}</div>
    <div v-else-if="!sb" class="placeholder">데이터가 없습니다.</div>
    <div v-else>
      <div class="meta">
        <span class="meta-item"><b>학생</b> {{ sb.students.length }}</span>
        <span class="meta-item"><b>문제</b> {{ sb.problems.length }}</span>
        <span class="meta-item">
          <b>정성평가</b> {{ sb.n_evaluated_pairs }} / {{ sb.n_total_pairs }}
        </span>
      </div>
      <div class="matrix-wrap">
        <table class="matrix">
          <thead>
            <tr>
              <th class="sticky-l student-col">학생</th>
              <th v-for="p in sb.problems" :key="p.id" class="problem-col" :title="p.title">
                <div class="ph-label">{{ p.label }}</div>
                <div class="ph-title">{{ p.title }}</div>
                <div class="ph-score">/{{ p.total_score }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sb.students" :key="s.user_id">
              <td class="sticky-l student-col">
                <div class="su-name">{{ s.realname || s.username }}</div>
                <div class="su-id">{{ s.username }}</div>
              </td>
              <td v-for="p in sb.problems" :key="p.id"
                  class="cell"
                  :class="[
                    cellClass(s.by_problem[p.label]),
                    isSelected(s.user_id, p.id) ? 'selected' : ''
                  ]"
                  :title="resultTooltip(s.by_problem[p.label])"
                  @click="openCell(s, p)">
                <template v-if="s.by_problem[p.label] && s.by_problem[p.label].testcase">
                  <div class="result-label">
                    <span class="r-ko">{{ resultKo(s.by_problem[p.label].testcase.result_label) }}</span>
                    <span class="r-abbr">({{ s.by_problem[p.label].testcase.result_label }})</span>
                  </div>
                  <div class="score">{{ s.by_problem[p.label].testcase.score }}</div>
                </template>
                <template v-else>
                  <div class="result-label muted">미제출</div>
                </template>
                <div class="badges" v-if="s.by_problem[p.label] && s.by_problem[p.label].qualitative">
                  <span class="badge overall"
                        :title="`overall ${s.by_problem[p.label].qualitative.overall}`">
                    {{ s.by_problem[p.label].qualitative.overall }}
                  </span>
                  <span class="badge ai"
                        :class="aiClass(s.by_problem[p.label].qualitative.ai_likelihood_score)"
                        :title="`AI ${s.by_problem[p.label].qualitative.ai_likelihood_score}`">
                    AI{{ s.by_problem[p.label].qualitative.ai_likelihood_score }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
  import EvalApi from './EvalApi'

  export default {
    name: 'Scoreboard',
    props: {
      contestId: { type: [String, Number], required: true },
      selectedUserId: { type: [String, Number], default: null },
      selectedProblemId: { type: [String, Number], default: null }
    },
    data () {
      return {
        sb: null,
        loading: false,
        error: ''
      }
    },
    watch: {
      contestId: { immediate: true, handler () { this.fetch() } }
    },
    methods: {
      fetch () {
        if (!this.contestId) return
        this.loading = true
        this.error = ''
        EvalApi.getScoreboard(this.contestId)
          .then(d => { this.sb = d })
          .catch(e => { this.error = (e && e.detail) || '점수판 로드 실패' })
          .finally(() => { this.loading = false })
      },
      cellClass (cell) {
        if (!cell || !cell.testcase) return 'empty'
        // Backend JudgeStatus: 0=AC, -1=WA, -2=CE, -3 미사용,
        // 1=TLE, 2=RTLE, 3=MLE, 4=RE, 5=SE, 6=PENDING, 7=JUDGING, 8=PA
        const r = cell.testcase.result
        if (r === 0) return 'ac'
        if (r === 8) return 'pa'
        if (r === -2) return 'ce'
        if (r === 6 || r === 7) return 'pending'
        return 'wa'
      },
      resultKo (label) {
        const map = {
          AC: '정답',
          PA: '부분정답',
          WA: '오답',
          TLE: '시간초과',
          RTLE: '실시간초과',
          MLE: '메모리초과',
          RE: '런타임오류',
          CE: '컴파일오류',
          SE: '시스템오류',
          PENDING: '대기중',
          JUDGING: '채점중'
        }
        return map[label] || label
      },
      resultTooltip (cell) {
        if (!cell || !cell.testcase) return '미제출'
        const r = cell.testcase
        const ko = this.resultKo(r.result_label) + ' (' + r.result_label + ')'
        const parts = [ko]
        if (r.score !== undefined && r.score !== null) parts.push(`점수: ${r.score}`)
        if (r.language) parts.push(`언어: ${r.language}`)
        if (r.time_cost_ms !== undefined && r.time_cost_ms !== null) parts.push(`시간: ${r.time_cost_ms}ms`)
        return parts.join('\n')
      },
      aiClass (score) {
        if (score >= 70) return 'ai-high'
        if (score >= 40) return 'ai-mid'
        return 'ai-low'
      },
      isSelected (uid, pid) {
        return this.selectedUserId === uid && this.selectedProblemId === pid
      },
      openCell (s, p) {
        if (!s.by_problem[p.label] || !s.by_problem[p.label].testcase) return
        this.$emit('cell-click', {
          userId: s.user_id,
          problemId: p.id,
          studentName: s.realname || s.username,
          problemLabel: p.label
        })
      },
      refresh () { this.fetch() }
    }
  }
</script>

<style lang="less" scoped>
  .eval-scoreboard {
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    .placeholder {
      padding: 80px 0;
      text-align: center;
      color: var(--text-color);
      opacity: 0.7;
      &.error { color: #ed4014; opacity: 1; }
    }
    .meta {
      padding: 12px 18px;
      color: var(--text-color);
      font-size: 13px;
      border-bottom: 1px solid var(--panel-border-color);
      background: var(--table-head-backgound);
      .meta-item {
        margin-right: 28px;
        b { font-weight: 500; opacity: 0.65; margin-right: 6px; }
      }
    }
    .matrix-wrap {
      overflow-x: auto;
    }
    table.matrix {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      font-size: 12px;
      color: var(--table-text-color);
      th, td {
        border-bottom: 1px solid var(--table-border-color);
        border-right: 1px solid var(--table-border-color);
        padding: 8px 10px;
        background: var(--table-body-background);
        vertical-align: middle;
      }
      thead th {
        background: var(--table-head-backgound);
        position: sticky;
        top: 0;
        z-index: 2;
        text-align: center;
        white-space: nowrap;
        padding: 10px 10px;
        font-weight: 600;
      }
      .sticky-l {
        position: sticky;
        left: 0;
        z-index: 3;
        background: var(--table-head-backgound);
      }
      thead .sticky-l { z-index: 4; }
      .student-col {
        min-width: 150px;
        text-align: left;
        .su-name { font-weight: 600; font-size: 13px; }
        .su-id { font-size: 11px; opacity: 0.55; margin-top: 2px; }
      }
      .problem-col {
        min-width: 110px;
        max-width: 160px;
        .ph-label { font-weight: 700; font-size: 12px; color: var(--text-hover-color); }
        .ph-title { font-size: 10px; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .ph-score { font-size: 10px; opacity: 0.5; margin-top: 2px; }
      }
      td.cell {
        position: relative;
        cursor: pointer;
        text-align: center;
        min-width: 110px;
        height: 60px;
        transition: filter 0.1s, box-shadow 0.1s;
        &:hover { filter: brightness(1.07); }
        .result-label {
          font-weight: 600;
          font-size: 11px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 4px;
          .r-ko { font-weight: 700; }
          .r-abbr { font-weight: 500; opacity: 0.65; margin-left: 3px; font-size: 10px; }
        }
        .result-label.muted { opacity: 0.4; font-weight: 500; }
        .score { font-size: 11px; opacity: 0.85; margin-top: 2px; font-variant-numeric: tabular-nums; }
        .badges {
          position: absolute;
          top: 3px;
          right: 3px;
          display: flex;
          gap: 2px;
          .badge {
            font-size: 9px;
            font-weight: 600;
            line-height: 1;
            padding: 3px 5px;
            border-radius: 8px;
            color: #fff;
            background: #2d8cf0;
            &.ai-high { background: #ed4014; }
            &.ai-mid { background: #ff9900; }
            &.ai-low { background: #95a5a6; }
          }
        }
        &.empty { background: var(--table-bottom-color); cursor: default; }
        &.ac { background: rgba(25, 190, 107, 0.16); }
        &.pa { background: rgba(255, 153, 0, 0.16); }
        &.wa { background: rgba(237, 64, 20, 0.14); }
        &.ce { background: rgba(150, 150, 150, 0.16); }
        &.pending { background: rgba(45, 140, 240, 0.10); }
        &.selected {
          box-shadow: inset 0 0 0 3px var(--text-hover-color);
          z-index: 1;
        }
      }
    }
  }
</style>
