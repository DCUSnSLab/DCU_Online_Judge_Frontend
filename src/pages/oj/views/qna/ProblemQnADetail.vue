<template>
  <div>
    <Panel id="lecture-card" shadow>
      <div slot="title"><b>{{$t('m.DCUCode_qna') }}</b></div>
			<el-row>
        <el-col>
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <el-row :gutter="24">
                <el-col :span="17">
                  <a class="mr-2" href="#" v-if="qnaList.author.realname">{{ qnaList.author.realname }}</a>
                  <small class="text-muted" v-if="qnaList.date_posted">{{ qnaList.date_posted | localtime('YYYY-M-D HH:mm')}}</small>
                  <el-tag size="mini" v-if="qnaList.problem">{{ qnaList.problem.contest.lecture_title }}</el-tag>
                  <el-tag size="mini" v-if="qnaList.problem">{{ qnaList.problem.title }}</el-tag>
                  <el-tag size="mini" type="success" v-if="qnaList.solved">Solved</el-tag>
                </el-col>
                <div v-if="isAdmin || isSemiAdmin">
                  <el-col :span="7">
                    <el-switch
                      v-model="openQnA"
                      @change="changeQnA2OpenQnA"
                      :active-text="$t('m.Enable_public_questions')"
                      :inactive-text="$t('m.Disable_public_questions')"
                      active-color="#13ce66"
                      inactive-color="#ff4949">
                    </el-switch>
                  </el-col>
                </div>
              </el-row>
            </div>
            <h2 class="article-title">{{ qnaList.title }}</h2>
	          <br/>
            <div class="article-content" v-html="qnaList.content"></div>
            <br/>
            <div v-if="qnaList.submission">
              <a @click="dialogVisible = true">{{$t('m.View_Problem_detail') }}</a><br/> <br/>
              <a @click="showDetailCode">{{$t('m.View_submit_code') }}</a>
              <div v-if="detailCode">
                <submission-details :submissionID.sync="qnaList.submission.id"></submission-details>
              </div>
            </div>
	          <hr/>
            <div class="d-block mr-0 ml-auto">
              <el-button @click="deletePost()">{{$t('m.qna_delete') }}</el-button>
              <el-button @click="solvedQnA" v-if="!isSemiAdmin">{{$t('m.qna_solved') }}</el-button>
              <!--
              <el-button v-if=isAdmin @click="solvedQnA">해결 완료</el-button>
              <el-button v-else disabled @click="solvedQnA">해결 완료</el-button>
              -->
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="21">
          <h3 class="box-card">{{$t('m.Answer') }}</h3>
          <el-input
            type="textarea"
            :autosize="{ minRows: 5, maxRows: 10}"
            class="box-card"
            v-model="answer"
            :placeholder= "$t('m.Enter_answer')"
            ></el-input>
        </el-col>
        <el-col :span="3">
          <Dropdown @on-click="onStatusChange">
            <h3 class="show_comment">{{ numOfCommentShow }}{{$t('m.Each') }}
              <Icon type="arrow-down-b"></Icon>
            </h3>
            <Dropdown-menu slot="list">
              <Dropdown-item name="5">5</Dropdown-item>
              <Dropdown-item name="7">7</Dropdown-item>
              <Dropdown-item name="10">10</Dropdown-item>
            </Dropdown-menu>
          </Dropdown>
          <el-button class="bottom-align-text" @click="writeComment">{{$t('m.Write') }}</el-button>
        </el-col>
      </el-row>
      <!-- comment area -->
      <el-row>
        <el-card class="box-card" v-for="comment in comments">
          <div slot="header" class="clearfix">
            <el-row>
              <el-col :span="21">
                <a class="mr-2" href="#" v-if="comment.author.realname">{{ comment.author.realname }}</a>
                <small class="text-muted" v-if="comment.date_posted">{{ comment.date_posted | localtime('YYYY-M-D HH:mm')}}</small>
                <el-tag size="mini" v-if="comment.permit">{{ comment.permit }}</el-tag>
              </el-col>
              <el-col :span="3">
                <el-button class="delete" size="mini" icon="el-icon-delete" @click="deleteComment(comment.id)"></el-button>
              </el-col>
            </el-row>
          </div>
          <pre>{{comment.content}}</pre>
          <hr/>
        </el-card>
        <el-row :gutter="24">
          <el-col :offset="3" :span="21">
            <div class="panel-options ivu-dropdown">
              <el-pagination
                class="page"
                layout="prev, pager, next"
                @current-change="currentChange"
                :current-page.sync="currentPage"
                :total="total" :pageSize="limit">
              </el-pagination>
            </div>
          </el-col>
        </el-row>
      </el-row>
    </Panel>
    <div v-if="qnaList.problem !== null">
      <el-dialog
        title="Problem Detail"
        :visible.sync="dialogVisible"
        width="60%">
        <problem-detail :contID.sync="qnaList.contest" :probID.sync="qnaList.problem._id"></problem-detail>
      </el-dialog>
    </div>
  </div>
</template>

<script>
  import api from '../../api.js'
  import { mapGetters } from 'vuex'
  import submissionDetails from '@oj/views/qna/SubmissionDetail.vue'
  import problemDetail from '@oj/views/qna/ProblemDetail.vue'

  export default {
    name: 'ProblemQnADetail',
    components: {
      submissionDetails,
      problemDetail
    },
    data () {
      return {
        numOfCommentShow: 5,
        answer: '',
        // comments: [{'author': 'testUser', 'date_posted': '2020-09-02 07:04:18.604325+00', 'permit': 'Student', 'comment': 'test Comment page'}, {'author': 'testUser', 'date_posted': '2020-09-02 07:05:18.604325+00', 'permit': 'TA', 'comment': 'test Comment page 2'}],
        comments: [],
        qnaList: [],
        openQnA: false,
        routeName: false,
        detailCode: false,
        questionID: '',
        dialogVisible: false,
        currentPage: 0,
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
        this.detailCode = false
        this.questionID = this.$route.params.questionID
        this.getPostList()
        this.getCommentList()
        this.$Loading.finish()
      },
      solvedQnA () {
        let params = ''
        params = {questionID: this.questionID}
        api.solvedQuestion(params).then(res => {
          this.qnaList.solved = res.data.data
        })
      },
      writeComment () {
        let params = ''
        params = {questionID: this.questionID, comment: this.answer}
        api.writeComment(params).then(res => {
          this.comments.unshift(res.data.data)
          this.comments.splice(this.limit, 1)
          this.total += 1
          this.answer = ''
        })
      },
      getCommentList () {
        let params = ''
        params = {questionID: this.questionID,
          limit: this.limit,
          offset: -1}
        api.getQnACommentList(params).then(res => {
          this.currentPage = res.data.data
          this.getCommentListPage(res.data.data, this.limit)
        })
      },
      changeQnA2OpenQnA () {
        let params = ''
        params = {questionID: this.questionID,
          OpenQnA: this.openQnA}
        api.changeQnA2Open(params).then(res => {
          console.log(res)
        })
      },
      getPostList () {
        let params = ''
        params = {questionID: this.questionID}
        api.getQnAPostDetail(params).then(res => {
          this.qnaList = res.data.data
          this.openQnA = !res.data.data.private
          console.log(this.qnaList)
        })
      },
      onStatusChange (status) {
        this.numOfCommentShow = status
        this.limit = Number(status)
        this.getCommentListPage(0, this.limit)
      },
      showDetailCode () {
        if (this.detailCode) {
          this.detailCode = false
        } else {
          this.detailCode = true
        }
      },
      handleRoute (route) {
        this.$router.push(route)
      },
      currentChange (page) {
        this.currentPage = page
        this.getCommentListPage(page, this.limit)
      },
      deletePost () {
        if (this.total > 0) {
          this.$alert('댓글이 작성되어 있어 삭제가 불가능 합니다.<br/>관리자에게 문의해주세요.', '삭제 불가', {
            confirmButtonText: this.$i18n.t('m.ok'),
            dangerouslyUseHTMLString: true
          })
        } else {
          this.$confirm(this.$i18n.t('m.Question_delete_ask'), 'confirm', {
            type: 'warning',
            confirmButtonText: this.$i18n.t('m.ok'),
            cancelButtonText: this.$i18n.t('m.Cancel')
          }).then(() => {
            api.deletePost(this.qnaList.id).then(res => {
              this.$router.go(-1)
            }).catch(() => {
            })
          }, () => {
          })
        }
      },
      deleteComment (lectureId) {
        this.$confirm(this.$i18n.t('m.Comment_delete_ask'), 'confirm', {
          type: 'warning',
          confirmButtonText: this.$i18n.t('m.ok'),
          cancelButtonText: this.$i18n.t('m.Cancel')
        }).then(() => {
          api.deleteComment(lectureId).then(res => {
            this.getCommentListPage(this.currentPage, this.limit)
          }).catch(() => {
            this.getCommentListPage(this.currentPage, this.limit)
          })
        }, () => {
        })
      },
      getCommentListPage (page, limit) {
        this.loading = true
        let params = ''
        params = {questionID: this.questionID,
          limit: limit,
          offset: (page - 1) * limit}
        api.getQnACommentList(params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.comments = res.data.data.results
        }).catch(() => {
        })
      }
    },
    computed: {
      ...mapGetters(['isAdmin', 'isSemiAdmin'])
    },
    watch: {
      answer: function (val) {
        this.answer = val
      },
      $route (to, from) {
        this.init()
      }
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
  .mr-0 {
    margin-top: 10px;
    margin-bottom: 10px;
    float: right;
  }
  .bottom-align-text {
    position: absolute;
    bottom: 0;
    right: 10px;
    margin-right: 22px;
    margin-bottom: 10px;
  }
  .ml-auto {
    margin-left:auto;
  }
  .delete {
    float: right;
  }
  .d-block {
    display:block;
  }
  .ivu-dropdown {
    float: right;
    margin-right: 22px;
  }
  .box-card {
    margin-left: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
  }
  pre{
    overflow: auto;
    font-family: 'Noto Sans KR', 'Helvetica Neue', sans-serif;
    white-space: pre-wrap; /* pre tag내에 word wrap */
  }
</style>