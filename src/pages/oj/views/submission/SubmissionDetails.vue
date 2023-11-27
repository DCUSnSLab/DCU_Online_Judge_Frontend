<template>
  <Row type="flex" justify="space-around">
    <Col :span="20" id="status">
      <Alert :type="status.type" showIcon>
        <span class="title">{{$t('m.' + status.statusName.replace(/ /g, "_"))}}</span>
        <div slot="desc" class="content">
          <template v-if="isCE">
            <pre>{{submission.statistic_info.err_info}}</pre>
          </template>
          <template v-else>
            <span>{{$t('m.Time')}}: {{submission.statistic_info.time_cost | submissionTime}}</span>
            <span>{{$t('m.Memory')}}: {{submission.statistic_info.memory_cost | submissionMemory}}</span>
            <span>{{$t('m.Lang')}}: {{submission.language}}</span>
            <span>{{$t('m.Author')}}: {{submission.username}}</span>
          </template>
        </div>
      </Alert>
    </Col>

    <!--后台返info就显示出来， 权限控制放后台 -->
    <Col v-if="submission.info && !isCE" :span="20">
      <Table stripe :loading="loading" :disabled-hover="true" :columns="columns" :data="submission.info.data"></Table>
    </Col>

    <Col :span="20">
      <Highlight :code="submission.code" :language="submission.language" :border-color="status.color"></Highlight>
    </Col>
    <Col v-if="submission.can_unshare" :span="20">
      <div id="share-btn">
        <!--
        <Button v-if="submission.shared"
                type="warning" size="large" @click="shareSubmission(false)">
          {{$t('m.UnShare')}}
        </Button>
        <Button v-else
                type="primary" size="large" @click="shareSubmission(true)">
          {{$t('m.Share')}}
        </Button>
        -->

        <el-button type="primary" v-b-toggle.sidebar-right>{{$t('m.qna')}}</el-button>
        <b-sidebar id="sidebar-right" title="Sidebar" width="500px" no-header right shadow>
          <div class="sidebar" id="wrapper">
            <el-button class="sidebar-margin" v-b-toggle.sidebar-right icon="el-icon-close" circle></el-button>
            <h2 class="sidebar-header">{{$t('m.qna')}}</h2>
            <hr/>
            <div class="sidebar-content">
              <br/>
              <span>내용</span>
              <el-input class="sidebar-content-margin" placeholder="제목을 입력해주세요." v-model="qnaContent.title"></el-input>
              <Simditor class="sidebar-content-margin" v-model="qnaContent.content"></Simditor>
              <el-button class="sidebar-margin d-block mr-0 ml-auto" type="primary" v-b-toggle.sidebar-right @click.native="QnAWrite">저장하기</el-button>
            </div>
          </div>
        </b-sidebar>

        <b-sidebar id="sidebar-airight" title="Sidebar" width="100%" no-header right shadow v-bind:visible="sidebarVisible">
          <div class="sidebar" id="wrapper">
            <p class="float-right">commented by chatGPT</p>
            <h2 class="sidebar-header">{{$t('m.aianswer')}}</h2>
            <hr/>
            <div class="sidebar-content">
              <br/>
              {{AIrespone}}
            </div>
            <el-button class="fl-right" type="primary" b-sidebar id="close" v-on:click="toggleSidebar"
                    style="margin: auto; display: block">닫기</el-button>
          </div>
        </b-sidebar>

        <!--
        <el-Button
                   v-on:click="toggleSidebar"
                @click.native="askAI"
                type="primary">
          <span>{{$t('m.callai')}}</span>
        </el-Button>
        -->
      </div>
    </Col>
  </Row>

</template>

<script>
  import api from '@oj/api'
  import {JUDGE_STATUS} from '@/utils/constants'
  import utils from '@/utils/utils'
  import Highlight from '@/pages/oj/components/Highlight'
  import ProblemQnA from '@oj/views/qna/AddProblemQnA.vue'
  import { SidebarPlugin } from 'bootstrap-vue'
  import 'bootstrap-vue/dist/bootstrap-vue.css'
  import Vue from 'vue'
  import Simditor from '../../components/Simditor.vue'
  Vue.use(SidebarPlugin)
  Simditor.locale = 'en-US'

  export default {
    name: 'submissionDetails',
    components: {
      Highlight,
      ProblemQnA,
      Simditor
    },

    data () {
      return {
        sidebarVisible: false,
        qna: false,
        aiaskbutton: true,
        input: '',
        lectureID: '',
        qnaContent: {
          title: '',
          content: ''
        },
        myStyle: {
          backgroundColor: 'white'
        },
        columns: [
          {
            title: this.$i18n.t('m.ID'),
            align: 'center',
            type: 'index'
          },
          {
            title: this.$i18n.t('m.Status'),
            align: 'center',
            render: (h, params) => {
              return h('Tag', {
                props: {
                  color: JUDGE_STATUS[params.row.result].color
                }
              }, this.$i18n.t('m.' + JUDGE_STATUS[params.row.result].name.replace(/ /g, '_')))
            }
          },
          {
            title: this.$i18n.t('m.Memory'),
            align: 'center',
            render: (h, params) => {
              return h('span', utils.submissionMemoryFormat(params.row.memory))
            }
          },
          {
            title: this.$i18n.t('m.Time'),
            align: 'center',
            render: (h, params) => {
              return h('span', utils.submissionTimeFormat(params.row.cpu_time))
            }
          }
        ],
        submission: {
          result: '0',
          code: '',
          info: {
            data: []
          },
          statistic_info: {
            time_cost: '',
            memory_cost: ''
          }
        },
        isConcat: false,
        loading: false,
        AIrespone: '답변을 작성하고 있습니다. 잠시만 기다려 주세요. 10초~30초 정도 소요 됩니다.'
      }
    },
    mounted () {
      this.getSubmission()
    },
    methods: {
      getLectureID () {
        let data = { contestID: this.submission.contest }
        console.log(this.submission.contest)
        api.getlectureid(data).then(res => {
          this.lectureID = res.data.data
        })
      },
      goContestQnA () {
        this.$router.push({
          name: 'constest-problem-qna',
          // path: '/CourseList/:lectureID/:contestID/question',
          params: {
            lectureID: this.lectureID,
            problemID: this.submission.problem,
            contestID: this.submission.contest
          }
        })
      },
      QnAWrite () {
        // console.log(this.submission)
        let data = { 'id': this.submission.id, 'contestID': this.submission.contest, 'problemID': this.submission.problem, 'content': this.qnaContent }
        api.writeQnAPost(data).then(res => { })
        this.goContestQnA()
      },
      askAI () {
        let params = {contestID: this.contestID,
          LectureID: this.LectureID,
          problemID: this.$route.params.problemID,
          id: this.submission.id,
          code: this.submission.code,
          content: this.qnaContent,
          submission: this.submission.info,
          status: this.status}
        // let data = { 'id': this.submission.id, 'code': this.submission.code,
        //   'contestID': this.submission.contest, 'problemID': this.submission.problem, 'content': this.qnaContent }
        console.log('askAI called')
        api.askQuAAI(params).then(res => {
          console.log(params)
          this.AIrespone = res.data.data
          console.log(res)
        })
      },
      // getAIresponse () {
      //   let data = { 'id': this.submission.id, 'contestID': this.submission.contest, 'problemID': this.submission.problem }
      //   api.getAIresponse(data).then(res => {
      //     this.AIrespone = res.data.data
      //   })
      //   console.log(this.AIrespone)
      // },
      getSubmission () {
        this.loading = true
        api.getSubmission(this.$route.params.id).then(res => {
          this.loading = false
          let data = res.data.data
          if (data.info && data.info.data && !this.isConcat) {
            // score exist means the submission is OI problem submission
            if (data.info.data[0].score !== undefined) {
              this.isConcat = true
              const scoreColumn = {
                title: this.$i18n.t('m.Score'),
                align: 'center',
                key: 'score'
              }
              this.columns.push(scoreColumn)
              this.loadingTable = false
            }
            if (this.isAdminRole) {
              this.isConcat = true
              const adminColumn = [
                {
                  title: this.$i18n.t('m.Real_Time'),
                  align: 'center',
                  render: (h, params) => {
                    return h('span', utils.submissionTimeFormat(params.row.real_time))
                  }
                },
                {
                  title: this.$i18n.t('m.Signal'),
                  align: 'center',
                  key: 'signal'
                }
              ]
              this.columns = this.columns.concat(adminColumn)
            }
          }
          this.submission = data
          this.getLectureID()
        }, () => {
          this.loading = false
        })
      },
      shareSubmission (shared) {
        let data = {id: this.submission.id, shared: shared}
        api.updateSubmission(data).then(res => {
          this.getSubmission()
          this.$success(this.$i18n.t('m.Succeeded'))
        }, () => {
        })
      },
      toggleSidebar () {
        this.sidebarVisible = !this.sidebarVisible
        this.AIrespone = '답변을 작성하고 있습니다. 잠시만 기다려 주세요. 10초~30초 정도 소요 됩니다.'
      }

    },
    computed: {
      status () {
        return {
          type: JUDGE_STATUS[this.submission.result].type,
          statusName: JUDGE_STATUS[this.submission.result].name,
          color: JUDGE_STATUS[this.submission.result].color
        }
      },
      isCE () {
        return this.submission.result === -2
      },
      isAdminRole () {
        return this.$store.getters.isAdminRole
      }
    }
  }
</script>

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

  pre {
    border: none;
    background: none;
  }

</style>
