<template>
  <div class="problem-layout-container" :style="currentTheme">
    
    <!-- 1. Menu Pane -->
    <div class="pane menu-pane" :class="{'pane-collapsed': !menuExpanded}">
      <div v-show="menuExpanded" class="pane-content pane-scroll">
        <div class="pane-header">
          <span class="title" style="font-weight: bold; margin-left: 10px;">메뉴</span>
          <icon type="chevron-left" @click="menuExpanded = false" class="toggle-btn"></icon>
        </div>
        <VerticalMenu @on-click="handleRoute">
        <template v-if="this.contestID">
          <div class="menu-collapsible-wrapper">
            <VerticalMenu-item @click.native="problemListExpanded = !problemListExpanded">
              <Icon type="ios-photos"></Icon>
              {{ $t('m.Problems') }}
              <Icon :type="problemListExpanded ? 'chevron-up' : 'chevron-down'" style="float: right; margin-top: 3px; font-size: 14px; color: #999;"></Icon>
            </VerticalMenu-item>
            <ul v-show="problemListExpanded" class="problem-list-menu">
              <li v-for="(p, index) in problemList" :key="p._id" @click="handleRoute({ name: $route.name, params: { lectureID: lectureID, contestID: contestID, problemID: p._id }})" :class="{'active-problem': p._id === problem._id}">
                <span v-if="p.my_status === 0" class="status-label status-completed">[완료]</span>
                <span v-else-if="p.my_status !== null && p.my_status !== undefined" class="status-label status-error">[오류]</span>
                <span>
                  {{index + 1}}. {{p.title || p._id}}
                </span>
              </li>
            </ul>
          </div>

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
          <VerticalMenu-item v-if="contestType === '대회' && this.lectureID"
                             :route="{name: 'lecture-contest-exit'}">
            <Icon type="android-exit"></Icon>
            {{$t('m.Exit')}}
          </VerticalMenu-item>
        </template>
      </VerticalMenu>
        <br />
        <Card id="info" :padding="10">
        <div slot="title" class="header" style="font-size: 14px;">
          <Icon type="information-circled"></Icon>
          <span class="card-title">{{ $t('m.Information') }}</span>
        </div>
        <ul style="font-size: 13px;">
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
        <br />
        <Card id="pieChart" :padding="10" v-if="!this.contestID || OIContestRealTimePermission">
        <div slot="title" style="font-size: 14px;">
          <Icon type="ios-analytics"></Icon>
          <span class="card-title">{{ $t('m.Statistic') }}</span>
          <Button type="ghost" size="small" id="detail" style="float: right; margin-top: -3px;" @click="graphVisible = !graphVisible">{{ $t('m.Detail') }}</Button>
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

    <!-- 2. Problem Pane -->
    <div class="pane problem-pane">
      <Panel :padding="40" shadow style="height: 100%">
          <div slot="title">{{ problem.title }}</div>
          <div id="problem-content" class="markdown-body" v-katex :style="{ height: (paneHeight - 60) + 'px', overflowY: 'auto' }">
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
                    <a class="copy" @click="handleSampleCopy(sample.input)">
<!--                      <Icon type="clipboard"></Icon>-->
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
      <br />
      <Card dis-hover>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <p>Problem copied({{ antiData.copy }}),</p>
            <p>Screen focusing({{ antiData.focusScreen }})</p>
          </div>
        </Card>
    </div>

    <!-- 3. Code Pane -->
    <div class="pane code-pane pane-scroll">
      <Card id="submit-code" dis-hover>
          <CodeMirror :value.sync="code" :languages="problem.languages" :language="language" :theme="theme"
            @resetCode="onResetToTemplate" @changeTheme="onChangeTheme" @changeLang="onChangeLang" :newHeight="codeMirrorHeight"></CodeMirror>
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

            <Button v-if="problemRes" type="success" icon="edit" :loading="submitting" @click="submitCode"
              :disabled="problemSubmitDisabled || submitted" class="fl-right"> <!--제출(비활성화)-->
              <span v-if="submitting">{{ $t('m.Submitting') }}</span> <!--제출중-->
              <span v-else>{{ $t('m.Submit') }}</span> <!--제출(평소)-->
            </Button>
            <Button v-else class="fl-right" disabled>{{ $t('m.WrongPath') }}</Button>
            <el-tooltip
              content="실행 버튼 클릭시 실행 결과가 아래 테스트칸에 출력됩니다. (ctrl + enter)"
              placement="top">
              <Button v-if="problemRes" icon="play" :loading="running" @click="runCode"
                    :disabled="problemSubmitDisabled || submitted"
                    class="run-btn">
                <span v-if="running">{{$t('m.Running')}}</span>
                <span v-else>{{$t('m.Execution')}}</span>
              </Button>
            </el-tooltip>
            <el-tooltip v-if="aiaskbutton" >
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
            <div class="result-tap">
              <p class="title">{{$t('m.Execution_Result')}}</p>
              <div class="type-switch-container">
                <span class="sub-title" style="margin-right: 8px;">{{$t('m.Type')}}</span>
                <el-switch
                  v-model="showResultType"
                  inline-prompt
                  size="large"
                  active-text="2"
                  inactive-text="1"
                />
              </div>
            </div>
            <div class="run-code-content-wrapper">
            <div v-if="showResultType">
              <el-tabs type="border-card">
                <el-tab-pane
                  v-for="(sample, index) of problem.samples"
                  :key="index"
                  :label="getRunResultLable(index)"
                >
                  <div class="input-output-container">
                    <div class="input-container">
                      <p class="sub-title">{{$t('m.Input')}}</p>
                      <div class="text-box">
                        <pre>{{sample.input}}</pre>
                      </div>
                    </div>
                    <div class="output-container">
                      <p class="sub-title">{{$t('m.Your_Output')}}</p>
                      <div class="text-box">
                        <pre v-if="outputdata[index]">{{outputdata[index].replace(/ /g, "&nbsp;")}}</pre>
                      </div>
                    </div>
                    <div class="sample-output-container">
                      <p class="sub-title">{{$t('m.DCU_Output')}}</p>
                      <div class="text-box">
                        <pre>{{sample.output}}</pre>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
            <div v-else>
              <div v-for="(sample, index) of problem.samples" :key="index" class="sample-container">
                <div class="sample">
                  <div class="samples" @click="toggleDetails(index)" style="display: flex; align-items: center;">
                    <icon v-if="isTestcaseSelected(index)" class="toggle-icon" type="arrow-down-b" size="20"></icon>
                    <icon v-else class="toggle-icon" type="arrow-right-b" size="20"></icon>
                    <p class="title">
                        {{$t('m.Test')}} {{index + 1}}
                    </p>
                    <div class="result-container">
                        <p class="sub-title">{{$t('m.Result')}} ></p>
                        <div class="text-box"
                        :style="{color: (runResultData[index] === '오류' || runResultData[index] === '오류(시간초과)') ? 'red' : (runResultData[index] === '정답' ? 'green' : 'red')}">
                          <pre v-if="runResultData[index]">{{runResultData[index]}}</pre>
                        </div>
                    </div>
                  </div>
                  <div v-if="isTestcaseSelected(index)" class="input-output-container">
                    <div class="input-container">
                      <p class="sub-title">{{$t('m.Input')}}</p>
                      <div class="text-box">
                        <pre>{{sample.input}}</pre>
                      </div>
                    </div>
                    <div class="output-container">
                      <p class="sub-title">{{$t('m.Your_Output')}}</p>
                      <div class="text-box">
                        <pre v-if="outputdata[index]">{{outputdata[index].replace(/ /g, "&nbsp;")}}</pre>
                      </div>
                    </div>
                    <div class="sample-output-container">
                      <p class="sub-title">{{$t('m.DCU_Output')}}</p>
                      <div class="text-box">
                        <pre>{{sample.output}}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </Card>
      </Card>
    </div>

    <!-- 4. AI Hint Pane -->
    <div class="pane ai-pane" :class="{'pane-collapsed': !aiHintExpanded}" v-show="llmHintVisible">
      <div v-show="aiHintExpanded" class="pane-content pane-scroll" style="height: 100%">
        <div class="pane-header">
          <span class="title">AI 힌트</span>
          <icon type="chevron-right" @click="aiHintExpanded = false" class="toggle-btn"></icon>
        </div>
        <Card id="llm-hint" dis-hover>
        <div class="hint-body">
          <div class="hint-chat-area" ref="hintChatArea">
            <div v-for="(msg, idx) in llmChatMessages" :key="idx" :class="['chat-bubble', msg.role === 'user' ? 'chat-user' : 'chat-assistant']">
              <div class="chat-role">{{ msg.role === 'user' ? '나' : 'AI' }}</div>
              <div class="chat-msg-body" v-html="renderMarkdown(msg.content)"></div>
            </div>
            <div v-if="llmHintLoading" class="hint-loading">
              <Spin size="small"/>
              <span>응답 생성 중...</span>
            </div>
          </div>
          <div class="hint-input-area">
            <Input v-model="llmFollowUpInput" placeholder="추가 질문을 입력하세요..." @on-enter="sendFollowUpQuestion" :disabled="llmHintLoading" />
            <Button type="warning" icon="ios-send" :loading="llmHintLoading" :disabled="!llmFollowUpInput.trim()" @click="sendFollowUpQuestion">전송</Button>
          </div>
        </div>
      </Card>
      </div>
      <div v-show="!aiHintExpanded" class="pane-collapsed-content" @click="aiHintExpanded = true">
        <span class="vertical-text">AI 힌트 열기...</span>
      </div>
    </div>

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
    <transition name="fade">
      <div v-if="showHintNotification" class="ai-hint-notification" @click="scrollToHint">
        <span class="notify-text">AI 힌트가 도착했습니다!</span>
        <Icon type="close" class="notify-close" @click.stop="showHintNotification = false" />
      </div>
    </transition>
  </div>
</template>

<script>
  import { mapGetters, mapActions, mapState } from 'vuex'
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

  Vue.use(SidebarPlugin)

  // 只显示这些状态的图形占用
  const filtedStatus = ['-1', '-2', '0', '1', '2', '3', '4', '8']

  function getCookie (name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  }

  export default {
    name: 'Problem',
    components: {
      CodeMirror,
      Simditor
    },
    mixins: [FormMixin],
    data () {
      return {
        menuExpanded: true,
        aiHintExpanded: true,
        selectedTestcase: [],
        showResultType: false,
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
        runResultData: {},
        running: false,
        contestType: '',
        isBlurred: false,
        antiData: { copy: 0, focusScreen: 0 },
        initialAntiData: { copy: 0, focusScreen: 0 },
        llmHintVisible: false,
        llmHintLoading: false,
        llmChatMessages: [],
        llmHintExpanded: true,
        llmFollowUpInput: '',
        llmConversationHistory: [],
        llmHintSessionId: '',
        llmHintSessionTag: '',
        llmHintSessionPromise: null,
        scrollTimeout: null,
        showHintNotification: false,
        problemList: [],
        problemListExpanded: true
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
      this.onChangeTheme(this.currentTheme)
      this.init()
      window.addEventListener('resize', this.handleResize)
      window.addEventListener('keydown', this.handleKeyDown)
      document.addEventListener('copy', this.handleCopy)
      window.addEventListener('keydown', this.preventKeyCombinations)
      window.addEventListener('blur', this.handleScreenBlur)
      window.addEventListener('focus', this.handleScreenFocus)
      document.addEventListener('contextmenu', this.handleRightClick)
      window.addEventListener('keyup', this.handleKeyUp)
      window.addEventListener('beforeunload', this.handleBeforeUnload)
      window.addEventListener('scroll', this.handleMainScroll)
    },
    beforeDestroy () {
      if (this.$route.params.problemID) {
        storage.set(buildProblemCodeKey(this.$route.params.problemID, this.$route.params.contestID), {
          code: this.code,
          language: this.language,
          theme: this.theme
        })
      }
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('keydown', this.handleKeyDown)
      document.removeEventListener('copy', this.handleCopy)
      window.removeEventListener('keydown', this.preventKeyCombinations)
      window.removeEventListener('blur', this.handleScreenBlur)
      window.removeEventListener('focus', this.handleScreenFocus)
      document.removeEventListener('contextmenu', this.handleRightClick)
      window.removeEventListener('keyup', this.handleKeyUp)
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
      window.removeEventListener('scroll', this.handleMainScroll)
    },
    methods: {
      logUserEvent (problemID, ruleType, contestID, focusing, copied) {
        return api.logUserEvent(problemID, ruleType, contestID, focusing, copied)
      },
      handleBeforeUnload (event) {
        console.log('Before unload event triggered')

        const copiedDiff = this.antiData.copy - this.initialAntiData.copy
        const focusDiff = this.antiData.focusScreen - this.initialAntiData.focusScreen

        if (copiedDiff > 0 || focusDiff > 0) {
          const logData = {
            problem_id: this.problem.id,
            rule_type: this.rule_type,
            contest_id: this.contestID,
            focusing: focusDiff,
            copied: copiedDiff
          }

          console.log('Sending log data with fetch:', logData)

          const csrfToken = getCookie('csrftoken')  // ✅ 쿠키에서 CSRF 토큰 가져오기

          fetch('/api/user/event_log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken               // ✅ CSRF 헤더 추가
            },
            body: JSON.stringify(logData),
            keepalive: true,
            credentials: 'include'                   // ✅ 쿠키 동봉 필수
          })
        }

        event.preventDefault()
        event.returnValue = ''
      },
      handleResize () {
        this.dynamicHeight = window.innerHeight
      },
      handleKeyDown (event) {
        if (event.ctrlKey && event.key === 'Enter' && !this.problemSubmitDisabled && !this.submitted) {
          this.runCode()
        }
      },
      toggleDetails (index) {
        const idx = this.selectedTestcase.indexOf(index)
        if (idx > -1) {
          this.selectedTestcase.splice(idx, 1)
        } else {
          this.selectedTestcase.push(index)
        }
      },
      isTestcaseSelected (index) {
        return this.selectedTestcase.includes(index)
      },
      showResultTypeSwithch (swithchValue) {
        console.log(this.showResultType)
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
        this.contestID = this.$route.params.contestID // 실제 문제에 대한 정보를 얻기 위해서는 Contest의 id값과
        this.problemID_ = this.$route.params.problemID // Contest에 포함된 problem의 id값이 필요
        this.lectureID = this.$route.params.lectureID
        this.getLectureID()
        this.checkAllowedAIhelper()
        this.checkContestExit()
        let func = this.$route.name === 'problem-details' ? 'getProblem' : 'getContestProblem'
        if (func === 'getContestProblem') {
          this.$store.dispatch('getContest').then(res => {
            this.contestType = res.data.data.lecture_contest_type
          }).catch(() => {
          })
        }
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
          this.antiData.copy = problem.copied || 0
          this.antiData.focusScreen = problem.focusing || 0
          this.initialAntiData.copy = this.antiData.copy
          this.initialAntiData.focusScreen = this.antiData.focusScreen
          this.rule_type = problem.rule_type

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
          // Fetch problem submission log
          let params = {lectureID: this.lectureID, contestID: this.contestID, problemID: problem.id}
          api.checkSubmissionLog(params).then(res => {
            if (res.data.data) {
              if (this.code === '') { // Only populate if not already set by storage
                this.code = res.data.data.code
              }
              this.submissionId = res.data.data.id
              // Fetch latest result to show status
              api.getSubmission(this.submissionId).then(res => {
                this.result = res.data.data
                if (this.result.result !== null && this.result.result !== undefined) {
                  this.statusVisible = true
                }
              })
            }
          }).catch(() => {
          })
        }, () => {
          this.$Loading.error()
        })

        // Fetch problem list for the contest/lecture menu
        if (this.contestID) {
          api.getContestProblemList(this.contestID).then(res => {
            this.problemList = res.data.data || []
          }).catch(() => {
            this.problemList = []
          })
        }
      },
      checkContestExit () {
        api.checkContestExit(this.contestID).then(res => {
          this.contestEndtime = res.data.data.end_time
          if (this.contestEndtime) {
            this.submitted = true
            this.contestExitStatus = true
          }
          if (this.contestExitStatus) {
            this.$error('이미 퇴실하셨습니다.')
          }
        })
      },
      // ContestTimeOverExit () {  // working by soojung (설정 시간 초과로 인한 시험 자동 종료의 경우)
      //   api.getContestTimeOverExit(this.$route.params.contestID).then(res => {
      //     console.log(this.contestID)
      //     console.log(this.lectureID)
      //   }).catch(() => {this.$error('이미 퇴실하셨습니다.')
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
              // 채점 완료 후 실패시 LLM 힌트 요청
              if (res.data.data.result !== 0) {
                this.fetchLLMHint('submit', res.data.data.result)
              } else {
                this.llmHintVisible = false
              }
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
          contest_id: this.contestID,
          copied: this.antiData.copy,               // 안티 데이터 추가
          focusing: this.antiData.focusScreen,      // 안티 데이터 추가
          rule_type: this.problem.rule_type
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
        this.running = true
        this.submitting = true
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
        api.submitCode(data).then(res => {
          console.log(res)
          this.outputdata = res.data.data.outputResultData.map(item => item.output)
          let resultData = res.data.data.outputResultData.map(item => item.result)
          for (let i = 0; i < resultData.length; i++) {
            if (resultData[i] === -1) {
              this.runResultData.push('오답')
            } else if (resultData[i] === 0) {
              this.runResultData.push('정답')
            } else if (resultData[i] === 1) {
              this.runResultData.push('오류(시간초과)')
            } else {
              this.runResultData.push('오류')
            }
          }
          // 실행 완료 후 오답/오류 있으면 LLM 힌트 요청
          const hasFailure = resultData.some(r => r !== 0)
          if (hasFailure) {
            this.fetchLLMHint('run', resultData)
          } else {
            this.llmHintVisible = false
          }
        }).catch((err) => {
          console.error(err)
          let errMsg = '컴파일 에러 혹은 서버 오류가 발생했습니다.'
          if (err.response && err.response.data) {
            errMsg = err.response.data.data || err.response.data.error || errMsg
          }
          // 컴파일 실패 시 모든 테스트 케이스 결과 란에 에러 메시지를 채웁니다.
          for (let i = 0; i < this.problem.samples.length; i++) {
            this.runResultData.push('오류')
            this.outputdata.push(errMsg)
          }
          // 컴파일 에러 상태(전부 '오류')를 AI Hint 패널로 넘깁니다.
          this.fetchLLMHint('run', this.runResultData.map(() => -2))
        }).finally(() => {
          setTimeout(() => {
            this.running = false
            this.statusVisible = false
            this.submitting = false
          }, 3000)
        })
      },
      getRunResultLable (index) {
        if (this.runResultData[index]) {
          return '테스트 ' + (index + 1) + ' > ' + this.runResultData[index]
        } else {
          return '테스트 ' + (index + 1) + ' > '
        }
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
      },
      fetchLLMHint (mode, resultInfo) {
        this.llmHintVisible = true
        this.llmHintExpanded = true
        this.llmHintLoading = true
        this.llmHintText = ''
        this.llmChatMessages = []
        this.llmFollowUpInput = ''

        // 문제 설명 구성
        const problemDesc = [
          this.problem.description ? this.problem.description.replace(/<[^>]*>/g, '') : '',
          this.problem.input_description ? '입력: ' + this.problem.input_description.replace(/<[^>]*>/g, '') : '',
          this.problem.output_description ? '출력: ' + this.problem.output_description.replace(/<[^>]*>/g, '') : ''
        ].filter(Boolean).join('\n')

        // 샘플 입출력 구성
        let sampleInfo = ''
        if (this.problem.samples && this.problem.samples.length > 0) {
          sampleInfo = this.problem.samples.map((s, i) =>
            `예시 ${i + 1}:\n입력: ${s.input}\n기대 출력: ${s.output}`
          ).join('\n')
        }

        // 결과 정보 구성
        let resultDesc = ''
        if (mode === 'run') {
          const resultNames = { '-1': '오답', '0': '정답', '1': '시간초과', '2': '시간초과', '3': '메모리초과', '4': '런타임에러', '5': '시스템에러' }
          const details = resultInfo.map((r, i) => {
            const name = resultNames[String(r)] || '오류'
            const output = this.outputdata[i] || '(출력 없음)'
            const expected = this.problem.samples[i] ? this.problem.samples[i].output : '(알 수 없음)'
            return `테스트 ${i + 1}: ${name} (출력: ${output}, 기대: ${expected})`
          }).join('\n')
          resultDesc = details
        } else {
          const statusNames = { '-2': '컴파일 에러', '-1': '오답', '1': '시간초과', '2': '시간초과', '3': '메모리초과', '4': '런타임에러', '5': '시스템에러', '8': '부분정답' }
          resultDesc = '채점 결과: ' + (statusNames[String(resultInfo)] || '실패')
        }

        const userPrompt = `## 문제 설명\n${problemDesc}\n\n## 샘플 입출력\n${sampleInfo}\n\n## 제출한 코드 (${this.language})\n${this.code}\n\n## 실행 결과\n${resultDesc}`

        const systemMsg = { role: 'system', content: '당신은 프로그래밍 교육 조교입니다. 학생이 제출한 코드가 틀렸습니다. 반드시 아래 규칙을 지키세요:\n1. 절대로 정답 코드, 수정된 코드, 또는 문제를 풀 수 있는 코드 조각을 제공하지 마세요.\n2. 코드 블록(```)을 사용하여 코드를 직접 작성하지 마세요.\n3. 어디가 잘못되었는지 개념적 힌트와 방향만 제시하세요.\n4. 학생이 스스로 문제를 해결하도록 유도하세요.\n5. 한국어로 답변하세요.\n6. 답변은 간결하게 3~5문장으로 해주세요.' }
        const firstUserMsg = { role: 'user', content: userPrompt }

        this.llmConversationHistory = [systemMsg, firstUserMsg]

        this.streamLLMRequest([systemMsg, firstUserMsg])
      },
      buildLLMHintSessionTag () {
        const problemId = this.problem && this.problem.id ? this.problem.id : this.problemID_
        const contestId = this.contestID || 0
        if (!problemId) return ''
        return `[PROBLEM_HINT] p=${problemId} c=${contestId}`
      },
      async ensureLLMHintSession () {
        const tag = this.buildLLMHintSessionTag()
        if (!tag) return ''

        if (this.llmHintSessionId && this.llmHintSessionTag === tag) {
          return this.llmHintSessionId
        }

        if (this.llmHintSessionPromise) {
          return this.llmHintSessionPromise
        }

        this.llmHintSessionPromise = (async () => {
          const listRes = await api.getLLMChatSessions()
          const sessions = (listRes.data && listRes.data.data) || []
          let target = sessions.find(session => session.title === tag)

          if (!target) {
            const createRes = await api.createLLMChatSession({
              title: tag
            })
            target = createRes.data && createRes.data.data
          }

          if (!target || !target.id) {
            throw new Error('Failed to prepare LLM chat session')
          }

          this.llmHintSessionId = target.id
          this.llmHintSessionTag = tag
          return target.id
        })()

        try {
          return await this.llmHintSessionPromise
        } finally {
          this.llmHintSessionPromise = null
        }
      },
      sendFollowUpQuestion () {
        const question = this.llmFollowUpInput.trim()
        if (!question || this.llmHintLoading) return

        this.llmChatMessages.push({ role: 'user', content: question })
        this.llmConversationHistory.push({ role: 'user', content: question })
        this.llmFollowUpInput = ''
        this.llmHintLoading = true
        this.scrollChatToBottom()

        this.streamLLMRequest(this.llmConversationHistory)
      },
      async streamLLMRequest (messages) {
        this.llmHintLoading = true

        // 빈 assistant 메시지를 먼저 추가 (스트리밍으로 채워짐)
        const assistantMsg = { role: 'assistant', content: '' }
        this.llmChatMessages.push(assistantMsg)
        const msgIndex = this.llmChatMessages.length - 1
        this.scrollChatToBottom()

        try {
          const sessionId = await this.ensureLLMHintSession()
          if (!sessionId) {
            throw new Error('LLM session is not ready')
          }

          const systemMsg = (messages || []).find(msg => msg && msg.role === 'system' && typeof msg.content === 'string')
          const userMessages = (messages || []).filter(msg => msg && msg.role === 'user' && typeof msg.content === 'string')
          const latestUserContent = userMessages.length ? userMessages[userMessages.length - 1].content : ''

          // 초기 요청은 기존 형식을 유지하면서 system 지침을 함께 전달한다.
          const content = systemMsg && (messages || []).length <= 2
            ? `[시스템 지침]\n${systemMsg.content}\n\n[사용자 요청]\n${latestUserContent}`
            : latestUserContent

          if (!content || !content.trim()) {
            throw new Error('Empty LLM content')
          }

          const requestBody = {
            session_id: sessionId,
            content,
            max_tokens: 512,
            temperature: 0.7,
            stream: true
          }

          const csrfToken = getCookie('csrftoken')
          const response = await fetch('/api/llm/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder('utf-8')
          let buffer = ''
          let fullContent = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // SSE 형식 파싱: "data: {...}\n\n"
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data:')) continue
              const jsonStr = trimmed.slice(5).trim()
              if (jsonStr === '[DONE]') continue

              try {
                const chunk = JSON.parse(jsonStr)
                const delta = chunk.choices && chunk.choices[0] && chunk.choices[0].delta
                if (delta && delta.content) {
                  fullContent += delta.content
                  this.$set(this.llmChatMessages, msgIndex, { role: 'assistant', content: fullContent })
                  this.scrollChatToBottom()
                }
              } catch (e) {
                // JSON 파싱 실패 무시 (불완전한 청크)
              }
            }
          }

          // 대화 히스토리에 최종 응답 저장
          if (fullContent) {
            this.llmHintText = fullContent
            this.llmConversationHistory.push({ role: 'assistant', content: fullContent })
          } else if (!this.llmChatMessages[msgIndex].content) {
            this.$set(this.llmChatMessages, msgIndex, { role: 'assistant', content: '힌트를 생성하지 못했습니다. 다시 시도해주세요.' })
          }
        } catch (err) {
          console.error('LLM streaming error:', err)
          this.$set(this.llmChatMessages, msgIndex, { role: 'assistant', content: '힌트 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' })
        } finally {
          this.llmHintLoading = false
          this.scrollChatToBottom()
        }
      },
      scrollChatToBottom () {
        this.$nextTick(() => {
          const el = this.$refs.hintChatArea || this.$refs.hintChatAreaVertical
          if (el) el.scrollTop = el.scrollHeight
        })
      },
      renderMarkdown (text) {
        if (!text) return ''
        // HTML 특수문자 이스케이프
        const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

        // 펜스드 코드 블록 (```lang ... ```) — 완성된 블록
        let result = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
          const langLabel = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ''
          return `<div class="md-code-block">${langLabel}<pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`
        })

        // 스트리밍 중 아직 닫히지 않은 코드 블록 (```lang\ncode... 끝에 ``` 없음)
        result = result.replace(/```(\w*)\n([\s\S]*)$/g, (match, lang, code) => {
          const langLabel = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ''
          return `<div class="md-code-block">${langLabel}<pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`
        })

        // 인라인 코드 (`code`)
        result = result.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')

        // 굵은 텍스트 (**bold**)
        result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

        // 줄바꾼 처리
        result = result.replace(/\n/g, '<br>')

        return result
      },

      // obfuscateText (text) { // 랜덤 문자 삽입입
      //   let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
      //   return text.split('').map(() => randomChars[Math.floor(Math.random() * randomChars.length)]).join('')
      // },
      handleSampleCopy (text) {
        this.ignoreNextCopy = true // 🔥 이 플래그를 세워서 다음 copy 이벤트 무시
        // 직접 복사
        navigator.clipboard.writeText(text)
          .then(() => {
            this.$message.success(this.$t('m.Code_Copied'))
          })
          .catch(() => {
            this.$message.error(this.$t('m.Failed_to_copy'))
          })
        // 🔥 잠시 후 플래그 해제
        setTimeout(() => {
          this.ignoreNextCopy = false
        }, 50)
      },
      handleCopy (event) {
        if (this.ignoreNextCopy) {
          // ❗복사 버튼에서 발생한 copy 이벤트는 무시
          return
        }
        if (event.target.closest('#submit-code')) {
          return // 코드 입력 구간에서는 복사 방지 예외 처리
        }
        event.preventDefault() // 기본 복사 동작 방지
        const problems = [
          `설명\n\n2 ~ 9 사이의 값을 정수값을 입력받아 입력받은 수에 대한 구구단을 출력하는 프로그램을 작성하시오.\n정수에 대한 변수를 선언하고 변수(dan)에 입력값을 대입한다.\n입력값에 대한 변수를 '출력예시'와 같이 출력하시오.\n\n입력\n\n2 ~ 9 사이의 정수형 값을 입력받는다.\n입력 시 입력 문구는 작성하지 않는다.\n\n출력\n\n입력한 수에 해당하는 구구단을 출력한다.\n입력받은 값이 2 ~ 9 사이의 값이 아닌 경우 -1을 출력한다.\n즉, 입력한 값(dan)이 2보다 작거나 또는 9보다 큰 경우에는 -1을 출력한다.\n\n예시 입력 1 \n\n1\n예시 출력 1\n\n-1\n예시 입력 2 \n\n2\n예시 출력 2\n\n2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18`,
          `설명\n\n이름, 나이, 키를 입력받은 후 아래와 같이 정리하여 출력해주는 프로그램을 작성하시오. 키는 소수점까지 입력받을 수 있도록 하고, 출력할 때 키는 소수점 둘째 자리까지 표시하도록 한다.\n입력 예시\n\nhong gil dong\n22\n139.4\n출력 예시\n\nname:hong gil dong\nage:22years old\nheight:139.40cm\n\n입력\n\n임의의 이름, 나이, 키를 입력받는다.\n\n출력\n\n위 설명에 맞게 코드를 작성하고 출력한다.\n출력은 print()를 이용하여 출력한다.\n\n예시 입력 1 \n\nHong gil dong\n22\n139.4\n예시 출력 1\n\nname:Hong gil dong\nage:22years old\nheight:139.40cm\n예시 입력 2 \n\nLee jae huek\n25\n188.333\n예시 출력 2\n\nname:Lee jae huek\nage:25years old\nheight:188.33cm`,
          `설명\n\n점수를 키보드로부터 입력받아 80점 이상이면 A등급, 60점 이상이고 80점 미만이면 B등급, 60점 미만이면 C등급으로 출력하는 프로그램을 아래 설명과 입/출력 예시 참고 후 작성하시오.\n점수(score)에 대한 변수를 선언하고 변수에 입력값을 대입한다.\n변수에 저장된 입력값의 조건에 따라, '출력예시'와 같이 출력하시오.\n\n입력\n\n점수값 1개를 입력 받는다.\n입력 시 입력 문구는 작성하지 않는다.\n\n출력\n\n입력받은 점수에 따라 다음의 출력문을 출력한다.\n점수가 0 이하 또는 100을 초과하는 경우에는 -1을 출력한다.\n점수가 80점 이상인 경우 문자 'A'를 출력한다.\n점수가 60점 이상이고, 80점 미만인 경우 문자 'B'를 출력한다.\n점수가 60점 미만인 경우 문자 'C'를 출력한다.\n\n예시 입력 1 \n\n-13\n예시 출력 1\n\n-1\n예시 입력 2 \n\n100\n예시 출력 2\n\nA\n예시 입력 3 \n\n10\n예시 출력 3\n\nC\n예시 입력 4 \n\n-2\n예시 출력 4\n\n-1`
        ]
        const randomIndex = Math.floor(Math.random() * problems.length)
        const replacementText = problems[randomIndex]
        event.clipboardData.setData('text/plain', replacementText)
        this.$message.error({
          message: '⚠️페이지 내용을 복사하는 행위는 부정 행위로 의심될 수 있습니다. 로그 저장 완료',
          duration: 5000
        })
        this.antiData.copy += 1
      },
      // preventKeyCombinations (event) {
      //   if ((event.ctrlKey && event.key === 'p') ||
      //       (event.metaKey && event.key === 'p') ||
      //       (event.key === 'PrintScreen') ||
      //       (event.shiftKey && event.key === 's') ||
      //       (event.metaKey && event.shiftKey && event.key === 's') ||
      //       (event.metaKey && event.shiftKey) ||
      //       (event.altKey)) {
      //     // event.preventDefault()
      //     this.triggerBlurEffect()
      //     this.isBlurred = true
      //     // this.$message.warning('스크린샷 및 단축키가 차단되었습니다!')
      //   }
      // },
      // handleKeyUp (event) {
      //   // 특정 키 조합을 눌렀다가 떼면 블러 해제
      //   if (
      //     (event.key === 'PrintScreen') ||
      //     (event.altKey) ||
      //     (event.metaKey && event.shiftKey) ||
      //     (event.metaKey && event.shiftKey && event.key === 's')
      //   ) {
      //     this.clearBlurEffect()
      //     this.isBlurred = false
      //   }
      // },
      // handleScreenBlur () {
      //   this.triggerBlurEffect()
      //   this.isBlurred = true
      //   this.$message.error('⚠️ 창이 비활성화됨: 캡처 도구 실행 가능성 감지!')
      // },
      handleScreenFocus () {
        if (this.isBlurred) {
          // this.isBlurred = false
          // this.clearBlurEffect()
          // navigator.clipboard.writeText('스크린샷 차단').catch(() => console.warn('클립보드 초기화 실패'))
        }
        this.$message.error({
          message: '화면 전환 감지되었습니다. 로그 데이터 저장 완료',
          duration: 3000
        })
        setTimeout(() => {
          this.$message.error({
            message: '🚨화면을 캡처하면 캡처한 내용도 기록됩니다.',
            duration: 3000
          })
        }, 500)
        this.antiData.focusScreen += 1
      },
      triggerBlurEffect () {
        document.body.style.filter = 'blur(10px)'
      },
      clearBlurEffect () {
        document.body.style.filter = 'none'
      },
      handleRightClick (event) {
        event.preventDefault()
        // this.$message.warning('우클릭이 차단되었습니다.')
      },
      handleMainScroll () {
        if (this.showHintNotification) {
          this.showHintNotification = false
          if (this.scrollTimeout) clearTimeout(this.scrollTimeout)
        }
      },
      scrollToHint () {
        const el = document.getElementById('llm-hint') || document.querySelector('#llm-hint')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          this.showHintNotification = false
          // Open hint if closed
          this.llmHintExpanded = true
        }
      }
    },
    computed: {
      ...mapState('theme', ['isDarkMode']),
      currentTheme () {
        return this.isDarkMode ? 'monokai' : 'solarized'
      },
      paneHeight () {
        return this.dynamicHeight - 80
      },
      codeMirrorHeight () {
        return Math.max(this.paneHeight - 100, 400)
      },
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
          return {name: 'contest-submission-list', query: {problemID: this.problemID_}}
        } else {
          return {name: 'submission-list', query: {problemID: this.problem.id}}
        }
      }
    },
    beforeRouteLeave (to, from, next) {
      // 防止切换组件后仍然不断请求
      if (this.refreshStatus) {
        clearTimeout(this.refreshStatus)
      }

      this.$store.commit(types.CHANGE_CONTEST_ITEM_VISIBLE, {menu: true})
      storage.set(buildProblemCodeKey(this.problem._id, from.params.contestID), {
        code: this.code,
        language: this.language,
        theme: this.theme
      })

      const copiedDiff = this.antiData.copy - this.initialAntiData.copy
      const focusDiff = this.antiData.focusScreen - this.initialAntiData.focusScreen

      if (copiedDiff > 0 || focusDiff > 0) {
        this.logUserEvent(
          this.problem.id,
          this.rule_type,
          this.contestID,
          focusDiff,
          copiedDiff
        )
      }

      next()
    },
    watch: {
      llmHintVisible (val) {
        if (val) {
          // Show notification if hint becomes visible
          this.showHintNotification = true
          // Auto hide after 10s
          if (this.scrollTimeout) clearTimeout(this.scrollTimeout)
          this.scrollTimeout = setTimeout(() => {
            this.showHintNotification = false
          }, 10000)
        }
      },
      '$route' (newVal, oldVal) {
        if (oldVal.params.problemID) {
          storage.set(buildProblemCodeKey(oldVal.params.problemID, oldVal.params.contestID), {
            code: this.code,
            language: this.language,
            theme: this.theme
          })
        }

        if (this.refreshStatus) {
          clearTimeout(this.refreshStatus)
        }

        this.code = ''
        this.statusVisible = false
        this.submissionId = ''
        this.submitted = false
        this.result = { result: 9 }
        this.outputdata = []
        this.runResultData = {}
        this.running = false
        this.submitting = false
        this.llmHintVisible = false
        this.llmChatMessages = []
        this.llmFollowUpInput = ''
        this.llmConversationHistory = []
        this.llmHintSessionId = ''
        this.llmHintSessionTag = ''
        this.llmHintSessionPromise = null

        let problemCode = storage.get(buildProblemCodeKey(newVal.params.problemID, newVal.params.contestID))
        if (problemCode) {
          this.language = problemCode.language
          this.code = problemCode.code
          this.theme = problemCode.theme
        }

        this.init()
      },
      isDarkMode (newVal) {
      // 다크모드 변경 시 자동으로 테마를 바꾸도록 함
        this.onChangeTheme(this.currentTheme)
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
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
    }
    #problem-main-width {
      flex: 5;
      margin-right: 9px;
      overflow: scroll;
    }
    #problem-main-height {
      flex: auto;
      margin-right: 18px;
    }
    #problem-source {
      flex: 7;
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
      color: var(--problem-text-color);
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
        border: 1px solid var(--problem-example-box-color);
      }
    }
  }

  #submit-code {
    background-color: var(--panelBackground);
    color: var(--text-color);
    .status {
      float: left;
      span {
        margin-right: 10px;
        margin-left: 10px;
      }
    }
    .run-btn {
      background-color: #5DB85B;
      float: right;
      color: white;
      margin-left: 5px;
      margin-right: 5px;
    }
    .run-btn:disabled {
      background-color: #f7f7f7;
      color: #bbbec4;
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
    background-color: var(--panelBackground);
    margin-bottom: 5px;
    margin-top: 5px;
    color: var(--verticalMenu-item-color);
    ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
      li {
        border-bottom: 1px dotted var(--list-border-bottom);
        margin-bottom: 5px;
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
    background-color: var(--panelBackground);
    color: var(--verticalMenu-item-color);
    .echarts {
      height: 180px;
      width: 100%;
    }
    #detail {
      color: var(--verticalMenu-item-color);
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
    background-color: var(--panelBackground);
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
    background-color: var(--panelBackground);
    display: flex;
    flex-direction: column;
    height: 100%;
    .sample {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 10px;
      border: 1px solid #ccc;
      margin: -1px;
      max-height: 48vh;
    }
    .samples {
      cursor: pointer;
    }
    .toggle-icon{
      color: #3091f2;
      margin-bottom: 1px;
    }
    .title {
      font-weight: bold;
      color: #3091f2;
      margin-left: 8px;
    }
    .sub-title {
      font-weight: bold;
      color: #3091f2;
      margin-left: 3px;
    }
    .result-tap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex: none;
    }
    .result-tap .sub-title {
      margin-bottom: 3px;
      margin-right: 5px;
    }
    .run-code-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--panelBackground);
    }
    .input-output-container {
      background-color: var(--panelBackground);
      display: flex;
      flex: 1;
      height: auto;
      max-height: 250px;
    }
    .input-container,
    .output-container,
    .sample-output-container {
      width: 50%;
      height: 100%;
      padding: 10px;
      display: flex;
      flex-direction: column;
    }
    .result-container {
      display: flex;
      width: auto;
      height: auto;
      flex-wrap: wrap;
    }
    .output-container .text-box,
    .input-container .text-box,
    .sample-output-container .text-box {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: auto;
    }
    .result-container .text-box {
      border: none;
      overflow: auto;
      margin-left: 5px;
      display: inline-block;
      font-weight: 'bold';
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
    }
  }

  #llm-hint {
    background-color: var(--panelBackground);
    border: 1px solid #ffc107;
    border-radius: 8px;
    margin-top: 10px;
    margin-right: 18px;
    transition: all 0.3s ease;
    flex: 0 0 100%;
    width: 100%;

    .hint-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: 4px 0;
      user-select: none;
    }
    .hint-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hint-icon {
      font-size: 22px;
    }
    .hint-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-color);
    }
    .hint-toggle {
      color: var(--text-color);
      font-size: 16px;
    }
    .hint-body {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #ffc107;
    }
    .hint-chat-area {
      max-height: 400px;
      overflow-y: auto;
      padding: 4px 0;
    }
    .chat-bubble {
      margin-bottom: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      .chat-role {
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .chat-msg-body {
        font-family: 'Noto Sans KR', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        line-height: 1.7;
        word-wrap: break-word;
      }
    }
    .chat-assistant {
      background: rgba(128,128,128,0.1);
      border: 1px solid #ffe082;
      .chat-role { color: #e65100; }
      .chat-msg-body { color: var(--text-color); }
    }
    .chat-user {
      background: rgba(128,128,128,0.2);
      border: 1px solid #ffcc80;
      margin-left: 20%;
      .chat-role { color: #1565c0; }
      .chat-msg-body { color: var(--text-color); }
    }
    .md-code-block {
      position: relative;
      margin: 8px 0;
      border-radius: 6px;
      overflow: hidden;
      background: #263238;
      border: 2px solid #37474f;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      .code-lang {
        display: block;
        padding: 4px 12px;
        font-size: 11px;
        color: #80cbc4;
        background: #1a2327;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #37474f;
      }
      pre {
        margin: 0;
        padding: 12px;
        overflow-x: auto;
        background: transparent;
        border: none;
      }
      code {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 13px;
        line-height: 1.5;
        color: #eeffff;
        white-space: pre;
        background: transparent;
      }
    }
    .md-inline-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      background: rgba(0,0,0,0.08);
      color: #c62828;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .hint-loading {
      text-align: center;
      padding: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      span {
        color: #795548;
        font-size: 13px;
      }
    }
    .hint-input-area {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed #ffe082;
    }
  }
  .ai-hint-notification {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    background: #ff9900;
    padding: 12px 24px;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    color: white;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: bounce 1s infinite alternate;
  }
  .notify-close {
    margin-left: 10px;
    cursor: pointer;
    font-size: 16px;
  }
  @keyframes bounce {
    from { transform: translate(-50%, 0); }
    to { transform: translate(-50%, -10px); }
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }

  /* ====== New Layout System ====== */
  .problem-layout-container {
    display: flex;
    width: 100%;
    height: calc(100vh - 60px);
    overflow: hidden;
    background-color: var(--background-color);
  }

  .pane {
    height: 100%;
    border-right: 1px solid #dcdfe6;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.3s ease, flex 0.3s ease;
  }

  /* Dark mode border adjustment */
  body[theme='dark'] .pane {
    border-right-color: #4c4e52;
  }

  .pane:last-child {
    border-right: none;
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

  body[theme='dark'] .pane-header {
    border-bottom-color: #4c4e52;
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

  body[theme='dark'] .pane-collapsed:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .pane-collapsed-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    height: 100%;
    color: var(--text-color);
  }

  .vertical-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    white-space: nowrap;
    font-weight: bold;
    letter-spacing: 2px;
    margin-top: 15px;
  }

  /* Specific Pane Sizes */
  .menu-pane {
    width: 220px;
    flex: none;
    background-color: var(--panelBackground);
  }

  .problem-pane {
    flex: 3.5;
    min-width: 350px;
  }

  .code-pane {
    flex: 6.5;
    min-width: 500px;
  }

  .ai-pane {
    width: 350px;
    flex: none;
    background-color: var(--panelBackground);
  }

  /* Override existing components spacing inside panes */
  .problem-layout-container .ivu-card,
  .problem-layout-container .ivu-panel {
    margin-bottom: 10px;
  }

  .problem-list-menu {
    list-style: none;
    padding: 0;
    margin: 0;
    background-color: var(--background-color);
    max-height: 200px;
    overflow-y: auto;
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
</style>
