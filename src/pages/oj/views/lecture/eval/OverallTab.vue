<template>
  <div class="overall-tab">
    <div v-if="loading" class="placeholder">
      <Spin size="large" fix/>
      집계 중… ({{ progressText }})
    </div>
    <div v-else-if="error" class="placeholder error">{{ error }}</div>
    <div v-else-if="!groupSections.length" class="placeholder">집계할 데이터가 없습니다.</div>
    <div v-else>
      <div class="export-bar">
        <Dropdown @on-click="onExport" trigger="click">
          <Button type="primary" size="small" :loading="exporting">
            <Icon type="ios-download-outline"/> Export
            <Icon type="arrow-down-b"/>
          </Button>
          <DropdownMenu slot="list">
            <DropdownItem name="xlsx">엑셀 (.xlsx) — 그룹별 시트</DropdownItem>
            <DropdownItem name="csv">CSV (평탄형)</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <!-- 그룹별 요약 카드들 — 탭 전환과 무관하게 상단에 항상 노출 -->
      <div class="group-summary-bar">
        <div v-for="g in groupSections"
             :key="'card-' + g.key"
             class="group-card"
             :class="['g-' + g.key, { active: activeGroupKey === g.key }]"
             @click="activeGroupKey = g.key">
          <div class="g-header">
            <span class="g-name">{{ g.label }}</span>
            <span class="g-count">{{ g.contestCount }} 컨테스트 · {{ g.problemCount }} 문제</span>
          </div>
          <div class="g-stats">
            <div class="g-stat">
              <span class="lbl">{{ $t('m.EvalStat_MaxScore') }}</span>
              <span class="val">{{ g.maxScore }}</span>
            </div>
            <div class="g-stat">
              <span class="lbl">{{ $t('m.EvalStat_AvgScaled') }}</span>
              <span class="val">{{ g.avgScaled }} <small>/100</small></span>
            </div>
            <div class="g-stat">
              <span class="lbl">{{ $t('m.EvalStat_AvgSubmitted') }}</span>
              <span class="val">{{ g.avgSubmitted }} <small>/ {{ g.problemCount }}</small></span>
            </div>
            <div class="g-stat">
              <span class="lbl">{{ $t('m.EvalStat_AvgACRate') }}</span>
              <span class="val">{{ g.avgACRate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 그룹별 표 (탭) -->
      <Tabs v-model="activeGroupKey" class="overall-tabs" :animated="false">
        <TabPane v-for="g in groupSections"
                 :key="'tab-' + g.key"
                 :name="g.key"
                 :label="renderTabLabel(g)">
          <div class="table-card">
            <div class="table-meta">
              <span><b>{{ $t('m.EvalStat_StudentCount') }}</b> {{ g.rows.length }}</span>
              <span><b>{{ $t('m.EvalStat_ContestCount') }}</b> {{ g.contestCount }}</span>
              <span><b>{{ $t('m.EvalStat_ProblemCount') }}</b> {{ g.problemCount }}</span>
              <span><b>{{ $t('m.EvalStat_MaxScore') }}</b> {{ g.maxScore }}</span>
            </div>
            <Table :columns="g.columns"
                   :data="g.rows"
                   :stripe="true"
                   :max-height="tableMaxHeight"
                   class="overall-table"></Table>
          </div>
        </TabPane>
      </Tabs>
    </div>
  </div>
</template>

<script>
  import EvalApi from './EvalApi'

  const TYPE_ORDER = ['exam', 'lab', 'assignment', 'other']
  const TYPE_KEYS = {
    '대회': 'exam',
    '시험': 'exam',
    '실습': 'lab',
    '과제': 'assignment'
  }

  function classify (type) {
    return TYPE_KEYS[type] || 'other'
  }

  // PENDING(6) / JUDGING(7) 은 "제출" 으로 인정하지 않음. 그 외는 채점 끝난 것으로 본다.
  function isJudgedCell (cell) {
    if (!cell || !cell.testcase) return false
    const r = cell.testcase.result
    return r !== 6 && r !== 7
  }

  export default {
    name: 'OverallTab',
    props: {
      lectureId: { type: [String, Number], required: true }
    },
    data () {
      return {
        loading: false,
        error: '',
        contestsLoaded: [],
        scoreboards: [],
        progressDone: 0,
        progressTotal: 0,
        tableMaxHeight: window.innerHeight - 420,
        exporting: false,
        activeGroupKey: 'exam'
      }
    },
    computed: {
      progressText () {
        return this.progressTotal ? `${this.progressDone} / ${this.progressTotal} 컨테스트` : ''
      },
      groupLabels () {
        return {
          exam: this.$t('m.EvalGroup_Exam'),
          lab: this.$t('m.EvalGroup_Lab'),
          assignment: this.$t('m.EvalGroup_Assignment'),
          other: this.$t('m.EvalGroup_Other')
        }
      },
      groups () {
        const map = { exam: [], lab: [], assignment: [], other: [] }
        this.scoreboards.forEach(sb => {
          map[classify(sb.contest.lecture_contest_type)].push(sb)
        })
        return map
      },
      // 그룹별 독립 섹션 — 각 섹션은 자기 그룹의 학생 rows / columns / 통계만 가짐
      groupSections () {
        const sections = []
        TYPE_ORDER.forEach(k => {
          const list = this.groups[k]
          if (!list.length) return
          sections.push(this._buildSection(k, list))
        })
        return sections
      }
    },
    watch: {
      lectureId: { immediate: true, handler () { this.run() } },
      groupSections (sections) {
        // 데이터 도착 후 활성 탭이 비어있는 그룹이면 첫 그룹으로 이동
        const has = sections.some(s => s.key === this.activeGroupKey)
        if (!has && sections.length) this.activeGroupKey = sections[0].key
      }
    },
    methods: {
      renderTabLabel (g) {
        // h 가 인자로 들어오지 않는 형태로 label 을 함수로 넘기면 iView 가 알아서 처리.
        // 라벨에 그룹명 + 학생수 보조 표기.
        return (h) => h('span', { class: 'tab-label g-' + g.key }, [
          h('span', { class: 'tab-name' }, g.label),
          h('span', { class: 'tab-count' }, ` (${g.rows.length})`)
        ])
      },
      _buildSection (groupKey, scoreboards) {
        const label = this.groupLabels[groupKey]
        // 그룹 만점 = 그 그룹 안 모든 contest 의 problem.total_score 합
        let maxScore = 0
        let problemCount = 0
        scoreboards.forEach(sb => {
          (sb.problems || []).forEach(p => {
            maxScore += (p.total_score || 0)
            problemCount += 1
          })
        })

        // 학생별 행 집계
        const byUser = new Map()
        scoreboards.forEach(sb => {
          (sb.students || []).forEach(s => {
            if (!byUser.has(s.user_id)) {
              byUser.set(s.user_id, {
                user_id: s.user_id,
                username: s.username,
                name: s.realname || s.username,
                total: 0,
                submitted: 0,
                ac: 0
              })
            }
            const row = byUser.get(s.user_id)
            let csum = 0
            ;(sb.problems || []).forEach(p => {
              const cell = s.by_problem[p.label]
              if (isJudgedCell(cell)) {
                row.submitted += 1
                csum += (cell.testcase.score || 0)
                if (cell.testcase.result === 0) row.ac += 1
              }
            })
            row['c_' + sb.contest.id] = csum
            row.total += csum
          })
        })
        const rows = [...byUser.values()]
        const denom = maxScore || 1
        rows.forEach(r => {
          r.scaled = Math.round((r.total / denom) * 100)
          r.progressPct = problemCount ? Math.round((r.submitted / problemCount) * 100) : 0
          r.acRate = r.submitted ? Math.round((r.ac / r.submitted) * 100) : 0
        })
        rows.sort((a, b) => b.total - a.total)

        // 그룹 카드 통계
        const studentCount = rows.length || 1
        const avgScaled = Math.round(rows.reduce((a, r) => a + r.scaled, 0) / studentCount)
        const avgSubmitted = (rows.reduce((a, r) => a + r.submitted, 0) / studentCount).toFixed(1)
        const totalAttempts = rows.reduce((a, r) => a + r.submitted, 0)
        const totalAC = rows.reduce((a, r) => a + r.ac, 0)
        const avgACRate = totalAttempts ? Math.round((totalAC / totalAttempts) * 100) : 0

        return {
          key: groupKey,
          label,
          contestCount: scoreboards.length,
          problemCount,
          maxScore,
          avgScaled,
          avgSubmitted,
          avgACRate,
          rows,
          columns: this._buildColumns(groupKey, scoreboards, maxScore, problemCount)
        }
      },
      _buildColumns (groupKey, scoreboards, maxScore, problemCount) {
        const cols = [
          { title: '학생', key: 'name', width: 140, fixed: 'left', sortable: true },
          { title: '학번', key: 'username', width: 110, fixed: 'left' },
          {
            title: this.$t('m.EvalCol_TotalRaw'),
            key: 'total',
            width: 90,
            fixed: 'left',
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong' }, this.$t('m.EvalCol_TotalRaw')),
            render: (h, p) => h('strong', { class: 'cell-total' }, String(p.row.total))
          },
          {
            title: this.$t('m.EvalCol_Scaled'),
            key: 'scaled',
            width: 110,
            fixed: 'left',
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong' }, [
              h('div', this.$t('m.EvalCol_Scaled')),
              h('div', { class: 'th-sub' }, `만점 ${maxScore}`)
            ]),
            render: (h, p) => h('span', { class: 'cell-scaled' }, [
              h('strong', String(p.row.scaled)),
              h('small', { class: 'unit' }, ' /100')
            ])
          },
          {
            title: this.$t('m.EvalCol_Progress'),
            key: 'submitted',
            width: 130,
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong' }, [
              h('div', this.$t('m.EvalCol_Progress')),
              h('div', { class: 'th-sub' }, `전체 ${problemCount}`)
            ]),
            render: (h, p) => h('span', { class: 'cell-progress' }, [
              h('strong', `${p.row.submitted} / ${problemCount}`),
              h('small', { class: 'unit' }, ` (${p.row.progressPct}%)`)
            ])
          },
          {
            title: this.$t('m.EvalCol_ACCount'),
            key: 'ac',
            width: 100,
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong' }, this.$t('m.EvalCol_ACCount')),
            render: (h, p) => h('span', { class: 'cell-ac' }, [
              h('strong', String(p.row.ac)),
              h('small', { class: 'unit' }, ` (${p.row.acRate}%)`)
            ])
          }
        ]
        // 그룹 안 각 contest 점수 컬럼
        scoreboards.forEach(sb => {
          cols.push({
            title: sb.contest.title,
            key: 'c_' + sb.contest.id,
            width: 130,
            sortable: true,
            renderHeader: (h) => {
              const t = sb.contest.title
              const short = t.length > 14 ? t.slice(0, 12) + '…' : t
              return h('div', { class: `th-contest g-${groupKey}`, attrs: { title: t } }, [
                h('div', { class: 'th-contest-name' }, short),
                h('div', { class: 'th-contest-type' }, sb.contest.lecture_contest_type || '')
              ])
            },
            render: (h, p) => h('span', { class: 'cell-contest' }, String(p.row['c_' + sb.contest.id] || 0))
          })
        })
        return cols
      },
      run () {
        if (!this.lectureId) return
        this.loading = true
        this.error = ''
        this.scoreboards = []
        EvalApi.listContests(this.lectureId)
          .then(list => {
            this.contestsLoaded = list || []
            this.progressDone = 0
            this.progressTotal = this.contestsLoaded.length
            if (!this.progressTotal) { this.loading = false; return }
            return Promise.all(this.contestsLoaded.map(c =>
              EvalApi.getScoreboard(c.id)
                .then(sb => { this.progressDone++; return sb })
                .catch(() => { this.progressDone++; return null })
            ))
          })
          .then(boards => { if (boards) this.scoreboards = boards.filter(Boolean) })
          .catch(e => { this.error = (e && e.detail) || '집계 실패' })
          .finally(() => { this.loading = false })
      },
      onExport (fmt) {
        if (this.exporting) return
        this.exporting = true
        const url = EvalApi.lectureExportUrl(this.lectureId, fmt)
        const a = document.createElement('a')
        a.href = url
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => { this.exporting = false }, 800)
      }
    }
  }
</script>

<style lang="less" scoped>
  .overall-tab {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .placeholder {
    padding: 80px 24px;
    text-align: center;
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    color: var(--text-color);
    opacity: 0.7;
    &.error { color: #ed4014; opacity: 1; }
  }

  .export-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 4px;
  }

  // 그룹 요약 카드 가로 띠 (탭 전환과 무관, 상시 노출)
  .group-summary-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
    margin-bottom: 4px;
  }

  .group-card {
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border-left: 4px solid var(--g-color, #95a5a6);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s, border-color 0.1s;
    &.g-exam   { --g-color: #ed4014; }
    &.g-lab    { --g-color: #19be6b; }
    &.g-assignment { --g-color: #2d8cf0; }
    &.g-other  { --g-color: #95a5a6; }
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    &.active {
      box-shadow: 0 0 0 2px var(--g-color), 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    .g-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 10px;
      .g-name { font-size: 15px; font-weight: 700; color: var(--g-color, var(--text-color)); }
      .g-count { font-size: 10px; opacity: 0.6; color: var(--text-color); }
    }
    .g-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 12px;
      .g-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
        .lbl { font-size: 9px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.04em; }
        .val { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--text-color);
          small { font-size: 10px; font-weight: 400; opacity: 0.55; margin-left: 2px; }
        }
      }
    }
  }

  .overall-tabs /deep/ .ivu-tabs-bar {
    margin-bottom: 12px;
    border-bottom-color: var(--panel-border-color);
  }
  .overall-tabs /deep/ .ivu-tabs-tab {
    font-size: 13px;
    padding: 8px 16px;
    .tab-label .tab-count { opacity: 0.55; font-size: 11px; }
    &.g-exam.ivu-tabs-tab-active, &.ivu-tabs-tab-active .tab-label.g-exam .tab-name { color: #ed4014; }
    &.g-lab.ivu-tabs-tab-active, &.ivu-tabs-tab-active .tab-label.g-lab .tab-name { color: #19be6b; }
    &.g-assignment.ivu-tabs-tab-active, &.ivu-tabs-tab-active .tab-label.g-assignment .tab-name { color: #2d8cf0; }
    &.g-other.ivu-tabs-tab-active, &.ivu-tabs-tab-active .tab-label.g-other .tab-name { color: #95a5a6; }
  }
  .overall-tabs /deep/ .ivu-tabs-ink-bar { height: 3px; background-color: var(--text-hover-color); }

  .table-card {
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    .table-meta {
      padding: 10px 18px;
      border-bottom: 1px solid var(--panel-border-color);
      background: var(--table-head-backgound);
      font-size: 12px;
      color: var(--text-color);
      span { margin-right: 24px; }
      b { font-weight: 500; opacity: 0.65; margin-right: 6px; }
    }
  }

  .overall-table /deep/ .ivu-table {
    .th-strong { font-weight: 700; }
    .th-sub { font-size: 10px; opacity: 0.5; font-weight: 400; }
    .th-contest-name { font-size: 12px; font-weight: 500; }
    .th-contest-type { font-size: 10px; opacity: 0.5; }
    .th-contest { line-height: 1.25; }
    .th-contest.g-exam { border-bottom: 2px solid rgba(237, 64, 20, 0.4); }
    .th-contest.g-lab { border-bottom: 2px solid rgba(25, 190, 107, 0.4); }
    .th-contest.g-assignment { border-bottom: 2px solid rgba(45, 140, 240, 0.4); }
    .th-contest.g-other { border-bottom: 2px solid rgba(149, 165, 166, 0.4); }
    .cell-total { font-weight: 700; }
    .cell-scaled strong { font-weight: 700; font-variant-numeric: tabular-nums; }
    .cell-scaled .unit, .cell-progress .unit, .cell-ac .unit {
      opacity: 0.55; font-size: 11px; font-weight: 400;
    }
    .cell-progress strong { font-variant-numeric: tabular-nums; }
    .cell-ac strong { font-weight: 700; font-variant-numeric: tabular-nums; color: #19be6b; }
    .cell-contest { font-variant-numeric: tabular-nums; }
  }
</style>
