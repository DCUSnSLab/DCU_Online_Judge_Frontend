<template>
  <div class="bycontest-tab">
    <!-- Toolbar: 좌(label + select) | 우(actions). 모든 컨트롤 28px 통일. -->
    <div class="toolbar">
      <div class="left">
        <span class="lbl">컨테스트</span>
        <Select v-model="selectedContestId"
                :placeholder="$t('m.EvalSelectContest')"
                filterable
                size="small"
                class="contest-select"
                @on-change="onSelectChange">
          <Option v-for="c in contests" :key="c.id" :value="c.id" :label="c.title">
            <span>{{ c.title }}</span>
            <span class="opt-meta">{{ c.lecture_contest_type }}</span>
          </Option>
        </Select>
      </div>
      <div class="right">
        <EvalControls v-if="selectedContestId"
                      :contest-id="selectedContestId"
                      :attach-job-id="attachJobId"
                      @done="refreshScoreboard"/>
        <Dropdown v-if="selectedContestId"
                  @on-click="onExport"
                  trigger="click"
                  class="export-dd">
          <Button size="small" class="export-btn">
            <Icon type="ios-download-outline"/> Export <Icon type="arrow-down-b"/>
          </Button>
          <DropdownMenu slot="list">
            <DropdownItem name="xlsx">엑셀 (.xlsx)</DropdownItem>
            <DropdownItem name="csv">CSV</DropdownItem>
          </DropdownMenu>
        </Dropdown>
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
      },
      // URL query.contest 가 외부에서 바뀌면 (예: MyJobsBanner 클릭) 동기화.
      // 같은 lecture 안에서 query 만 바뀌는 케이스 — props 는 변하지 않아 다른 watch 가 안 잡음.
      '$route.query.contest': {
        handler (newVal) {
          const qid = parseInt(newVal)
          if (!qid || qid === this.selectedContestId) return
          if (this.contests.find(c => c.id === qid)) {
            this.selectedContestId = qid
          }
        }
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
  // 단일 row 플렉스 — 좌측 select 가 가용 폭 채우고, 우측 actions 는 고정.
  // 좁아지면 wrap.
  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: var(--panelBackground);
    border: 1px solid var(--panel-border-color);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03);
    flex-wrap: wrap;

    .left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1 1 320px;
      min-width: 0;
      .lbl {
        color: var(--text-color);
        opacity: 0.7;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        flex-shrink: 0;
      }
      .contest-select {
        flex: 1;
        min-width: 220px;
        max-width: 480px;
      }
      .opt-meta {
        float: right;
        font-size: 11px;
        opacity: 0.55;
        margin-left: 12px;
      }
    }
    .right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      flex-wrap: wrap;
      justify-content: flex-end;
      .export-dd { flex-shrink: 0; }
      .export-btn { height: 28px; }
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
