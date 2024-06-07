<template>
  <div class="flex-container">
    <div id="contest-main">
      <!--children-->
      <transition name="fadeInUp">
        <router-view></router-view>
      </transition>
      <!--children end-->
      <div class="flex-container" v-if="route_name === 'lecture-contest-details'">
        <template>
          <div v-if="isvisible" id="contest-desc">
            <Panel :padding="50" shadow>
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
            
              <Table :columns="columns" :data="contest_table" disabled-hover style="margin-bottom: 20px;"></Table>
              <div v-if="OIContestRealTimePermission && contestType === '대회'" class="check-in">
                <div class="sub-title">{{$t('상태 : '+contestcheckInOutStatusWord)}}</div>
                <el-button
                  v-if="contestCheckInOutStatus==='notCheck'"
                  type="info"
                  size="small"
                  @click="checkInContest" 
                  :disabled="contestCheckInOutStatus!=='notCheck' || contestMenuDisabled"
                >
                  <span>{{$t('시험 시작')}}</span>
                </el-button>
              </div>
            </Panel>
          </div>
        </template>
      </div>
    </div>
    <div v-if="isvisible" v-show="showMenu" id="contest-menu">
      <VerticalMenu @on-click="handleRoute">
        <VerticalMenu-item :route="{name: 'lecture-contest-details', params: {contestID: contestID, lectureID: lectureID}}">
          <Icon type="home"></Icon>
          {{$t('m.Overview')}}
        </VerticalMenu-item>

        <VerticalMenu-item :disabled="contestMenuDisabled || contestCheckInOutStatus === 'checkOut' || contestCheckInOutStatus === 'notCheck'"
                           :route="{name: 'lecture-contest-announcement-list', params: {contestID: contestID, lectureID: lectureID}}">
          <Icon type="chatbubble-working"></Icon>
          {{$t('m.Announcements')}}
        </VerticalMenu-item>

        <VerticalMenu-item :disabled="contestMenuDisabled || contestCheckInOutStatus === 'checkOut' || contestCheckInOutStatus === 'notCheck'"
                           :route="{name: 'lecture-contest-problem-list', params: {contestID: contestID, lectureID: lectureID}}">
          <Icon type="ios-photos"></Icon>
          {{$t('m.Problems')}}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="OIContestRealTimePermission"
                           :disabled="contestMenuDisabled || contestCheckInOutStatus === 'checkOut' || contestCheckInOutStatus === 'notCheck'"
                           :route="{name: 'lecture-contest-submission-list'}">
          <Icon type="navicon-round"></Icon>
          {{$t('m.Submissions')}}
        </VerticalMenu-item>
        <VerticalMenu-item v-if="OIContestRealTimePermission"
                           :route="{name: 'constest-problem-qna', params: {contestID: contestID, lectureID: lectureID}}">
          <Icon type="help"></Icon>
          {{$t('m.qa')}}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="OIContestRealTimePermission"
                           :disabled="contestMenuDisabled || contestCheckInOutStatus === 'checkOut' || contestCheckInOutStatus === 'notCheck'"
                           :route="{name: 'lecture-contest-rank', params: {contestID: contestID, lectureID: lectureID}}">
          <Icon type="stats-bars"></Icon>
          {{$t('m.Rankings')}}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="showAdminHelper"
                           :route="{name: 'lecture-acm-helper', params: {contestID: contestID, lectureID: lectureID}}">
          <Icon type="ios-paw"></Icon>
          {{$t('m.Admin_Helper')}}
        </VerticalMenu-item>

        <!--submission student list (working by soojung)-->
        <!-- view case, disappear case, route -->
        <VerticalMenu-item v-if="OIContestRealTimePermission && contestType === '대회' && this.lectureID"
                           :disabled="contestMenuDisabled || contestCheckInOutStatus !== 'checkIn' && contestCheckInOutStatus !== 'notStudent'"
                           :route="{name: 'lecture-contest-exit'}">
          <Icon type="android-exit"></Icon>
          {{$t('m.Exit')}}
        </VerticalMenu-item>
      </VerticalMenu>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import api from '@oj/api'
  import { mapState, mapGetters, mapActions } from 'vuex'
  import { types } from '@/store'
  import { CONTEST_STATUS_REVERSE, CONTEST_STATUS } from '@/utils/constants'
  import time from '@/utils/time'
  import { compareIdentifiers } from 'semver'

  export default {
    name: 'ContestDetail',
    components: {},
    data () {
      return {
        CONTEST_STATUS: CONTEST_STATUS,
        route_name: '',
        btnLoading: false,
        contestID: '',
        lectureID: '',
        // contestType: '',  // working by soojung
        // contestEndtime: '',  // working by soojung
        // contestExitStatus: false, // working by soojung
        contestPassword: '',
        isvisible: false,
        dialogFormVisible: false,
        contestcheckInOutStatusWord: '',
        contestcheckInOutStatus: '',
        columns: [ // 수강과목 세부 페이지의 내부 항목 제목
          // {
          //   title: this.$i18n.t('Id'),
          //   render: (h, params) => {
          //     return h('span', params.row.id)
          //   }
          // },
          {
            title: this.$i18n.t('m.StartDate'),
            render: (h, params) => {
              return h('span', time.utcToLocal(params.row.start_time))
            }
          },
          {
            title: this.$i18n.t('m.EndDate'),
            render: (h, params) => {
              return h('span', time.utcToLocal(params.row.end_time))
            }
          },
          {
            title: this.$i18n.t('m.PublicType'),
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
            title: this.$i18n.t('m.Created'),
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
        this.changeDomTitle({title: res.data.data.title})
        let data = res.data.data
        this.isvisible = res.data.data.visible
        if (this.isvisible === false) {
          this.$error(this.$i18n.t('m.WrongPath'))
        }
        this.lectureID = res.data.data.lecture
        this.contestType = res.data.data.lecture_contest_type // working by soojung
        let endTime = moment(data.end_time)
        if (endTime.isAfter(moment(data.now))) {
          this.timer = setInterval(() => {
            this.$store.commit(types.NOW_ADD_1S)
          }, 1000)
        }
        if (this.contestType === '대회') {
          this.contestCheckInOutStatus()
        }
      })
    },
    methods: {
      ...mapActions(['changeDomTitle']),
      handleRoute (route) {
        this.$router.push(route)
      },
      checkPassword () {
        if (this.contestPassword === '') {
          this.$error(this.$i18n.t('m.No_empty_Password'))
          return
        }
        this.btnLoading = true
        api.checkContestPassword(this.contestID, this.contestPassword).then((res) => {
          this.$success(this.$i18n.t('m.Succeeded'))
          this.$store.commit(types.CONTEST_ACCESS, {access: true})
          this.btnLoading = false
        }, (res) => {
          this.btnLoading = false
        })
      },
      contestCheckInOutStatus () {
        api.checkContestExit(this.contestID).then(res => {
          if (res.data.data.data === 'notStudent') {
            this.contestCheckInOutStatus = 'notStudent'
            this.contestcheckInOutStatusWord = '관리자'
          } else if (res.data.data.end_time) {
            this.contestCheckInOutStatus = 'checkOut'
            this.contestcheckInOutStatusWord = '퇴실완료'
          } else if (res.data.data.start_time) {
            this.contestCheckInOutStatus = 'checkIn'
            this.contestcheckInOutStatusWord = '입실완료'
          } else {
            this.contestCheckInOutStatus = 'notCheck'
            this.contestcheckInOutStatusWord = '입실 전'
          }
        })
      },
      checkInContest () {
        let data = {
          contest_id: this.contestID
        }
        api.checkInContest(data).then(res => {
          window.location.reload()
        })
      }
      // ,
      // ContestTimeOverExit () {  // working by soojung (설정 시간 초과로 인한 시험 자동 종료의 경우)
      //   api.getContestTimeOverExit(this.$route.params.contestID).then(res => {
      //     console.log(this.contestID)
      //     console.log(this.lectureID)
      //   }).catch(() => {
      //   })
      // }
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
          // if (this.contestStatus === CONTEST_STATUS.ENDED) {  // working by soojung
          //   this.ContestTimeOverExit()
          // }
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
      }
    },
    beforeDestroy () {
      clearInterval(this.timer)
      this.$store.commit(types.CLEAR_CONTEST)
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
    #contest-main {
      flex: 1 1;
      #contest-desc {
        flex: auto;
      }
    }
    #contest-menu {
      flex: none;
      width: 210px;
      margin-left: 20px;
    }
    .contest-password {
      margin-top: 20px;
      margin-bottom: -10px;
      &-input {
        width: 200px;
        margin-right: 10px;
      }
    }
    .check-in {
      flex: auto;
      display: flex;
      float: right;
    }
    .sub-title {
      font-weight: bold;
      margin-top: 7px;
      margin-right: 10px;
    }
  }
  
</style>
