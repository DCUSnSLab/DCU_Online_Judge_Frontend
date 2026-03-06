<template>
  <div>
    <Panel id="lecture-card" shadow>
      <div slot="title"><b>{{$t('m.DCUCode_qna') }}</b>
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
                  <el-tag size="mini" v-else>{{$t('m.Public_Questions')}}</el-tag>
                  <el-tag size="mini" v-if="!(LectureID === undefined)">{{ qna.problem.contest.lecture_title }}</el-tag>
                  <el-tag size="mini" type="success" v-if="qna.solved">Solved</el-tag>
                </el-col>
                <el-col :span="1">
                  <i class="el-icon-chat-dot-round">&nbsp;{{qna.comment}}</i>
                </el-col>
              </el-row>
            </div>
            <h2>
              <a class="article-title" @click="handleRoute(qna.id)" v-if="!(qna.author.realname === $t('m.Admin_Author'))">{{ qna.title }}</a>
              <a class="article-title" v-else>{{ qna.title }}</a>
            </h2>
            <br/>
            <div class="article-content" v-html="qna.content" v-if="!(qna.author.realname === $t('m.Admin_Author'))" @click="handleRoute(qna.id)"></div>
            <div class="article-content" v-html="qna.content" v-else></div>
          </el-card>

          <el-row :gutter="24">
            <el-col :span="21">
              <div class="panel-options">
                <el-pagination
                  class="page"
                  layout="prev, pager, next"
                  @current-change="pushRouter"
                  :page-size="limit"
                  :total="total"
                  :current-page.sync="query.page">
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
            <span>{{$t('m.Contents') }}</span>
            <el-input class="sidebar-content-margin" :placeholder="$t('m.Please_enter_subject')" v-model="qnaContent.title"></el-input>
            <Simditor class="sidebar-content-margin" v-model="qnaContent.content"></Simditor>
            <el-button type="primary" v-b-toggle.sidebar-right @click.native="QnAWrite">{{$t('m.Save') }}</el-button>
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
            <span> {{$t('m.GPT_Placeholder')}} <br/></span>
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
  import utils from '@/utils/utils'
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
        total: 0,
        query: {
          page: parseInt(this.$route.query.page) || 1
        }
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
        this.query.page = parseInt(this.$route.query.page) || 1
        if (this.query.page < 1) {
          this.query.page = 1
        }
        if ((this.$route.name === 'constest-problem-qna' || this.$route.name === 'lecture-contest-qna' || this.$route.name === 'contest-qna')) {
          // this.routeName = true
          // params = {LectureID: this.LectureID, visible: false}
          params = {contestID: this.contestID,
            LectureID: this.LectureID,
            offset: (this.query.page - 1) * this.limit,
            limit: this.limit,
            visible: false}
        } else if (this.$route.name === 'constest-problem-public-qna') {
          params = {contestID: this.contestID,
            LectureID: this.LectureID,
            problemID: this.$route.params.problemID,
            offset: (this.query.page - 1) * this.limit,
            limit: this.limit,
            visible: false}
        } else {
          params = {all: 'all',
            visible: false,
            offset: (this.query.page - 1) * this.limit,
            limit: this.limit}
        }
        // this.contestID = this.$route.params.contestID
        // let params = {contestID: this.contestID, visible: false}
        api.getQnAPost(params).then(res => {
          this.qnaList = res.data.data.results
          // if (this.LectureID === undefined) {
          if ((this.$route.name === 'constest-problem-qna' || this.$route.name === 'lecture-contest-qna' || this.$route.name === 'contest-qna')) {
            this.qnaList.unshift({
              'author': {'realname': this.$t('m.Admin_Author')},
              'problem': {'title': this.$t('m.QnA_Private_Title'), 'contest': {lecture_title: undefined}},
              'content': this.$t('m.QnA_Private_Notice')
            })
          } else if (this.$route.name === 'constest-problem-public-qna') {
            this.qnaList.unshift({
              'author': {'realname': this.$t('m.Admin_Author')},
              'problem': {'title': this.$t('m.QnA_Public_Title'), 'contest': {lecture_title: undefined}},
              'content': this.$t('m.QnA_Public_Notice')
            })
          } else {
            this.qnaList.unshift({
              'author': {'realname': this.$t('m.Admin_Author')},
              'problem': {'title': this.$t('m.QnA_Public_Title'), 'contest': {lecture_title: undefined}},
              'content': this.$t('m.QnA_General_Notice')
            })
          }
          this.total = res.data.data.total
        })
        this.$Loading.finish()
      },
      pushRouter () {
        this.$router.push({
          name: this.$route.name,
          query: utils.filterEmptyValue(this.query)
        })
        this.getLectureList()
      },
      handleTagsVisible (value) {
        let params = {}
        if ((this.$route.name === 'constest-problem-qna' || this.$route.name === 'lecture-contest-qna' || this.$route.name === 'contest-qna')) {
          // this.routeName = true
          // params = {LectureID: this.LectureID, visible: false}
          params = {contestID: this.contestID,
            LectureID: this.LectureID,
            offset: (this.query.page - 1) * this.limit,
            limit: this.limit,
            visible: value}
        } else {
          params = {all: 'all',
            visible: value,
            offset: (this.query.page - 1) * this.limit,
            limit: this.limit}
        }
        api.getQnAPost(params).then(res => {
          this.qnaList = res.data.data.results
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
      getLectureList () {
        let params = {}
        this.loading = true
        if ((this.$route.name === 'constest-problem-qna' || this.$route.name === 'lecture-contest-qna' || this.$route.name === 'contest-qna')) {
          // this.routeName = true
          // params = {LectureID: this.LectureID, visible: false}
          params = {offset: (this.query.page - 1) * this.limit,
            LectureID: this.LectureID,
            contestID: this.contestID,
            limit: this.limit,
            visible: false}
        } else {
          params = {all: 'all',
            visible: false,
            limit: this.limit,
            offset: (this.query.page - 1) * this.limit}
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
    color: var(--text-color); 
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
    background-color: var(--qna-card-backgound);
    color: var(--qna-text-color);
    border: 1px solid var(--qna-card-border-color);
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
