<template>
  <div class="lecture-page">
    <Tabs :value="activeTab"
          @on-click="onTabChange"
          class="lecture-tabs"
          type="card">
      <TabPane :label="tabLabel('contests')" name="contests">
        <ContestList :lecture-id="lectureID" @contests-loaded="onContestsLoaded"/>
      </TabPane>
      <TabPane v-if="canViewScores"
               :label="tabLabel('overall')"
               name="overall">
        <OverallTab v-if="activeTab === 'overall'"
                    :lecture-id="lectureID"/>
      </TabPane>
      <TabPane v-if="canViewScores"
               :label="tabLabel('by-contest')"
               name="by-contest">
        <ByContestTab v-if="activeTab === 'by-contest'"
                      :lecture-id="lectureID"/>
      </TabPane>
    </Tabs>
  </div>
</template>

<script>
  import api from '@oj/api'
  import ContestList from './ContestList.vue'

  const OverallTab = () => import(/* webpackChunkName: "lecture-eval" */ './eval/OverallTab.vue')
  const ByContestTab = () => import(/* webpackChunkName: "lecture-eval" */ './eval/ByContestTab.vue')

  export default {
    name: 'LectureDetail',
    components: { ContestList, OverallTab, ByContestTab },
    data () {
      return {
        canViewScores: false,
        loadedContests: [],
        activeTab: 'contests'
      }
    },
    computed: {
      lectureID () { return this.$route.params.lectureID }
    },
    mounted () {
      this.activeTab = this.$route.query.tab || 'contests'
      this.fetchPermission()
    },
    methods: {
      tabLabel (key) {
        const map = {
          'contests': 'm.EvalTab_Contests',
          'overall': 'm.EvalTab_Overall',
          'by-contest': 'm.EvalTab_ByContest'
        }
        return this.$t(map[key])
      },
      fetchPermission () {
        api.getLectureScorePermission(this.lectureID).then(res => {
          this.canViewScores = !!(res.data && res.data.data && res.data.data.can_view_scores)
        }).catch(() => { this.canViewScores = false })
      },
      onContestsLoaded (payload) {
        this.loadedContests = payload.contests || []
      },
      onTabChange (name) {
        this.activeTab = name
        const q = Object.assign({}, this.$route.query, { tab: name })
        if (name === 'contests') delete q.tab
        this.$router.replace({ name: 'lecture-details', params: { lectureID: this.lectureID }, query: q })
      }
    },
    watch: {
      '$route' (newVal) {
        const t = newVal.query.tab || 'contests'
        if (t !== this.activeTab) this.activeTab = t
        if (newVal.params.lectureID !== this.lectureID) this.fetchPermission()
      }
    }
  }
</script>

<style lang="less" scoped>
  .lecture-page {
    padding: 4px 0 24px;
  }
  .lecture-tabs {
    /deep/ .ivu-tabs-bar {
      margin-bottom: 18px;
      border-bottom: 1px solid var(--panel-border-color);
    }
    /deep/ .ivu-tabs-nav-container {
      font-size: 14px;
    }
    /deep/ .ivu-tabs-tab {
      position: relative;
      padding: 10px 22px;
      margin-right: 8px;
      color: var(--text-color);
      opacity: 0.65;
      border: none !important;
      background: transparent !important;
      border-radius: 8px 8px 0 0;
      transition: opacity 0.15s, color 0.15s;
      font-weight: 500;
      &:hover {
        opacity: 1;
        color: var(--text-hover-color);
      }
    }
    /deep/ .ivu-tabs-tab-active {
      opacity: 1;
      color: var(--text-hover-color) !important;
      font-weight: 600;
      &::after {
        content: '';
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: -1px;
        height: 3px;
        background: var(--text-hover-color);
        border-radius: 3px 3px 0 0;
      }
    }
    /deep/ .ivu-tabs-ink-bar {
      display: none;  // 위 ::after 로 직접 그림
    }
  }
</style>
