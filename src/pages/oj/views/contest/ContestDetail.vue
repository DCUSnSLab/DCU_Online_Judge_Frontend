<template>
  <div class="flex-container">
    <div v-if="isvisible" v-show="showMenu" class="pane menu-pane" :class="{'pane-collapsed': !menuExpanded}">
      <div v-show="menuExpanded" class="pane-content pane-scroll">
        <div class="pane-header">
          <span class="title" style="font-weight: bold; margin-left: 10px;">메뉴</span>
          <icon type="chevron-left" @click="menuExpanded = false" class="toggle-btn"></icon>
        </div>
        <VerticalMenu @on-click="handleRoute">
          <VerticalMenu-item :route="{name: 'contest-details', params: {contestID: contestID, lectureID: lectureID}}">
            <Icon type="home"></Icon>
            {{$t('m.Overview')}}
          </VerticalMenu-item>

          <VerticalMenu-item :disabled="contestMenuDisabled"
                             :route="{name: 'contest-announcement-list', params: {contestID: contestID, lectureID: lectureID}}">
            <Icon type="chatbubble-working"></Icon>
            {{$t('m.Announcements')}}
          </VerticalMenu-item>

          <div class="menu-collapsible-wrapper">
            <VerticalMenu-item :disabled="contestMenuDisabled" @click.native="problemListExpanded = !problemListExpanded">
              <Icon type="ios-photos"></Icon>
              {{$t('m.Problems')}}
              <Icon :type="problemListExpanded ? 'chevron-up' : 'chevron-down'" style="float: right; margin-top: 3px; font-size: 14px; color: #999;"></Icon>
            </VerticalMenu-item>
            <ul v-show="problemListExpanded && !contestMenuDisabled" class="problem-list-menu">
              <li v-for="(p, index) in problemList" :key="p._id"
                  @click="selectProblem(p)"
                  :class="{'active-problem': selectedProblem && p._id === selectedProblem._id}">
                <span v-if="p.my_status === 0" class="status-label status-completed">[완료]</span>
                <span v-else-if="p.my_status !== null && p.my_status !== undefined" class="status-label status-error">[오류]</span>
                <span>{{index + 1}}. {{p.title || p._id}}</span>
              </li>
            </ul>
          </div>

          <VerticalMenu-item v-if="OIContestRealTimePermission"
                             :disabled="contestMenuDisabled"
                             :route="{name: 'contest-submission-list'}">
            <Icon type="navicon-round"></Icon>
            {{$t('m.Submissions')}}
          </VerticalMenu-item>
          <VerticalMenu-item v-if="OIContestRealTimePermission"
                             :route="{name: 'contest-qna', params: {contestID: contestID, lectureID: lectureID}}">
            <Icon type="help"></Icon>
            {{$t('m.qa')}}
          </VerticalMenu-item>

          <VerticalMenu-item v-if="OIContestRealTimePermission"
                             :disabled="contestMenuDisabled"
                             :route="{name: 'contest-rank', params: {contestID: contestID, lectureID: lectureID}}">
            <Icon type="stats-bars"></Icon>
            {{$t('m.Rankings')}}
          </VerticalMenu-item>

          <VerticalMenu-item v-if="showAdminHelper"
                             :route="{name: 'acm-helper', params: {contestID: contestID, lectureID: lectureID}}">
            <Icon type="ios-paw"></Icon>
            {{$t('m.Admin_Helper')}}
          </VerticalMenu-item>
          <VerticalMenu-item v-if="contestType === '대회' && this.lectureID"
                             :route="{name: 'lecture-contest-exit', params: {contestID: contestID, lectureID: lectureID}}">
            <Icon type="android-exit"></Icon>
            {{$t('m.Exit')}}
          </VerticalMenu-item>
        </VerticalMenu>

        <br />
        <Card v-if="selectedProblem" id="info" :padding="10">
          <div slot="title" class="header" style="font-size: 14px;">
            <Icon type="information-circled"></Icon>
            <span class="card-title">{{ $t('m.Information') }}</span>
          </div>
          <ul style="font-size: 13px;">
            <li>
              <p>ID</p>
              <p>{{ selectedProblem._id }}</p>
            </li>
            <li>
              <p>{{ $t('m.Time_Limit') }}</p>
              <p>{{ selectedProblem.time_limit }}MS</p>
            </li>
            <li>
              <p>{{ $t('m.Memory_Limit') }}</p>
              <p>{{ selectedProblem.memory_limit }}MB</p>
            </li>
            <li v-if="selectedProblem.io_mode">
              <p>{{ $t('m.IOMode') }}</p>
              <p>{{ selectedProblem.io_mode.io_mode }}</p>
            </li>
            <li v-if="selectedProblem.created_by">
              <p>{{ $t('m.Created') }}</p>
              <p>{{ selectedProblem.created_by.username }}</p>
            </li>
            <li v-if="selectedProblem.difficulty">
              <p>{{ $t('m.Level') }}</p>
              <p>{{ $t('m.' + selectedProblem.difficulty) }}</p>
            </li>
            <li v-if="selectedProblem.total_score">
              <p>{{ $t('m.Score') }}</p>
              <p>{{ selectedProblem.total_score }}</p>
            </li>
            <li v-if="selectedProblem.tags && selectedProblem.tags.length">
              <p>{{ $t('m.Tags') }}</p>
              <p>
                <Poptip trigger="hover" placement="left-end">
                  <a>{{ $t('m.Show') }}</a>
                  <div slot="content">
                    <Tag v-for="tag in selectedProblem.tags" :key="tag">{{ tag }}</Tag>
                  </div>
                </Poptip>
              </p>
            </li>
          </ul>
        </Card>
        <br />
        <Card v-if="selectedProblem" id="statistic" :padding="10">
          <div slot="title" class="header" style="font-size: 14px;">
            <Icon type="ios-analytics"></Icon>
            <span class="card-title">{{ $t('m.Statistic') }}</span>
          </div>
          <div class="echarts">
            <ECharts :options="pie"></ECharts>
          </div>
        </Card>
      </div>
      <div v-show="!menuExpanded" class="pane-collapsed-content" @click="menuExpanded = true">
        <icon type="navicon-round" size="24"></icon>
      </div>
    </div>
    <div id="contest-main">
      <!--children-->
      <transition name="fadeInUp">
        <router-view></router-view>
      </transition>
      <!--children end-->
      <div class="flex-container" v-if="route_name === 'contest-details'">
        <template>
          <div v-if="isvisible" id="contest-desc">
            <Panel :padding="20" shadow>
              <div slot="title">
                {{contest.title}}
              </div>
              <div slot="extra">
                <Tag type="dot" :color="countdownColor">
                  <span id="countdown">{{countdown}}</span>
                </Tag>
              </div>
              <div v-html="contest.description" class="markdown-body"></div>
              <div v-if="passwordFormVisible" class="contest-password">
                <Input v-model="contestPassword" type="password"
                       placeholder="contest password" class="contest-password-input"
                       @on-enter="checkPassword"/>
                <Button type="info" @click="checkPassword">Enter</Button>
              </div>
            </Panel>
            <Table :columns="columns" :data="contest_table" disabled-hover style="margin-bottom: 40px;"></Table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import api from '@oj/api'
  import { mapState, mapGetters, mapActions } from 'vuex'
  import { types } from '@/store'
  import { CONTEST_STATUS_REVERSE, CONTEST_STATUS, JUDGE_STATUS } from '@/utils/constants'
  import time from '@/utils/time'
  import { pie } from '../problem/chartData'
  import ECharts from 'vue-echarts/components/ECharts'
  import 'echarts/lib/chart/pie'

  export default {
    name: 'ContestDetail',
    components: {
      ECharts
    },
    data () {
      return {
        CONTEST_STATUS: CONTEST_STATUS,
        JUDGE_STATUS: JUDGE_STATUS,
        route_name: '',
        btnLoading: false,
        contestID: '',
        lectureID: '',
        contestPassword: '',
        isvisible: false,
        isSubmit: false,
        contestType: '',
        menuExpanded: true,
        problemListExpanded: true,
        problemList: [],
        selectedProblem: null,
        pie: pie,
        columns: [
          {
            title: this.$i18n.t('m.ID'),
            render: (h, params) => {
              return h('span', params.row.id)
            }
          },
          {
            title: this.$i18n.t('m.StartAt'),
            render: (h, params) => {
              return h('span', time.utcToLocal(params.row.start_time))
            }
          },
          {
            title: this.$i18n.t('m.EndAt'),
            render: (h, params) => {
              return h('span', time.utcToLocal(params.row.end_time))
            }
          },
          {
            title: this.$i18n.t('m.ContestType'),
            render: (h, params) => {
              return h('span', this.$i18n.t('m.' + params.row.contest_type))
            }
          },
          {
            title: this.$i18n.t('m.Rule'),
            render: (h, params) => {
              return h('span', this.$i18n.t('m.' + params.row.rule_type))
            }
          },
          {
            title: this.$i18n.t('m.Creator'),
            render: (h, data) => {
              return h('span', data.row.created_by.username)
            }
          }
        ]
      }
    },
    mounted () {
      this.contestID = this.$route.params.contestID
      this.lectureID = this.$route.params.lectureID
      this.route_name = this.$route.name
      this.$store.dispatch('getContest').then(res => {
        this.contestType = res.data.data.lecture_contest_type
      }).catch(() => {
      })
      this.$store.dispatch('getContest').then(res => {
        this.changeDomTitle({title: res.data.data.title})
        let data = res.data.data
        this.isvisible = res.data.data.visible
        if (this.isvisible === false) {
          this.$error('잘못된 경로로 진입했습니다.')
        }
        this.lectureID = res.data.data.lecture
        let endTime = moment(data.end_time)
        if (endTime.isAfter(moment(data.now))) {
          this.timer = setInterval(() => {
            this.$store.commit(types.NOW_ADD_1S)
          }, 1000)
        }
      })
      this.loadProblemList()
      this.loadCurrentProblem()
      this.$root.$on('submission-judged', this.loadProblemList)
    },
    methods: {
      ...mapActions(['changeDomTitle']),
      handleRoute (route) {
        this.$router.push(route)
      },
      checkPassword () {
        if (this.contestPassword === '') {
          this.$error('Password can\'t be empty')
          return
        }
        this.btnLoading = true
        api.checkContestPassword(this.contestID, this.contestPassword).then((res) => {
          this.$success('Succeeded')
          this.$store.commit(types.CONTEST_ACCESS, {access: true})
          this.btnLoading = false
        }, (res) => {
          this.btnLoading = false
        })
      },
      loadProblemList () {
        if (this.contestID) {
          api.getContestProblemList(this.contestID).then(res => {
            this.problemList = res.data.data || []
          }).catch(() => {
            this.problemList = []
          })
        }
      },
      selectProblem (problem) {
        this.selectedProblem = problem
        this.changePie(problem)
        this.$router.push({
          name: 'contest-problem-details',
          params: {
            contestID: this.contestID,
            problemID: problem._id
          }
        })
      },
      changePie (problemData) {
        if (!problemData) return
        let acNum = problemData.accepted_number || 0
        let totalNum = problemData.submission_number || 0
        this.pie.series[0].data = [
          {name: 'WA', value: totalNum - acNum},
          {name: 'AC', value: acNum}
        ]
      },
      loadCurrentProblem () {
        let problemID = this.$route.params.problemID
        if (problemID && this.contestID) {
          api.getContestProblem(problemID, this.contestID).then(res => {
            this.selectedProblem = res.data.data
            this.changePie(res.data.data)
          }).catch(() => {})
        }
      }
    },
    computed: {
      ...mapState({
        showMenu: state => state.contest.itemVisible.menu,
        contest: state => state.contest.contest,
        contest_table: state => [state.contest.contest],
        now: state => state.contest.now
      }),
      ...mapGetters(
        ['contestMenuDisabled', 'contestRuleType', 'contestStatus', 'countdown', 'isContestAdmin',
          'OIContestRealTimePermission', 'passwordFormVisible']
      ),
      countdownColor () {
        if (this.contestStatus) {
          return CONTEST_STATUS_REVERSE[this.contestStatus].color
        }
      },
      showAdminHelper () {
        return this.isContestAdmin && this.contestRuleType === 'ACM'
      }
    },
    watch: {
      '$route' (newVal) {
        this.route_name = newVal.name
        this.contestID = newVal.params.contestID
        this.changeDomTitle({title: this.contest.title})
        this.loadProblemList()
        if (newVal.params.problemID) {
          this.loadCurrentProblem()
        } else {
          this.selectedProblem = null
        }
      }
    },
    beforeDestroy () {
      clearInterval(this.timer)
      this.$store.commit(types.CLEAR_CONTEST)
      this.$root.$off('submission-judged', this.loadProblemList)
    }
  }
</script>

<style scoped lang="less">
  pre {
    display: inline-block;
  }

  #countdown {
    font-size: 16px;
  }

  .flex-container {
    height: calc(100vh - 60px);
    overflow: hidden;
    background-color: #fff;
    #contest-main {
      flex: 1 1;
      overflow-y: auto;
      #contest-desc {
        flex: auto;
      }
    }
    .contest-password {
      margin-top: 20px;
      margin-bottom: -10px;
      &-input {
        width: 200px;
        margin-right: 10px;
      }
    }
  }

  /* ====== Collapsible Menu Pane ====== */
  .menu-pane {
    width: 220px;
    flex: none;
    background-color: var(--panelBackground);
    height: 100%;
    border-right: 1px solid #dcdfe6;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.3s ease, flex 0.3s ease;
  }

  .pane-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 10px;
  }

  .pane-scroll {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    margin-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }

  .pane-header .title {
    font-size: 16px;
    font-weight: bold;
  }

  .toggle-btn {
    cursor: pointer;
    font-size: 18px;
    color: #909399;
  }

  .toggle-btn:hover {
    color: #409eff;
  }

  .pane-collapsed {
    width: 45px !important;
    flex: none !important;
    cursor: pointer;
    background-color: var(--panelBackground);
  }

  .pane-collapsed:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .pane-collapsed-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    height: 100%;
    color: var(--text-color);
  }

  /* ====== Problem List Menu ====== */
  .problem-list-menu {
    list-style: none;
    padding: 0;
    margin: 0;
    background-color: var(--background-color);
  }
  .problem-list-menu li {
    padding: 8px 10px 8px 15px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px dotted #ebeef5;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .problem-list-menu li:hover {
    background-color: var(--panelBackground);
    color: #409eff;
  }
  .problem-list-menu li.active-problem {
    color: #409eff;
    font-weight: bold;
    background-color: rgba(64,158,255,0.1);
  }

  .status-label {
    font-size: 11px;
    font-weight: normal;
    margin-right: 5px;
  }
  .status-completed {
    color: #19be6b;
  }
  .status-error {
    color: #ed3f14;
  }

  /* ====== Info Card ====== */
  #info, #statistic {
    ul {
      list-style: none;
      padding: 0;
      li {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px dashed #ebeef5;
        &:last-child {
          border-bottom: none;
        }
      }
    }
    .echarts {
      height: 180px;
      width: 100%;
    }
  }
</style>
