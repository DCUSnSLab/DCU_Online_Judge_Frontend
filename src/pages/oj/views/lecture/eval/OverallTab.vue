<template>
  <div class="overall-tab">
    <div v-if="loading" class="placeholder">
      <Spin size="large" fix/>
      집계 중… ({{ progressText }})
    </div>
    <div v-else-if="error" class="placeholder error">{{ error }}</div>
    <div v-else-if="!aggregated.length" class="placeholder">집계할 데이터가 없습니다.</div>
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

      <!-- 그룹별 요약 카드 -->
      <div class="group-summary">
        <div v-for="g in groupSummary" :key="g.key"
             class="group-card"
             :class="'g-' + g.key">
          <div class="g-header">
            <span class="g-name">{{ g.label }}</span>
            <span class="g-count">{{ g.contestCount }} 건</span>
          </div>
          <div class="g-stats">
            <div class="g-stat">
              <span class="lbl">최대 점수</span>
              <span class="val">{{ g.maxScore }}</span>
            </div>
            <div class="g-stat">
              <span class="lbl">평균</span>
              <span class="val">{{ g.avg }}</span>
            </div>
            <div class="g-stat">
              <span class="lbl">평균 비율</span>
              <span class="val">{{ g.avgPct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 학생별 종합표 -->
      <div class="table-card">
        <div class="table-meta">
          <span><b>학생</b> {{ aggregated.length }}</span>
          <span><b>컨테스트</b> {{ scoreboards.length }}</span>
          <span><b>최대 가능 총점</b> {{ totalPossible }}</span>
        </div>
        <Table :columns="columns"
               :data="aggregated"
               :stripe="true"
               :max-height="tableMaxHeight"
               class="overall-table"></Table>
      </div>
    </div>
  </div>
</template>

<script>
  import EvalApi from './EvalApi'

  // contest type 우선 순위 + 라벨 매핑
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
        tableMaxHeight: window.innerHeight - 360,
        exporting: false
      }
    },
    computed: {
      progressText () {
        return this.progressTotal ? `${this.progressDone} / ${this.progressTotal} 컨테스트` : ''
      },
      // 분류된 contest 그룹
      groups () {
        const map = { exam: [], lab: [], assignment: [], other: [] }
        this.scoreboards.forEach(sb => {
          const k = classify(sb.contest.lecture_contest_type)
          map[k].push(sb)
        })
        return map
      },
      groupLabels () {
        return {
          exam: this.$t('m.EvalGroup_Exam'),
          lab: this.$t('m.EvalGroup_Lab'),
          assignment: this.$t('m.EvalGroup_Assignment'),
          other: this.$t('m.EvalGroup_Other')
        }
      },
      groupSummary () {
        const out = []
        TYPE_ORDER.forEach(k => {
          const list = this.groups[k]
          if (!list.length) return
          let max = 0
          let totalEarned = 0
          let studentCount = 0
          list.forEach(sb => {
            ;(sb.problems || []).forEach(p => { max += p.total_score || 0 })
            studentCount = Math.max(studentCount, (sb.students || []).length)
            ;(sb.students || []).forEach(s => {
              ;(sb.problems || []).forEach(p => {
                const cell = s.by_problem[p.label]
                if (cell && cell.testcase) totalEarned += (cell.testcase.score || 0)
              })
            })
          })
          const denom = max * studentCount || 1
          const avg = studentCount ? Math.round(totalEarned / studentCount) : 0
          const avgPct = ((totalEarned / denom) * 100).toFixed(1)
          out.push({
            key: k,
            label: this.groupLabels[k],
            contestCount: list.length,
            maxScore: max,
            avg,
            avgPct
          })
        })
        return out
      },
      totalPossible () {
        let t = 0
        this.scoreboards.forEach(sb => { (sb.problems || []).forEach(p => { t += p.total_score || 0 }) })
        return t
      },
      // 그룹별 max 점수 (학생 행에 표시할 그룹 소계 분모)
      groupMaxByKey () {
        const out = {}
        TYPE_ORDER.forEach(k => {
          let m = 0
          this.groups[k].forEach(sb => {
            (sb.problems || []).forEach(p => { m += p.total_score || 0 })
          })
          out[k] = m
        })
        return out
      },
      columns () {
        const cols = [
          {
            title: '학생',
            key: 'name',
            width: 150,
            fixed: 'left',
            sortable: true
          },
          {
            title: '학번',
            key: 'username',
            width: 110,
            fixed: 'left'
          },
          {
            title: '총점',
            key: 'total',
            width: 90,
            fixed: 'left',
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong' }, '총점'),
            render: (h, p) => h('strong', { class: 'cell-total' }, String(p.row.total))
          },
          {
            title: '%',
            key: 'pct',
            width: 80,
            fixed: 'left',
            sortable: true,
            render: (h, p) => h('span', { class: 'cell-pct' }, `${p.row.pct}%`)
          }
        ]
        // 그룹별 column: 각 그룹의 소계 컬럼 + 그룹 안의 contest 컬럼
        TYPE_ORDER.forEach(k => {
          const list = this.groups[k]
          if (!list.length) return
          const label = this.groupLabels[k]
          // 그룹 소계
          cols.push({
            title: `${label} ${this.$t('m.EvalGroup_Subtotal')}`,
            key: `g_${k}`,
            width: 130,
            sortable: true,
            renderHeader: (h) => h('div', { class: `th-group g-${k}` }, [
              h('div', { class: 'th-group-name' }, label),
              h('div', { class: 'th-group-sub' }, this.$t('m.EvalGroup_Subtotal'))
            ]),
            render: (h, p) => {
              const v = p.row[`g_${k}`] || 0
              const max = this.groupMaxByKey[k]
              const pct = max ? Math.round((v / max) * 100) : 0
              return h('div', { class: `cell-group g-${k}` }, [
                h('strong', String(v)),
                h('span', { class: 'cell-group-pct' }, ` (${pct}%)`)
              ])
            }
          })
          // 그룹 내 각 contest
          list.forEach(sb => {
            cols.push({
              title: sb.contest.title,
              key: 'c_' + sb.contest.id,
              width: 130,
              sortable: true,
              renderHeader: (h) => {
                const t = sb.contest.title
                const short = t.length > 14 ? t.slice(0, 12) + '…' : t
                return h('div', { class: `th-contest g-${k}`, attrs: { title: t } }, [
                  h('div', { class: 'th-contest-name' }, short),
                  h('div', { class: 'th-contest-type' }, sb.contest.lecture_contest_type || '')
                ])
              },
              render: (h, p) => h('span', { class: 'cell-contest' }, String(p.row['c_' + sb.contest.id] || 0))
            })
          })
        })
        return cols
      },
      aggregated () {
        if (!this.scoreboards.length) return []
        const byUser = new Map()
        this.scoreboards.forEach(sb => {
          const k = classify(sb.contest.lecture_contest_type)
          ;(sb.students || []).forEach(s => {
            if (!byUser.has(s.user_id)) {
              byUser.set(s.user_id, {
                user_id: s.user_id,
                username: s.username,
                name: s.realname || s.username,
                total: 0,
                g_exam: 0,
                g_lab: 0,
                g_assignment: 0,
                g_other: 0
              })
            }
            const row = byUser.get(s.user_id)
            let csum = 0
            ;(sb.problems || []).forEach(p => {
              const cell = s.by_problem[p.label]
              const sc = cell && cell.testcase ? (cell.testcase.score || 0) : 0
              csum += sc
            })
            row['c_' + sb.contest.id] = csum
            row.total += csum
            row['g_' + k] += csum
          })
        })
        const rows = [...byUser.values()]
        const tp = this.totalPossible || 1
        rows.forEach(r => { r.pct = ((r.total / tp) * 100).toFixed(1) })
        rows.sort((a, b) => b.total - a.total)
        return rows
      }
    },
    watch: {
      lectureId: { immediate: true, handler () { this.run() } }
    },
    methods: {
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
        // PR 4: 사이드카 → 본 서버 endpoint 로 전환
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
    gap: 16px;
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

  // 그룹 요약 카드들 (시험/실습/과제…)
  .group-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .group-card {
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    padding: 16px 18px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border-top: 3px solid #95a5a6;
    &.g-exam { border-top-color: #ed4014; }
    &.g-lab { border-top-color: #19be6b; }
    &.g-assignment { border-top-color: #2d8cf0; }
    &.g-other { border-top-color: #95a5a6; }
    .g-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 12px;
      .g-name { font-size: 14px; font-weight: 700; color: var(--text-color); }
      .g-count { font-size: 11px; opacity: 0.6; }
    }
    .g-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      .g-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
        .lbl { font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.05em; }
        .val { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
      }
    }
  }

  .table-card {
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    .table-meta {
      padding: 12px 18px;
      border-bottom: 1px solid var(--panel-border-color);
      background: var(--table-head-backgound);
      font-size: 13px;
      color: var(--text-color);
      span { margin-right: 24px; }
      b { font-weight: 500; opacity: 0.65; margin-right: 6px; }
    }
  }

  .overall-table /deep/ .ivu-table {
    .th-strong { font-weight: 700; }
    .th-group-name { font-weight: 700; font-size: 12px; }
    .th-group-sub { font-size: 10px; opacity: 0.55; }
    .th-contest-name { font-size: 12px; font-weight: 500; }
    .th-contest-type { font-size: 10px; opacity: 0.5; }
    .th-group, .th-contest { line-height: 1.25; }
    .th-group.g-exam .th-group-name { color: #ed4014; }
    .th-group.g-lab .th-group-name { color: #19be6b; }
    .th-group.g-assignment .th-group-name { color: #2d8cf0; }
    .th-contest.g-exam { border-bottom: 2px solid rgba(237, 64, 20, 0.4); }
    .th-contest.g-lab { border-bottom: 2px solid rgba(25, 190, 107, 0.4); }
    .th-contest.g-assignment { border-bottom: 2px solid rgba(45, 140, 240, 0.4); }
    .cell-total { font-weight: 700; }
    .cell-pct { opacity: 0.75; font-variant-numeric: tabular-nums; }
    .cell-group strong { font-weight: 700; font-variant-numeric: tabular-nums; }
    .cell-group.g-exam strong { color: #ed4014; }
    .cell-group.g-lab strong { color: #19be6b; }
    .cell-group.g-assignment strong { color: #2d8cf0; }
    .cell-group-pct { opacity: 0.55; font-size: 11px; margin-left: 4px; }
    .cell-contest { font-variant-numeric: tabular-nums; }
  }
</style>
