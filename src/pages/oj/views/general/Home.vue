<template>
  <Row type="flex" justify="space-around">
    <!-- 1열 -->
    <Col :span="22">
      <panel v-if="(month == 3)">
        <div slot="title">
          <Button style="float: right" type="info" @click="dialogFormVisible = true">개인정보 변경</Button>
          <h2>[!신입생 개인정보 변경 안내!]</h2><br/>
          DCU Code 입학 전 교육에 참여한 신입생 분들은<br/>
          반드시 개인정보를 수정해주시기 바랍니다.<br/>
        </div>
      </panel>
      <el-dialog title="개인정보 변경" :modal=false :visible.sync="dialogFormVisible">
        <Form ref="formProfile" :model="formProfile">
          <Row type="flex" :gutter="30" justify="space-around">
            <Col :span="30" align="center">
              <h4 align="center">DCU Code 입학 전 교육에 참여한 신입생 분들은<br/>
                반드시 전화번호를 학번으로 변경해주시기 바랍니다.</h4><br/>
              <Form-item label="학번">
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
          <!--{{$t('m.DCU_Code_Intro_video')}}-->
          Terminal for Hiring with Llama
          <!-- DCU Code 소개 영상 -->
          <Button style="float: right" type="info" v-if="!detail" @click="showDetail">{{$t('m.Detail')}}</Button>
          <Button style="float: right" type="info" v-else @click="showDetail">{{$t('m.Minimization')}}</Button>
        </div>
        <p v-if="detail" align="middle">
          <template>
            <div class="terminal-container">
              <div ref="terminal"></div>
            </div>
          </template>
          <!--<iframe width="789" height="444" src="https://www.youtube.com/embed/6kaNUXN951c" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>-->
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
import { mapGetters, mapActions, mapState } from 'vuex'
import time from '@/utils/time'
import { CONTEST_STATUS } from '@/utils/constants'
import utils from '@/utils/utils'
import {types} from '@/store'
import { lightTheme, darkTheme } from '@/theme'
import { Terminal } from 'xterm'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SerializeAddon } from 'xterm-addon-serialize'
import 'xterm/css/xterm.css'
import axios from 'axios'

Vue.use(Element)

const pieColorMap = {
  '성공': {color: '#409EFF'},
  '시작 전': {color: '#F56C6C'},
  '도전 중': {color: '#E6A23C'},
  '진행도(%)': {color: '#9BCCFF'},
  '': {color: 'Transparent'},
  'CE': {color: '#80848f'},
  'PAC': {color: '#2d8cf0'}
}

function getItemColor (obj) {
  return pieColorMap[obj.name].color
}

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
      detail: true,
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
      month: 0,
      term: null,
      apiUrl: 'http://203.250.33.193:11434/api/generate',
      userInput: ''
    }
  },
  mounted () {
    this.setDashboard()
    let today = new Date()
    this.month = today.getMonth() + 1
    this.initTerminal()
  },
  methods: {
    initTerminal () {
      this.term = new Terminal({
        cursorBlink: true, // 커서 깜박임 활성화
        cols: 140,
        rows: 25,
        fontSize: 14,
        wordWrap: true,
        theme: {
          background: '#000000',
          foreground: '#FFFFFF'
        }
      })
      this.term.loadAddon(new WebLinksAddon())
      this.term.loadAddon(new SerializeAddon())
      this.term.loadAddon(new WebLinksAddon())
      this.term.open(this.$refs.terminal)
      this.created()
      this.printBanner()
      this.promptUser()
    },
    printBanner () {
      this.term.write('\x1b[32m') // 초록색 적용
      this.term.write('   _____        __ _                                      _____           _                   _           _     \r\n')
      this.term.write('  / ____|      / _| |                            ___     / ____|         | |                 | |         | |    \r\n')
      this.term.write(' | (___   ___ | |_| |___      ____ _ _ __ ___   ( _ )   | (___  _   _ ___| |_ ___ _ __ ___   | |     __ _| |__  \r\n')
      this.term.write('  \\___ \\ / _ \\|  _| __\\ \\ /\\ / / _` | \'__/ _ \\  / _ \\/\\  \\___ \\| | | / __| __/ _ \\ \'_ ` _ \\  | |    / _` | \'_ \\ \r\n')
      this.term.write('  ____) | (_) | | | |_ \\ V  V / (_| | | |  __/ | (_>  <  ____) | |_| \\__ \\ ||  __/ | | | | | | |___| (_| | |_) |\r\n')
      this.term.write(' |_____/ \\___/|_|  \\__| \\_/\\_/ \\__,_|_|  \\___|  \\___/\\/ |_____/ \\__, |___/\\__\\___|_| |_| |_| |______\\__,_|_.__/ \r\n')
      this.term.write('                                                                 __/ |                                          \r\n')
      this.term.write('                                                                |___/                                           \r\n')
      this.term.write('\x1b[34m') // 파란색 적용
      this.term.write('DCUCODE 세상에 오신 걸 환영합니다.\r\n')
      this.term.write('DCUCODE는 대구가톨릭대학교 컴퓨터소프트웨어학부 "소프트웨어시스템연구실"에서 관리하고 있습니다.\r\n')
      this.term.write('\x1b[33m') // 노란색 적용
      this.term.write('DCUCODE 개발팀에서는 개발자와 디자이너를 모집하고 있습니다.\r\n')
      this.term.write('\x1b[0m') // 색상 초기화
      this.term.write('모집 공고 : https://gleaming-wound-252.notion.site/Recruit-e6aa63beb7ea463dacfcd755e2e3c04c\r\n')
      this.term.write('↓↓↓ 궁금한게 있으면 바로 물어보세요 (질문을 입력하고 Enter를 누르세요.)↓↓↓\r\n')
      this.term.write('\x1b[32mDCU Llama Chat - Ollama API 연결됨\r\n')
    },
    promptUser () {
      this.userInput = ''
      this.term.write('\x1b[33m> \x1b[37m')
    },
    async sendToOllama (userInput) {
      if (!userInput.trim()) return
      const prePrompt = `
        지금부터 프롬프트는 아래 조건에 따라 수행되어야 함
        - 대답은 무조건 한국어로만 한다. 필요에 따라 영어를 쓸 수 있음.
        - 내가 제공 해주는 연구실 관련된 대답만 해야함.
        - 연구실 정보 이외에 대한 대답은 모두 거부하십시오.
        - 연구실 정보:
        - 연구실이름 : 소프트웨어시스템연구실(Software&System Lab.)
        - 지도교수: 전수빈, 서동만
        - 프로젝트: 자율주행, 딥러닝, 딥러닝시스템, 딥러닝응용시스템
        - 연구생정보 : 박준홍, 권혁규, 조준현, 문지원, 박보은, 임찬아, 윤재이, 정하연
        `
      const fullPrompt = prePrompt + '\n\n' + 'Q: ' + userInput
      this.term.write('\x1b[36m[Llama]:\x1b[37m 생각중...\r\n')
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.3',
            prompt: fullPrompt,
            stream: true
          })
        })
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let partialText = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          try {
            const jsonObjects = text.trim().split('\n').map(JSON.parse)
            for (const obj of jsonObjects) {
              if (obj.response) {
                this.term.write(obj.response.replace(/\n/g, '\r\n'))
              }
              if (obj.done) break
            }
          } catch (error) {
            console.error('JSON 파싱 오류:', error)
          }
        }
        this.term.write('\r\n')
        this.promptUser()
      } catch (error) {
        this.term.write('\x1b[31m[Llama]: 오류 발생 - ' + error.message + '\r\n\x1b[37m> ')
      }
    },
    async sendToOllama2 (userInput) {
      if (!userInput.trim()) return
      this.term.write('\x1b[36m[Llama]:\x1b[37m 생각중...\r\n')
      try {
        const response = await axios.post(this.apiUrl, {
          model: 'llama3.3',  // 사용할 모델 (Ollama 서버에 설정된 모델명 확인)
          prompt: userInput,
          stream: false
        })
        const result = response.data.response || '응답을 받을 수 없습니다.'
        this.printResponse(result)
      } catch (error) {
        this.printResponse('오류 발생: ' + error.message)
      }
    },
    printResponse (responseText) {
      const lines = responseText.replace(/\s+/g, ' ').split('\n') // 공백 정리 후 줄 단위 분할
      lines.forEach((line) => {
        this.term.write('\x1b[36m[Llama]:\x1b[37m ' + line.trimStart() + '\r\n') // 앞 공백 제거 후 출력
      })
      this.promptUser()
    },
    created () {
      this.term.onKey((e) => {
        const { key, domEvent } = e
        if (domEvent.key === 'Enter') {
          this.term.write('\r\n')
          this.sendToOllama(this.userInput)
        } else if (domEvent.key === 'Backspace') {
          if (this.userInput.length > 0) {
            this.userInput = this.userInput.slice(0, -1)
            this.term.write('\b \b')
          }
        } else if (!domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
          // 한글 입력을 방해하지 않도록 IME를 사용하도록 설정
          this.userInput += key
          this.term.write(key)
        }
      })
      // IME(한글) 입력 지원을 위한 이벤트 처리
      this.term.element.addEventListener('compositionstart', () => {
        this.isComposing = true
      })
      this.term.element.addEventListener('compositionend', (event) => {
        this.isComposing = false
        this.userInput += event.data // 입력된 한글 추가
        this.term.write(event.data)
      })
    },
    getDuration (startTime, endTime) {
      return time.duration(startTime, endTime)
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
                  subtext: '실습 진행 현황',
                  left: '25%',
                  top: '85%',
                  textAlign: 'center'
                }, {
                  subtext: '과제 진행 현황',
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
                data: ['성공', '도전 중', '시작 전']
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
                    normal: {color: getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.solvePractice || ''), name: '진행도(%)' // 시도한 문제 + 해결한 문제
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
                    normal: {color: getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.solvePractice || ''), name: '성공'
                    },
                    {
                      value: (lecture.subPractice - lecture.solvePractice || ''), name: '도전 중'
                    },
                    {
                      value: (lecture.totalPractice - lecture.subPractice || ''), name: '시작 전'
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
                    normal: {color: getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.solveAssign || ''), name: '진행도(%)' // 시도한 문제 + 해결한 문제
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
                    normal: {color: getItemColor}
                  },
                  data: [
                    {
                      value: (lecture.totalAssign - lecture.subAssign || ''), name: '시작 전'
                    },
                    {
                      value: (lecture.subAssign - lecture.solveAssign || ''), name: '도전 중'
                    },
                    {
                      value: (lecture.solveAssign || ''), name: '성공'
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
        remain = '종료됨'
        // console.log('이미 지남')
      } else {
        remain = time.duration(new Date(), endTime)
        let current = new Date()
        let end = new Date(endTime)
        console.log(current)
        console.log(end)
        console.log(end - current)
        let dateGap = end.getTime() - current.getTime()
        let timeGap = new Date(0, 0, 0, 0, 0, 0, end - current)
        let diffDay = Math.floor(dateGap / (1000 * 60 * 60 * 24))
        let diffHour = timeGap.getHours()
        let diffMin = timeGap.getMinutes()
        return diffDay + '일 ' + diffHour + '시간 ' + diffMin + '분'
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

.terminal-container {
  width: 100%;
  height: 450px;
  background: black;
  overflow: hidden;
}
.xterm-viewport::-webkit-scrollbar {
  display: none;
}
.xterm-viewport {
  overflow: hidden !important;
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
