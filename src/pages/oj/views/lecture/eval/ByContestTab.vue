<template>
  <div class="bycontest-tab">
    <!-- Top toolbar: 고정 grid 레이아웃. eval status 가 길어져도 좌측 select/buttons는 안 흔들림. -->
    <div class="toolbar">
      <div class="contest-zone">
        <span class="lbl">컨테스트</span>
        <Select v-model="selectedContestId"
                :placeholder="$t('m.EvalSelectContest')"
                filterable
                class="contest-select"
                @on-change="onSelectChange">
          <Option v-for="c in contests" :key="c.id" :value="c.id" :label="c.title">
            <span>{{ c.title }}</span>
            <span class="opt-meta">{{ c.lecture_contest_type }}</span>
          </Option>
        </Select>
      </div>
      <div class="eval-zone">
        <Dropdown v-if="selectedContestId"
                  @on-click="onExport"
                  trigger="click"
                  class="export-dd">
          <Button size="small">
            <Icon type="ios-download-outline"/> Export
            <Icon type="arrow-down-b"/>
          </Button>
          <DropdownMenu slot="list">
            <DropdownItem name="xlsx">엑셀 (.xlsx)</DropdownItem>
            <DropdownItem name="csv">CSV</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <EvalControls v-if="selectedContestId"
                      :contest-id="selectedContestId"
                      :attach-job-id="attachJobId"
                      @done="refreshScoreboard"/>
      </div>
    </div>

    <!-- Content: 좌측 매트릭스 + 우측 detail panel (조건부) -->
    <div class="content"
         :class="{ 'with-panel': panelOpen }">
      <div class="matrix-zone">
        <div v-if="loadingContests" class="placeholder">불러오는 중…</div>
        <div v-else-if="error" class="placeholder error">{{ error }}</div>
        <div v-else-if="!contests.length" class="placeholder">이 강의에 등록된 컨테스트가 없습니다.</div>
        <Scoreboard v-else-if="selectedContestId"
                    ref="sb"
                    :contest-id="selectedContestId"
                    :selected-user-id="selectedCell.userId"
                    :selected-problem-id="selectedCell.problemId"
                    @cell-click="onCellClick"/>
        <div v-else class="placeholder muted">상단에서 컨테스트를 선택해 주세요.</div>
      </div>
      <DetailPanel v-if="panelOpen && selectedContestId"
                   :visible="panelOpen"
                   :contest-id="selectedContestId"
                   :user-id="selectedCell.userId"
                   :problem-id="selectedCell.problemId"
                   :student-name="selectedCell.studentName"
                   :problem-label="selectedCell.problemLabel"
                   @close="closePanel"/>
    </div>
  </div>
</template>

<script>
  import EvalApi from './EvalApi'
  import Scoreboard from './Scoreboard.vue'
  import EvalControls from './EvalControls.vue'
  import DetailPanel from './DetailPanel.vue'

  export default {
    name: 'ByContestTab',
    components: { Scoreboard, EvalControls, DetailPanel },
    props: {
      lectureId: { type: [String, Number], required: true }
    },
    data () {
      return {
        contests: [],
        selectedContestId: null,
        loadingContests: false,
        error: '',
        attachJobId: null,
        panelOpen: false,
        selectedCell: { userId: null, problemId: null, studentName: '', problemLabel: '' }
      }
    },
    watch: {
      lectureId: { immediate: true, handler () { this.fetchContests() } },
      selectedContestId (id) {
        this.fetchAttachStatus(id)
        this.closePanel()
      }
    },
    methods: {
      fetchContests () {
        this.loadingContests = true
        this.error = ''
        EvalApi.listContests(this.lectureId)
          .then(list => {
            this.contests = list || []
            const qid = parseInt(this.$route.query.contest)
            if (qid && this.contests.find(c => c.id === qid)) {
              this.selectedContestId = qid
            } else if (this.contests.length) {
              this.selectedContestId = this.contests[0].id
            }
          })
          .catch(e => { this.error = (e && e.detail) || '컨테스트 목록 로드 실패' })
          .finally(() => { this.loadingContests = false })
      },
      fetchAttachStatus (contestId) {
        this.attachJobId = null
        if (!contestId) return
        EvalApi.getEvalStatus(contestId).then(s => {
          if (s && s.running_job_id) this.attachJobId = s.running_job_id
        }).catch(() => {})
      },
      onSelectChange (id) {
        const q = Object.assign({}, this.$route.query, { tab: 'by-contest', contest: id })
        this.$router.replace({ query: q })
      },
      onCellClick (cell) {
        this.selectedCell = cell
        this.panelOpen = true
      },
      closePanel () {
        this.panelOpen = false
      },
      refreshScoreboard () {
        if (this.$refs.sb) this.$refs.sb.refresh()
        this.fetchAttachStatus(this.selectedContestId)
      },
      onExport (fmt) {
        if (!this.selectedContestId) return
        // PR 4: 사이드카 → 본 서버 endpoint 로 전환
        const url = EvalApi.contestExportUrl(this.selectedContestId, fmt)
        const a = document.createElement('a')
        a.href = url
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    }
  }
</script>

<style lang="less" scoped>
  .bycontest-tab {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  // 고정 그리드: contest-zone | eval-zone
  // eval-zone 의 진행 상태 텍스트가 길어져도 contest-zone 폭은 고정.
  .toolbar {
    display: grid;
    grid-template-columns: minmax(360px, 420px) 1fr;
    gap: 18px;
    align-items: center;
    padding: 14px 18px;
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    .contest-zone {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      .lbl {
        color: var(--text-color);
        opacity: 0.7;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        flex-shrink: 0;
      }
      .contest-select { flex: 1; min-width: 0; }
      .opt-meta { float: right; font-size: 11px; opacity: 0.55; margin-left: 12px; }
    }
    .eval-zone {
      min-width: 0;
      overflow: hidden;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      gap: 8px;
      .export-dd { flex-shrink: 0; }
    }
  }
  .content {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    .matrix-zone {
      flex: 1 1 0;
      min-width: 0;
    }
    &.with-panel .matrix-zone {
      // detail panel이 열리면 매트릭스 영역을 줄여 공간 확보
    }
  }
  .placeholder {
    padding: 80px 24px;
    text-align: center;
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 12px;
    color: var(--text-color);
    opacity: 0.7;
    &.muted { opacity: 0.55; }
    &.error { color: #ed4014; opacity: 1; }
  }
</style>
