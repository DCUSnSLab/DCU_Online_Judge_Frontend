<template>
  <div>
    <Panel id="lecture-card" shadow>
      <div slot="title"><b>DCU Code 질문/답변</b>
        <i-switch class="switch" size="large" @on-change="handleTagsVisible">
          <span slot="open">{{$t('m.Solved')}}</span>
          <span slot="close">{{$t('m.Solved')}}</span>
        </i-switch>
      </div>

      <el-row>
        <el-col>
          <el-card class="box-card" v-for="qna in qnaList">
            <div slot="header" class="clearfix">
              <el-row :gutter="24">
                <el-col :span="23">
                  <a class="mr-2" href="#">{{ qna.author.realname }}</a>
                  <small class="text-muted">{{ qna.date_posted | localtime('YYYY-M-D HH:mm')}}</small>
                  <el-tag size="mini" v-if="qna.problem">{{ qna.problem.title }}</el-tag>
                  <el-tag size="mini" v-else>공개 질문</el-tag>
                  <el-tag size="mini" v-if="!(LectureID === undefined)">{{ qna.problem.contest.lecture_title }}</el-tag>
                  <el-tag size="mini" type="success" v-if="qna.solved">Solved</el-tag>
                </el-col>
                <el-col :span="1">
                  <i class="el-icon-chat-dot-round">&nbsp;{{qna.comment}}</i>
                </el-col>
              </el-row>
            </div>
            <h2>
              <a class="article-title" @click="handleRoute(qna.id)" v-if="!(qna.author.realname === '관리자')">{{ qna.title }}</a>
              <a class="article-title" v-else>{{ qna.title }}</a>
            </h2>
            <br/>
            <div class="article-content" v-html="qna.content" v-if="!(qna.author.realname === '관리자')" @click="handleRoute(qna.id)"></div>
            <div class="article-content" v-html="qna.content" v-else></div>
          </el-card>

          <el-row :gutter="24">
            <el-col :span="21">
              <div class="panel-options">
                <el-pagination
                  class="page"
                  layout="prev, pager, next"
                  @current-change="currentChange"
                  :total="total" :pageSize="limit">
                </el-pagination>
              </div>
            </el-col>
            <el-col :span="3" v-if="!LectureID">
              <el-button type="primary" v-b-toggle.sidebar-right>{{$t('m.qa')}}</el-button>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
      <!--
      Todo Update
      -->
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
            <el-button type="primary" v-b-toggle.sidebar-right @click.native="QnAWrite">저장하기</el-button>
          </div>
        </div>
      </b-sidebar>

      <b-sidebar id="sidebar-airight" title="Sidebar" width="500px" no-header right shadow>
        <div class="sidebar" id="wrapper">
          <el-button class="sidebar-margin" v-b-toggle.sidebar-right icon="el-icon-close" circle></el-button>
          <h2 class="sidebar-header">{{$t('m.aianswer')}}</h2>
          <hr/>
          <div class="sidebar-content">
            <br/>
            <span>chat GPT 3.5 Turbo</span>
            <br/>
            <span> 여기에 GPT의 답변을 출력 <br/></span>
            <span> ... <br/></span>
            <span> ... <br/></span>
            <span> ... <br/></span>
            <span> ... <br/></span>
            <span> ... <br/></span>
            <span> ... <br/></span>
            <span> ... <br/></span>
          </div>
        </div>
      </b-sidebar>
      <!-- -->
    </Panel>
  </div>
</template>

<script>
  import api from '../../api.js'
  import { SidebarPlugin } from 'bootstrap-vue'
  import 'bootstrap-vue/dist/bootstrap-vue.css'
  import Vue from 'vue'
  import Simditor from '../../components/Simditor.vue'
  Vue.use(SidebarPlugin)

  export default {
    name: 'ProblemQnA',
    components: {
      Simditor
    },
    data () {
      return {
        test_probrem: [{'name': 'user1', 'title': 'test qa 1', 'date': 'September 08, 2020', 'Content': 'test1', 'Comment': 2}, {'name': 'user2', 'date': 'September 07, 2020', 'title': 'test qa 2', 'Content': 'test2', 'Comment': 3}],
        qnaList: {},
        tags: ['JavaScript', 'Java', 'Ruby', 'Python'],
        qnaContent: {
          title: '',
          content: ''
        },
        routeName: false,
        LectureID: '',
        problemID: '',
        contestID: '',
        isEmpty: false,
        limit: 5,
        total: 0
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      init () {
        this.$Loading.start()
        let params = ''
        this.contestID = this.$route.params.contestID
        this.LectureID = this.$route.params.lectureID
        console.log(this.LectureID)
        if (this.$route.name === 'constest-problem-qna') {
          // this.routeName = true
          // params = {LectureID: this.LectureID, visible: false}
          params = {contestID: this.contestID,
            LectureID: this.LectureID,
            offset: 0,
            limit: this.limit,
            visible: false}
        } else if (this.$route.name === 'constest-problem-public-qna') {
          params = {contestID: this.contestID,
            LectureID: this.LectureID,
            problemID: this.$route.params.problemID,
            offset: 0,
            limit: this.limit,
            visible: false}
        } else {
          params = {all: 'all',
            visible: false,
            offset: 0,
            limit: this.limit}
        }
        // this.contestID = this.$route.params.contestID
        // let params = {contestID: this.contestID, visible: false}
        api.getQnAPost(params).then(res => {
          console.log(res)
          this.qnaList = res.data.data.results
          // if (this.LectureID === undefined) {
          if (this.$route.name === 'constest-problem-qna') {
            this.qnaList.unshift({
              'author': {'realname': '관리자'},
              'problem': {'title': '비공개 질문&답변', 'contest': {lecture_title: undefined}},
              'content': '안녕하세요. DCU Code 관리자 입니다.<br/>본 과목 질문 페이지에서는 실습, 과제에 대하여 질문하는 페이지입니다. <br/>문제 / 오류 내역 란에서 조교에게 질문하기 버튼을 통해 질문 할 수 있으며, 자신이 마지막으로 작성한 제출 내역이 자동으로 기입됩니다.</br><br/><b>본 게시판의 경우 비공개 게시판이므로 본인의 게시글만 조회 할 수 있습니다.</b><br/>감사합니다.'
            })
          } else if (this.$route.name === 'constest-problem-public-qna') {
            this.qnaList.unshift({
              'author': {'realname': '관리자'},
              'problem': {'title': '공개 질문&답변', 'contest': {lecture_title: undefined}},
              'content': '안녕하세요. DCU Code 관리자 입니다.<br/>본 과목 질문 페이지에서는 실습, 과제에 대하여 질문 내용 중 일부를 공개하는 페이지입니다. <br/>교수/조교와 질답 간의 진행한 QnA 중 학생들의 문제를 푸는 도중 발생하는 문제에 대하여 참고가 가능하며, 풀이 코드가 공개되지 않을 경우 <br/><b>교수/조교 판단에 따라 해당 페이지에 공개됩니다.</b></br><br/>감사합니다.'
            })
          } else {
            this.qnaList.unshift({
              'author': {'realname': '관리자'},
              'problem': {'title': '공개 질문&답변', 'contest': {lecture_title: undefined}},
              'content': '안녕하세요. DCU Code 관리자 입니다.<br/>본 공개 질문 페이지에서는 프로그래밍 문법 등에 대하여 질문하는 페이지이며, <b>자신이 푼 실습, 과제 코드 공유가 금지되어 있습니다.</b><br/>과제, 실습관련 질문은 해당 과목 페이지 질문을 이용해주세요.<br/><b>코드 공유시 미통보 삭제됩니다.</b><br/>감사합니다.'
            })
          }
          console.log(this.qnaList)
          this.total = res.data.data.total
        })
        this.$Loading.finish()
      },
      handleTagsVisible (value) {
        let params = {}
        if (this.$route.name === 'constest-problem-qna') {
          // this.routeName = true
          // params = {LectureID: this.LectureID, visible: false}
          params = {contestID: this.contestID,
            LectureID: this.LectureID,
            offset: 0,
            limit: this.limit,
            visible: value}
        } else {
          params = {all: 'all',
            visible: value,
            offset: 0,
            limit: this.limit}
        }
        api.getQnAPost(params).then(res => {
          this.qnaList = res.data.data.results
          console.log(res.data.data.results)
          this.total = res.data.data.total
        })
      },
      QnAWrite () {
        // console.log(this.submission)
        let data = { 'content': this.qnaContent, 'private': false }
        api.writeQnAPost(data).then(res => {
          this.qnaList.push(res.data.data)
        })
      },
      handleRoute (route) {
        console.log(this.$route)
        // :route="{name: 'constest-problem-qna-detail', params: {}}
        if (this.$route.name === 'problem-qna-list') {
          this.$router.push({name: 'problem-qna-detail', params: {questionID: route}})
        } else {
          this.$router.push({name: 'constest-problem-qna-detail', params: {questionID: route}})
        }
      },
      currentChange (page) {
        this.currentPage = page
        this.getLectureList(page)
      },
      getLectureList (page) {
        let params = {}
        this.loading = true
        if (this.$route.name === 'constest-problem-qna') {
          // this.routeName = true
          // params = {LectureID: this.LectureID, visible: false}
          params = {offset: (page - 1) * this.limit,
            LectureID: this.LectureID,
            contestID: this.contestID,
            limit: this.limit,
            visible: false}
        } else {
          params = {all: 'all',
            visible: false,
            limit: this.limit,
            offset: (page - 1) * this.limit}
        }
        api.getQnAPost(params).then(res => {
          this.loading = false
          this.qnaList = res.data.data.results
          this.total = res.data.data.total
        }).catch(() => {
        })
      }
    },
    computed: {
    }
  }
</script>
<style>
  body {
    color: #333333;
    margin-top: 5rem;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #444444;
  }

  ul {
    margin: 0;
  }
  .site-header .navbar-nav .nav-link {
    color: #cbd5db;
  }

  .site-header .navbar-nav .nav-link:hover {
    color: #ffffff;
  }

  .site-header .navbar-nav .nav-link.active {
    font-weight: 500;
  }

  .content-section {
    background: #ffffff;
    padding: 10px 20px;
    border: 1px solid #dddddd;
    border-radius: 3px;
    margin-bottom: 20px;
  }

  .article-title {
    color: #444444;
  }

  a.article-title:hover {
    color: #428bca;
    text-decoration: none;
  }

  .article-content {
    white-space: pre-line;
  }

  .article-metadata a:hover {
    color: #333;
    text-decoration: none;
  }
  .switch {
    float: right;
  }
  .el-button {
    margin-bottom: 10px;
    margin-right: 10px;
  }

  .box-card {
    margin-left: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
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
  pre {
    border: none;
    background: none;
  }
</style>
