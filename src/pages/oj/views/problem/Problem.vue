<template>
  <div class="flex-container">
    <el-col :span="10" v-if="problemRes" id="view-mode">
      <el-col :span="5" v-if="toggleValue" id="problem-main-width" :style="{ height: dynamicHeight-150 + 'px' }"> <!--가로 모드 문제란-->
        <Panel :padding="40" shadow>
          <div slot="title">{{ problem.title }}</div>
          <div id="problem-content" class="markdown-body" v-katex>
            <p class="title">{{ $t('m.Description') }}</p>
            <p class="content" v-html=problem.description></p>
            <!-- {{$t('m.music')}} -->
            <p class="title">{{ $t('m.Input') }} <span v-if="problem.io_mode.io_mode == 'File IO'">({{ $t('m.FromFile') }}: {{ problem.io_mode.input }})</span></p>
            <p class="content" v-html=problem.input_description></p>

            <p class="title">{{ $t('m.Output') }} <span v-if="problem.io_mode.io_mode == 'File IO'">({{ $t('m.ToFile') }}: {{ problem.io_mode.output }})</span></p>
            <p class="content" v-html=problem.output_description></p>

            <div v-for="(sample, index) of problem.samples" :key="index">
              <div class="flex-container sample">
                <div class="sample-input">
                  <p class="title">{{ $t('m.Sample_Input') }} {{ index + 1 }}
                    <a class="copy" v-clipboard:copy="sample.input" v-clipboard:success="onCopy"
                      v-clipboard:error="onCopyError">
                      <Icon type="clipboard"></Icon>
                    </a>
                  </p>
                  <pre>{{ sample.input }}</pre>
                </div>
                <div class="sample-output">
                  <p class="title">{{ $t('m.Sample_Output') }} {{ index + 1 }}</p>
                  <pre>{{ sample.output }}</pre>
                </div>
              </div>
            </div>

            <div v-if="problem.hint">
              <p class="title">{{ $t('m.Hint') }}</p>
              <Card dis-hover>
                <div class="content" v-html=problem.hint></div>
              </Card>
            </div>

            <div v-if="problem.source">
              <p class="title">{{ $t('m.Source') }}</p>
              <p class="content">{{ problem.source }}</p>
            </div>

          </div>
        </Panel>
      </el-col>
      <el-col :span="7" v-if="toggleValue" id="problem-source"> <!--가로 모드 소스코드 제출란-->
        <!--problem main end-->
        <!--<iframe src="https://www.onlinegdb.com/" style="width:100%; height:750px">
      </iframe>-->  
        <Card id="submit-code" dis-hover>
          <CodeMirror :value.sync="code" :languages="problem.languages" :language="language" :theme="theme"
            @resetCode="onResetToTemplate" @changeTheme="onChangeTheme" @changeLang="onChangeLang" :newHeight="dynamicHeight" :ToggleValue="toggleValue"></CodeMirror>
          <Row type="flex" justify="space-between">
            <Col :span="10">
            <div class="status" v-if="statusVisible">
              <template v-if="!this.contestID || (this.contestID && OIContestRealTimePermission)">
                <span>{{ $t('m.Status') }}</span>
                <Tag type="dot" :color="submissionStatus.color" @click.native="handleRoute('/status/' + submissionId)">
                  {{ $t('m.' + submissionStatus.text.replace(/ /g, "_")) }}
                </Tag>
              </template>
              <template v-else-if="this.contestID && !OIContestRealTimePermission">
                <Alert type="success" show-icon>{{ $t('m.Submitted_successfully') }}</Alert>
              </template>
            </div>
            <div v-else-if="problem.my_status === 0">
              <Alert type="success" show-icon>{{ $t('m.You_have_solved_the_problem') }}</Alert>
            </div>
            <div v-else-if="this.contestID && !OIContestRealTimePermission && submissionExists">
              <Alert type="success" show-icon>{{ $t('m.You_have_submitted_a_solution') }}</Alert>
            </div>
            <div v-if="contestEnded">
              <Alert type="warning" show-icon>{{ $t('m.Contest_has_ended') }}</Alert>
            </div>
            <div v-else-if="contestExitStatus"> <!--working by soojung-->
              <Alert type="warning" show-icon>{{ $t('m.Already_Submitted') }}</Alert>
            </div>
            </Col>
            <Col :span="12">
            <template v-if="captchaRequired">
              <div class="captcha-container">
                <Tooltip v-if="captchaRequired" content="Click to refresh" placement="top">
                  <img :src="captchaSrc" @click="getCaptchaSrc" />
                </Tooltip>
                <Input v-model="captchaCode" class="captcha-code" />
              </div>
            </template>

            <Button v-if="problemRes" type="warning" icon="edit" :loading="submitting" @click="submitCode"
              :disabled="problemSubmitDisabled || submitted" class="fl-right"> <!--제출(비활성화)-->
              <span v-if="submitting">{{ $t('m.Submitting') }}</span> <!--제출중-->
              <span v-else>{{ $t('m.Submit') }}</span> <!--제출(평소)-->
            </Button>
            <Button v-if="problemRes" type="warning" icon="play" :loading="running" @click="runCode"
                    :disabled="problemSubmitDisabled || submitted"
                    class="fl-right">
              <span v-if="running">실행중</span>
              <span v-else>실행</span>
            </Button>
            <Button v-else class="fl-right" disabled>{{ $t('m.WrongPath') }}</Button>
            <el-tooltip v-if="aiaskbutton" content="제출 시 버튼이 활성화됩니다." placement="top">
              <Button @click="toggleSidebar"
                      v-if="aihelperflag"
                      :disabled="aiaskbutton"
                      class="fl-right">
                <span>{{$t('m.callai')}}</span>
              </Button>
            </el-tooltip>
            <!-- aiaskbutton이 false일 때는 툴팁 없이 버튼만 표시 -->
            <Button v-if="aihelperflag && !aiaskbutton" @click="toggleSidebar"
                    :disabled="aiaskbutton"
                    @click.native="askAI"
                    class="fl-right">
              <span>{{$t('m.callai')}}</span>
            </Button>

            <!-- Tara 버튼에 대한 툴팁, askbutton이 true일 때만 툴팁 표시 -->
            <el-tooltip v-if="askbutton" content="제출 시 버튼이 활성화됩니다." placement="top">
              <Button v-b-toggle.sidebar-right
                      :disabled="askbutton"
                      class="fl-right">
                <span>{{$t('m.calltara')}}</span>
              </Button>
            </el-tooltip>
            <!-- askbutton이 false일 때는 툴팁 없이 버튼만 표시 -->
            <Button v-if="!askbutton" v-b-toggle.sidebar-right
                    :disabled="askbutton"
                    class="fl-right">
              <span>{{$t('m.calltara')}}</span>
            </Button>
            </Col>
          </Row>
          <Card :padding="20" id="run-code" dis-hover>
            <el-collapse v-model="activeNames">
              <el-collapse-item v-for="(sample, index) of problem.samples" :key="index" :title="$t('테스트') + ' ' + (index + 1)" :name="'test-' + index">
                <div class="sample">
                  <div class="input-output-container">
                    <div class="input-container">
                      <p class="sub-title">{{$t('입력 >')}}</p>
                      <div class="text-box">
                        <pre>{{sample.input}}</pre>
                      </div>
                    </div>
                    <div class="output-container">
                      <p class="sub-title">{{$t('출력 >')}}</p>
                      <div class="text-box">
                        <pre v-if="outputdata[index]">{{outputdata[index].replace(/ /g, "&nbsp;")}}</pre>
                      </div>
                    </div>
                  </div>
                  <div class="result-container">
                      <p class="sub-title">{{$t('결과 >')}}</p>
                      <div class="text-box">
                        <pre v-if="runResultData[index]">{{$t('m.' + runResultData[index].replace(/ /g, "_"))}}</pre>
                      </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </Card>
        </Card>
      </el-col>
      <div v-else id="problem-main-height"> <!--세로 모드 문제, 소스코드 제출란-->
        <Panel :padding="40" shadow>
          <div slot="title">{{ problem.title }}</div>
          <div id="problem-content" class="markdown-body" v-katex>
            <p class="title">{{ $t('m.Description') }}</p>
            <p class="content" v-html=problem.description></p>
            <!-- {{$t('m.music')}} -->
            <p class="title">{{ $t('m.Input') }} <span v-if="problem.io_mode.io_mode == 'File IO'">({{ $t('m.FromFile') }}: {{
              problem.io_mode.input }})</span></p>
            <p class="content" v-html=problem.input_description></p>

            <p class="title">{{ $t('m.Output') }} <span v-if="problem.io_mode.io_mode == 'File IO'">({{ $t('m.ToFile') }}: {{
              problem.io_mode.output }})</span></p>
            <p class="content" v-html=problem.output_description></p>

            <div v-for="(sample, index) of problem.samples" :key="index">
              <div class="flex-container sample">
                <div class="sample-input">
                  <p class="title">{{ $t('m.Sample_Input') }} {{ index + 1 }}
                    <a class="copy" v-clipboard:copy="sample.input" v-clipboard:success="onCopy"
                      v-clipboard:error="onCopyError">
                      <Icon type="clipboard"></Icon>
                    </a>
                  </p>
                  <pre>{{ sample.input }}</pre>
                </div>
                <div class="sample-output">
                  <p class="title">{{ $t('m.Sample_Output') }} {{ index + 1 }}</p>
                  <pre>{{ sample.output }}</pre>
                </div>
              </div>
            </div>

            <div v-if="problem.hint">
              <p class="title">{{ $t('m.Hint') }}</p>
              <Card dis-hover>
                <div class="content" v-html=problem.hint></div>
              </Card>
            </div>

            <div v-if="problem.source">
              <p class="title">{{ $t('m.Source') }}</p>
              <p class="content">{{ problem.source }}</p>
            </div>

          </div>
        </Panel>
        <br>
        <Card :padding="20" id="submit-code" dis-hover>
          <CodeMirror :value.sync="code" :languages="problem.languages" :language="language" :theme="theme"
            @resetCode="onResetToTemplate" @changeTheme="onChangeTheme" @changeLang="onChangeLang"></CodeMirror>
          <Row type="flex" justify="space-between">
            <Col :span="10">
            <div class="status" v-if="statusVisible">
              <template v-if="!this.contestID || (this.contestID && OIContestRealTimePermission)">
                <span>{{ $t('m.Status') }}</span>
                <Tag type="dot" :color="submissionStatus.color" @click.native="handleRoute('/status/' + submissionId)">
                  {{ $t('m.' + submissionStatus.text.replace(/ /g, "_")) }}
                </Tag>
              </template>
              <template v-else-if="this.contestID && !OIContestRealTimePermission">
                <Alert type="success" show-icon>{{ $t('m.Submitted_successfully') }}</Alert>
              </template>
            </div>
            <div v-else-if="problem.my_status === 0">
              <Alert type="success" show-icon>{{ $t('m.You_have_solved_the_problem') }}</Alert>
            </div>
            <div v-else-if="this.contestID && !OIContestRealTimePermission && submissionExists">
              <Alert type="success" show-icon>{{ $t('m.You_have_submitted_a_solution') }}</Alert>
            </div>
            <div v-if="contestEnded">
              <Alert type="warning" show-icon>{{ $t('m.Contest_has_ended') }}</Alert>
            </div>
            <div v-else-if="contestExitStatus"> <!--working by soojung-->
              <Alert type="warning" show-icon>{{ $t('m.Already_Submitted') }}</Alert>
            </div>
            </Col>
            <Col :span="12">
            <template v-if="captchaRequired">
              <div class="captcha-container">
                <Tooltip v-if="captchaRequired" content="Click to refresh" placement="top">
                  <img :src="captchaSrc" @click="getCaptchaSrc" />
                </Tooltip>
                <Input v-model="captchaCode" class="captcha-code" />
              </div>
            </template>
            <Button v-if="problemRes" type="warning" icon="edit" :loading="submitting" @click="submitCode"
              :disabled="problemSubmitDisabled || submitted" class="fl-right"> <!--제출(비활성화)-->
              <span v-if="submitting">{{ $t('m.Submitting') }}</span> <!--제출중-->
              <span v-else>{{ $t('m.Submit') }}</span> <!--제출(평소)-->
            </Button>
            <Button v-if="problemRes" type="warning" icon="play" :loading="running" @click="runCode"
                    :disabled="problemSubmitDisabled || submitted"
                    class="fl-right">
              <span v-if="running">실행중</span>
              <span v-else>실행</span>
            </Button>
            <Button v-else="problemRes" class="fl-right" disabled>{{ $t('m.WrongPath') }}</Button>
            <el-tooltip v-if="aiaskbutton" content="제출 시 버튼이 활성화됩니다." placement="top">
              <Button @click="toggleSidebar"
                      v-if="aihelperflag"
                      :disabled="aiaskbutton"
                      class="fl-right">
                <span>{{$t('m.callai')}}</span>
              </Button>
            </el-tooltip>
            <!-- aiaskbutton이 false일 때는 툴팁 없이 버튼만 표시 -->
            <Button v-if="aihelperflag && !aiaskbutton" @click="toggleSidebar"
                    :disabled="aiaskbutton"
                    @click.native="askAI"
                    class="fl-right">
              <span>{{$t('m.callai')}}</span>
            </Button>

            <!-- Tara 버튼에 대한 툴팁, askbutton이 true일 때만 툴팁 표시 -->
            <el-tooltip v-if="askbutton" content="제출 시 버튼이 활성화됩니다." placement="top">
              <Button v-b-toggle.sidebar-right
                      :disabled="askbutton"
                      class="fl-right">
                <span>{{$t('m.calltara')}}</span>
              </Button>
            </el-tooltip>
            <!-- askbutton이 false일 때는 툴팁 없이 버튼만 표시 -->
            <Button v-if="!askbutton" v-b-toggle.sidebar-right
                    :disabled="askbutton"
                    class="fl-right">
              <span>{{$t('m.calltara')}}</span>
            </Button>
            </Col>
          </Row>
        </Card>
        <Card :padding="20" id="run-code" dis-hover>
          <el-collapse v-model="activeNames">
            <el-collapse-item v-for="(sample, index) of problem.samples" :key="index" :title="$t('테스트') + ' ' + (index + 1)" :name="'test-' + index">
              <div class="sample">
                <div class="input-output-container">
                  <div class="input-container">
                    <p class="sub-title">{{$t('입력 >')}}</p>
                    <div class="text-box">
                      <pre>{{sample.input}}</pre>
                    </div>
                  </div>
                  <div class="output-container">
                    <p class="sub-title">{{$t('출력 >')}}</p>
                    <div class="text-box">
                      <pre v-if="outputdata[index]">{{outputdata[index].replace(/ /g, "&nbsp;")}}</pre>
                    </div>
                  </div>
                </div>
                <div class="result-container">
                    <p class="sub-title">{{$t('결과 >')}}</p>
                    <div class="text-box">
                      <pre v-if="runResultData[index]">{{$t('m.' + runResultData[index].replace(/ /g, "_"))}}</pre>
                    </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </Card>
      </div>
    </el-col>
    <div v-else></div>

    <el-col :span="2" id="right-column">
      <Card id="page-mode">
        <el-switch v-model="toggleValue" size="large" active-text="가로" inactive-text="세로" @change="toggleSwitch" />

      </Card>
      <br />
      <VerticalMenu @on-click="handleRoute">
        <template v-if="this.contestID">
          <VerticalMenu-item :route="{ name: 'contest-problem-list', params: { contestID: contestID } }">
            <Icon type="ios-photos"></Icon>
            {{ $t('m.Problems') }}
          </VerticalMenu-item>

          <VerticalMenu-item :route="{ name: 'contest-announcement-list', params: { contestID: contestID } }">
            <Icon type="chatbubble-working"></Icon>
            {{ $t('m.Announcements') }}
          </VerticalMenu-item>
        </template>

        <VerticalMenu-item v-if="!this.contestID || OIContestRealTimePermission" :route="submissionRoute">
          <Icon type="navicon-round"></Icon>
          {{ $t('m.Submissions') }}
        </VerticalMenu-item>

        <template v-if="this.contestID">
          <VerticalMenu-item v-if="!this.contestID || OIContestRealTimePermission"
            :route="{ name: 'contest-rank', params: { contestID: contestID } }">
            <Icon type="stats-bars"></Icon>
            {{ $t('m.Rankings') }}
          </VerticalMenu-item>
          <VerticalMenu-item @click.native="goContestQnA">
            <Icon type="help"></Icon>
            {{ $t('m.qa') }}
          </VerticalMenu-item>
          <VerticalMenu-item :route="{ name: 'contest-details', params: { contestID: contestID } }">
            <Icon type="home"></Icon>
            {{ $t('m.View_Contest') }}
          </VerticalMenu-item>
        </template>
      </VerticalMenu>

      <Card id="info">
        <div slot="title" class="header">
          <Icon type="information-circled"></Icon>
          <span class="card-title">{{ $t('m.Information') }}</span>
        </div>
        <ul>
          <li>
            <p>ID</p>
            <p>{{ problem._id }}</p>
          </li>
          <li>
            <p>{{ $t('m.Time_Limit') }}</p>
            <p>{{ problem.time_limit }}MS</p>
          </li>
          <li>
            <p>{{ $t('m.Memory_Limit') }}</p>
            <p>{{ problem.memory_limit }}MB</p>
          </li>

          <li>
            <p>{{ $t('m.IOMode') }}</p>
            <p>{{ problem.io_mode.io_mode }}</p>
          </li>
          <li>
            <p>{{ $t('m.Created') }}</p>
            <p>{{ problem.created_by.username }}</p>
          </li>
          <li v-if="problem.difficulty">
            <p>{{ $t('m.Level') }}</p>
            <p>{{ $t('m.' + problem.difficulty) }}</p>
          </li>
          <li v-if="problem.total_score">
            <p>{{ $t('m.Score') }}</p>
            <p>{{ problem.total_score }}</p>
          </li>
          <li>
            <p>{{ $t('m.Tags') }}</p>
            <p>
              <Poptip trigger="hover" placement="left-end">
                <a>{{ $t('m.Show') }}</a>
                <div slot="content">
                  <Tag v-for="tag in problem.tags" :key="tag">{{ tag }}</Tag>
                </div>
              </Poptip>
            </p>
          </li>
        </ul>
      </Card>
      <Card id="pieChart" :padding="0" v-if="!this.contestID || OIContestRealTimePermission">
        <div slot="title">
          <Icon type="ios-analytics"></Icon>
          <span class="card-title">{{ $t('m.Statistic') }}</span>
          <Button type="ghost" size="small" id="detail" @click="graphVisible = !graphVisible">{{ $t('m.Detail') }}</Button>
        </div>
        <div class="echarts">
          <ECharts :options="pie"></ECharts>
        </div>
      </Card>
    </el-col>

    <b-sidebar id="sidebar-right" title="Sidebar" width="500px" no-header right shadow>
      <div class="sidebar" id="wrapper">
        <el-button class="sidebar-margin" v-b-toggle.sidebar-right icon="el-icon-close" circle></el-button>
        <h2 class="sidebar-header">{{ $t('m.qna') }}</h2>
        <hr />
        <div class="sidebar-content">
          <br />
          <span>{{ $t('m.Contents') }}</span>
          <el-input class="sidebar-content-margin" :placeholder="$t('m.Please_enter_subject')" v-model="qnaContent.title"></el-input>
          <Simditor class="sidebar-content-margin" v-model="qnaContent.content"></Simditor>
          <el-button type="primary" v-b-toggle.sidebar-right @click.native="QnAWrite">{{ $t('m.Save') }}</el-button>
        </div>
      </div>
    </b-sidebar>

    <b-sidebar id="sidebar-airight" title="Sidebar" width="500px"no-header right shadow v-bind:visible="sidebarVisible">
          <div class="sidebar" id="wrapper">
            <el-button class="sidebar-margin" v-on:click="toggleSidebar" icon="el-icon-close" circle></el-button>
            <h2 class="sidebar-header">{{$t('m.aianswer')}}</h2>
            <hr/>
            <div class="sidebar-content" top="50%" left="50%">
              <br/>
              <p style= "font-size:18px">{{AIrespone}}</p>
            </div>
            <br/>
            <p style="font-weight: bold">commented by chatGPT </p>
          </div>
        </b-sidebar>

    <Modal v-model="graphVisible">
      <div id="pieChart-detail">
        <ECharts :options="largePie" :initOptions="largePieInitOpts"></ECharts>
      </div>
      <div slot="footer">
        <Button type="ghost" @click="graphVisible = false">{{ $t('m.Close') }}</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
  import {mapGetters, mapActions} from 'vuex'
  import {types} from '../../../../store'
  import CodeMirror from '@oj/components/CodeMirror.vue'

  import storage from '@/utils/storage'
  import {FormMixin} from '@oj/components/mixins'
  import {JUDGE_STATUS, CONTEST_STATUS, buildProblemCodeKey} from '@/utils/constants'
  import api from '@oj/api'
  import {pie, largePie} from './chartData'
  // SidebarPlugin
  import { SidebarPlugin } from 'bootstrap-vue'
  import 'bootstrap-vue/dist/bootstrap-vue.css'
  import Vue from 'vue'
  import Simditor from '../../components/Simditor.vue'
  import axios from 'axios'
  
  Vue.use(SidebarPlugin)

  // 只显示这些状态的图形占用
  const filtedStatus = ['-1', '-2', '0', '1', '2', '3', '4', '8']

  export default {
    name: 'Problem',
    components: {
      CodeMirror,
      Simditor
    },
    mixins: [FormMixin],
    data () {
      return {
        toggleValue: window.localStorage.getItem('viewMode') ? JSON.parse(window.localStorage.getItem('viewMode')) : false, // 가로 세로 모드 토글 버튼
        sidebarVisible: false,
        statusVisible: false,
        captchaRequired: false,
        graphVisible: false,
        submissionExists: false,
        problemRes: false,
        captchaCode: '',
        captchaSrc: '',
        contestID: '',
        problemID: '',
        lectureID: '',
        askbutton: true,
        aiaskbutton: true,
        aihelperflag: false,
        submitting: false,
        AIrespone: '답변을 작성하고 있습니다. 잠시만 기다려 주세요. 10초~30초 정도 소요 됩니다.',
        qnaContent: {
          title: '',
          content: ''
        },
        code: '',
        language: 'C++',
        theme: 'solarized',
        submissionId: '',
        submitted: false,
        result: {
          result: 9
        },
        problem: {
          title: '',
          description: '',
          hint: '',
          my_status: '',
          template: {},
          languages: [],
          created_by: {
            username: ''
          },
          tags: [],
          io_mode: {'io_mode': 'Standard IO'}
        },
        pie: pie,
        largePie: largePie,
        // echarts 无法获取隐藏dom的大小，需手动指定
        largePieInitOpts: {
          width: '500',
          height: '480'
        },
        contestEndtime: '',  // working by soojung
        contestExitStatus: false, // working by soojung
        dynamicHeight: window.innerHeight,
        outputdata: [],
        runResultData: {}
      }
    },

    beforeRouteEnter (to, from, next) {
      let problemCode = storage.get(buildProblemCodeKey(to.params.problemID, to.params.contestID))
      if (problemCode) {
        next(vm => {
          vm.language = problemCode.language
          vm.code = problemCode.code
          vm.theme = problemCode.theme
        })
      } else {
        next()
      }
    },
    mounted () {
      this.$store.commit(types.CHANGE_CONTEST_ITEM_VISIBLE, {menu: false})
      this.init()
      window.addEventListener('resize', this.handleResize)
      window.addEventListener('keydown', this.handleKeyDown)
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('keydown', this.handleKeyDown)
    },
    methods: {
      handleResize () {
        this.dynamicHeight = window.innerHeight
      },
      handleKeyDown (event) {
        if (event.ctrlKey && event.key === 'Enter') {
          this.runCode()
        }
      },
      toggleSwitch (newToggleValue) { // toggle 버튼 이벤트 감지
        this.toggleValue = newToggleValue
        if (this.toggleValue) {
          window.localStorage.setItem('viewMode', true)
        } else {
          window.localStorage.setItem('viewMode', false)
        }
      },
      ...mapActions(['changeDomTitle']),
      getLectureID () {
        if (this.lectureID === undefined) {
          let data = { contestID: this.contestID }
          api.getlectureid(data).then(res => {
            this.lectureID = res.data.data
          })
        }
      },
      checkAllowedAIhelper () {
        let data = { contestID: this.contestID }
        api.getAIhelperflag(data).then(res => {
          this.aihelperflag = res.data.data
        })
      },
      goContestQnA () {
        this.$router.push({
          name: 'constest-problem-qna',
          // path: '/CourseList/:lectureID/:contestID/question',
          params: {
            lectureID: this.lectureID,
            problemID: this.problem.id,
            contestID: this.contestID
          }
        })
      },
      init () {
        this.$Loading.start()
        this.CheckContestExit()
        this.contestID = this.$route.params.contestID // 실제 문제에 대한 정보를 얻기 위해서는 Contest의 id값과
        this.problemID_ = this.$route.params.problemID // Contest에 포함된 problem의 id값이 필요
        this.lectureID = this.$route.params.lectureID
        this.getLectureID()
        this.checkAllowedAIhelper()
        let func = this.$route.name === 'problem-details' ? 'getProblem' : 'getContestProblem'
        api[func](this.problemID_, this.contestID).then(res => {
          this.$Loading.finish()
          let problem = res.data.data
          this.changeDomTitle({title: problem.title})
          api.submissionExists(problem.id, this.lectureID, this.contestID).then(res => {
            this.submissionExists = res.data.data
          })
          api.problemResponsible(problem.id, this.lectureID, this.contestID).then(res => {
            this.problemRes = res.data.data
          })
          problem.languages = problem.languages.sort()
          this.problem = problem
          this.changePie(problem)

          // 在beforeRouteEnter中修改了, 说明本地有code，无需加载template
          if (this.code !== '') {
            return
          }
          // try to load problem template
          this.language = this.problem.languages[0]
          let template = this.problem.template
          if (template && template[this.language]) {
            this.code = template[this.language]
          }
        }, () => {
          this.$Loading.error()
        })
        let params = {lectureID: this.lectureID, contestID: this.contestID, problemID: this.problem.id}
        api.checkSubmissionLog(params).then(res => {
          this.code = res.data.data.code
          this.submissionId = res.data.data.id
        }).catch(() => {
        })
      },
      CheckContestExit () {  // working by soojung
        api.checkContestExit(this.$route.params.contestID).then(res => {
          this.contestEndtime = res.data.data.end_time
          console.log('What is state')
          console.log(this.contestEndtime)
          if (this.contestEndtime) {
            this.submitted = true
            this.contestExitStatus = true
          }
          console.log(this.contestExitStatus)
          if (this.contestExitStatus) {
            this.$error('이미 퇴실하셨습니다.')
          }
        }).catch(() => {
        })
      },
      // ContestTimeOverExit () {  // working by soojung (설정 시간 초과로 인한 시험 자동 종료의 경우)
      //   api.getContestTimeOverExit(this.$route.params.contestID).then(res => {
      //     console.log(this.contestID)
      //     console.log(this.lectureID)
      //   }).catch(() => {
      //   })
      // },
      QnAWrite () {
        let data = { id: this.submissionId, contestID: this.contestID, problemID: this.problem.id, 'content': this.qnaContent, 'private': false }
        api.writeQnAPost(data).then(res => {
          this.goContestQnA()
        })
      },
      changePie (problemData) {
        // 只显示特定的一些状态
        for (let k in problemData.statistic_info) {
          if (filtedStatus.indexOf(k) === -1) {
            delete problemData.statistic_info[k]
          }
        }
        let acNum = problemData.accepted_number
        let data = [
          {name: 'WA', value: problemData.submission_number - acNum},
          {name: 'AC', value: acNum}
        ]
        this.pie.series[0].data = data
        // 只把大图的AC selected下，这里需要做一下deepcopy
        let data2 = JSON.parse(JSON.stringify(data))
        data2[1].selected = true
        this.largePie.series[1].data = data2

        // 根据结果设置legend,没有提交过的legend不显示
        let legend = Object.keys(problemData.statistic_info).map(ele => JUDGE_STATUS[ele].short)
        if (legend.length === 0) {
          legend.push('AC', 'WA')
        }
        this.largePie.legend.data = legend

        // 把ac的数据提取出来放在最后
        let acCount = problemData.statistic_info['0']
        delete problemData.statistic_info['0']

        let largePieData = []
        Object.keys(problemData.statistic_info).forEach(ele => {
          largePieData.push({name: JUDGE_STATUS[ele].short, value: problemData.statistic_info[ele]})
        })
        largePieData.push({name: 'AC', value: acCount})
        this.largePie.series[0].data = largePieData
      },
      handleRoute (route) {
        console.log(route)
        this.$router.push(route)
      },
      onChangeLang (newLang) {
        if (this.problem.template[newLang]) {
          if (this.code.trim() === '') {
            this.code = this.problem.template[newLang]
          }
        }
        this.language = newLang
      },
      onChangeTheme (newTheme) {
        this.theme = newTheme
      },
      onResetToTemplate () {
        this.$Modal.confirm({
          content: this.$i18n.t('m.Are_you_sure_you_want_to_reset_your_code'),
          onOk: () => {
            let template = this.problem.template
            if (template && template[this.language]) {
              this.code = template[this.language]
            } else {
              this.code = ''
            }
          }
        })
      },
      askAI () {
        let params = {
          id: this.submissionId,
          code: this.code,
          result: this.result.result}
        // let data = { 'id': this.submission.id, 'code': this.submission.code,
        //   'contestID': this.submission.contest, 'problemID': this.submission.problem, 'content': this.qnaContent }
        console.log('askAI called')
        api.askQuAAI(params).then(res => {
          console.log(params)
          this.AIrespone = res.data.data
          console.log(res)
        })
      },
      checkSubmissionStatus () {
        // 使用setTimeout避免一些问题
        if (this.refreshStatus) {
          // 如果之前的提交状态检查还没有停止, 则停止,否则将会失去timeout的引用造成无限请求
          clearTimeout(this.refreshStatus)
        }
        const checkStatus = () => {
          let id = this.submissionId
          api.getSubmission(id).then(res => {
            this.result = res.data.data
            if (Object.keys(res.data.data.statistic_info).length !== 0) {
              this.submitting = false
              this.submitted = false
              clearTimeout(this.refreshStatus)
              this.init()
            } else {
              this.refreshStatus = setTimeout(checkStatus, 2000)
            }
          }, res => {
            this.submitting = false
            clearTimeout(this.refreshStatus)
          })
        }
        this.refreshStatus = setTimeout(checkStatus, 2000)
      },
      // 코드 제출 버튼
      submitCode () {
        if (this.code.trim() === '') {
          this.$error(this.$i18n.t('m.Code_can_not_be_empty'))
          return
        }
        this.submissionId = ''
        this.result = {result: 9}
        this.submitting = true
        let data = {
          problem_id: this.problem.id,
          language: this.language,
          code: this.code,
          contest_id: this.contestID
        }
        if (this.captchaRequired) {
          data.captcha = this.captchaCode
        }
        const submitFunc = (data, detailsVisible) => {
          this.statusVisible = true
          console.log(data)
          api.submitCode(data).then(res => {
            this.submissionId = res.data.data && res.data.data.submission_id
            // 定时检查状态
            this.submitting = false
            this.submissionExists = true
            if (!detailsVisible) {
              this.$Modal.success({
                title: this.$i18n.t('m.Success'),
                content: this.$i18n.t('m.Submit_code_successfully')
              })
              return
            }
            this.submitted = true
            this.checkSubmissionStatus()
          }, res => {
            this.getCaptchaSrc()
            if (res.data.data.startsWith('보안 문자가 필요합니다')) {
              this.captchaRequired = true
            }
            this.submitting = false
            this.statusVisible = false
          })
        }

        if (this.contestRuleType === 'OI' && !this.OIContestRealTimePermission) {
          if (this.submissionExists) {
            this.$Modal.confirm({
              title: '',
              content: '<h3>' + this.$i18n.t('m.You_have_submission_in_this_problem_sure_to_cover_it') + '<h3>',
              onOk: () => {
                // 暂时解决对话框与后面提示对话框冲突的问题(否则一闪而过）
                setTimeout(() => {
                  submitFunc(data, false)
                }, 1000)
              },
              onCancel: () => {
                this.submitting = false
              }
            })
          } else {
            submitFunc(data, false)
          }
        } else {
          submitFunc(data, true)
        }
        this.askbutton = false
        this.aiaskbutton = false
      },
      runCode () {
        console.log('run 버튼 실행')
        if (this.code.trim() === '') {
          this.$error(this.$i18n.t('m.Code_can_not_be_empty'))
          return
        }
        this.submissionId = ''
        this.result = {result: 9}
        this.runResultData = []
        let data = {
          problem_id: this.problem.id,
          sample_test: true,
          sample_count: this.problem.samples.length,
          language: this.language,
          code: this.code,
          contest_id: this.contestID
        }
        console.log(data)
        api.submitCode(data).then(res => {
          console.log(res)
          this.outputdata = res.data.data.outputResultData.map(item => item.output)
          let resultData = res.data.data.outputResultData.map(item => item.result)
          for (let i = 0; i < resultData.length; i++) {
            if (resultData[i] === -1) {
              this.runResultData.push('오답')
            } else if (resultData[i] === 0) {
              this.runResultData.push('정답')
            } else {
              this.runResultData.push('컴파일 오류')
            }
          }
          console.log(this.outputdata)
        })
      },
      onCopy (event) {
        this.$success(this.$i18n.t('m.Code_Copied'))
      },
      onCopyError (e) {
        this.$error(this.$i18n.t('m.Failed_to_copy'))
      },
      toggleSidebar () {
        this.sidebarVisible = !this.sidebarVisible
        this.AIrespone = '답변을 작성하고 있습니다. 잠시만 기다려 주세요. 10초~30초 정도 소요 됩니다.'
      }
    },
    computed: {
      ...mapGetters(['problemSubmitDisabled', 'contestRuleType', 'OIContestRealTimePermission', 'contestStatus']),
      contest () {
        return this.$store.state.contest.contest
      },
      contestEnded () {
        // if (this.contestStatus === CONTEST_STATUS.ENDED) {
        //   this.ContestTimeOverExit()  // working by soojung
        // }
        return this.contestStatus === CONTEST_STATUS.ENDED
      },
      submissionStatus () {
        return {
          text: JUDGE_STATUS[this.result.result]['name'],
          color: JUDGE_STATUS[this.result.result]['color']
        }
      },
      submissionRoute () {
        if (this.contestID) {
          return {name: 'contest-submission-list', query: {problemID: this.problem.id}}
        } else {
          return {name: 'submission-list', query: {problemID: this.problem.id}}
        }
      }
    },
    beforeRouteLeave (to, from, next) {
      // 防止切换组件后仍然不断请求
      clearInterval(this.refreshStatus)

      this.$store.commit(types.CHANGE_CONTEST_ITEM_VISIBLE, {menu: true})
      storage.set(buildProblemCodeKey(this.problem._id, from.params.contestID), {
        code: this.code,
        language: this.language,
        theme: this.theme
      })
      next()
    },
    watch: {
      '$route' () {
        this.init()
      }
    }
  }
</script>

<style lang="less" scoped>
  .card-title {
    margin-left: 8px;
  }

  .flex-container {
    display: flex;
    #view-mode {
      flex: 1; /* 부모가 자식 요소를 꽉 채울 수 있도록 설정 */
      display: flex; /* 내부 요소를 가로로 정렬 */
    }
    #problem-main-width {
      flex: 5; /* 5:7 비율로 나누기 위해 5로 설정 */
      margin-right: 9px;
      overflow: scroll;
 
    }
    #problem-main-height {
      flex: auto;
      margin-right: 18px;
    }
    #problem-source {
      flex: 7; /* 5:7 비율로 나누기 위해 7로 설정 */
      height: 100%;
      margin-right: 18px;
    }
    #right-column {
      flex: none;
      width: 220px;
    }
  }

  #problem-content {
    margin-top: -50px;
    .title {
      font-size: 20px;
      font-weight: 400;
      margin: 25px 0 8px 0;
      color: #3091f2;
      .copy {
        padding-left: 8px;
      }
    }
    p.content {
      margin-left: 25px;
      margin-right: 20px;
      font-size: 15px
    }
    .sample {
      align-items: stretch;
      &-input, &-output {
        width: 50%;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        margin-right: 5%;
      }
      pre {
        flex: 1 1 auto;
        align-self: stretch;
        border-style: solid;
        background: transparent;
      }
    }
  }

  #submit-code {
    .status {
      float: left;
      span {
        margin-right: 10px;
        margin-left: 10px;
      }
    }
    .captcha-container {
      display: inline-block;
      .captcha-code {
        width: auto;
        margin-top: -20px;
        margin-left: 20px;
      }
    }
  }

  #info {
    margin-bottom: 20px;
    margin-top: 20px;
    ul {
      list-style-type: none;
      li {
        border-bottom: 1px dotted #e9eaec;
        margin-bottom: 10px;
        p {
          display: inline-block;
        }
        p:first-child {
          width: 90px;
        }
        p:last-child {
          float: right;
        }
      }
    }
  }

  .fl-right {
    float: right;
  }

  #pieChart {
    .echarts {
      height: 250px;
      width: 210px;
    }
    #detail {
      position: absolute;
      right: 10px;
      top: 10px;
    }
  }

  #pieChart-detail {
    margin-top: 20px;
    width: 500px;
    height: 480px;
  }
</style>


<style scoped lang="less">
  @import url('https://fonts.googleapis.com/earlyaccess/notosanskr.css');
  #status {
    .title {
      font-size: 20px;
    }
    .content {
      margin-top: 10px;
      font-size: 14px;
      span {
        margin-right: 10px;
      }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        word-break: break-all;
      }
    }
  }
  .sidebar {
    background: white;
    border: 2px solid #bcbcbc;
  }
  .sidebar-header {
    float: right;
    margin: 10px;
    margin-top: 17px;
  }
  .sidebar-content {
    font-family: 'Noto Sans KR', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    margin: 10px;
  }
  .sidebar-content-margin {
    margin-top: 10px;
  }
  .admin-info {
    margin: 5px 0;
    &-content {
      font-size: 16px;
      padding: 10px;
    }
  }
  .sidebar-margin {
    margin: 10px;
  }
  .mr-0 {
    margin-right: 10px;
  }
  .ml-auto {
    margin-left:auto;
  }
  .d-block {
    display:block;
  }
  #share-btn {
    float: right;
    margin-top: 5px;
    margin-right: 10px;
  }
  #run-code{
    align-items: stretch;
    .sample {
      height: 50%;
      display: flex;
      flex-direction: column;
      padding: 10px;
      border: 1px solid #ccc;
    }
    .title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #3091f2;
    }
    .sub-title {
      font-weight: bold;
      margin-bottom: 5px;
      color: #3091f2;
    }
    .input-output-container {
      display: flex;
    }
    .input-container,
    .output-container,
    .result-container {
      width: 50%;
      height: 55%;
      padding: 10px;
    }
    .result-container {
      display: flex; /* 가로로 배치 */
      width: auto;
      height: auto;
      flex-wrap: wrap;
      background-color: white;
    }
    .output-container .text-box,
    .input-container .text-box {
      height: 50%;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: auto;
    }
    .result-container .text-box {
      border: none; /* 테두리 없애기 */
      overflow: auto;
      margin-left: 5px;
      margin-bottom: 5px;
      background-color: #e2e4ff;
      display: inline-block;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
    }
  }
</style>
