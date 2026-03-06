<template>
  <Row type="flex" justify="space-around">
    <!-- 1열 -->
    <Col :span="22">
      <panel v-if="(month == 3)">
        <div slot="title">
          <Button style="float: right" type="info" @click="dialogFormVisible = true">{{$t('m.Home_Change_Info')}}</Button>
          <h2>{{$t('m.Home_Freshman_Notice_Title')}}</h2><br/>
          <span v-html="$t('m.Home_Freshman_Notice_Desc')"></span><br/>
        </div>
      </panel>
      <el-dialog :title="$t('m.Home_Change_Info')" :modal=false :visible.sync="dialogFormVisible">
        <Form ref="formProfile" :model="formProfile">
          <Row type="flex" :gutter="30" justify="space-around">
            <Col :span="30" align="center">
              <h4 align="center" v-html="$t('m.Home_Dialog_Info_Desc')"></h4><br/>
              <Form-item :label="$t('m.Home_Student_ID')">
                <Input v-model="formProfile.schoolssn"/>
              </Form-item>
              <Form-item>
                <Button type="primary" @click="updateProfile" :loading="loadingSaveBtn">{{$t('m.Save')}}</Button>
              </Form-item>
            </Col>
          </Row>
        </Form>
      </el-dialog>
    </Col>
    <Col :span="22">
      <panel>
        <div slot="title">
          {{$t('m.DCU_Code_Usage_manual_student')}}
          <!-- DCU Code 사용 메뉴얼 (학생용) -->
          <Button style="float: right" type="info"><a href="/static/manual.pdf" download>{{$t('m.Download')}}</a></Button>
        </div>
      </panel>
    </Col>
    <Col :span="22">
      <panel>
        <div slot="title">
          {{$t('m.DCU_Code_Intro_video')}}
          <!-- DCU Code 소개 영상 -->
          <Button style="float: right" type="info" v-if="!detail" @click="showDetail">{{$t('m.Detail')}}</Button>
          <Button style="float: right" type="info" v-else @click="showDetail">{{$t('m.Minimization')}}</Button>
        </div>
        <p v-if="detail" align="middle">
          <iframe width="789" height="444" src="https://www.youtube.com/embed/6kaNUXN951c" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </p>
      </panel>
    </Col>
    <Col :span="22">
      <panel class="lecture" v-if="$store.state.user.profile.id !== undefined && !isAdmin">
        <div slot="title">
          {{$t('m.My_Course_Progress')}}
          <!-- 나의 수강과목 진행 현황 -->
        </div>
        <!-- DivTable.com -->
        <!-- <template v-for="pie in pielist"> -->
        <el-tabs v-model="activeName" tab-position="left" @tab-click="handleClick">
          <template v-for="pie in pielist">
            <el-tab-pane :label="pie.title" :name="pie.title">
              <el-Card class="lecture-card">
                <h2 style="margin-bottom:10px">{{ pie.title }}</h2>
                <el-table-column align="center">
                  <el-row :gutter="12">
                    <el-col :span="12">
                      <el-card shadow="always">
                        <div class="echarts">
                          <ECharts :options="pie.pie" autoresize></ECharts>
                        </div>
                      </el-card>
                    </el-col>
                    <el-col :span="12">
                      <h2 style="padding-bottom:10px">{{$t('m.Ongoing_practice_assignments')}}</h2>
                      <el-card v-if="clsize > 0" shadow="always">
                        <ul class="announcements-container" key="list">
                          <li>
                            <div class="flex-container">
                              <div class="title">
                                <div class="entry">
                                  <strong>{{$t('m.Practice_assignment')}}</strong>
                                </div>
                              </div>
                              <div class="date">
                                <strong>{{$t('m.EndDate')}}</strong>
                              </div>
                              <div class="creator">
                                <strong>{{$t('m.Remaining_Day')}}</strong>
                              </div>
                              <div class="problem">
                                <strong>{{$t('m.Num_of_Problem_Remaining')}}</strong>
                              </div>
                            </div>
                          </li>
                          <li v-for="contest in pie.contestlist">
                            <div class="flex-container">
                              <div class="title">
                                <a class="entry" v-bind:href="'/CourseList/' + pie.lecture_id + '/' + contest.id">
                                  {{ contest.title }}
                                </a>
                              </div>
                              <div class="date">
                                {{ contest.end_time | localtime('YYYY-M-D HH:mm') }}
                              </div>
                              <div class="creator">
                                {{ remainDuration(contest.end_time) }}
                              </div>
                              <div class="problem">
                                {{ contest.remainproblem }}
                              </div>
                            </div>
                          </li>
                        </ul>
                      </el-card>
                      <el-card v-else style="text-align:center">
                        <strong>{{$t('m.No_Ongoing')}}</strong>
                      </el-card>
                    </el-col>
                  </el-row>
                </el-table-column>
              </el-Card>
            </el-tab-pane>
          </template>
        </el-tabs>
        <!-- </template> -->
      </panel>
    </Col>
    <Col :span="22">
      <Announcements class="announcement"></Announcements>
    </Col>
  </Row>
</template>

<script>
import Vue from 'vue'
import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import Announcements from './Announcements.vue'
import api from '@oj/api'
import { mapGetters, mapState } from 'vuex'
import time from '@/utils/time'
import { CONTEST_STATUS } from '@/utils/constants'
import utils from '@/utils/utils'
import {types} from '@/store'
import { lightTheme, darkTheme } from '@/theme'

Vue.use(Element)

// pieColorMap moved inside component to support i18n

export default {
  name: 'home',
  components: {
    Announcements
  },
  computed: {
    ...mapGetters(['isAdmin', 'modalStatus']),
    activeMenu () {
      // 여기서 이전 주소의 [1], [4]가 CourseList, problems 일때 return을 CourseList
      if (this.$route.path.split('/')[1] === 'contest' && parseInt(this.$route.path.split('/')[2]) > 0) {
        return '/' + 'CourseList'
      }
      return '/' + this.$route.path.split('/')[1]
    },
    ...mapState('theme', ['isDarkMode']),
    currentTheme () {
      return this.isDarkMode ? darkTheme : lightTheme
    },
    modalVisible: {
      get () {
        return this.modalStatus.visible
      },
      set (value) {
        this.changeModalStatus({visible: value})
      }
    }
  },
  data () {
    return {
      pielist: [],
      tablerow: ['1'], // 테이블 출력 수 조절을 위한 값. 지우거나 값 수정하지 말 것
      lecturelist: [],
      contests: [],
      detail: false,
      index: 0,
      activeName: '',
      clsize: 0,
      resize: true,
      detail2: true,
      dialogFormVisible: false,
      formProfile: {
        schoolssn: ''
      },
      loadingSaveBtn: false,
      month: 0
    }
  },
  mounted () {
    this.setDashboard()
    let today = new Date()
    this.month = today.getMonth() + 1
  },
  methods: {
    getDuration (startTime, endTime) {
      return time.duration(startTime, endTime)
    },
    getItemColor (obj) {
      const colorMap = {}
      colorMap[this.$t('m.Home_Chart_Success')] = '#409EFF'
      colorMap[this.$t('m.Home_Chart_Not_Started')] = '#F56C6C'
      colorMap[this.$t('m.Home_Chart_In_Progress')] = '#E6A23C'
      colorMap[this.$t('m.Home_Chart_Progress_Pct')] = '#9BCCFF'
      colorMap[''] = 'Transparent'
      colorMap['CE'] = '#80848f'
      colorMap['PAC'] = '#2d8cf0'
      return (colorMap[obj.name] || '#ccc')
    },
    showDetail () {
      if (this.detail === true) {
        this.detail = false
      } else {
        this.detail = true
      }
    },
    setDashboard () {
      let params = {status: CONTEST_STATUS.NOT_START}
      api.getContestList(0, 5, params).then(res => {
        this.contests = res.data.data.results
      })
      api.getDashboardinfo().then(res => {
        this.lecturelist = res.data.data.results
        this.clsize = Object.keys(this.lecturelist[0].contestlist).length
        this.lecturelist.forEach(lecture => {
          let jsonpie = {
            title: lecture.lecture.title, // 시도 - 해결 = 도전중
            pie: {
              title: [
                {
                  subtext: this.$t('m.Home_Practice_Progress'),
                  left: '25%',
                  top: '85%',
                  textAlign: 'center'
                }, {
                  subtext: this.$t('m.Home_Assignment_Progress'),
                  left: '75%',
                  top: '85%',
                  textAlign: 'center'
                } /*, {
                    subtext: '문제 진행 현황',
                    left: '75%',
                    top: '75%',
                    textAlign: 'center'
                  } */
              ],
              legend: {
                data: [this.$t('m.Home_Chart_Success'), this.$t('m.Home_Chart_In_Progress'), this.$t('m.Home_Chart_Not_Started')]
              },
              opts: {
                width: 'auto',
                height: 'auto'
              },
              series: [
                {
                  name: 'Progress_1',
                  type: 'pie',
                  radius: ['40%', '45%'],
                  center: ['25%', '50%'],
                  itemStyle: {
                    normal: {color: this.getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.solvePractice || ''), name: this.$t('m.Home_Chart_Progress_Pct') // 시도한 문제 + 해결한 문제
                    },
                    {
                      value: (lecture.totalPractice - lecture.solvePractice || ''), name: '' // 총 문제 수 - 시도한 문제 - 해결한 문제
                    }
                  ],
                  label: {
                    normal: {
                      formatter: '{d}%', textStyle: {fontWeight: 'bold'}
                    }
                  },
                  hoverAnimation: false
                },
                {
                  name: 'Summary_1',
                  type: 'pie',
                  radius: '35%',
                  center: ['25%', '50%'],
                  itemStyle: {
                    normal: {color: this.getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.solvePractice || ''), name: this.$t('m.Home_Chart_Success')
                    },
                    {
                      value: (lecture.subPractice - lecture.solvePractice || ''), name: this.$t('m.Home_Chart_In_Progress')
                    },
                    {
                      value: (lecture.totalPractice - lecture.subPractice || ''), name: this.$t('m.Home_Chart_Not_Started')
                    }
                  ],
                  label: {
                    normal: {
                      position: 'inner', margin: '0', show: true, formatter: '{b}: {c}', textStyle: {fontWeight: 'bold'}
                    }
                  },
                  hoverAnimation: false
                },
                {
                  name: 'Progress_2',
                  type: 'pie',
                  radius: ['40%', '45%'],
                  center: ['75%', '50%'],
                  itemStyle: {
                    normal: {color: this.getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.solveAssign || ''), name: this.$t('m.Home_Chart_Progress_Pct') // 시도한 문제 + 해결한 문제
                    },
                    {
                      value: (lecture.totalAssign - lecture.solveAssign || ''), name: '' // 총 문제 수 - 시도한 문제 - 해결한 문제
                    }
                  ],
                  label: {
                    normal: {
                      formatter: '{d}%', textStyle: {fontWeight: 'bold'}
                    }
                  },
                  hoverAnimation: false
                },
                {
                  name: 'Summary_2',
                  type: 'pie',
                  radius: '35%',
                  center: ['75%', '50%'],
                  itemStyle: {
                    normal: {color: this.getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.totalAssign - lecture.subAssign || ''), name: this.$t('m.Home_Chart_Not_Started')
                    },
                    {
                      value: (lecture.subAssign - lecture.solveAssign || ''), name: this.$t('m.Home_Chart_In_Progress')
                    },
                    {
                      value: (lecture.solveAssign || ''), name: this.$t('m.Home_Chart_Success')
                    }
                  ],
                  label: {
                    normal: {
                      position: 'inner', margin: '0', show: true, formatter: '{b}: {c}', textStyle: {fontWeight: 'bold'}
                    }
                  },
                  hoverAnimation: false
                }
              ]
            },
            contestlist: lecture.contestlist,
            lecture_id: lecture.lecture.id
          }
          this.pielist.push(jsonpie)
        })
        // console.log(this.pielist[0].title)
        this.activeName = this.pielist[0].title
      })
    },
    goContest () {
      this.$router.push({
        name: 'contest-details',
        params: {contestID: this.contests[this.index].id}
      })
    },
    handleClick (tab, event) {
      console.log(tab, event)
    },
    remainDuration (endTime) {
      let remain
      if (new Date() - new Date(endTime) > 0) {
        remain = this.$t('m.Home_Ended')
      } else {
        remain = time.duration(new Date(), endTime)
        let current = new Date()
        let end = new Date(endTime)
        let dateGap = end.getTime() - current.getTime()
        let timeGap = new Date(0, 0, 0, 0, 0, 0, end - current)
        let diffDay = Math.floor(dateGap / (1000 * 60 * 60 * 24))
        let diffHour = timeGap.getHours()
        let diffMin = timeGap.getMinutes()
        return diffDay + this.$t('m.Home_Days') + diffHour + this.$t('m.Home_Hours') + diffMin + this.$t('m.Home_Minutes')
        // console.log('안 지남')
      }
      return remain
    },
    updateProfile () {
      this.loadingSaveBtn = true
      let updateData = utils.filterEmptyValue(Object.assign({}, this.formProfile))
      console.log(updateData)
      api.updateProfile(updateData).then(res => {
        this.$success('Success')
        this.$store.commit(types.CHANGE_PROFILE, {profile: res.data.data})
        this.loadingSaveBtn = false
        this.dialogFormVisible = false
      }, _ => {
        this.loadingSaveBtn = false
      })
    }
  }
}
</script>

<style lang="less" scoped>
a {color:#ffffff; /*new colour*/}
a span {color:#ffffff; /*originalcolour*/}
h3 {
  padding-left: 25px;
}

.dashboard {
  margin-left: 25px;
  margin-bottom: 15px;
  margin-top: 10px;
  width: 97%;
}

.lecture-card {
  background: var(--table-body-background);
  border-color: var(--table-border-color);
  color: var(--table-text-color);
  margin-left:20px;
  margin-right:20px;
  margin-bottom:10px
}

.contest {
  &-title {
    font-style: italic;
    font-size: 21px;
  }
  &-content {
    padding: 0 70px 40px 70px;
    &-description {
      margin-top: 25px;
    }
  }
}

.announcement {
  margin-top: 20px;
}

.lecturetitle{
  margin-left: 25px;
  font-size: 21px;
}

/* DivTable.com */
.divTable{
  margin: 0 auto;
  display: table;
  width: 50%;
  padding-bottom: 20px;
}
.divTableRow {
  display: table-row;
}
.divTableHeading {
  background-color: #EEE;
  display: table-header-group;
}
.divTableCell, .divTableHead {
  border: 1px solid #999999;
  display: table-cell;
  text-align: center;
}
.divScore{
  border: 1px solid #999999;
  display: table-cell;
  text-align: center;
}
.divTableHeading {
  background-color: #EEE;
  display: table-header-group;
  font-weight: bold;
}
.divTableFoot {
  background-color: #EEE;
  display: table-footer-group;
  font-weight: bold;
}
.divTableBody {
  display: table-row-group;
}
.announcements-container {
  margin-top: -10px;
  margin-bottom: 10px;
  li {
    padding-top: 15px;
    list-style: none;
    padding-bottom: 15px;
    margin-left: 20px;
    font-size: 16px;
    border-bottom: 1px solid rgba(187, 187, 187, 0.5);
    &:last-child {
      border-bottom: none;
    }
    .flex-container {
      .title {
        flex: 1 1;
        text-align: center;
        padding-left: 10px;
        a.entry {
          color: #495060;
          &:hover {
            color: #2d8cf0;
            border-bottom: 1px solid #2d8cf0;
          }
        }
      }
      .creator {
        flex: none;
        width: 25%;
        text-align: center;
      }
      .date {
        flex: none;
        width: 25%;
        text-align: center;
      }
      .problem {
        flex: none;
        width: 20%;
        text-align: center;
      }
    }
  }
}
</style>
<style>
/**
 * The default size is 600px×400px, for responsive charts
 * you may need to set percentage values as follows (also
 * don't forget to provide a size for the container).
 */
.echarts {
  width: auto!important;
  height: auto;
}
</style>
