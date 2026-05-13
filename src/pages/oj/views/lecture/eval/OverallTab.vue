<template>
  <div class="overall-tab">
    <div v-if="loading" class="placeholder">
      <Spin size="large" fix/>
      집계 중… ({{ progressText }})
    </div>
    <div v-else-if="error" class="placeholder error">{{ error }}</div>
    <div v-else-if="!groupSections.length" class="placeholder">집계할 데이터가 없습니다.</div>
    <div v-else>
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

      <!-- 그룹별 표 (탭) — extra slot 에 Export 버튼 -->
      <Tabs v-model="activeGroupKey" class="overall-tabs" :animated="false">
        <div slot="extra">
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
        <TabPane v-for="g in groupSections"
                 :key="'tab-' + g.key"
                 :name="g.key"
                 :label="renderTabLabel(g)">
          <!-- 시험/대회 전용: 컨테스트별 가중치 입력 -->
          <div v-if="g.key === 'exam'" class="weights-panel">
            <div class="wp-head">
              <span class="wp-title">컨테스트별 환산 점수</span>
              <span class="wp-sum ok">
                합계 만점 <strong>{{ examWeightsSum }}</strong>점
              </span>
              <label class="wp-qual-toggle" :class="{ on: useQual[g.key] }">
                <input type="checkbox" :checked="useQual[g.key]"
                       @change="$set(useQual, g.key, $event.target.checked)"/>
                <span>정성평가 점수 반영</span>
                <span class="wp-qual-hint">max(자동, 제안부분점수)</span>
              </label>
              <a class="wp-reset" @click="resetExamWeights">초기화</a>
            </div>
            <div class="wp-grid">
              <label v-for="sb in g.scoreboards" :key="'w-' + sb.contest.id" class="wp-item" :title="sb.contest.title">
                <span class="wp-name">{{ sb.contest.title }}</span>
                <span class="wp-input">
                  <input type="number" min="0" step="1"
                         :value="examWeights[sb.contest.id] || 0"
                         @input="onWeightInput(sb.contest.id, $event)"
                         class="wp-num"/>
                  <span class="wp-unit">점</span>
                </span>
              </label>
            </div>
          </div>
          <!-- 비-시험 그룹: 그룹 전체 환산 만점 단일 입력 -->
          <div v-else class="weights-panel">
            <div class="wp-head">
              <span class="wp-title">{{ g.label }} 전체 환산 만점</span>
              <span class="wp-input wp-input-inline">
                <input type="number" min="0" step="1"
                       :value="groupScaleMax[g.key] || 0"
                       @input="onGroupScaleInput(g.key, $event)"
                       class="wp-num wp-num-large"/>
                <span class="wp-unit">점</span>
              </span>
              <label class="wp-qual-toggle" :class="{ on: useQual[g.key] }">
                <input type="checkbox" :checked="useQual[g.key]"
                       @change="$set(useQual, g.key, $event.target.checked)"/>
                <span>정성평가 점수 반영</span>
                <span class="wp-qual-hint">max(자동, 제안부분점수)</span>
              </label>
              <span class="wp-hint">학생별 환산점수 = 총점 / 그룹 만점 × 위 값</span>
            </div>
          </div>
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
        activeGroupKey: 'exam',
        examWeights: {},
        groupScaleMax: { lab: 0, assignment: 0, other: 0 },
        useQual: { exam: false, lab: false, assignment: false, other: false }
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
      },
      examWeightsSum () {
        const exam = this.groups.exam || []
        return exam.reduce((a, sb) => a + (Number(this.examWeights[sb.contest.id]) || 0), 0)
      }
    },
    watch: {
      lectureId: {
        immediate: true,
        handler (id) {
          this.loadExamWeights(id)
          this.loadGroupScaleMax(id)
          this.loadUseQual(id)
          this.run()
        }
      },
      groupSections (sections) {
        // 데이터 도착 후 활성 탭이 비어있는 그룹이면 첫 그룹으로 이동
        const has = sections.some(s => s.key === this.activeGroupKey)
        if (!has && sections.length) this.activeGroupKey = sections[0].key
      },
      examWeights: {
        deep: true,
        handler () { this.saveExamWeights() }
      },
      groupScaleMax: {
        deep: true,
        handler () { this.saveGroupScaleMax() }
      },
      useQual: {
        deep: true,
        handler () { this.saveUseQual() }
      }
    },
    methods: {
      _examWeightsKey (lectureId) {
        return `eval_exam_weights_${lectureId}`
      },
      _groupScaleMaxKey (lectureId) {
        return `eval_group_scale_max_${lectureId}`
      },
      _useQualKey (lectureId) {
        return `eval_use_qual_${lectureId}`
      },
      loadUseQual (lectureId) {
        const defaults = { exam: false, lab: false, assignment: false, other: false }
        if (!lectureId) { this.useQual = defaults; return }
        try {
          const raw = localStorage.getItem(this._useQualKey(lectureId))
          this.useQual = raw ? Object.assign({}, defaults, JSON.parse(raw)) : defaults
        } catch (e) { this.useQual = defaults }
      },
      saveUseQual () {
        if (!this.lectureId) return
        try {
          localStorage.setItem(this._useQualKey(this.lectureId), JSON.stringify(this.useQual))
        } catch (e) {}
      },
      loadGroupScaleMax (lectureId) {
        const defaults = { lab: 0, assignment: 0, other: 0 }
        if (!lectureId) { this.groupScaleMax = defaults; return }
        try {
          const raw = localStorage.getItem(this._groupScaleMaxKey(lectureId))
          this.groupScaleMax = raw ? Object.assign({}, defaults, JSON.parse(raw)) : defaults
        } catch (e) { this.groupScaleMax = defaults }
      },
      saveGroupScaleMax () {
        if (!this.lectureId) return
        try {
          localStorage.setItem(this._groupScaleMaxKey(this.lectureId), JSON.stringify(this.groupScaleMax))
        } catch (e) {}
      },
      onGroupScaleInput (groupKey, ev) {
        let v = Number(ev.target.value)
        if (!isFinite(v) || v < 0) v = 0
        this.$set(this.groupScaleMax, groupKey, v)
      },
      loadExamWeights (lectureId) {
        if (!lectureId) { this.examWeights = {}; return }
        try {
          const raw = localStorage.getItem(this._examWeightsKey(lectureId))
          this.examWeights = raw ? JSON.parse(raw) : {}
        } catch (e) { this.examWeights = {} }
      },
      saveExamWeights () {
        if (!this.lectureId) return
        try {
          localStorage.setItem(this._examWeightsKey(this.lectureId), JSON.stringify(this.examWeights))
        } catch (e) {}
      },
      onWeightInput (contestId, ev) {
        let v = Number(ev.target.value)
        if (!isFinite(v) || v < 0) v = 0
        if (v > 100) v = 100
        this.$set(this.examWeights, contestId, v)
      },
      resetExamWeights () {
        this.examWeights = {}
      },
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
        const useQual = !!this.useQual[groupKey]
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
                schoolssn: s.schoolssn || 0,
                schoolssnDisplay: s.schoolssn ? String(s.schoolssn) : '—',
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
                let cellScore = cell.testcase.score || 0
                // 정성평가 반영: qualitative.suggested_partial_score 와 비교해 큰 값.
                // qualitative 없으면 자동점수 그대로 (안전 기본).
                if (useQual && cell.qualitative && cell.qualitative.suggested_partial_score != null) {
                  const sps = cell.qualitative.suggested_partial_score || 0
                  if (sps > cellScore) cellScore = sps
                }
                csum += cellScore
                if (cell.testcase.result === 0) row.ac += 1
              }
            })
            row['c_' + sb.contest.id] = csum
            row.total += csum
          })
        })
        const rows = [...byUser.values()]
        const denom = maxScore || 1
        const scaleMax = Number(this.groupScaleMax[groupKey]) || 0
        // exam 그룹: contestId → cmax 캐시. row 별 totalConv 계산에 사용.
        const examCmaxById = {}
        if (groupKey === 'exam') {
          scoreboards.forEach(sb => {
            examCmaxById[sb.contest.id] = (sb.problems || []).reduce((a, p) => a + (p.total_score || 0), 0)
          })
        }
        rows.forEach(r => {
          r.scaled = Math.round((r.total / denom) * 100)
          r.progressPct = problemCount ? Math.round((r.submitted / problemCount) * 100) : 0
          r.acRate = r.submitted ? Math.round((r.ac / r.submitted) * 100) : 0
          if (groupKey === 'exam') {
            let acc = 0
            scoreboards.forEach(sb => {
              const w = Number(this.examWeights[sb.contest.id]) || 0
              const cmax = examCmaxById[sb.contest.id] || 0
              if (!w || !cmax) return
              acc += ((r['c_' + sb.contest.id] || 0) / cmax) * w
            })
            r.totalConv = Math.round(acc * 10) / 10
          } else {
            r.customScaled = scaleMax && maxScore ? Math.round((r.total / maxScore) * scaleMax * 10) / 10 : 0
          }
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
          scoreboards,
          columns: this._buildColumns(groupKey, scoreboards, maxScore, problemCount)
        }
      },
      _buildColumns (groupKey, scoreboards, maxScore, problemCount) {
        const cols = [
          { title: '이름', key: 'name', width: 110, fixed: 'left', sortable: true },
          { title: 'ID', key: 'username', width: 110, fixed: 'left' },
          {
            title: '학번',
            key: 'schoolssn',
            width: 110,
            fixed: 'left',
            sortable: true,
            render: (h, p) => h('span', { class: 'cell-ssn' }, p.row.schoolssnDisplay)
          },
          {
            title: this.$t('m.EvalCol_TotalRaw'),
            key: 'total',
            width: 90,
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong' }, this.$t('m.EvalCol_TotalRaw')),
            render: (h, p) => h('strong', { class: 'cell-total' }, String(p.row.total))
          },
          {
            title: this.$t('m.EvalCol_Scaled'),
            key: 'scaled',
            width: 110,
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong' }, [
              h('div', this.$t('m.EvalCol_Scaled')),
              h('div', { class: 'th-sub' }, `만점 ${maxScore}`)
            ]),
            render: (h, p) => h('span', { class: 'cell-scaled' }, [
              h('strong', String(p.row.scaled)),
              h('small', { class: 'unit' }, ' /100')
            ])
          }
        ]
        // [환산] 다음 — [전체 환산점수] 컬럼.
        //   exam: 컨테스트별 환산값의 합 (가중치 합 만점 기준)
        //   비-exam: 그룹 전체 환산 만점 입력값 기준 (총점 / 그룹만점 × 만점)
        if (groupKey === 'exam') {
          cols.push({
            title: '전체 환산',
            key: 'totalConv',
            width: 130,
            sortable: true,
            renderHeader: (h) => h('div', { class: 'th-strong th-weighted' }, [
              h('div', '전체 환산'),
              h('div', { class: 'th-sub' }, `합계 만점 ${this.examWeightsSum}점`)
            ]),
            render: (h, p) => {
              const v = p.row.totalConv || 0
              return h('span', { class: 'cell-weighted' }, [
                h('strong', v.toFixed(1)),
                h('small', { class: 'unit' }, ` / ${this.examWeightsSum}`)
              ])
            }
          })
        } else {
          const scaleMax = Number(this.groupScaleMax[groupKey]) || 0
          if (scaleMax) {
            cols.push({
              title: '전체 환산',
              key: 'customScaled',
              width: 130,
              sortable: true,
              renderHeader: (h) => h('div', { class: 'th-strong th-weighted' }, [
                h('div', '전체 환산'),
                h('div', { class: 'th-sub' }, `만점 ${scaleMax}점`)
              ]),
              render: (h, p) => {
                const v = p.row.customScaled || 0
                return h('span', { class: 'cell-weighted' }, [
                  h('strong', v.toFixed(1)),
                  h('small', { class: 'unit' }, ` / ${scaleMax}`)
                ])
              }
            })
          }
        }
        // 진행 / AC 는 전체환산 다음에
        cols.push({
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
        })
        cols.push({
          title: this.$t('m.EvalCol_ACCount'),
          key: 'ac',
          width: 100,
          sortable: true,
          renderHeader: (h) => h('div', { class: 'th-strong' }, this.$t('m.EvalCol_ACCount')),
          render: (h, p) => h('span', { class: 'cell-ac' }, [
            h('strong', String(p.row.ac)),
            h('small', { class: 'unit' }, ` (${p.row.acRate}%)`)
          ])
        })
        // 그룹 안 각 contest: 원점수 컬럼 + (시험/대회 그룹만) 환산점수 컬럼
        scoreboards.forEach(sb => {
          const cmax = (sb.problems || []).reduce((a, p) => a + (p.total_score || 0), 0)
          const rawKey = 'c_' + sb.contest.id
          const t = sb.contest.title
          const short = t.length > 14 ? t.slice(0, 12) + '…' : t
          // 원점수 컬럼
          cols.push({
            title: t,
            key: rawKey,
            width: 120,
            sortable: true,
            renderHeader: (h) => h('div', { class: `th-contest g-${groupKey}`, attrs: { title: t } }, [
              h('div', { class: 'th-contest-name' }, short),
              h('div', { class: 'th-contest-sub' }, [
                h('span', { class: 'th-contest-type' }, sb.contest.lecture_contest_type || ''),
                h('span', { class: 'th-contest-max' }, ` · 만점 ${cmax}`)
              ])
            ]),
            render: (h, p) => h('span', { class: 'cell-contest-raw' }, String(p.row[rawKey] || 0))
          })
          // 시험/대회 그룹: 환산점수 컬럼 추가
          if (groupKey === 'exam') {
            cols.push({
              title: t + ' 환산',
              key: rawKey + '_conv',
              width: 110,
              sortable: true,
              sortMethod: (a, b, type) => {
                const w = Number(this.examWeights[sb.contest.id]) || 0
                const av = cmax ? (a[rawKey] || 0) / cmax * w : 0
                const bv = cmax ? (b[rawKey] || 0) / cmax * w : 0
                return type === 'asc' ? av - bv : bv - av
              },
              renderHeader: (h) => {
                const w = Number(this.examWeights[sb.contest.id]) || 0
                return h('div', { class: `th-contest th-contest-conv g-${groupKey}`, attrs: { title: t + ' 환산' } }, [
                  h('div', { class: 'th-contest-name' }, short + ' 환산'),
                  h('div', { class: 'th-contest-sub' }, w ? `만점 ${w}점` : '미설정')
                ])
              },
              render: (h, p) => {
                const w = Number(this.examWeights[sb.contest.id]) || 0
                if (!w || !cmax) return h('span', { class: 'cell-contest-conv muted' }, '—')
                const conv = Math.round(((p.row[rawKey] || 0) / cmax) * w * 10) / 10
                return h('span', { class: 'cell-contest-conv' }, [
                  h('strong', conv.toFixed(1)),
                  h('small', { class: 'unit' }, ` / ${w}`)
                ])
              }
            })
          }
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
      _exportPayload () {
        // examWeights / groupScaleMax / useQual 중 의미있는 값만 backend 로 전달.
        const weights = {}
        Object.keys(this.examWeights).forEach(cid => {
          const v = Number(this.examWeights[cid]) || 0
          if (v > 0) weights[cid] = v
        })
        const scales = {}
        Object.keys(this.groupScaleMax).forEach(g => {
          const v = Number(this.groupScaleMax[g]) || 0
          if (v > 0) scales[g] = v
        })
        const useQual = {}
        Object.keys(this.useQual).forEach(g => {
          if (this.useQual[g]) useQual[g] = true
        })
        return { weights, scales, useQual }
      },
      onExport (fmt) {
        if (this.exporting) return
        this.exporting = true
        const url = EvalApi.lectureExportUrl(this.lectureId, fmt, this._exportPayload())
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

  // 시험/대회 가중치 입력 패널
  .weights-panel {
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 12px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
    .wp-head {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 10px;
      .wp-title { font-size: 13px; font-weight: 600; color: var(--text-color); }
      .wp-sum {
        font-size: 12px;
        padding: 2px 10px;
        border-radius: 10px;
        font-variant-numeric: tabular-nums;
        strong { font-weight: 700; margin: 0 2px; }
        small { font-weight: 400; opacity: 0.75; margin-left: 4px; }
        &.ok { background: rgba(25, 190, 107, 0.15); color: #19be6b; }
        &.off { background: rgba(255, 153, 0, 0.15); color: #c2820e; }
      }
      .wp-reset {
        margin-left: auto;
        font-size: 11px;
        color: var(--text-color);
        opacity: 0.6;
        cursor: pointer;
        &:hover { opacity: 1; color: var(--text-hover-color); }
      }
      .wp-input-inline {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        .wp-num-large {
          width: 80px;
          font-size: 14px;
          font-weight: 600;
        }
        .wp-unit { font-size: 12px; opacity: 0.7; }
      }
      .wp-hint {
        font-size: 11px;
        opacity: 0.55;
        color: var(--text-color);
        margin-left: 8px;
      }
      .wp-qual-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border: 1px solid var(--panel-border-color);
        border-radius: 14px;
        font-size: 12px;
        color: var(--text-color);
        cursor: pointer;
        user-select: none;
        transition: background 0.1s, border-color 0.1s, color 0.1s;
        input[type="checkbox"] {
          margin: 0;
          cursor: pointer;
        }
        .wp-qual-hint {
          opacity: 0.55;
          font-size: 10px;
          font-variant-numeric: tabular-nums;
        }
        &:hover {
          border-color: var(--text-hover-color);
        }
        &.on {
          background: rgba(45, 140, 240, 0.12);
          border-color: var(--text-hover-color);
          color: var(--text-hover-color);
          .wp-qual-hint { opacity: 0.75; }
        }
      }
    }
    .wp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 8px 14px;
    }
    .wp-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: var(--text-color);
      .wp-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .wp-input {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        .wp-num {
          width: 56px;
          padding: 3px 6px;
          border: 1px solid var(--panel-border-color);
          border-radius: 4px;
          font-size: 12px;
          text-align: right;
          font-variant-numeric: tabular-nums;
          background: var(--panelBackground);
          color: var(--text-color);
          &:focus { border-color: var(--text-hover-color); outline: none; }
        }
        .wp-unit { opacity: 0.6; font-size: 11px; }
      }
    }
  }

  .overall-tabs /deep/ .ivu-tabs-bar {
    margin-bottom: 12px;
    border-bottom-color: var(--panel-border-color);
  }
  .overall-tabs /deep/ .ivu-tabs-extra {
    // iView 2 의 .ivu-tabs-extra 는 padding 영향을 안 받음 (float/absolute).
    // transform 으로 확실히 내림.
    transform: translateY(10px);
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
    .cell-contest-raw {
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }
    .cell-contest-conv {
      font-variant-numeric: tabular-nums;
      color: #ed4014;
      strong { font-weight: 700; }
      .unit { opacity: 0.6; font-size: 11px; margin-left: 1px; }
      &.muted { color: var(--text-color); opacity: 0.35; }
    }
    .th-contest-sub {
      font-size: 10px;
      opacity: 0.5;
      .th-contest-type, .th-contest-max { display: inline; }
    }
    .th-contest-conv .th-contest-name { color: #ed4014; }
    .th-contest-conv .th-contest-sub { color: #ed4014; opacity: 0.7; }
    .cell-ssn { font-variant-numeric: tabular-nums; opacity: 0.9; }
    .cell-weighted strong { font-weight: 700; font-variant-numeric: tabular-nums; color: #ed4014; }
    .th-weighted .th-sub { color: #ed4014; opacity: 0.7; }
  }
</style>
